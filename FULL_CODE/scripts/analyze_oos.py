import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "FULL_CODE"))
sys.path.insert(0, str(ROOT / "scripts"))

from calibrate_threshold import load_all_eval_items
from chroma_retrieval import ChromaRetrievalEngine
from knowledge_boundary import KnowledgeBoundaryEngine

e = ChromaRetrievalEngine()
kb = KnowledgeBoundaryEngine()
items = load_all_eval_items()

print("--- Out-Of-Scope Queries Analysis ---")
for it in items:
    if it.get("out_of_scope", False):
        q = it["question_text"]
        c_res = e.evaluate_grounding(q, threshold=0.52)
        kb_res = kb.evaluate_query(q)
        print("Q:", q[:55])
        print("   Chroma standalone:", c_res["status"], f"sim={c_res['top_similarity']:.3f}")
        print("   Full Guardian:    ", kb_res.status, kb_res.cited_section_ids)
