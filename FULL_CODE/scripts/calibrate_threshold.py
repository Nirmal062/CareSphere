"""Empirical Similarity Threshold Calibration Script for CareSphere ChromaDB.

Evaluates semantic retrieval across 68 validation queries:
- 40 official development questions (data/dev_truth.jsonl)
- 28 held-out validation questions (data/held_out_eval.jsonl)

Covers all evaluation cohorts:
1. In-scope direct queries
2. Paraphrased protocol questions
3. Misspellings and colloquial syntax
4. Devanagari Hindi & Telugu Unicode
5. Roman Telugu & Hinglish queries
6. Unapproved drugs & dosages (out-of-scope)
7. Unlisted conditions (out-of-scope)
8. Administrative / portal / non-health questions (out-of-scope)
9. Adversarial prompt-injection queries (out-of-scope)
10. Emergency danger sign queries (ESC)

Strict isolation:
NEVER evaluates or touches hidden test data (`data/questions_test.csv`).
"""
from __future__ import annotations

import csv
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Setup paths
ROOT_DIR = Path(__file__).resolve().parents[1]
FULL_CODE_DIR = ROOT_DIR / "FULL_CODE"
for p in [str(FULL_CODE_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from chroma_retrieval import ChromaRetrievalEngine
from emergency_detector import detect_escalation

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("CalibrateThreshold")


def load_all_eval_items() -> List[Dict[str, Any]]:
    """Load combined dev questions and held-out evaluation queries."""
    eval_items: List[Dict[str, Any]] = []

    # 1. Dev questions (40 items)
    dev_csv = ROOT_DIR / "data" / "questions_dev.csv"
    dev_truth = ROOT_DIR / "data" / "dev_truth.jsonl"
    q_texts = {}
    if dev_csv.exists():
        with open(dev_csv, "r", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                q_texts[row["question_id"]] = row["question_text"]

    if dev_truth.exists():
        with open(dev_truth, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                item = json.loads(line)
                qid = item["question_id"]
                item["question_text"] = q_texts.get(qid, item.get("notes", ""))
                item["source"] = "dev_truth"
                eval_items.append(item)

    # 2. Held-out eval (28 items)
    ho_file = ROOT_DIR / "data" / "held_out_eval.jsonl"
    if ho_file.exists():
        with open(ho_file, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                item = json.loads(line)
                item["question_text"] = item["question"]
                item["source"] = "held_out"
                eval_items.append(item)

    logger.info(f"Loaded {len(eval_items)} total validation queries (40 dev + 28 held-out).")
    return eval_items


def evaluate_threshold(
    engine: ChromaRetrievalEngine,
    eval_items: List[Dict[str, Any]],
    threshold: float,
) -> Dict[str, Any]:
    """Evaluate performance of a specific similarity threshold."""
    tp = 0  # in-scope and accepted
    fn = 0  # in-scope but rejected
    tn = 0  # out-of-scope and rejected
    fp = 0  # out-of-scope but accepted as grounded
    sec_correct = 0  # top section matches expected section
    total_in_scope = 0
    total_out_of_scope = 0

    for item in eval_items:
        q = item["question_text"]
        is_oos = bool(item.get("out_of_scope", False))
        is_esc = bool(item.get("must_escalate", False))
        expected_secs = item.get("expected_section_ids", [])
        if isinstance(expected_secs, str):
            expected_secs = [s.strip() for s in expected_secs.split(",") if s.strip()]

        # Emergency check runs first in architecture
        esc_res = detect_escalation(q)
        if esc_res.escalate or is_esc:
            # Emergency handled by Tier 1 escalation gate
            continue

        if is_oos:
            total_out_of_scope += 1
            res = engine.evaluate_grounding(q, threshold=threshold)
            if not res["is_grounded"] or res["best_section_id"] == "SCP-1.2":
                tn += 1
            else:
                fp += 1
        else:
            total_in_scope += 1
            res = engine.evaluate_grounding(q, threshold=threshold)
            if res["is_grounded"] and res["best_section_id"] != "SCP-1.2":
                tp += 1
                # Check section citation match
                best_sec = res["best_section_id"]
                if any(best_sec == exp or best_sec.split(".")[0] == exp.split(".")[0] for exp in expected_secs):
                    sec_correct += 1
            else:
                fn += 1

    precision = (tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    recall = (tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    refusal_rate = (tn / (tn + fp)) if (tn + fp) > 0 else 1.0
    sec_acc = (sec_correct / tp) if tp > 0 else 0.0

    return {
        "threshold": threshold,
        "tp": tp,
        "fn": fn,
        "tn": tn,
        "fp": fp,
        "total_in_scope": total_in_scope,
        "total_out_of_scope": total_out_of_scope,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "refusal_rate": refusal_rate,
        "section_accuracy": sec_acc,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    logger.info("=" * 80)
    logger.info("CARESPHERE CHROMADB SIMILARITY THRESHOLD CALIBRATION")
    logger.info("=" * 80)

    engine = ChromaRetrievalEngine()
    eval_items = load_all_eval_items()

    candidate_thresholds = [0.38, 0.40, 0.42, 0.45, 0.48, 0.50, 0.52, 0.55, 0.58, 0.60]
    results = []

    header = (
        f"{'Threshold':<10} | {'InScope (TP/Tot)':<16} | {'OOS Refusal':<12} | "
        f"{'Precision':<10} | {'Recall':<8} | {'F1':<8} | {'SecMatch':<8}"
    )
    logger.info("\n" + header)
    logger.info("-" * len(header))

    best_thresh = 0.48
    best_f1 = -1.0
    selected_metrics = None

    for th in candidate_thresholds:
        m = evaluate_threshold(engine, eval_items, th)
        results.append(m)
        row = (
            f"{m['threshold']:<10.2f} | "
            f"{m['tp']}/{m['total_in_scope']:<13} | "
            f"{m['refusal_rate']*100:<10.1f}% | "
            f"{m['precision']:<10.4f} | "
            f"{m['recall']:<8.4f} | "
            f"{m['f1']:<8.4f} | "
            f"{m['section_accuracy']*100:<6.1f}%"
        )
        logger.info(row)

        # Optimization criterion:
        # Zero Hallucination constraint: FP must be 0 (100% OOS Refusal)
        # Subject to FP == 0, maximize F1 and Recall
        if m["fp"] == 0 and m["f1"] > best_f1:
            best_f1 = m["f1"]
            best_thresh = th
            selected_metrics = m

    # If no threshold achieved FP=0, choose the one with lowest FP then highest F1
    if selected_metrics is None:
        sorted_res = sorted(results, key=lambda x: (x["fp"], -x["f1"]))
        selected_metrics = sorted_res[0]
        best_thresh = selected_metrics["threshold"]

    logger.info("\n" + "=" * 80)
    logger.info(f"CALIBRATION RECOMMENDATION: Optimal Similarity Threshold = {best_thresh:.2f}")
    logger.info(f"  - In-Scope Recall:       {selected_metrics['recall']*100:.1f}% ({selected_metrics['tp']}/{selected_metrics['total_in_scope']})")
    logger.info(f"  - Out-of-Scope Refusal:  {selected_metrics['refusal_rate']*100:.1f}% ({selected_metrics['tn']}/{selected_metrics['total_out_of_scope']})")
    logger.info(f"  - Zero Hallucination:    False Positives = {selected_metrics['fp']}")
    logger.info(f"  - Section Citation Match: {selected_metrics['section_accuracy']*100:.1f}%")
    logger.info(f"  - Overall F1 Score:      {selected_metrics['f1']:.4f}")
    logger.info("=" * 80)

    # Update config/retrieval_config.json
    config_path = ROOT_DIR / "config" / "retrieval_config.json"
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    cfg["similarity_threshold"] = best_thresh
    cfg["calibrated_metrics"] = {
        "optimal_threshold": best_thresh,
        "f1": round(selected_metrics["f1"], 4),
        "recall": round(selected_metrics["recall"], 4),
        "refusal_rate": round(selected_metrics["refusal_rate"], 4),
        "section_accuracy": round(selected_metrics["section_accuracy"], 4),
        "total_eval_queries": len(eval_items),
    }

    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)

    logger.info(f"Saved calibrated threshold {best_thresh:.2f} to {config_path}")


if __name__ == "__main__":
    main()
