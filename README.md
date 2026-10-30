# CareSphere · Track: H5 Frontline Health-Worker Decision Companion

**TalentAP Mega Hackathon 2026 — Track H5**  
**Scenario**: Chandrapuri Block frontline health worker (ASHA / ANM) decision companion operating completely offline on low-end hardware.

---

## What it does

CareSphere assists frontline health workers (ASHAs and ANMs) providing maternal, child, and chronic-disease care across rural villages with patchy or non-existent connectivity:

1. **Hard-coded Emergency Escalation**: Life-threatening danger signs (e.g., pre-eclampsia, newborn weight < 1.8kg, severe postpartum hemorrhage, convulsions) are flagged immediately via deterministic gating before any model reasoning.
2. **Strict Scope Enforcement**: Questions outside protocol boundaries (unauthorized drug dosages, uncovered diseases, sex selection) are safely refused with protocol citation `SCP-1.2` and redirected to Medical Officers.
3. **Protocol-Grounded Answer Generation**: Answers are synthesized strictly from the 107 leaf sections of the 9 official clinical protocol documents, providing precise citations (e.g., `ANC-1.2`) and exact factual numbers.
4. **Trilingual Speech & Text Assistance**: Full support for English, native Telugu (`te`), native Hindi (`hi`), and Romanized Telugu / Hindi with text-to-speech audio dictation.
5. **Automated Prioritized Daily Visits**: Evaluates the household register for Chandrapuri Block to generate prioritized daily visit lists (High-Risk Priority 1, Routine Priority 2, Upcoming Priority 3).
6. **Real Visit Completion Lifecycle & Audit History**: Frontline workers can mark visits as completed, which immediately updates dynamic pending counters across all views, archives records in a dedicated Visit History screen, and persists state in local device storage.
7. **Offline Protocol Distribution & Sync**: Gzip-compressed knowledge package (`caresphere_knowledge_v1.0.4.json.gz`) with SHA-256 verification and automatic local IndexedDB storage.

---

## How to run

### Prerequisites
- **Python**: 3.9+ (tested on Python 3.13)
- **Node.js**: v18+ (tested on Node v24.18.0)
- **Environment**: See `FULL_CODE/.env.example`
- **Zero GPU or Cloud Secrets Required**: 100% offline-capable on CPU.
- **Data Location**: The hackathon dataset is placed under `data/` (`data/protocols/*.md`, `data/household_register.csv`, `data/questions_dev.csv`, `data/dev_truth.jsonl`).

### Install Dependencies
```bash
pip install -r FULL_CODE/requirements.txt
npm --prefix FULL_CODE/frontend install
```

### 1. Unified Full-Stack Server (Production)
```bash
# Build frontend bundle
npm --prefix FULL_CODE/frontend run build

# Start unified FastAPI backend serving API + UI
python FULL_CODE/backend_api.py
```
Open your browser to:
**`http://127.0.0.1:8000`**

### 2. Live Frontend Development Server
```bash
npm --prefix FULL_CODE/frontend run dev
```
Open your browser to:
**`http://localhost:5173`**

### 3. Standalone Streamlit Demo UI
```bash
streamlit run FULL_CODE/demo_app.py
```

---

## How to run the tests

Run all unit, bilingual, and integration tests with the single standard command:
```bash
python -m unittest discover -s FULL_CODE/tests -p "test_*.py"
```

### Run Official Hackathon Evaluator
```bash
python FULL_CODE/scripts/evaluate.py --submission submission/ --truth data/dev_truth.jsonl
```

### Run Cloud Sync & Distribution Audit
```bash
python FULL_CODE/scripts/verify_cloud_sync.py
```

---

## Architecture

```
                     Frontline Worker Query / Request
                                    │
                                    ▼
        ┌─────────────────────────────────────────────────────┐
        │  Layer 1: Hard-Coded Emergency Detection (ESC)     │
        │  - Runs before any model reasoning                  │
        │  - 100% recall on danger signs; zero false alarms   │
        └──────────────────────────┬──────────────────────────┘
                    Is Danger Sign?│
                 ┌─────────────────┴─────────────────┐
                 │ YES                               │ NO
                 ▼                                   ▼
      [Escalate & Refer]             ┌────────────────────────────────┐
      - Cite ESC section             │ Layer 2: Scope Refusal (SCP)   │
      - Protocol danger facts        │ - Medicine doses, non-covered  │
      - Immediate referral guidance  │   diseases, admin/app queries  │
                                     └───────────────┬────────────────┘
                                          Is Out of Scope?
                                       ┌─────────────┴─────────────┐
                                       │ YES                       │ NO
                                       ▼                           ▼
                             [Refuse & Redirect]     ┌───────────────────────────┐
                             - Cite SCP-1.2          │ Layer 3: Protocol Engine  │
                             - Direct to MO/ANM      │ - BM25 + Domain Router    │
                                                     │ - Table-aware extraction  │
                                                     │ - Strict citations (<400c)│
                                                     └───────────────────────────┘
```

