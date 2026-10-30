"""Automated unit and regression test suite for Step 2 Question Answering.

Verifies:
1. All emergency danger questions are detected with recall = 1.0 (no gate failure).
2. False escalation rate is 0.0 (well below 0.20 threshold).
3. Out-of-scope questions are accurately refused (SCP-1.2).
4. Section citation accuracy on in-scope questions.
5. Key fact coverage on answerable questions.
"""
from __future__ import annotations

import csv
import json
import os
import re
import sys
import unittest
from pathlib import Path

TESTS_DIR = Path(__file__).resolve().parent
FULL_CODE_DIR = TESTS_DIR.parent if TESTS_DIR.name == "tests" else TESTS_DIR
ROOT = FULL_CODE_DIR.parent if FULL_CODE_DIR.name == "FULL_CODE" else FULL_CODE_DIR
DATA = ROOT / "data" if (ROOT / "data").exists() else FULL_CODE_DIR / "data"

if str(FULL_CODE_DIR) not in sys.path:
    sys.path.insert(0, str(FULL_CODE_DIR))

from emergency_detector import detect_escalation
from refusal_detector import is_out_of_scope
from protocol_engine import ProtocolEngine


def normalise(text: str) -> str:
    t = (text or "").lower()
    for a, b in (("–", "-"), ("—", "-"), ("−", "-"), ("≥", ">="),
                 ("≤", "<="), (" ", " "), ("°", " ")):
        t = t.replace(a, b)
    t = re.sub(r"(?<=\d)(?=[a-z])", " ", t)
    t = re.sub(r"(?<=\d)\s*-\s*(?=\d)", "-", t)
    return re.sub(r"\s+", " ", t).strip()


def fact_in_text(fact: str, text: str) -> bool:
    f = normalise(fact)
    if not f:
        return False
    return re.search(r"(?<![a-z0-9])" + re.escape(f) + r"(?![a-z0-9])", normalise(text)) is not None


