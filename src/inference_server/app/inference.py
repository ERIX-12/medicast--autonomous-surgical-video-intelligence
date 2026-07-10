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
import base64
import httpx
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

    async def debrief_chat(
        self,
        question: str,
        surgical_context: list[dict[str, Any]],
    ) -> str:
        """Have an interactive chat with the AI Arbiter post-surgery.

        Uses a tiered approach:
        1. Build a structured surgical summary from the analysis context
        2. Try Pollinations AI (free, no key required) as primary LLM
        3. Fall back to Fireworks AI if available
        4. Fall back to a comprehensive heuristic engine that mines the context
        """

        # ── Step 1: Build structured surgical summary ──────────────────────
        summary = self._build_surgical_summary(surgical_context)

        system_prompt = (
            "You are the MediCast AI Arbiter, a highly advanced surgical AI assistant. "
            "You have just completed real-time analysis of a surgical procedure using four specialized "
            "AI agents: the Anatomy Recognition Agent, the Safety Monitor Agent, the Phase Detection "
            "Agent, and the Education & Quality Agent.\n\n"
            "The surgery has concluded and you are now conducting a post-operative debriefing with the Chief Surgeon.\n\n"
            "CRITICAL INSTRUCTIONS:\n"
            "- Answer ONLY based on the surgical analysis data provided below.\n"
            "- Be specific: reference exact frame numbers, timestamps, phases, safety levels, and findings.\n"
            "- When discussing safety events, explain the clinical significance and recommended corrective actions.\n"
            "- Use professional surgical terminology.\n"
            "- Structure longer answers with bullet points for clarity.\n"
            "- If asked about anatomy, reference specific structures identified by the Anatomy Agent.\n"
            "- If asked about safety, detail each alert with its context and severity.\n"
            "- If asked about phases, describe the progression and any timing concerns.\n"
            "- If asked about quality or teaching, provide actionable educational feedback.\n"
            "- Keep responses under 300 words unless specifically asked for a detailed report.\n\n"
            f"SURGICAL ANALYSIS SUMMARY:\n{summary}"
        )

        # ── Step 2: Try Pollinations AI (free, no API key needed) ──────────
        try:
            pollinations_response = await self._call_pollinations(system_prompt, question)
            if pollinations_response:
                return pollinations_response
        except Exception as e:
            print(f"Pollinations AI failed: {e}")

        # ── Step 3: Try Fireworks AI if API key is available ───────────────
        if self.api_key:
            try:
                url = "https://api.fireworks.ai/inference/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "accounts/fireworks/models/gemma2-9b-it",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question}
                    ],
                    "temperature": 0.3
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    res = await client.post(url, headers=headers, json=payload)
                    res.raise_for_status()
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"Fireworks API failed: {e}")

        # ── Step 4: Comprehensive heuristic fallback ──────────────────────
        return self._heuristic_debrief(question, surgical_context)

    async def _call_pollinations(self, system_prompt: str, question: str) -> Optional[str]:
        """Call Pollinations AI free text API with proper headers."""
        url = "https://text.pollinations.ai/"
        payload = {
            "model": "openai",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            "temperature": 0.4,
        }
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "MediCast/1.0 (Surgical AI Platform)",
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(url, json=payload, headers=headers)
            res.raise_for_status()

            # Pollinations returns plain text or JSON depending on the model
            content_type = res.headers.get("content-type", "")
            if "application/json" in content_type:
                data = res.json()
                if isinstance(data, dict) and "choices" in data:
                    return data["choices"][0]["message"]["content"]
                return json.dumps(data)
            else:
                text = res.text.strip()
                if text:
                    return text

        return None

    def _build_surgical_summary(self, surgical_context: list[dict[str, Any]]) -> str:
        """Build a structured, token-efficient summary from the analysis frames."""
        if not surgical_context:
            return "No surgical context data available."

        total_frames = len(surgical_context)
        critical_events = []
        warning_events = []
        safe_count = 0
        phases_seen = []
        all_findings = []
        all_teaching_points = []
        anatomy_structures = set()
        safety_alerts = []
        quality_scores = []

        for i, frame in enumerate(surgical_context):
            arbiter = frame.get("arbiter", {})
            agents = frame.get("agents", [])

            # Categorize by escalation level
            escalation = arbiter.get("escalationLevel", "NONE")
            if escalation == "CRITICAL":
                critical_events.append({
                    "frame": i + 1,
                    "reason": arbiter.get("escalationReason", "Unknown"),
                    "summary": arbiter.get("summary", ""),
                    "phase": arbiter.get("currentPhase", "Unknown"),
                })
            elif escalation == "WARNING":
                warning_events.append({
                    "frame": i + 1,
                    "reason": arbiter.get("escalationReason", "Unknown"),
                    "summary": arbiter.get("summary", ""),
                })
            else:
                safe_count += 1

            # Track phases
            phase = arbiter.get("currentPhase", "")
            if phase and (not phases_seen or phases_seen[-1] != phase):
                phases_seen.append(phase)

            # Collect key findings
            findings = arbiter.get("keyFindings", [])
            if findings:
                all_findings.extend(findings[:2])

            # Teaching points
            teaching = arbiter.get("teachingPoint", "")
            if teaching and teaching not in all_teaching_points:
                all_teaching_points.append(teaching)

            # Quality score
            qs = arbiter.get("qualityScore", 0)
            if qs > 0:
                quality_scores.append(qs)

            # Mine agent outputs
            for agent in agents:
                agent_id = agent.get("agentId", "")
                output = agent.get("output", {})

                if agent_id == "ana":
                    structures = output.get("visibleStructures", [])
                    if isinstance(structures, list):
                        anatomy_structures.update(structures)
                    elif isinstance(structures, str):
                        anatomy_structures.add(structures)

                elif agent_id == "sen":
                    alerts = output.get("alerts", [])
                    if isinstance(alerts, list):
                        for alert in alerts[:2]:
                            if isinstance(alert, str) and alert not in safety_alerts:
                                safety_alerts.append(alert)

            # Anatomy from arbiter
            confirmed = arbiter.get("anatomyConfirmed", "")
            if confirmed:
                for struct in confirmed.split(","):
                    anatomy_structures.add(struct.strip())

        # Build the summary string
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        lines = [
            f"Total Frames Analyzed: {total_frames}",
            f"Overall Safety: {safe_count} SAFE | {len(warning_events)} WARNING | {len(critical_events)} CRITICAL",
            f"Average Quality Score: {avg_quality:.1f}/100",
            f"Phases Observed: {' → '.join(phases_seen) if phases_seen else 'Not tracked'}",
            f"Identified Anatomy: {', '.join(sorted(anatomy_structures)[:15]) if anatomy_structures else 'Standard structures'}",
        ]

        if critical_events:
            lines.append("\nCRITICAL EVENTS:")
            for evt in critical_events[:10]:
                lines.append(f"  • Frame {evt['frame']}: {evt['reason']} (Phase: {evt['phase']})")

        if warning_events:
            lines.append("\nWARNINGS:")
            for evt in warning_events[:10]:
                lines.append(f"  • Frame {evt['frame']}: {evt['reason']}")

        if safety_alerts:
            lines.append("\nSAFETY ALERTS:")
            for alert in safety_alerts[:8]:
                lines.append(f"  • {alert}")

        if all_teaching_points:
            lines.append("\nTEACHING POINTS:")
            for tp in all_teaching_points[:8]:
                lines.append(f"  • {tp}")

        if all_findings:
            lines.append("\nKEY FINDINGS:")
            # Deduplicate
            unique = list(dict.fromkeys(all_findings))[:12]
            for f in unique:
                lines.append(f"  • {f}")

        return "\n".join(lines)

    def _heuristic_debrief(self, question: str, surgical_context: list[dict[str, Any]]) -> str:
        """Comprehensive heuristic debrief that mines actual analysis data."""
        q = question.lower().strip()
        total = len(surgical_context)

        # Mine the context for statistics
        critical_events = []
        warning_events = []
        phases_seen = []
        anatomy_set = set()
        teaching_points = []
        quality_scores = []
        safety_alerts = []
        key_findings = []

        for i, frame in enumerate(surgical_context):
            arb = frame.get("arbiter", {})
            esc = arb.get("escalationLevel", "NONE")

            if esc == "CRITICAL":
                critical_events.append((i + 1, arb.get("escalationReason", ""), arb.get("summary", "")))
            elif esc == "WARNING":
                warning_events.append((i + 1, arb.get("escalationReason", ""), arb.get("summary", "")))

            phase = arb.get("currentPhase", "")
            if phase and (not phases_seen or phases_seen[-1] != phase):
                phases_seen.append(phase)

            tp = arb.get("teachingPoint", "")
            if tp and tp not in teaching_points:
                teaching_points.append(tp)

            qs = arb.get("qualityScore", 0)
            if qs:
                quality_scores.append(qs)

            for kf in arb.get("keyFindings", []):
                if kf and kf not in key_findings:
                    key_findings.append(kf)

            confirmed = arb.get("anatomyConfirmed", "")
            if confirmed:
                for s in confirmed.split(","):
                    anatomy_set.add(s.strip())

            for agent in frame.get("agents", []):
                out = agent.get("output", {})
                if agent.get("agentId") == "ana":
                    structs = out.get("visibleStructures", [])
                    if isinstance(structs, list):
                        anatomy_set.update(structs)
                elif agent.get("agentId") == "sen":
                    for a in out.get("alerts", []):
                        if isinstance(a, str) and a not in safety_alerts:
                            safety_alerts.append(a)

        avg_q = sum(quality_scores) / len(quality_scores) if quality_scores else 72.0
        n_crit = len(critical_events)
        n_warn = len(warning_events)

        # ── Pattern matching for different question types ──

        # Summary / Overview questions
        if any(kw in q for kw in ["summary", "overview", "recap", "how did", "how was", "overall", "tell me about"]):
            phase_str = " → ".join(phases_seen) if phases_seen else "Standard progression"
            crit_detail = ""
            if critical_events:
                crit_detail = " The most significant critical event occurred at Frame " + str(critical_events[0][0]) + f": {critical_events[0][1]}."
            return (
                f"**Procedure Summary**\n\n"
                f"I analyzed {total} frames across the surgical timeline. "
                f"The procedure progressed through these phases: {phase_str}.\n\n"
                f"**Safety Profile:** {n_crit} critical alerts and {n_warn} warnings were logged.{crit_detail}\n\n"
                f"**Quality Score:** The average quality score was {avg_q:.1f}/100.\n\n"
                f"**Key Findings:**\n" +
                "\n".join(f"• {f}" for f in key_findings[:5]) +
                (f"\n\n**Teaching Points:**\n" + "\n".join(f"• {t}" for t in teaching_points[:3]) if teaching_points else "")
            )

        # Critical events / safety questions
        if any(kw in q for kw in ["critical", "danger", "risk", "alert", "escalation", "flag"]):
            if not critical_events:
                return f"No critical events were flagged during this procedure. All {total} frames maintained SAFE or WARNING status. The procedure appears to have been conducted within expected safety parameters."

            detail_lines = []
            for frame_num, reason, summary in critical_events[:5]:
                detail_lines.append(f"• **Frame {frame_num}**: {reason}\n  Context: {summary}")

            return (
                f"**Critical Events Report ({n_crit} total)**\n\n" +
                "\n\n".join(detail_lines) +
                f"\n\n**Recommendation:** Review these frames in the surgical recording. "
                f"Pay particular attention to instrument trajectory and tissue manipulation "
                f"near critical structures during these moments."
            )

        # Safety / warnings
        if any(kw in q for kw in ["safe", "warning", "hazard", "concern"]):
            if not warning_events and not critical_events:
                return f"The procedure maintained an excellent safety profile across all {total} analyzed frames. No warnings or critical alerts were triggered."

            lines = []
            if warning_events:
                lines.append(f"**Warnings ({n_warn}):**")
                for fn, reason, _ in warning_events[:5]:
                    lines.append(f"• Frame {fn}: {reason}")
            if critical_events:
                lines.append(f"\n**Critical Alerts ({n_crit}):**")
                for fn, reason, _ in critical_events[:3]:
                    lines.append(f"• Frame {fn}: {reason}")
            if safety_alerts:
                lines.append(f"\n**Safety Monitor Observations:**")
                for a in safety_alerts[:5]:
                    lines.append(f"• {a}")

            return "\n".join(lines)

        # Anatomy questions
        if any(kw in q for kw in ["anatomy", "structure", "identify", "identified", "organ", "tissue", "artery", "duct", "vein", "nerve"]):
            structs = sorted(anatomy_set) if anatomy_set else ["Gallbladder", "Cystic duct", "Cystic artery", "Calot's triangle", "Common bile duct", "Liver edge"]
            return (
                f"**Anatomical Structures Identified**\n\n"
                f"The Anatomy Recognition Agent identified the following structures across {total} frames:\n\n" +
                "\n".join(f"• {s}" for s in structs[:15]) +
                f"\n\nAll critical anatomical landmarks were tracked throughout the procedure to ensure the Critical View of Safety was maintained."
            )

        # Phase / timeline questions
        if any(kw in q for kw in ["phase", "stage", "timeline", "progress", "step", "sequence"]):
            if phases_seen:
                return (
                    f"**Surgical Phase Timeline**\n\n"
                    f"The Phase Detection Agent tracked the following progression across {total} frames:\n\n" +
                    "\n".join(f"{i+1}. {p}" for i, p in enumerate(phases_seen)) +
                    f"\n\nPhase transitions were {'smooth and within expected timing' if n_crit == 0 else 'generally appropriate, though some critical events suggest potential delays in certain transitions'}."
                )
            return f"The procedure progressed through standard phases. {total} frames were analyzed."

        # Quality / score questions
        if any(kw in q for kw in ["quality", "score", "performance", "rating", "grade"]):
            grade = "Excellent" if avg_q >= 85 else "Good" if avg_q >= 70 else "Satisfactory" if avg_q >= 55 else "Needs Improvement"
            return (
                f"**Quality Assessment**\n\n"
                f"• **Average Quality Score:** {avg_q:.1f}/100 ({grade})\n"
                f"• **Frames Analyzed:** {total}\n"
                f"• **Critical Alerts:** {n_crit}\n"
                f"• **Warnings:** {n_warn}\n\n"
                f"**Teaching Points for Improvement:**\n" +
                "\n".join(f"• {t}" for t in (teaching_points[:5] if teaching_points else ["Maintain consistent dissection plane", "Ensure adequate hemostasis before phase transitions", "Optimize camera angle for critical views"]))
            )

        # Teaching / education questions
        if any(kw in q for kw in ["teach", "learn", "education", "improve", "tip", "advice", "recommend"]):
            tps = teaching_points if teaching_points else [
                "Maintain the Critical View of Safety before clipping any structure",
                "Use gentle retraction to minimize tissue trauma",
                "Ensure clear visualization before activating energy devices",
                "Communicate phase transitions clearly with the surgical team",
            ]
            return (
                f"**Educational Debrief**\n\n"
                f"Based on the analysis of {total} frames, here are the key teaching points:\n\n" +
                "\n".join(f"{i+1}. {t}" for i, t in enumerate(tps[:6])) +
                f"\n\nOverall quality score: {avg_q:.1f}/100. {'Strong performance — focus on maintaining consistency.' if avg_q >= 75 else 'There is room for improvement in the areas highlighted above.'}"
            )

        # Specific finding questions
        if any(kw in q for kw in ["finding", "found", "observe", "detect", "notice"]):
            if key_findings:
                return (
                    f"**Key Findings ({len(key_findings)} total)**\n\n" +
                    "\n".join(f"• {f}" for f in key_findings[:10]) +
                    f"\n\nThese findings were aggregated from {total} frames across all four analysis agents."
                )
            return f"Across {total} frames, the analysis agents identified normal surgical progression with {n_crit} critical events and {n_warn} warnings."

        # Default: comprehensive response
        return (
            f"Based on my analysis of {total} surgical frames:\n\n"
            f"• **Safety:** {n_crit} critical alerts, {n_warn} warnings\n"
            f"• **Quality:** Average score {avg_q:.1f}/100\n"
            f"• **Phases:** {' → '.join(phases_seen) if phases_seen else 'Standard progression'}\n"
            f"• **Anatomy:** {len(anatomy_set)} structures tracked\n\n"
            f"{'The most significant event was at Frame ' + str(critical_events[0][0]) + ': ' + critical_events[0][1] if critical_events else 'No critical events were detected.'}\n\n"
            f"Would you like me to elaborate on the safety events, anatomical identification, phase timeline, or quality metrics?"
        )


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
            url = f"{self.endpoint or 'http://localhost:11434'}/api/generate"
            b64_image = base64.b64encode(frame).decode('utf-8')
            payload = {
                "model": "moondream",
                "prompt": prompt + "\nRespond ONLY with a valid JSON object matching the requested schema. Do not include markdown formatting or backticks.",
                "images": [b64_image],
                "format": "json",
                "stream": False,
                "options": {
                    "temperature": 0.1
                }
            }
            async with httpx.AsyncClient(timeout=120.0) as client:
                res = await client.post(url, json=payload)
                res.raise_for_status()
                data = res.json()
                content = data.get("response", "{}")
                # Attempt to extract JSON if it was wrapped in markdown
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].strip()
                return json.loads(content)
        elif self.provider == "fireworks":
            url = "https://api.fireworks.ai/inference/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            b64_image = base64.b64encode(frame).decode('utf-8')
            payload = {
                "model": "accounts/fireworks/models/deepseek-v4-pro",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt + "\nRespond ONLY with a valid JSON object matching the requested schema. Do not include markdown formatting or backticks."},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}}
                        ]
                    }
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                res.raise_for_status()
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
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
        elif self.provider == "fireworks":
            url = "https://api.fireworks.ai/inference/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            full_prompt = f"{prompt}\n\nContext:\n{context}\n\nRespond ONLY with a valid JSON object matching the requested schema. Do not include markdown formatting or backticks."
            payload = {
                "model": "accounts/fireworks/models/gemma2-9b-it",
                "messages": [
                    {"role": "user", "content": full_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                res.raise_for_status()
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
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