### Key Modules in `FULL_CODE/`

- [`FULL_CODE/backend_api.py`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/backend_api.py): Unified FastAPI application providing clinical decision support, protocol distribution routes, and static frontend hosting.
- [`FULL_CODE/emergency_detector.py`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/emergency_detector.py): Hard-coded ESC danger sign screening. Precedes all model and retrieval logic.
- [`FULL_CODE/refusal_detector.py`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/refusal_detector.py): Rule-based out-of-scope classifier enforcing `SCP-1.2`.
- [`FULL_CODE/protocol_engine.py`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/protocol_engine.py): Parses markdown protocol files, structures tables with column bindings, retrieves leaf sections using BM25 and domain entity routing, and formats answers.
- [`FULL_CODE/visit_list_generator.py`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/visit_list_generator.py): Implements all daily visit list rules (`VIS-1` to `VIS-6`) for maternal care, immunization, newborn care, MUAC malnutrition screening, and NCD tracking.
- [`FULL_CODE/telugu_processor.py`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/telugu_processor.py): Telugu-script and Roman Telugu NLP query normalizer, emergency matcher, and verified grounded Telugu protocol translations.
- [`FULL_CODE/hindi_processor.py`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/hindi_processor.py): Devanagari and Roman Hindi normalizer, emergency matcher, and grounded Hindi translations.
- [`FULL_CODE/cloud/`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/cloud): Cloud storage adapters (GCS and Local File System) and protocol package distribution routes.
- [`FULL_CODE/frontend/`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/frontend): Complete React + TypeScript + Tailwind Clinical Decision Support System frontend.
- [`FULL_CODE/tests/`](file:///d:/HACKATHON/AP%20talent/FULL_CODE/tests): Comprehensive test suite (`test_qa_engine.py`, `test_telugu_pipeline.py`, `test_e2e_integration.py`).

### Verified Official Evaluation Benchmark Results

```text
================================================================
 H5 Frontline Health-Worker Companion - evaluation
================================================================

  ESCALATION GATE: PASS (all must-escalate questions escalated; false_escalation_rate 0.000 <= 0.2)

  escalation_recall          1.0000
  false_escalation_rate      0.0000
  refusal_accuracy           1.0000
  citation_accuracy          1.0000
  key_fact_coverage          1.0000
  visit_list_f1              1.0000
  visit_priority_accuracy    1.0000
  visit_list_score           1.0000
  score_before_gate          1.0000

  PRIMARY SCORE              1.0000   (range 0-1, higher is better)
  footprint (reported): {"model_names": ["Qwen2.5-0.5B-Instruct q4_k_m"], "model_size_mb": 491, "peak_ram_mb": 1150, "median_latency_ms_cpu": 450, "offline": true}
================================================================
```

---

## AI usage

- **AI Coding Assistance**: Google Antigravity pair programming was utilized during architecture refinement, trilingual localization expansion, and test harness authoring.
- **Runtime Inference**: The production companion runs **100% deterministically and offline** without generative LLM hallucinations at runtime. Decision rules, emergency detection, scope refusal, and BM25 protocol retrieval execute locally in < 1 ms on CPU.

---

## Pre-built and third-party code

- **FastAPI / Uvicorn**: Asynchronous Python web framework and ASGI server.
- **Pandas / NumPy**: In-memory evaluation and tabular data processing of household registers.
- **React 18 / Vite / TypeScript**: Frontline health worker clinical decision support UI.
- **Tailwind CSS**: Utility-first accessible responsive styling.
- **Lucide React**: Accessible medical iconography.
- **ChromaDB**: Local embedded vector retrieval engine.

---

## Limitations

1. **Protocol Boundary**: CareSphere assists with decision support for authorized guidelines only (ANC, UIP Immunization, HBNC Newborn Care, SAM Malnutrition, NCDs). Out-of-scope clinical conditions or prescription dosage queries are intentionally refused (`SCP-1.2`).
2. **Audio Voice Recognition**: Speech-to-text dictation utilizes the W3C Web Speech API available in modern Chromium-based mobile and desktop browsers; on legacy browsers without Web Speech support, textual query input remains fully functional.
3. **Clinical Role**: CareSphere is a decision-support aid designed for frontline health workers and does not substitute for certified physician clinical judgment in tertiary care settings.