class TestStep2QA(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = ProtocolEngine(DATA / "protocols")
        with open(DATA / "questions_dev.csv", encoding="utf-8-sig") as f:
            cls.questions = {r["question_id"]: r["question_text"] for r in csv.DictReader(f)}
        with open(DATA / "dev_truth.jsonl", encoding="utf-8-sig") as f:
            cls.truth = [json.loads(line) for line in f if line.strip()]

    def test_emergency_detection(self):
        tp = fp = fn = tn = 0
        for row in self.truth:
            qid = row["question_id"]
            text = self.questions[qid]
            pred = detect_escalation(text).escalate
            actual = row["must_escalate"]
            if pred and actual:
                tp += 1
            elif pred and not actual:
                fp += 1
            elif not pred and actual:
                fn += 1
            else:
                tn += 1

        self.assertEqual(fn, 0, f"Missed emergencies: FN={fn}")
        self.assertEqual(fp, 0, f"False alarm escalations: FP={fp}")
        self.assertEqual(tp, 10, f"Expected 10 true positive emergencies, got {tp}")
        print(f"\n[Test] Emergency Detection: TP={tp}, FP={fp}, FN={fn}, TN={tn}")

    def test_refusal_accuracy(self):
        oos_correct = 0
        in_scope_correct = 0
        oos_total = 0
        in_scope_total = 0

        for row in self.truth:
            if row["must_escalate"]:
                continue
            qid = row["question_id"]
            text = self.questions[qid]
            pred_oos = is_out_of_scope(text)
            actual_oos = row["out_of_scope"]

            if actual_oos:
                oos_total += 1
                if pred_oos:
                    oos_correct += 1
            else:
                in_scope_total += 1
                if not pred_oos:
                    in_scope_correct += 1

        self.assertEqual(oos_correct, oos_total, f"Refusal accuracy miss on OOS questions: {oos_correct}/{oos_total}")
        self.assertEqual(in_scope_correct, in_scope_total, f"False refusal on in-scope questions: {in_scope_correct}/{in_scope_total}")
        print(f"[Test] Refusal Accuracy: OOS={oos_correct}/{oos_total}, In-scope non-refusal={in_scope_correct}/{in_scope_total}")

    def test_citation_accuracy(self):
        cit_correct = 0
        total = 0
        for row in self.truth:
            if row["out_of_scope"]:
                continue
            total += 1
            qid = row["question_id"]
            text = self.questions[qid]

            esc = detect_escalation(text)
            if esc.escalate:
                cited = [esc.section_id or "ESC-1.1"]
            else:
                cited = self.engine.retrieve(text, k=1)

            expected = row["expected_section_ids"]
            hit = any(c in expected for c in cited)
            if hit:
                cit_correct += 1

        self.assertEqual(cit_correct, total, f"Citation accuracy misses: {cit_correct}/{total}")
        print(f"[Test] Citation Accuracy: {cit_correct}/{total} (100%)")

    def test_key_fact_coverage(self):
        scores = []
        for row in self.truth:
            if row["out_of_scope"]:
                continue
            qid = row["question_id"]
            text = self.questions[qid]

            esc = detect_escalation(text)
            if esc.escalate:
                sec_id = esc.section_id or "ESC-1.1"
                ans = self.engine.extract_answer(text, sec_id, is_esc=True)
            else:
                cited = self.engine.retrieve(text, k=1)
                sec_id = cited[0] if cited else "SCP-1.1"
                ans = self.engine.extract_answer(text, sec_id, is_esc=False)

            facts = row.get("key_fact_alternatives") or [[f] for f in (row.get("key_facts") or [])]
            if facts:
                score = sum(any(fact_in_text(alt, ans[:400]) for alt in alts) for alts in facts) / len(facts)
                scores.append(score)

        avg_score = sum(scores) / len(scores) if scores else 1.0
        print(f"[Test] Key Fact Coverage: {avg_score:.4f} ({len(scores)} questions evaluated)")
        self.assertGreaterEqual(avg_score, 0.95, f"Expected key fact coverage >= 95%, got {avg_score:.4f}")

    def test_visit_list(self):
        from visit_list_generator import build_daily_visit_list, item_key
        import pandas as pd

        reg = pd.read_csv(DATA / "household_register.csv", dtype=str, keep_default_na=False)
        pred_df = build_daily_visit_list(reg)

        dev_scope = set(pd.read_csv(DATA / "dev_truth_visit_scope.csv", dtype=str)["member_id"])
        truth_df = pd.read_csv(DATA / "dev_truth_visit_list.csv", dtype={"member_id": str, "due_item": str})

        truth_df["key"] = truth_df["member_id"].str.strip() + "|" + truth_df["due_item"].map(item_key)
        truth_pairs = dict(zip(truth_df["key"], truth_df["priority"].astype(int)))

        pred_df["key"] = pred_df["member_id"].str.strip() + "|" + pred_df["due_item"].map(item_key)
        pv = pred_df[pred_df["member_id"].isin(dev_scope)]
        pred_pairs = dict(zip(pv["key"], pv["priority"]))

        tp = len(set(pred_pairs) & set(truth_pairs))
        vp = tp / len(pred_pairs) if pred_pairs else 0.0
        vr = tp / len(truth_pairs) if truth_pairs else 0.0
        vf1 = 2 * vp * vr / (vp + vr) if (vp + vr) else 0.0
        pacc = sum(1 for k, p in truth_pairs.items() if pred_pairs.get(k) == p) / max(len(truth_pairs), len(pred_pairs))

        print(f"[Test] Visit List: Precision={vp:.4f}, Recall={vr:.4f}, F1={vf1:.4f}, Priority Accuracy={pacc:.4f}")
        self.assertEqual(vf1, 1.0, f"Visit list F1 expected 1.0, got {vf1}")
        self.assertEqual(pacc, 1.0, f"Visit list priority accuracy expected 1.0, got {pacc}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
