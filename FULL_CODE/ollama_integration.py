"""Ollama Client Integration with Knowledge Boundary & Dataset Grounding Enforcement.

Ensures that:
1. Hardcoded danger-sign and refusal boundary checks run BEFORE contacting Ollama.
2. The model prompt strictly bounds generation to the retrieved protocol excerpt.
3. Post-generation fidelity verification checks for hallucinations or unsupported numbers.
4. Graceful offline fallback operates in < 2ms if Ollama service is unavailable.
"""
from __future__ import annotations

import json
import time
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path

from knowledge_boundary import KnowledgeBoundaryEngine, BoundaryDecision

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = "caresphere-qwen"
FALLBACK_MODEL = "qwen2.5:0.5b"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"


class GroundedOllamaEngine:
    """Strictly grounded Ollama inference engine with multi-tier boundary protection."""

    def __init__(self, model_name: str = DEFAULT_MODEL, endpoint: str = OLLAMA_URL):
        self.model_name = model_name
        self.endpoint = endpoint
        self.boundary_engine = KnowledgeBoundaryEngine()

    def is_ollama_available(self) -> bool:
        """Check if local Ollama server is responding."""
        try:
            req = urllib.request.Request("http://127.0.0.1:11434/", method="HEAD")
            with urllib.request.urlopen(req, timeout=0.5):
                return True
        except Exception:
            return False

    def query(
        self,
        question: str,
        section_id: str,
        section_content: str,
        language: str = "en",
        boundary_decision: Optional[BoundaryDecision] = None
    ) -> Tuple[str, List[str], float, bool]:
        """Synthesize answer with strict grounding against section_content.
        
        Returns: (answer_text, citations, latency_ms, used_ollama)
        """
        t0 = time.perf_counter()

        # Handle boundary decisions if already computed
        if boundary_decision is None:
            boundary_decision = self.boundary_engine.evaluate_query(question, language)

        # 1. Emergency danger sign -> Return immediate escalation
        if boundary_decision.is_emergency:
            latency = (time.perf_counter() - t0) * 1000
            sec = boundary_decision.cited_section_ids[0] if boundary_decision.cited_section_ids else "ESC-1.1"
            ans = f"🚨 DANGER SIGN DETECTED: Refer immediately to First Referral Unit (FRU) / District Hospital ({sec}). Call 108 or 102 immediately."
            return (ans, [sec], latency, False)

        # 2. Out-of-scope question -> Return immediate deflection
        if boundary_decision.is_out_of_scope:
            latency = (time.perf_counter() - t0) * 1000
            refusal = "This is outside my protocol book. Please ask the Medical Officer at the PHC (or your ANM). If any danger sign is present, refer immediately (SCP-1.2)."
            return (refusal, ["SCP-1.2"], latency, False)

        # 3. Partially supported question -> Synthesize supported part and append refusal
        if boundary_decision.is_partial:
            supp_q = boundary_decision.supported_query or question
            unsupp_q = boundary_decision.unsupported_query or ""
            ans_supp, cites, _, used = self._generate_grounded(supp_q, section_id, section_content)
            final_ans = (
                f"{ans_supp} "
                f"(Note: The portion regarding '{unsupp_q.strip()}' is outside protocol scope; please consult the PHC Medical Officer (SCP-1.2))."
            )
            latency = (time.perf_counter() - t0) * 1000
            return (final_ans, cites, latency, used)

        # 4. Standard in-scope supported question -> Grounded generation
        ans, cites, latency, used = self._generate_grounded(question, section_id, section_content)
        return (ans, cites, latency, used)

    def _generate_grounded(
        self,
        question: str,
        section_id: str,
        section_content: str
    ) -> Tuple[str, List[str], float, bool]:
        """Attempt Ollama grounded generation; fallback to extractive synthesis on failure."""
        t0 = time.perf_counter()

        # Construct strict instruction bounded to section_content
        prompt = (
            f"You are CareSphere, an offline clinical decision support companion.\n"
            f"Answer the question strictly and exclusively from the official protocol excerpt below.\n"
            f"Do not guess, extrapolate, or use outside clinical knowledge.\n"
            f"Always include the citation '({section_id})' in the answer.\n"
            f"Keep the answer concise (under 350 characters).\n\n"
            f"PROTOCOL EXCERPT ({section_id}):\n{section_content}\n\n"
            f"QUESTION: {question}\n\n"
            f"GROUNDED ANSWER:"
        )

        try:
            payload = json.dumps({
                "model": self.model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "top_p": 0.8,
                    "num_predict": 250,
                    "stop": ["<|im_end|>", "\n\nQUESTION:"]
                }
            }).encode("utf-8")

            req = urllib.request.Request(
                self.endpoint,
                data=payload,
                headers={"Content-Type": "application/json"}
            )

            with urllib.request.urlopen(req, timeout=1.8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                gen_text = data.get("response", "").strip()

                if gen_text and len(gen_text) > 10:
                    # Enforce citation presence
                    if f"({section_id})" not in gen_text and section_id not in gen_text:
                        gen_text = f"{gen_text} ({section_id})."

                    # Verify fact fidelity against section content
                    is_faithful, sanitized_text, _ = self.boundary_engine.verify_answer_fidelity(
                        gen_text, section_id
                    )
                    latency = (time.perf_counter() - t0) * 1000
                    return (sanitized_text[:399], [section_id], latency, True)

        except Exception:
            # Graceful fallback to extractive protocol synthesis
            pass

        # Deterministic Extractive Grounding Fallback
        ans_extractive = self._extractive_fallback(question, section_id, section_content)
        latency = (time.perf_counter() - t0) * 1000
        return (ans_extractive, [section_id], latency, False)

    def _extractive_fallback(self, question: str, section_id: str, section_content: str) -> str:
        """Extract verified key facts using the official protocol extractive engine."""
        try:
            ans = self.boundary_engine.protocol_engine.extract_answer(question, section_id)
            if ans and len(ans) > 10:
                if f"({section_id})" not in ans and section_id not in ans:
                    ans = f"{ans} ({section_id})."
                return ans[:399]
        except Exception:
            pass

        lines = [l.strip("- *# ") for l in section_content.splitlines() if l.strip("- *# ")]
        filtered = [l for l in lines if not l.startswith("|") and len(l) > 10]
        summary = " ".join(filtered[:3])[:360]
        if not summary.endswith("."):
            summary += "."
        return f"{summary} ({section_id})."
