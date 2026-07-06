"""Inference engine for the MediCast inference server.

Provides both real GPU-based inference (via vLLM/Ollama) and
mock inference mode for development without GPU hardware.

The 4 vision agents run in PARALLEL via asyncio.gather.
The Arbiter runs SEQUENTIALLY after all vision agents complete.
"""

from __future__ import annotations

import asyncio
import json
import random
import time
from typing import Any, Optional

from . import agents as agent_prompts


# ─── Mock Data ───────────────────────────────────────────────────────────────

_MOCK_FINDINGS: dict[str, list[str]] = {
    "ana": [
        "Gallbladder fundus and body clearly visible in surgical field",
        "Cystic duct identified entering gallbladder infundibulum",
        "Calot's triangle being dissected — cystic artery visualized",
        "CBD identified posterior to duodenum — no signs of injury",
        "Liver edge and gallbladder fossa visualized — normal appearance",
        "Anatomical landmarks well-identified and within normal limits",
        "Critical structures in safe zone — adequate distance from dissection",
    ],
    "sen": [
        "Dissection plane maintained within safe boundaries",
        "No thermal spread to adjacent structures detected",
        "Hemostasis adequate — no active bleeding identified",
        "Instrument trajectory safe, no risk of critical structure injury",
        "Field visibility clear — no smoke, fog, or blood obstruction",
        "Tissue handling appropriate — no traumatic grasping visible",
        "Clip positioning appears secure with clear visual confirmation",
    ],
    "nav": [
        "Current phase consistent with procedural timeline",
        "Key landmark exposed successfully for this stage",
        "Dissection progressing at expected pace",
        "Transition between phases appears smooth and appropriate",
        "Instruments appropriate for current surgical step",
        "Phase timing within expected range for this procedure",
    ],
    "edu": [
        "Good tissue handling technique observed",
        "Instrument selection appropriate for current procedural step",
        "Dissection plane maintained in correct anatomical layer",
        "Team coordination and field management effective",
        "Excellent visualization and camera control",
        "Appropriate use of energy device with safe activation technique",
    ],
}

_MOCK_RISK_ZONES: dict[str, list[str]] = [
    "Calot's Triangle — dissection in progress, CBD at risk",
    "Cystic Artery — pulse visible, maintain distance",
    "CBD identified — safe distance maintained",
    "Liver Bed — dissection plane evident, no deep penetration",
    "No high-risk zones identified in current field",
]


def _weighted_severity() -> str:
    """Return a severity level with realistic distribution (~safe 55%, caution 30%, danger 10%, critical 5%)."""
    r = random.random()
    if r < 0.55:
        return "GOOD"
    elif r < 0.85:
        return "CAUTION"
    elif r < 0.95:
        return "DANGER"
    return "CRITICAL"


def _mock_agent_output(agent_id: str, procedure_name: str) -> dict[str, Any]:
    """Generate a realistic mock output for a single agent."""
    findings = _MOCK_FINDINGS.get(agent_id, _MOCK_FINDINGS["ana"])
    num_findings = random.randint(2, 4)
    selected = random.sample(findings, min(num_findings, len(findings)))
    severity = _weighted_severity()
    confidence = 0.70 + (random.random() * 0.28)  # 0.70-0.98

    base: dict[str, Any] = {
        "findings": selected,
        "confidence": round(confidence, 2),
        "safetyLevel": severity,
        "alerts": [],
    }

    # Add severity-specific alerts
    if severity == "CRITICAL":
        base["alerts"] = [
            "POTENTIAL CRITICAL FINDING — verify immediately",
            "Structure at risk — reassess dissection plane",
        ]
    elif severity == "DANGER":
        base["alerts"] = ["Significant concern detected — proceed with caution"]

    # Add agent-specific fields
    if agent_id == "ana":
        base["visibleStructures"] = [
            "Gallbladder (fundus, body)", "Cystic duct", "Cystic artery",
            "Liver edge", "CBD (partial view)",
        ][:random.randint(2, 5)]
        base["riskZones"] = random.sample(
            _MOCK_RISK_ZONES, min(random.randint(1, 3), len(_MOCK_RISK_ZONES))
        )
    elif agent_id == "sen":
        base["riskScore"] = random.randint(0, 100) if severity == "GOOD" else random.randint(30, 95)
    elif agent_id == "nav":
        base["currentPhase"] = "Dissection of Calot's Triangle"
        base["phaseNumber"] = 4
        base["phaseProgress"] = random.choice(["EARLY", "MID", "LATE"])
    elif agent_id == "edu":
        base["qualityScore"] = random.randint(60, 98)
        base["techniqueRating"] = random.choice(["EXCELLENT", "GOOD", "FAIR"])
        base["teachingPoints"] = [
            "Maintain Critical View of Safety before clipping any structures",
            "Keep the dissection plane close to the gallbladder wall to avoid CBD injury",
        ]

    return base


