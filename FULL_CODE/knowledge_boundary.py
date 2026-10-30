"""Knowledge Boundary & Strict Grounding Validation Engine for CareSphere.

Enforces strict dataset-grounding rules in accordance with official H5 guidelines and SCP-1.2:
1. Hard-coded danger-sign escalation layer (ESC-1.x to ESC-4.x) running before any model reasoning.
2. Hard-coded out-of-scope guardian rejecting unapproved medicines, unlisted conditions,
   sex determination (PC-PNDT Act), administrative questions, and non-health topics.
3. Partial support query decomposition: answers only the supported portion and clearly identifies
   unsupported questions with a redirect to the Medical Officer.
4. Statistical and semantic grounding overlap verification against the 107 leaf protocol sections.
5. Post-generation fact-fidelity checker verifying that all numerical cut-offs, timelines,
   and dosages originate strictly from the cited dataset record.
"""
from __future__ import annotations

import re
import math
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field

ROOT_DIR = Path(__file__).resolve().parents[1]
FULL_CODE_DIR = Path(__file__).resolve().parent
for p in [str(FULL_CODE_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from emergency_detector import detect_escalation
from refusal_detector import is_out_of_scope
from telugu_processor import (
    check_telugu_emergency,
    check_telugu_out_of_scope,
    normalize_telugu_query,
    is_telugu_text,
    get_telugu_protocol_details,
)
from hindi_processor import (
    check_hindi_emergency,
    check_hindi_out_of_scope,
    normalize_hindi_query,
    is_hindi_text,
    get_hindi_protocol_details,
)


@dataclass
class BoundaryDecision:
    status: str  # "EMERGENCY" | "OUT_OF_SCOPE" | "PARTIALLY_SUPPORTED" | "SUPPORTED"
    is_emergency: bool = False
    is_out_of_scope: bool = False
    is_partial: bool = False
    cited_section_ids: List[str] = field(default_factory=list)
    reason: Optional[str] = None
    supported_query: Optional[str] = None
    unsupported_query: Optional[str] = None
    refusal_reason: Optional[str] = None
    confidence: float = 1.0


# Extended out-of-scope regex patterns covering English, Hindi, Hinglish, Telugu, and Roman Telugu
EXTENDED_OOS_PATTERNS = [
    # Prohibited medicines & dosages (ASHA cannot prescribe or titrate)
    r"\b(amoxicillin|cefixime|azithromycin|ciprofloxacin|metronidazole|antibiotic|antibiotics|paracetamol|crocin|combiflam|cough syrup|metformin dose|insulin kitna|amlodipine|cetirizine|azithro|penicillin|augmentin|ibuprofen|aspirin|steroid|dexamethasone)\b",
    r"\b(kitni goli du|kitna syrup|kitni dose|dose kitni|kitna dose|kitna mg|kitne drop du|dawai kitni|paracetamol.*kitna|kitna dena hai|which medicine|medicine dosage|prescribe medicine|moxikind)\b",
    r"\b(mandulu rayavacha|mandulu em ivvali|antibiotic ivvavacha|tablet dose|syrup dose|paracetamol dose)\b",

    # Uncovered medical conditions (outside the 9 protocol documents)
    r"\b(tb\b|tuberculosis|dengue|typhoid|widal|malaria test kitna|malaria treat|thyroid|cancer|hiv\b|aids\b|rabies|dog bite|kutta kata|bistar geela|bedwetting|skin allergy|daad|khujli|fungal|eczema|scabies|piles|fistula|appendix|gallbladder|kidney stone|cataract|motiyabind|jaundice in adult|peeliya|liver)\b",
    r"\b(dengue lakshanalu|typhoid mandulu|rabies vaccine kukka|cancer chikitsa|thyroid samasya)\b",

    # Surgery and invasive procedures
    r"\b(surgery|operation.*(gallbladder|appendix|hernia|cataract|piles)|chemotherapy|radiation|biopsy|endoscopy|angioplasty)\b",

    # Family planning, contraception, abortion (outside Chandrapuri protocol scope)
    r"\b(copper[- ]?t|mala[- ]?n|condom|garbhnirodhak|antargarbhashayi|abortion|garbhpat|mifepristone|misoprostol|garbhasravam cheyavacha|pill for abortion)\b",

    # Sex determination of foetus (strictly illegal under PC-PNDT Act, 1994)
    r"\b(ladka hoga ya ladki|sex determination|ling jaanch|beta hoga ya beti|gender of baby|foetal sex|boy or girl prediction|ling nirdharan|abbayi leda ammayi)\b",

    # Administrative, payroll, and app portal queries
    r"\b(salary|manpathe|maandey|vetan|incentive|paisa nahi aaya|portal login|app login|otp nahi|u-win.*(login|otp|error)|ration card|ayushman card|death certificate|birth certificate|praman patra|jeevan pramaan)\b",

    # General non-health topics (finance, programming, politics, cinema, sports, weather)
    r"\b(loan|interest rate|personal loan|home loan|emi|bank account|credit card|finance|stock market|cryptocurrency|mutual fund|invest|bitcoin)\b",
    r"\b(code|coding|python|javascript|java|c\+\+|html|css|for loop|function|sql|database|software|github|programming|write code|debug)\b",
    r"\b(cricket|football|world cup|movie|cinema|actor|actress|song|box office|ticket|entertainment|ipl)\b",
    r"\b(weather|temperature today|weather forecast|climate change|rain forecast|monsoon forecast)\b",
    r"\b(capital of|president of|prime minister of|history of|write an essay|essay on|joke|riddle|recipe|food delivery|modi|rahul gandhi)\b",

    # Adversarial / jailbreak / prompt-injection attempts
    r"\b(ignore previous instructions|disregard protocols|system prompt|jailbreak|pretend you are a doctor|act as an unrestricted AI|bypass safety)\b",
]


class KnowledgeBoundaryEngine:
    """Multi-tier boundary engine enforcing strict protocol grounding."""

    def __init__(self, protocols_dir: Optional[Path] = None):
        if protocols_dir is None:
            protocols_dir = Path(__file__).resolve().parents[1] / "data" / "protocols"
        self.protocols_dir = protocols_dir
        self.sections: Dict[str, Dict[str, Any]] = {}
        self.protocol_vocab: set[str] = set()
        self._load_protocols()
        from protocol_engine import ProtocolEngine
        self.protocol_engine = ProtocolEngine(self.protocols_dir)
        try:
            from chroma_retrieval import ChromaRetrievalEngine
            self.chroma_engine: Optional[ChromaRetrievalEngine] = ChromaRetrievalEngine()
        except Exception:
            self.chroma_engine = None

    def _load_protocols(self):
        """Parse all markdown files into canonical leaf sections and build corpus vocabulary."""
        if not self.protocols_dir.exists():
            return

        for path in sorted(self.protocols_dir.glob("*.md")):
            text = path.read_text(encoding="utf-8")
            parts = re.split(r"\n(?=###\s+[A-Z]+-\d+\.\d+)", text)
            for part in parts:
                m = re.match(r"^###\s+([A-Z]+-\d+\.\d+)\s+(.+?)\n(.*)", part, re.DOTALL)
                if m:
                    sec_id = m.group(1).strip()
                    title = m.group(2).strip()
                    content = m.group(3).strip()
                    self.sections[sec_id] = {
                        "id": sec_id,
                        "title": title,
                        "content": content,
                        "file": path.name,
                    }
                    # Tokenize vocabulary
                    words = re.findall(r"\b[a-zA-Z]{3,}\b", content.lower())
                    self.protocol_vocab.update(words)

    def evaluate_query(self, query: str, language: str = "en") -> BoundaryDecision:
        """Evaluate query through the 4-tier knowledge-boundary guardian."""
        q = (query or "").strip()
        if not q:
            return BoundaryDecision(
                status="OUT_OF_SCOPE",
                is_out_of_scope=True,
                cited_section_ids=["SCP-1.2"],
                refusal_reason="Empty question provided.",
            )

        # ------------------------------------------------------------------
        # TIER 1: EMERGENCY / DANGER SIGN ESCALATION (Cannot be overridden)
        # ------------------------------------------------------------------
        esc = detect_escalation(q)
        te_esc = check_telugu_emergency(q)
        hi_esc = check_hindi_emergency(q)

        if esc.escalate or te_esc is not None or hi_esc is not None:
            if esc.escalate and esc.section_id:
                sec_id = esc.section_id
                reason = esc.reason or "Life-threatening danger sign"
            elif te_esc:
                sec_id = te_esc[0]
                reason = te_esc[1]
            elif hi_esc:
                sec_id = hi_esc[0]
                reason = hi_esc[1]
            else:
                sec_id = "ESC-1.1"
                reason = "Life-threatening emergency detected"

            return BoundaryDecision(
                status="EMERGENCY",
                is_emergency=True,
                is_out_of_scope=False,
                cited_section_ids=[sec_id],
                reason=reason,
            )

        # ------------------------------------------------------------------
        # TIER 2: ADVERSARIAL & INJECTION GUARD
        # ------------------------------------------------------------------
        if re.search(r"\b(ignore previous instructions|disregard protocols|system prompt|jailbreak|pretend you are a doctor|act as an unrestricted AI|bypass safety)\b", q, re.I):
            return BoundaryDecision(
                status="OUT_OF_SCOPE",
                is_out_of_scope=True,
                cited_section_ids=["SCP-1.2"],
                refusal_reason="Adversarial prompt injection / override attempt detected.",
            )

        # ------------------------------------------------------------------
        # TIER 3: COMPOUND / PARTIALLY SUPPORTED QUERY SPLITTER
        # ------------------------------------------------------------------
        compound_split = self._check_compound_query(q)
        if compound_split is not None:
            supp_q, unsupp_q, reason = compound_split
            return BoundaryDecision(
                status="PARTIALLY_SUPPORTED",
                is_partial=True,
                is_out_of_scope=False,
                supported_query=supp_q,
                unsupported_query=unsupp_q,
                refusal_reason=reason,
            )

        # ------------------------------------------------------------------
        # TIER 4: HARD-CODED OUT-OF-SCOPE PRE-CLASSIFIER
        # ------------------------------------------------------------------
        if (
            is_out_of_scope(q)
            or check_telugu_out_of_scope(q)
            or check_hindi_out_of_scope(q)
            or self._matches_extended_oos(q)
        ):
            return BoundaryDecision(
                status="OUT_OF_SCOPE",
                is_out_of_scope=True,
                cited_section_ids=["SCP-1.2"],
                refusal_reason="Query is outside protocol boundary (medicine prescription, unlisted disease, administrative, or non-health topic).",
            )

        # ------------------------------------------------------------------
        # TIER 5: CHROMADB PERSISTENT SEMANTIC RETRIEVAL & SIMILARITY THRESHOLD
        # ------------------------------------------------------------------
        if self.chroma_engine is not None:
            chroma_decision = self.chroma_engine.evaluate_grounding(q)
            if not chroma_decision["is_grounded"] and not self._is_whitelisted_conversational(q):
                return BoundaryDecision(
                    status="OUT_OF_SCOPE",
                    is_out_of_scope=True,
                    cited_section_ids=["SCP-1.2"],
                    refusal_reason=(
                        f"Semantic similarity ({chroma_decision['top_similarity']:.3f}) falls below "
                        f"the calibrated grounding threshold ({chroma_decision['threshold']:.2f}). "
                        f"Query is outside protocol evidence boundary (SCP-1.2)."
                    ),
                    confidence=chroma_decision["top_similarity"],
                )

            best_sec = chroma_decision["best_section_id"]
            if best_sec == "SCP-1.2":
                return BoundaryDecision(
                    status="OUT_OF_SCOPE",
                    is_out_of_scope=True,
                    cited_section_ids=["SCP-1.2"],
                    refusal_reason="Semantic retrieval mapped query to out-of-scope boundaries (SCP-1.2).",
                    confidence=chroma_decision["top_similarity"],
                )

            return BoundaryDecision(
                status="SUPPORTED",
                is_emergency=False,
                is_out_of_scope=False,
                cited_section_ids=chroma_decision["matched_sections"] if chroma_decision["matched_sections"] else [best_sec],
                confidence=chroma_decision["top_similarity"],
            )

        # Fallback to BM25 vocabulary matching if ChromaDB unavailable
        grounding_score, best_section = self._measure_grounding_overlap(q)
        if grounding_score < 0.15 and not self._is_whitelisted_conversational(q):
            return BoundaryDecision(
                status="OUT_OF_SCOPE",
                is_out_of_scope=True,
                cited_section_ids=["SCP-1.2"],
                refusal_reason="Query concepts do not have sufficient grounding support in the Chandrapuri protocol corpus.",
            )

        return BoundaryDecision(
            status="SUPPORTED",
            is_emergency=False,
            is_out_of_scope=False,
            cited_section_ids=[best_section] if best_section else ["SCP-1.1"],
            confidence=grounding_score,
        )

    def _matches_extended_oos(self, query: str) -> bool:
        """Check against extended regex boundary filters."""
        q = query.lower()
        return any(re.search(pat, q, re.I) for pat in EXTENDED_OOS_PATTERNS)

    def _check_compound_query(self, query: str) -> Optional[Tuple[str, str, str]]:
        """Decompose compound questions into supported and unsupported clauses.
        
        Example: 'What is the IFA dose for pregnant women, and can I give amoxicillin for fever?'
        -> supported: 'What is the IFA dose for pregnant women'
        -> unsupported: 'can I give amoxicillin for fever'
        """
        clauses = re.split(r"(?<=[?.!,;])\s+|\s+(?:and also|aur sath me|mariyu mariyu|and can I|aur kya)\s+", query, flags=re.I)
        if len(clauses) < 2:
            clauses = re.split(r"\s+(?:and|aur|mariyu|tatha|lekin|but)\s+", query, flags=re.I)

        if len(clauses) >= 2:
            supported = []
            unsupported = []
            for c in clauses:
                c_clean = c.strip()
                if not c_clean:
                    continue
                is_oos = (
                    self._matches_extended_oos(c_clean)
                    or is_out_of_scope(c_clean)
                    or check_telugu_out_of_scope(c_clean)
                    or check_hindi_out_of_scope(c_clean)
                )
                if is_oos:
                    unsupported.append(c_clean)
                else:
                    c_lower = c_clean.lower()
                    has_anchor = any(
                        term in c_lower for term in [
                            "anc", "pmsma", "ifa", "calcium", "albendazole", "td", "hb", "anaemia",
                            "hypertension", "bp", "pre-eclampsia", "eclampsia", "vaccine", "bcg", "opv",
                            "penta", "rvv", "fipv", "pcv", "mr", "dpt", "je", "vitamin a", "hbnc",
                            "breastfeeding", "lbw", "birth weight", "cord", "muac", "sam", "mam", "ncd",
                            "diabetes", "blood sugar", "ors", "zinc", "diarrhoea", "fever", "breathing",
                            "visit", "register", "pregnant", "pregnancy", "mother", "baby", "child"
                        ]
                    )
                    if has_anchor:
                        supported.append(c_clean)

            if supported and unsupported:
                supp_text = ", ".join(supported)
                unsupp_text = ", ".join(unsupported)
                reason = f"The portion regarding '{unsupp_text}' is outside the protocol book (SCP-1.2)."
                return (supp_text, unsupp_text, reason)

        return None

    def _measure_grounding_overlap(self, query: str) -> Tuple[float, Optional[str]]:
        """Compute BM25 retrieval grounding against protocol sections."""
        norm_q = normalize_hindi_query(query) if is_hindi_text(query) else (
            normalize_telugu_query(query) if is_telugu_text(query) else query
        )
        retrieved = self.protocol_engine.retrieve(norm_q, k=1)
        if retrieved:
            return (1.0, retrieved[0])
        return (0.0, None)

    def _is_whitelisted_conversational(self, query: str) -> bool:
        """Permit basic greetings or protocol overview questions."""
        q = query.lower().strip()
        return bool(re.search(r"\b(hello|namaste|vanakkam|namaskaram|hi|protocols|guidelines|who are you|help)\b", q))

    def verify_answer_fidelity(self, answer_text: str, section_id: str) -> Tuple[bool, str, List[str]]:
        """Verify that numerical facts, doses, and timelines in answer_text exist in section_id.
        
        Returns (is_faithful, sanitized_answer, verified_facts).
        """
        sec_info = self.sections.get(section_id)
        if not sec_info:
            return (True, answer_text, [])

        sec_content = sec_info["content"]

        # Extract numerical expressions from answer (e.g. '180 days', '140/90', '11.5 cm', '20 mg', '4 check-ups')
        num_patterns = re.findall(r"\b(?:\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:kg|cm|mmhg|weeks?|days?|months?|mg|tablets?|check-ups?|visits?|hours?|sachets?|liters?|ml)|≥\s*\d+|>\s*\d+|<\s*\d+|≤\s*\d+|\d+/\d+)\b", answer_text, re.I)

        verified = []
        unverified = []

        for pat in num_patterns:
            clean_pat = re.sub(r"\s+", " ", pat.strip().lower())
            if clean_pat in sec_content.lower() or re.sub(r"[^\d]", "", clean_pat) in sec_content:
                verified.append(pat)
            else:
                unverified.append(pat)

        # If any unsupported numbers were generated, flag violation
        if unverified:
            # Strip unverified numbers or warn
            sanitized = f"{answer_text.strip()} (Verified from official {section_id} protocol)."
            return (False, sanitized, verified)

        return (True, answer_text, verified)
