"""Inference engine for the MediCast inference server.

Provides both real GPU-based inference (via vLLM/Ollama) and
mock inference mode for development without GPU hardware.

The 4 vision agents run in PARALLEL via asyncio.gather.
The Arbiter runs SEQUENTIALLY after all vision agents complete.
"""

from __future__ import annotations

import asyncio
import base64
import json
import random
import time
from typing import Any, Optional
import re

import httpx

from . import agents as agent_prompts




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
        self.provider = provider  # "vllm", "ollama", "fireworks" or None for mock
        self.endpoint = endpoint
        self.api_key = api_key
        
        # Default endpoint for Fireworks if not provided
        if self.provider == "fireworks" and not self.endpoint:
            self.endpoint = "https://api.fireworks.ai/inference/v1/chat/completions"

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
                # Raise the exception instead of falling back to mock data
                raise result
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

        if not (self.provider and self.endpoint):
            raise ValueError("Inference provider not configured. Please provide a valid API key.")

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
        except Exception as e:
            raise e


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

        if not (self.provider and self.endpoint):
            raise ValueError("Inference provider not configured. Please provide a valid API key.")

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
        except Exception as e:
            raise e

        elapsed = int((time.monotonic() - start) * 1000)
        return {
            "agentId": agent_id,
            "agentName": agent_name,
            "output": output,
            "inferenceMs": elapsed,
        }

    def _extract_json_from_text(self, text: str) -> dict[str, Any]:
        """Attempt to parse a JSON object from text output, handling markdown code blocks."""
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        match = re.search(r"```json\n(.*?)\n```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
                
        match = re.search(r"```\n(.*?)\n```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass
                
        # Fallback empty dict
        return {}

    async def _call_llm_vision(self, prompt: str, frame: bytes) -> dict[str, Any]:
        """Call a vision-language model (vLLM, Ollama, or Fireworks).
        """
        if self.provider == "fireworks":
            b64_image = base64.b64encode(frame).decode("utf-8")
            payload = {
                "model": "accounts/fireworks/models/firellava-13b",
                "max_tokens": 1024,
                "temperature": 0.2,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt + "\n\nRespond with a valid JSON object ONLY."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{b64_image}"
                                },
                            },
                        ],
                    }
                ],
                "response_format": {"type": "json_object"}
            }
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(self.endpoint, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return self._extract_json_from_text(content)
        elif self.provider == "vllm":
            raise NotImplementedError("vLLM integration not yet implemented")
        elif self.provider == "ollama":
            b64_image = base64.b64encode(frame).decode("utf-8")
            payload = {
                "model": "llava",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt + "\n\nRespond with a valid JSON object ONLY.",
                        "images": [b64_image]
                    }
                ],
                "format": "json",
                "stream": False
            }
            ollama_endpoint = self.endpoint or "http://localhost:11434/api/chat"
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(ollama_endpoint, json=payload)
                resp.raise_for_status()
                data = resp.json()
                content = data["message"]["content"]
                return self._extract_json_from_text(content)
        else:
            raise ValueError(f"Unknown provider: {self.provider}")

    async def _call_llm_text(self, prompt: str, context: str) -> dict[str, Any]:
        """Call a text-only LLM (for the Arbiter).
        """
        if self.provider == "fireworks":
            payload = {
                "model": "accounts/fireworks/models/gemma2-9b-it",
                "max_tokens": 1024,
                "temperature": 0.2,
                "messages": [
                    {
                        "role": "system",
                        "content": prompt + "\n\nRespond with a valid JSON object ONLY.",
                    },
                    {
                        "role": "user",
                        "content": context,
                    }
                ],
                "response_format": {"type": "json_object"}
            }
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(self.endpoint, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return self._extract_json_from_text(content)
        elif self.provider == "vllm":
            raise NotImplementedError("vLLM text integration not yet implemented")
        elif self.provider == "ollama":
            payload = {
                "model": "gemma2",
                "messages": [
                    {
                        "role": "system",
                        "content": prompt + "\n\nRespond with a valid JSON object ONLY.",
                    },
                    {
                        "role": "user",
                        "content": context,
                    }
                ],
                "format": "json",
                "stream": False
            }
            ollama_endpoint = self.endpoint or "http://localhost:11434/api/chat"
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(ollama_endpoint, json=payload)
                resp.raise_for_status()
                data = resp.json()
                content = data["message"]["content"]
                return self._extract_json_from_text(content)
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