def _mock_arbiter(agent_results: list[dict[str, Any]]) -> dict[str, Any]:
    """Generate a mock Arbiter verdict from agent outputs."""
    # Check for critical/danger conditions
    has_critical = any(
        a.get("output", {}).get("safetyLevel") == "CRITICAL"
        for a in agent_results
    )
    has_danger = any(
        a.get("output", {}).get("safetyLevel") == "DANGER"
        for a in agent_results
    )
    has_caution = any(
        a.get("output", {}).get("safetyLevel") == "CAUTION"
        for a in agent_results
    )

    if has_critical:
        return {
            "verdict": "CRITICAL",
            "summary": "POTENTIAL BILE DUCT INJURY RISK — immediate verification required.",
            "keyFindings": [
                "Critical safety issue detected by Safety Monitor",
                "Potential structure at risk — verify anatomy immediately",
            ],
            "anatomyConfirmed": "CBD NOT definitively identified",
            "currentPhase": "Dissection of Calot's Triangle",
            "escalationLevel": "CRITICAL",
            "escalationReason": "Possible CBD misidentification — STOP and reassess",
            "teachingPoint": "When in doubt, convert to open. The safest surgeon knows when to stop.",
            "qualityScore": 25.0,
        }
    elif has_danger:
        return {
            "verdict": "WARNING",
            "summary": "Approaching critical structure zone. Proceed with caution.",
            "keyFindings": [
                "Proximity to critical structure noted",
                "Anatomy partially obscured by inflammation",
            ],
            "anatomyConfirmed": "Gallbladder, cystic duct partially visualized",
            "currentPhase": "Dissection of Calot's Triangle",
            "escalationLevel": "WARNING",
            "escalationReason": "Critical structure proximity — verify anatomy before proceeding",
            "teachingPoint": "Consider intraoperative cholangiogram if anatomy unclear",
            "qualityScore": 62.0,
        }
    else:
        # Mostly safe, occasional caution
        is_caution = has_caution and random.random() < 0.3
        if is_caution:
            return {
                "verdict": "WARNING",
                "summary": "Minor concerns noted. Continue with standard caution.",
                "keyFindings": [
                    "Mild inflammation noted",
                    "Visibility adequate but suboptimal",
                ],
                "anatomyConfirmed": "Gallbladder, cystic duct, CBD, liver edge",
                "currentPhase": "Dissection of Calot's Triangle",
                "escalationLevel": "NONE",
                "escalationReason": "",
                "teachingPoint": "Patience in dissecting Calot's triangle prevents bile duct injuries.",
                "qualityScore": 72.0,
            }
        return {
            "verdict": "SAFE",
            "summary": "All structures within normal limits. Dissection proceeding cleanly.",
            "keyFindings": [
                "Clear anatomical visualization",
                "No safety concerns identified",
            ],
            "anatomyConfirmed": "Gallbladder, cystic duct, CBD, liver edge",
            "currentPhase": "Dissection of Calot's Triangle",
            "escalationLevel": "NONE",
            "escalationReason": "",
            "teachingPoint": "Maintain Critical View of Safety before clipping any structures.",
            "qualityScore": 88.0,
        }


# ─── Agent Mapping ───────────────────────────────────────────────────────────

