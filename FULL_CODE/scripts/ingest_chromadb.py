"""Idempotent ingestion script for persistent ChromaDB storage in CareSphere.

Populates:
1. `protocol_sections` collection: 107 leaf sections from official protocol markdown documents.
2. `verified_qa` collection: 40 development questions with verified ground-truth labels.

Strict isolation:
NEVER ingests, accesses, or touches hidden test data (`data/questions_test.csv`).
"""
from __future__ import annotations

import csv
import json
import logging
import sys
from pathlib import Path

# Setup paths
ROOT_DIR = Path(__file__).resolve().parents[1]
FULL_CODE_DIR = ROOT_DIR / "FULL_CODE"
for p in [str(FULL_CODE_DIR), str(ROOT_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from chroma_retrieval import ChromaRetrievalEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("IngestChroma")


def load_protocol_sections() -> dict:
    """Load all 107 protocol leaf sections from data/sections.json or data/protocols/*.md."""
    sections_json = ROOT_DIR / "data" / "sections.json"
    if sections_json.exists():
        with open(sections_json, "r", encoding="utf-8") as f:
            sections = json.load(f)
            logger.info(f"Loaded {len(sections)} sections from {sections_json.name}")
            return sections

    # Fallback to parsing markdown files directly
    protocols_dir = ROOT_DIR / "data" / "protocols"
    sections = {}
    import re
    for p in sorted(protocols_dir.glob("*.md")):
        text = p.read_text(encoding="utf-8")
        parts = re.split(r"\n(?=###\s+[A-Z]+-\d+\.\d+)", text)
        for part in parts:
            m = re.match(r"^###\s+([A-Z]+-\d+\.\d+)\s+(.+?)\n(.*)", part, re.DOTALL)
            if m:
                sec_id = m.group(1).strip()
                title = m.group(2).strip()
                content = m.group(3).strip()
                sections[sec_id] = {
                    "id": sec_id,
                    "title": title,
                    "content": content,
                    "file": p.name,
                }
    logger.info(f"Parsed {len(sections)} sections from markdown files in {protocols_dir}")
    return sections


def load_verified_qa() -> list:
    """Load verified dev question-answer pairs strictly from development data."""
    dev_truth_file = ROOT_DIR / "data" / "dev_truth.jsonl"
    questions_dev_file = ROOT_DIR / "data" / "questions_dev.csv"

    # Map qid -> question_text from csv if needed
    q_texts = {}
    if questions_dev_file.exists():
        with open(questions_dev_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                q_texts[row["question_id"]] = row["question_text"]

    records = []
    if dev_truth_file.exists():
        with open(dev_truth_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                item = json.loads(line)
                qid = item["question_id"]
                qtext = q_texts.get(qid, item.get("notes", ""))
                item["question_text"] = qtext
                records.append(item)
        logger.info(f"Loaded {len(records)} verified dev QA records from {dev_truth_file.name}")
    return records


def main():
    logger.info("Initializing persistent ChromaDB vector store...")
    chroma_dir = ROOT_DIR / "data" / "chroma_db"
    engine = ChromaRetrievalEngine(persist_directory=chroma_dir)

    # 1. Ingest Protocol Sections
    sections = load_protocol_sections()
    sec_count = engine.ingest_protocol_sections(sections)
    logger.info(f"Protocol sections stored: {sec_count} records.")

    # 2. Ingest Verified QA
    qa_records = load_verified_qa()
    qa_count = engine.ingest_verified_qa(qa_records)
    logger.info(f"Verified QA records stored: {qa_count} records.")

    # 3. Verify counts
    counts = engine.get_collection_counts()
    logger.info(f"ChromaDB collection status: {counts}")

    # 4. Spot check retrieval
    sample_queries = [
        "What is the schedule for ANC check-ups?",
        "garbhini sthree ki eppudu anc chek-up cheyali?",
        "Can you write Python code for a binary search tree?",
        "bachche ko loose motion hai ors kitna dena hai?",
    ]
    logger.info("\n--- Spot Check Retrieval ---")
    for q in sample_queries:
        res = engine.evaluate_grounding(q)
        logger.info(
            f"Query: '{q}' -> Status: {res['status']}, Top Sim: {res['top_similarity']:.4f}, "
            f"Section: {res['best_section_id']} ({res['best_section_title']})"
        )


if __name__ == "__main__":
    main()
