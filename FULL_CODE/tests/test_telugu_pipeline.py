"""Automated test suite for Telugu & Bilingual functionality in H5 Companion."""
import sys
import unittest
from pathlib import Path

TESTS_DIR = Path(__file__).resolve().parent
FULL_CODE_DIR = TESTS_DIR.parent if TESTS_DIR.name == "tests" else TESTS_DIR
ROOT = FULL_CODE_DIR.parent if FULL_CODE_DIR.name == "FULL_CODE" else FULL_CODE_DIR

if str(FULL_CODE_DIR) not in sys.path:
    sys.path.insert(0, str(FULL_CODE_DIR))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend_api import ask_assistant, AskRequest


class TestTeluguPipeline(unittest.TestCase):
    def test_telugu_suite(self):
        tests = [
            {
                "name": "Telugu Script ANC Checkup Schedule",
                "q": "గర్భిణీ స్త్రీకి నాలుగో ANC చెకప్ ఎప్పుడు చేయించాలి?",
                "expected_sec": "ANC-1.2",
                "expected_status": "GROUNDED_ANSWER",
                "expected_lang": "te",
                "must_contain_te": "కనీసం నాలుగు ANC తనిఖీలు"
            },
            {
                "name": "Roman Telugu ANC Checkup Schedule",
                "q": "garbhini ki nalugava ANC checkup eppudu cheyinchali?",
                "expected_sec": "ANC-1.2",
                "expected_status": "GROUNDED_ANSWER",
                "expected_lang": "te",
                "must_contain_te": "కనీసం నాలుగు ANC తనిఖీలు"
            },
            {
                "name": "Telugu Script Newborn LBW Emergency (<1.8kg)",
                "q": "పుట్టిన బిడ్డ బరువు 1.6 కిలోలు ఉంది, ఇప్పుడు ఏం చేయాలి?",
                "expected_sec": "ESC-4.4",
                "expected_status": "EMERGENCY",
                "expected_urgency": "CRITICAL",
                "must_contain_te": "1.8 కిలోల కంటే తక్కువ"
            },
            {
                "name": "Telugu Script Paracetamol Out-of-Scope Refusal",
                "q": "2 సంవత్సరాల బాబుకు పారాసిటమాల్ ఎంత మోతాదు ఇవ్వాలి?",
                "expected_sec": "SCP-1.2",
                "expected_status": "OUT_OF_SCOPE",
                "must_contain_te": "వైద్య అధికారిని సంప్రదించండి"
            }
        ]

        passed = 0
        for t in tests:
            req = AskRequest(question=t["q"])
            res = ask_assistant(req)
            
            self.assertEqual(res.status, t["expected_status"], f"Status mismatch for {t['name']}")
            self.assertEqual(res.cited_section_id, t["expected_sec"], f"Section mismatch for {t['name']}")
            if "expected_lang" in t:
                self.assertEqual(res.detected_language, t["expected_lang"], f"Language detection mismatch for {t['name']}")
            self.assertIn(t["must_contain_te"], res.answer, f"Telugu response missing expected phrase in {t['name']}")
            passed += 1

        self.assertEqual(passed, len(tests))


if __name__ == "__main__":
    unittest.main(verbosity=2)
