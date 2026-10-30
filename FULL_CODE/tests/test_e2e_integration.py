"""End-to-End Functional Integration Tests for H5 Frontline Companion API."""
import sys
import unittest
from pathlib import Path
from urllib.parse import urlparse, parse_qs

TESTS_DIR = Path(__file__).resolve().parent
FULL_CODE_DIR = TESTS_DIR.parent if TESTS_DIR.name == "tests" else TESTS_DIR
ROOT = FULL_CODE_DIR.parent if FULL_CODE_DIR.name == "FULL_CODE" else FULL_CODE_DIR

if str(FULL_CODE_DIR) not in sys.path:
    sys.path.insert(0, str(FULL_CODE_DIR))
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend_api import (
    app as fastapi_app,
    get_system_status,
    ask_assistant,
    AskRequest,
    get_visits,
    get_protocols,
    get_ashas,
)


class DirectResponse:
    def __init__(self, data, status_code=200):
        self._data = data
        self.status_code = status_code

    def json(self):
        return self._data


class DirectTestClient:
    def get(self, path: str):
        if path == "/api/status":
            return DirectResponse(get_system_status())
        elif path.startswith("/api/visits"):
            parsed = urlparse(path)
            qs = parse_qs(parsed.query)
            prio = int(qs.get("priority", [None])[0]) if "priority" in qs else None
            search = qs.get("search", [None])[0] if "search" in qs else None
            cat = qs.get("category", ["All"])[0] if "category" in qs else "All"
            vil = qs.get("village", ["All"])[0] if "village" in qs else "All"
            lim = int(qs.get("limit", [50])[0]) if "limit" in qs else 50
            page = int(qs.get("page", [1])[0]) if "page" in qs else 1
            return DirectResponse(get_visits(priority=prio, search=search, category=cat, village=vil, limit=lim, page=page))
        elif path == "/api/protocols":
            return DirectResponse(get_protocols())
        elif path == "/api/ashas":
            return DirectResponse(get_ashas())
        return DirectResponse({"detail": "Not found"}, 404)

    def post(self, path: str, json=None):
        if path in ("/api/ask", "/api/assistant/ask"):
            req = AskRequest(**(json or {}))
            return DirectResponse(ask_assistant(req))
        return DirectResponse({"detail": "Not found"}, 404)


class TestE2EIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = DirectTestClient()

    def test_status_endpoint(self):
        res = self.client.get("/api/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("system_status"), "OPERATIONAL")
        self.assertEqual(data.get("offline_mode"), True)
        self.assertEqual(data.get("protocols_indexed"), 107)
        self.assertGreaterEqual(data.get("register_members", 0), 2000)

    def test_ask_emergency_convulsions(self):
        payload = {"question": "Baby has continuous fits and convulsions"}
        res = self.client.post("/api/ask", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.status, "EMERGENCY")
        self.assertEqual(data.urgency, "CRITICAL")
        self.assertTrue(data.cited_section_id.startswith("ESC-"))
        self.assertIn("108", data.action_required)

    def test_ask_out_of_scope_antibiotics(self):
        payload = {"question": "What is the dosage of amoxicillin for 3 year child?"}
        res = self.client.post("/api/ask", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.status, "OUT_OF_SCOPE")
        self.assertEqual(data.cited_section_id, "SCP-1.2")
        self.assertIn("Medical Officer", data.answer)

    def test_ask_in_scope_anc_schedule(self):
        payload = {"question": "When is the 4th ANC checkup due?"}
        res = self.client.post("/api/ask", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.status, "GROUNDED_ANSWER")
        self.assertEqual(data.cited_section_id, "ANC-1.2")
        self.assertIn("36 weeks", data.answer)

    def test_visits_list_retrieval(self):
        res = self.client.get("/api/visits?limit=10")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data.get("total_count", 0), 0)
        self.assertLessEqual(len(data.get("items", [])), 10)
        item = data["items"][0]
        self.assertIn("member_id", item)
        self.assertIn("priority", item)
        self.assertIn(item["priority"], [1, 2, 3])

    def test_protocols_directory(self):
        res = self.client.get("/api/protocols")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data.get("protocols", [])), 9)


if __name__ == "__main__":
    unittest.main(verbosity=2)