AGENT_MAP: list[dict[str, str]] = [
    {"agentId": "ana", "agentName": "Anatomy Agent", "type": "vision"},
    {"agentId": "sen", "agentName": "Safety Monitor Agent", "type": "vision"},
    {"agentId": "nav", "agentName": "Phase Detection Agent", "type": "vision"},
    {"agentId": "edu", "agentName": "Education Quality Agent", "type": "vision"},
]

# ─── Inference Engine ────────────────────────────────────────────────────────

class InferenceEngine:
    """Abstraction over LLM inference backends (vLLM, Ollama) with mock fallback.

    In production mode, uses vision-language models for frame analysis.
    In mock mode (default), returns procedurally generated realistic data.
    """

    def __init__(
        self,
        provider: Optional[str] = None,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
    ):
        self.provider = provider  # "vllm" or "ollama" or None for mock
        self.endpoint = endpoint
        self.api_key = api_key

    async def analyze_frame_parallel(
        self,
        frame: bytes,
        procedure_type: str,
        procedure_name: str,
        procedure_id: int = 1,
        prompts: Optional[dict[str, str]] = None,
    ) -> list[dict[str, Any]]:
        """Run all 4 vision agents in PARALLEL via asyncio.gather.

        Args:
            frame: Raw JPEG bytes of the video frame.
            procedure_type: Specialty type (e.g. "General Surgery").
            procedure_name: Procedure display name.
            procedure_id: Knowledge base ID (1-10).
            prompts: Optional override prompts for each agent.

        Returns:
            List of agent result dicts in the format:
            [{"agentId": str, "agentName": str, "output": dict, "inferenceMs": int}, ...]
            Ordered to match AGENT_MAP: [ana, sen, nav, edu].
        """
        tasks = []
        for agent in AGENT_MAP:
            tasks.append(
                self._analyze_single_agent(
                    agent_id=agent["agentId"],
                    agent_name=agent["agentName"],
                    frame=frame,
                    procedure_type=procedure_type,
                    procedure_name=procedure_name,
                    procedure_id=procedure_id,
                    prompts=prompts,
                )
            )

        # ⚡ Run all 4 vision agents in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle any exceptions
        processed = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                # Fall back to mock data on error
                agent = AGENT_MAP[i]
                start = time.monotonic()
                output = _mock_agent_output(agent["agentId"], procedure_name)
                elapsed = int((time.monotonic() - start) * 1000)
                processed.append({
                    "agentId": agent["agentId"],
                    "agentName": agent["agentName"],
                    "output": output,
                    "inferenceMs": elapsed,
                })
            else:
                processed.append(result)

        return processed

    async def analyze_text(
        self,
        agent_results: list[dict[str, Any]],
        procedure_type: str,
        procedure_name: str,
        procedure_id: int = 1,
    ) -> dict[str, Any]:
        """Run the Arbiter (text-only) agent SEQUENTIALLY after vision agents complete.

        The Arbiter synthesizes all 4 agent outputs into a unified verdict.

        Args:
            agent_results: Outputs from analyze_frame_parallel.
            procedure_type: Specialty type.
            procedure_name: Procedure display name.
            procedure_id: Knowledge base ID.

        Returns:
            Arbiter verdict dict matching ArbiterVerdict interface.
        """
        start = time.monotonic()

        if self.provider and self.endpoint:
            # In production, send combined context to LLM
            arbiter_prompt = agent_prompts.build_arbiter_prompt(
                procedure_type, procedure_name, procedure_id
            )
            context = json.dumps({
                "agentResults": [
                    {
                        "agentId": a["agentId"],
                        "agentName": a["agentName"],
                        "output": a["output"],
                    }
                    for a in agent_results
                ],
            })
            try:
                verdict = await self._call_llm_text(arbiter_prompt, context)
                verdict["qualityScore"] = float(verdict.get("qualityScore", 75))
                return verdict
            except Exception:
                pass  # Fall through to mock

        # Mock arbiter
        return _mock_arbiter(agent_results)

    async def mock_analyze_frame(
        self,
        procedure_type: str,
        procedure_name: str,
        procedure_id: int = 1,
        frame_index: int = 0,
    ) -> list[dict[str, Any]]:
        """Generate fully mocked analysis data for development without GPU.

        This produces realistic-looking agent results with appropriate
        structure and variation.
        """
        results = []
        for agent in AGENT_MAP:
            start = time.monotonic()
            await asyncio.sleep(0.05 + random.random() * 0.1)  # Simulate processing delay
            output = _mock_agent_output(agent["agentId"], procedure_name)
            elapsed = int((time.monotonic() - start) * 1000)

            results.append({
                "agentId": agent["agentId"],
                "agentName": agent["agentName"],
                "output": output,
                "inferenceMs": elapsed,
            })

        return results

    async def mock_arbiter(
        self,
        agent_results: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Generate a mock Arbiter verdict with realistic variation."""
        await asyncio.sleep(0.02)  # Simulate minimal processing
        return _mock_arbiter(agent_results)

    # ── Private Helpers ──────────────────────────────────────────────────────

    async def _analyze_single_agent(
        self,
        agent_id: str,
        agent_name: str,
        frame: bytes,
        procedure_type: str,
        procedure_name: str,
        procedure_id: int = 1,
        prompts: Optional[dict[str, str]] = None,
    ) -> dict[str, Any]:
        """Run a single agent against the frame.

        Uses the LLM provider if configured, otherwise falls back to mock.
        """
        start = time.monotonic()

        if self.provider and self.endpoint:
            # Build agent-specific prompt
            prompt_builders = {
                "ana": agent_prompts.build_anatomy_prompt,
                "sen": agent_prompts.build_safety_prompt,
                "nav": agent_prompts.build_phase_prompt,
                "edu": lambda pt, pn, pi: agent_prompts.build_education_prompt(pt, pn, pi),
            }
            builder = prompt_builders.get(agent_id)
            if builder:
                system_prompt = builder(procedure_type, procedure_name, procedure_id)
            else:
                system_prompt = f"Analyze this surgical frame from {procedure_name}."

            # Use override prompts if provided
            if prompts and agent_id in prompts:
                system_prompt = prompts[agent_id]

            try:
                output = await self._call_llm_vision(system_prompt, frame)
            except Exception:
                output = _mock_agent_output(agent_id, procedure_name)
        else:
            # Mock mode
            await asyncio.sleep(0.05 + random.random() * 0.08)
            output = _mock_agent_output(agent_id, procedure_name)

        elapsed = int((time.monotonic() - start) * 1000)
        return {
            "agentId": agent_id,
            "agentName": agent_name,
            "output": output,
            "inferenceMs": elapsed,
        }

    async def _call_llm_vision(self, prompt: str, frame: bytes) -> dict[str, Any]:
        """Call a vision-language model (vLLM or Ollama).

        This is a placeholder for actual LLM integration.
        In production, this would make HTTP requests to the vLLM/Ollama endpoint.
        """
        if self.provider == "vllm":
            # TODO: Implement vLLM API call
            # POST {self.endpoint}/v1/chat/completions
            # with image_url content type
            raise NotImplementedError("vLLM integration not yet implemented")
        elif self.provider == "ollama":
            # TODO: Implement Ollama API call
            # POST {self.endpoint}/api/chat
            raise NotImplementedError("Ollama integration not yet implemented")
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    async def _call_llm_text(self, prompt: str, context: str) -> dict[str, Any]:
        """Call a text-only LLM (for the Arbiter).

        This is a placeholder for actual LLM integration.
        """
        if self.provider == "vllm":
            raise NotImplementedError("vLLM text integration not yet implemented")
        elif self.provider == "ollama":
            raise NotImplementedError("Ollama text integration not yet implemented")
        else:
            raise ValueError(f"Unknown provider: {self.provider}")


def create_inference_engine(
    provider: Optional[str] = None,
    endpoint: Optional[str] = None,
    api_key: Optional[str] = None,
) -> InferenceEngine:
    """Factory function to create an InferenceEngine instance.

    Args:
        provider: "vllm", "ollama", or None for mock mode.
        endpoint: URL endpoint for the LLM provider.
        api_key: API key for the LLM provider.

    Returns:
        Configured InferenceEngine instance.
    """
    return InferenceEngine(
        provider=provider,
        endpoint=endpoint,
        api_key=api_key,
    )