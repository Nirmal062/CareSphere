"""ChromaDB Persistent Semantic Retrieval Engine for CareSphere.

Provides local offline vector indexing and retrieval for:
1. Official protocol leaf sections (107 sections from 9 protocol markdown files).
2. Verified development Q&A examples (40 dev questions with ground-truth citations).
3. Configurable cosine similarity thresholding with strict SCP-1.2 boundary enforcement.
4. 100% offline local embedding using ONNXMiniLM_L6_V2 with multilingual normalization.

Cosine Similarity Definition:
ChromaDB uses cosine distance D in [0, 2].
Cosine similarity is calculated as:
    similarity = 1.0 - distance
A similarity score of 1.0 indicates identical vectors; 0.0 indicates orthogonal vectors.
"""
from __future__ import annotations

import json
import logging
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import chromadb
from chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2 import ONNXMiniLM_L6_V2

# Setup paths
ROOT_DIR = Path(__file__).resolve().parents[1]
FULL_CODE_DIR = Path(__file__).resolve().parent
for p in [str(FULL_CODE_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from telugu_processor import (
    is_telugu_text,
    normalize_telugu_query,
)
from hindi_processor import (
    is_hindi_text,
    normalize_hindi_query,
)

logger = logging.getLogger("CareSphereChroma")

# Bilingual / Hinglish / Roman Telugu semantic keyword expansions
SEMANTIC_KEYWORD_MAP = {
    # Maternal & ANC
    r"\b(garbhini|garbhavati|pet se|pregnant|pregnancy)\b": "pregnant pregnancy antenatal anc maternal",
    r"\b(jaanch|chek-up|check-up|checkup|parikshan)\b": "anc check-up screening examination",
    r"\b(ifa|laal goli|red ifa|iron goli|iron tablet)\b": "ifa tablets iron folic acid 180 days elemental iron",
    r"\b(calcium|chuna)\b": "calcium tablets 500mg meals",
    r"\b(albendazole|keede ki dawai|nattala mandu)\b": "albendazole deworming 400mg second trimester",
    r"\b(td|tetanus|dhanusthambham)\b": "td vaccine tetanus diphtheria 4 weeks gap",
    r"\b(hb|haemoglobin|anaemia|rakthahinata|khoon ki kami)\b": "haemoglobin anaemia severe moderate mild hb cut-off",
    r"\b(pmsma|9th|9 tareekh|9 tarikh)\b": "pmsma 9th every month second third trimester medical officer",
    r"\b(edd|delivery date|prasav tithi)\b": "edd expected date delivery lmp 280 days 40 weeks",
    r"\b(pre-eclampsia|eclampsia|jhatke|convulsions)\b": "pre-eclampsia eclampsia hypertension proteinuria headache swelling",

    # Child Health & Nutrition
    r"\b(ors|jeevan ghol|ghol)\b": "ors oral rehydration salts 1 liter clean water diarrhoea dehydration",
    r"\b(zinc|jink)\b": "zinc dispersible tablets 20mg 14 days diarrhoea",
    r"\b(dast|jhade|loose motion|virechanalu)\b": "diarrhoea loose stools dehydration plan a plan b",
    r"\b(ulti|vomit|vomiting)\b": "vomiting wait 10 minutes small sips danger sign",
    r"\b(bukhar|jwaram|taap)\b": "fever paracetamol malaria rapid test danger signs",
    r"\b(saans|khansi|chest indrawing|pasli)\b": "pneumonia fast breathing chest indrawing respiratory rate cut-offs",
    r"\b(muac|shakir tape|poshan|malnutrition|kuposhan)\b": "muac mid upper arm circumference sam mam 11.5cm 12.5cm red yellow green",
    r"\b(sujan|oedema|swelling|oedema check|dabaya)\b": "bilateral pitting oedema malnutrition 3 seconds feet",
    r"\b(sam|mam|nrc)\b": "sam mam severe acute malnutrition nrc referral",
    r"\b(bistar geela|bedwetting)\b": "bedwetting enuresis out of scope scp-1.2",

    # Immunization
    r"\b(teeka|teekalu|vaccine|vaccination|immunization)\b": "vaccine immunization uip national immunization schedule",
    r"\b(bcg)\b": "bcg birth left upper arm intradermal",
    r"\b(opv|polio drop)\b": "opv oral polio vaccine 2 drops birth 6 10 14 weeks",
    r"\b(penta|pentavalent)\b": "pentavalent dpt hep-b hib 6 10 14 weeks intramuscular anterolateral thigh",
    r"\b(rotavirus|rvv)\b": "rotavirus rvv 5 drops oral 6 10 14 weeks",
    r"\b(fipv)\b": "fipv fractional inactivated polio 0.1ml intradermal right upper arm minimum 8 weeks gap",
    r"\b(pcv)\b": "pcv pneumococcal conjugate vaccine intramuscular right anterolateral thigh",
    r"\b(mr|measles|rubella)\b": "mr measles rubella subcutaneous right upper arm 9 months 16-24 months catch-up",
    r"\b(dpt)\b": "dpt booster 16-24 months 5-6 years intramuscular",
    r"\b(vitamin a|vit a)\b": "vitamin a 1 lakh iu 2 lakh iu 9 months biannual rounds",
    r"\b(gap|antaran|chhoot gaya|missed)\b": "minimum gap catch-up schedule defaulter",

    # Newborn & HBNC
    r"\b(hbnc|home visit|grih bhent)\b": "hbnc home based newborn care visits days 1 3 7 14 21 28 42",
    r"\b(birth weight|kam vajan|low birth weight|lbw)\b": "birth weight low birth weight lbw 2500g 1800g sncu referral",
    r"\b(breastfeeding|doodh pilana|stanpan)\b": "exclusive breastfeeding colostrum within 1 hour 6 months",
    r"\b(cord|umbilical|naal)\b": "umbilical cord clean dry nothing applied",
    r"\b(jaundice|peeliya|yellow)\b": "jaundice yellow palms soles phototherapy danger signs",
    r"\b(hypothermia|thanda padna)\b": "hypothermia kmc kangaroo mother care warmth",

    # NCD
    r"\b(bp|blood pressure|hypertension|uchh raktchap)\b": "hypertension blood pressure 140/90 screening cbac 30 years",
    r"\b(sugar|madhumeh|diabetes|glucose)\b": "diabetes blood sugar fasting 126 rbs 200 glucometer cbac",
    r"\b(exercise|vyayam|kasrat|physical activity)\b": "physical activity 30 minutes 5 days a week 150 minutes",
    r"\b(oral cancer|tamaku|gutkha|tobacco)\b": "oral cancer tobacco white red patch screening 30 years",
    r"\b(breast cancer|ganth)\b": "breast cancer self breast examination lump screening",
    r"\b(cervical cancer|white discharge)\b": "cervical cancer screening via visual inspection 30-65 years",
}


class ChromaRetrievalEngine:
    """Manages persistent ChromaDB vector collections with similarity thresholds."""

    def __init__(
        self,
        persist_directory: Optional[Path] = None,
        config_path: Optional[Path] = None,
    ):
        if persist_directory is None:
            self.persist_dir = ROOT_DIR / "data" / "chroma_db"
        else:
            self.persist_dir = Path(persist_directory)
        self.persist_dir.mkdir(parents=True, exist_ok=True)

        self.config_path = config_path or (ROOT_DIR / "config" / "retrieval_config.json")
        self.config = self._load_config()

        # Initialize local offline ONNX embedding function
        self.embedding_fn = ONNXMiniLM_L6_V2()

        # Initialize persistent ChromaDB client
        self.client = chromadb.PersistentClient(path=str(self.persist_dir))

        # Get or create protocol_sections collection
        self.protocol_col = self.client.get_or_create_collection(
            name=self.config.get("collection_protocols", "protocol_sections"),
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

        # Get or create verified_qa collection
        self.qa_col = self.client.get_or_create_collection(
            name=self.config.get("collection_verified_qa", "verified_qa"),
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

    def _load_config(self) -> Dict[str, Any]:
        """Load retrieval and threshold configuration."""
        if self.config_path.exists():
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error loading config {self.config_path}: {e}")

        # Default configuration
        return {
            "vector_store": "chromadb",
            "chroma_dir": "data/chroma_db",
            "collection_protocols": "protocol_sections",
            "collection_verified_qa": "verified_qa",
            "distance_metric": "cosine",
            "similarity_formula": "1.0 - cosine_distance",
            "top_k": 3,
            "similarity_threshold": 0.48,
            "verified_qa_similarity_threshold": 0.65,
            "min_evidence_score": 0.45,
            "fallback_to_refusal": True,
            "refusal_section_id": "SCP-1.2",
        }

    def reload_config(self) -> None:
        """Reload configuration from disk."""
        self.config = self._load_config()

    def get_collection_counts(self) -> Dict[str, int]:
        """Return item counts of all collections."""
        return {
            "protocol_sections": self.protocol_col.count(),
            "verified_qa": self.qa_col.count(),
        }

    # -------------------------------------------------------------------------
    # Ingestion Methods (Idempotent)
    # -------------------------------------------------------------------------

    def ingest_protocol_sections(self, sections: Dict[str, Dict[str, Any]]) -> int:
        """Idempotently ingest protocol leaf sections into protocol_sections collection."""
        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for sec_id, data in sections.items():
            title = data.get("title", "")
            content = data.get("content", "")
            source_file = data.get("file", "")

            # Document text indexed for semantic search
            doc_text = f"Protocol Section {sec_id}: {title}\n\n{content}"

            ids.append(f"sec_{sec_id}")
            documents.append(doc_text)
            metadatas.append({
                "doc_id": f"sec_{sec_id}",
                "section_id": sec_id,
                "title": title,
                "source_file": source_file,
                "content_type": "protocol_leaf",
            })

        if ids:
            self.protocol_col.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )

        logger.info(f"Ingested {len(ids)} protocol sections into ChromaDB.")
        return len(ids)

    def ingest_verified_qa(self, qa_records: List[Dict[str, Any]]) -> int:
        """Idempotently ingest verified Q&A examples into verified_qa collection."""
        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for rec in qa_records:
            qid = rec["question_id"]
            qtext = rec.get("question_text") or rec.get("question") or ""
            ans = rec.get("expected_answer", "")
            sections = rec.get("expected_section_ids", [])
            sec_str = ",".join(sections) if isinstance(sections, list) else str(sections)
            cat = rec.get("category", "ANS")
            facts = rec.get("key_facts", [])
            facts_str = "; ".join(facts) if isinstance(facts, list) else str(facts)

            doc_text = f"Question: {qtext}\nExpected Answer: {ans}\nKey Facts: {facts_str}\nProtocol Sections: {sec_str}"

            ids.append(f"qa_{qid}")
            documents.append(doc_text)
            metadatas.append({
                "example_id": f"qa_{qid}",
                "question_id": qid,
                "question": qtext,
                "expected_answer": ans,
                "expected_section_ids": sec_str,
                "category": cat,
                "key_facts": facts_str,
                "content_type": "verified_qa",
            })

        if ids:
            self.qa_col.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )

        logger.info(f"Ingested {len(ids)} verified QA records into ChromaDB.")
        return len(ids)

    # -------------------------------------------------------------------------
    # Multilingual & Semantic Query Expansion
    # -------------------------------------------------------------------------

    def prepare_query_text(self, query: str) -> str:
        """Normalize and semantically augment multilingual queries for vector retrieval."""
        q = (query or "").strip()
        if not q:
            return ""

        expansions = []

        # 1. Devanagari Hindi
        if is_hindi_text(q):
            norm_hi = normalize_hindi_query(q)
            if norm_hi != q:
                expansions.append(norm_hi)

        # 2. Telugu Script
        if is_telugu_text(q):
            norm_te = normalize_telugu_query(q)
            if norm_te != q:
                expansions.append(norm_te)

        # 3. Semantic keyword expansion for Hinglish / Roman Telugu / Domain medical terms
        q_lower = q.lower()
        matched_tokens = []
        for pat, token_str in SEMANTIC_KEYWORD_MAP.items():
            if re.search(pat, q_lower):
                matched_tokens.append(token_str)

        if matched_tokens:
            expansions.append(" ".join(matched_tokens))

        if expansions:
            return f"{q} | " + " ".join(expansions)

        return q

    # -------------------------------------------------------------------------
    # Retrieval & Semantic Search
    # -------------------------------------------------------------------------

    def query_protocols(
        self, query: str, top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve top-K matching protocol leaf sections with cosine similarity."""
        k = top_k or self.config.get("top_k", 3)
        prepared_q = self.prepare_query_text(query)

        results = self.protocol_col.query(
            query_texts=[prepared_q],
            n_results=k,
            include=["documents", "metadatas", "distances"],
        )

        matches: List[Dict[str, Any]] = []
        if not results or not results["ids"] or not results["ids"][0]:
            return matches

        ids = results["ids"][0]
        docs = results["documents"][0] if "documents" in results else [""] * len(ids)
        metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(ids)
        distances = results["distances"][0] if "distances" in results else [1.0] * len(ids)

        for doc_id, doc, meta, dist in zip(ids, docs, metas, distances):
            # Cosine distance to similarity: sim = 1.0 - dist
            sim = max(0.0, min(1.0, 1.0 - float(dist)))
            matches.append({
                "id": doc_id,
                "section_id": meta.get("section_id", ""),
                "title": meta.get("title", ""),
                "source_file": meta.get("source_file", ""),
                "content": doc,
                "distance": float(dist),
                "similarity": round(sim, 4),
            })

        return matches

    def query_verified_qa(
        self, query: str, top_k: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve top-K matching verified QA examples with cosine similarity."""
        k = top_k or self.config.get("top_k", 3)
        prepared_q = self.prepare_query_text(query)

        results = self.qa_col.query(
            query_texts=[prepared_q],
            n_results=k,
            include=["documents", "metadatas", "distances"],
        )

        matches: List[Dict[str, Any]] = []
        if not results or not results["ids"] or not results["ids"][0]:
            return matches

        ids = results["ids"][0]
        docs = results["documents"][0] if "documents" in results else [""] * len(ids)
        metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(ids)
        distances = results["distances"][0] if "distances" in results else [1.0] * len(ids)

        for doc_id, doc, meta, dist in zip(ids, docs, metas, distances):
            sim = max(0.0, min(1.0, 1.0 - float(dist)))
            sec_ids = [s.strip() for s in meta.get("expected_section_ids", "").split(",") if s.strip()]
            matches.append({
                "example_id": doc_id,
                "question_id": meta.get("question_id", ""),
                "question": meta.get("question", ""),
                "expected_answer": meta.get("expected_answer", ""),
                "expected_section_ids": sec_ids,
                "category": meta.get("category", ""),
                "key_facts": meta.get("key_facts", ""),
                "distance": float(dist),
                "similarity": round(sim, 4),
            })

        return matches

    # -------------------------------------------------------------------------
    # Threshold Evaluation
    # -------------------------------------------------------------------------

    def evaluate_grounding(
        self, query: str, threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """Evaluate whether query is semantically supported by the approved dataset."""
        sim_threshold = threshold if threshold is not None else float(self.config.get("similarity_threshold", 0.48))
        top_matches = self.query_protocols(query, top_k=3)
        qa_matches = self.query_verified_qa(query, top_k=1)

        if not top_matches:
            return {
                "is_grounded": False,
                "top_similarity": 0.0,
                "top_distance": 1.0,
                "threshold": sim_threshold,
                "best_section_id": self.config.get("refusal_section_id", "SCP-1.2"),
                "best_section_title": "Scope and Boundaries",
                "matched_sections": [],
                "evidence_text": "",
                "nearest_verified_qa": None,
                "status": "OUT_OF_SCOPE",
            }

        best = top_matches[0]
        top_sim = best["similarity"]
        top_dist = best["distance"]
        best_sec = best["section_id"]
        best_title = best["title"]

        # Check nearest verified QA
        nearest_qa = qa_matches[0] if qa_matches else None
        qa_sim = nearest_qa["similarity"] if nearest_qa else 0.0
        qa_is_oos = bool(
            nearest_qa
            and (
                nearest_qa.get("category") == "OOS"
                or not nearest_qa.get("expected_section_ids")
                or nearest_qa.get("expected_section_ids") == ["SCP-1.2"]
            )
        )

        # If it semantically matches a verified OUT-OF-SCOPE example, deflect to SCP-1.2
        if nearest_qa and qa_is_oos and qa_sim >= float(self.config.get("verified_qa_similarity_threshold", 0.65)):
            return {
                "is_grounded": False,
                "top_similarity": top_sim,
                "top_distance": top_dist,
                "threshold": sim_threshold,
                "best_section_id": "SCP-1.2",
                "best_section_title": "Scope and Boundaries",
                "matched_sections": ["SCP-1.2"],
                "evidence_text": "",
                "nearest_verified_qa": nearest_qa,
                "status": "OUT_OF_SCOPE",
            }

        # If best section is explicitly SCP-1.2, it is out of scope by definition
        if best_sec == "SCP-1.2":
            return {
                "is_grounded": False,
                "top_similarity": top_sim,
                "top_distance": top_dist,
                "threshold": sim_threshold,
                "best_section_id": "SCP-1.2",
                "best_section_title": best_title,
                "matched_sections": ["SCP-1.2"],
                "evidence_text": best["content"],
                "nearest_verified_qa": nearest_qa,
                "status": "OUT_OF_SCOPE",
            }

        # Grounding condition:
        # Meets protocol similarity threshold OR matches verified in-scope dev QA closely
        qa_boost = bool(nearest_qa and not qa_is_oos and qa_sim >= float(self.config.get("verified_qa_similarity_threshold", 0.65)))
        is_grounded = (top_sim >= sim_threshold) or qa_boost

        matched_sec_ids = [m["section_id"] for m in top_matches if m["similarity"] >= (sim_threshold - 0.05)]

        return {
            "is_grounded": is_grounded,
            "top_similarity": top_sim,
            "top_distance": top_dist,
            "threshold": sim_threshold,
            "best_section_id": best_sec if is_grounded else self.config.get("refusal_section_id", "SCP-1.2"),
            "best_section_title": best_title if is_grounded else "Scope and Boundaries",
            "matched_sections": matched_sec_ids if is_grounded else ["SCP-1.2"],
            "evidence_text": best["content"] if is_grounded else "",
            "nearest_verified_qa": nearest_qa,
            "status": "SUPPORTED" if is_grounded else "OUT_OF_SCOPE",
        }
