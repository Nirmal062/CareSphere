"""Test script verifying CareSphere's ChromaDB semantic search and boundary enforcement across the 6 mandatory test cases.
"""
import json
import sys
from pathlib import Path

# Fix Windows console encoding
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "FULL_CODE"))

from backend_api import ask_assistant, AskRequest

test_cases = [
    {
        "name": "Case 1: Directly Supported",
        "question": "What is the schedule for ANC check-ups?",
        "expected_status": "GROUNDED_ANSWER",
        "expected_citation": "ANC-1.2",
    },
    {
        "name": "Case 2: Partially Supported",
        "question": "What is the IFA dose for pregnant women, and can I give amoxicillin for fever?",
        "expected_status": "GROUNDED_ANSWER",  # Answers supported portion and warns/deflects for unsupported portion
        "expected_citation": "ANC-2.2",
    },
    {
        "name": "Case 3: Unrelated Coding",
        "question": "Can you write Python code for a binary search tree?",
        "expected_status": "OUT_OF_SCOPE",
        "expected_citation": "SCP-1.2",
    },
    {
        "name": "Case 4: Medical Not Covered",
        "question": "What antibiotic dosage of Cefixime should be given for typhoid?",
        "expected_status": "OUT_OF_SCOPE",
        "expected_citation": "SCP-1.2",
    },
    {
        "name": "Case 5: Insufficient Information",
        "question": "Give me medicine for this illness",
        "expected_status": "OUT_OF_SCOPE",
        "expected_citation": "SCP-1.2",
    },
    {
        "name": "Case 6: Emergency Danger Sign",
        "question": "A pregnant woman is bleeding heavily from the vagina",
        "expected_status": "EMERGENCY",
        "expected_citation": "ESC-2.1",
    },
]

print("=" * 80)
print("TESTING 6 BEHAVIOR CASES WITH CHROMADB SEMANTIC SEARCH")
print("=" * 80)

all_passed = True
for tc in test_cases:
    req = AskRequest(question=tc["question"])
    resp = ask_assistant(req)
    
    status_ok = (resp.status == tc["expected_status"])
    citation_ok = any(tc["expected_citation"] in c for c in resp.citations)
    passed = status_ok and citation_ok
    if not passed:
        all_passed = False

    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] {tc['name']}")
    print(f"   Question:    {tc['question']}")
    print(f"   Status:      {resp.status} (expected: {tc['expected_status']})")
    print(f"   Citations:   {resp.citations} (expected: {tc['expected_citation']})")
    print(f"   Similarity:  {resp.semantic_similarity} (Threshold: {resp.semantic_threshold})")
    print(f"   Answer snippet: {resp.answer[:100]}...")
    print("-" * 80)

print(f"\nFINAL VERIFICATION RESULT: {'ALL 6 CASES PASSED' if all_passed else 'SOME CASES FAILED'}")
assert all_passed, "One or more behavior test cases failed!"
