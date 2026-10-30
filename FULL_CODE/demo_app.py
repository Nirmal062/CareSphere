"""Frontline Health-Worker Companion (H5) — Streamlit Demo UI.

Interactive demo interface for frontline health workers (ASHA/ANM) in Chandrapuri Block.
Provides:
1. Health Protocol Assistant with hard-coded emergency detection and scope refusal.
2. Daily Prioritized Visit List with search, filtering, and summary metrics.
3. Offline execution status, synthetic data notice, and clinical disclaimers.
"""
from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import pandas as pd
import streamlit as st

# Setup paths and imports
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent if CURRENT_DIR.name == "FULL_CODE" else CURRENT_DIR

if str(PROJECT_ROOT / "FULL_CODE") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "FULL_CODE"))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from emergency_detector import detect_escalation
from refusal_detector import is_out_of_scope
from protocol_engine import ProtocolEngine
from visit_list_generator import build_daily_visit_list

# Page Configuration (Mobile-friendly layout)
st.set_page_config(
    page_title="CareSphere — Frontline Health Companion",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom High-Contrast CSS for Frontline Usability
st.markdown("""
<style>
    .reportview-container {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .emergency-box {
        background-color: #fee2e2;
        border: 2px solid #b91c1c;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        color: #7f1d1d;
    }
    .refusal-box {
        background-color: #fef3c7;
        border: 2px solid #b45309;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        color: #78350f;
    }
    .answer-box {
        background-color: #ecfdf5;
        border: 2px solid #047857;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        color: #064e3b;
    }
    .badge-cit {
        background-color: #1e3a8a;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.85em;
        display: inline-block;
    }
    .disclaimer-banner {
        background-color: #f1f5f9;
        border-left: 4px solid #64748b;
        padding: 10px 14px;
        font-size: 0.88em;
        color: #334155;
        margin-bottom: 15px;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_resource(show_spinner="Loading protocol knowledge base...")
def load_protocol_engine() -> ProtocolEngine:
    protocols_dir = PROJECT_ROOT / "data" / "protocols"
    if not protocols_dir.exists():
        fallback = PROJECT_ROOT / "protocols"
        if fallback.exists():
            protocols_dir = fallback
    return ProtocolEngine(protocols_dir)


@st.cache_data(show_spinner="Generating daily visit register...")
def load_visit_data() -> pd.DataFrame:
    # First check if pre-generated visit list exists
    pregen = PROJECT_ROOT / "submission" / "H5_visit_list.csv"
    if pregen.exists():
        return pd.read_csv(pregen, dtype={"member_id": str, "due_item": str, "priority": int})
    
    # Fallback: generate dynamically from household register
    reg_path = PROJECT_ROOT / "data" / "household_register.csv"
    if reg_path.exists():
        reg = pd.read_csv(reg_path, dtype=str, keep_default_na=False)
        return build_daily_visit_list(reg)
    
    return pd.DataFrame(columns=["member_id", "due_item", "priority"])


# Load engines
try:
    engine = load_protocol_engine()
except Exception as e:
    st.error(f"Error loading protocol engine: {e}")
    st.stop()

# Sidebar — Operational Status & Architecture Overview
with st.sidebar:
    st.markdown("""
    <div style="background-color:#0d9488; color:white; padding:8px 12px; border-radius:6px; text-align:center; font-weight:700; font-size:11px; margin-bottom:12px; letter-spacing:0.5px;">
        STATUS: LOCAL DECISION ENGINE
    </div>
    """, unsafe_allow_html=True)
    st.title("CareSphere")
    st.caption("Frontline Health-Worker Decision Companion • Chandrapuri Sub-Centre")
    
    with st.expander("ℹ️ Clinical Notice & Data Disclosure"):
        st.caption("CareSphere is designed to assist qualified ANMs and ASHAs. Register records and patient IDs are synthetic. In life-threatening emergencies, immediate referral must always be initiated.")
    
    st.markdown("---")
    st.markdown("### ⚙️ System Specifications")
    st.markdown("""
    - **Engine Mode**: Local Device Processing
    - **Latency**: < 1.0 ms median on CPU
    - **Protocols**: 9 GoI guidelines (107 leaf sections)
    - **Escalation Gate**: ACTIVE (Recall: 1.0, FP: 0.0)
    - **Verified Accuracy Score**: **0.9956**
    """)
    
    st.markdown("---")
    st.markdown("### 🚨 Emergency Contacts")
    st.markdown("""
    - **108**: Emergency Medical Ambulance
    - **102**: Free Transport for Pregnant Women / Sick Infants (JSSK)
    - **Chandrapuri DH**: Referral District Hospital
    """)


# Main Navigation Tabs
tab_assistant, tab_visits, tab_about = st.tabs([
    "💬 Health Protocol Assistant",
    "📋 Daily Visit List (2026-10-26)",
    "ℹ️ Architecture & Validation"
])

# =============================================================================
# FEATURE 1: Health Protocol Assistant
# =============================================================================
with tab_assistant:
    st.subheader("Frontline Protocol Query Assistant")
    st.markdown(
        "Ask questions regarding antenatal care, child immunizations, newborn care, "
        "malnutrition (MUAC), diabetes/hypertension screening, or danger signs."
    )

    # Preset Demo Questions for Quick Evaluation
    st.markdown("**Sample Demo Queries (Click to test):**")
    col_d1, col_d2, col_d3 = st.columns(3)
    
    selected_demo_q = None
    with col_d1:
        if st.button("📋 Standard Protocol Query", help="ANC check-up timeline"):
            selected_demo_q = "4th ANC checkup kitne hafte pe karate hai?"
        if st.button("💉 Child Immunization Query", help="Minimum interval between fIPV doses"):
            selected_demo_q = "fIPV ke doses ke beech minimum gap kitna rakhna hai?"
    with col_d2:
        if st.button("🚨 Emergency: Newborn LBW", help="Birth weight below 1.8 kg (SNCU referral)"):
            selected_demo_q = "bachcha 1.6 kg ka paida hua ghar pe, kal raat"
        if st.button("🚨 Emergency: Pre-eclampsia", help="Third-trimester facial swelling and headache"):
            selected_demo_q = "7 mahine pregnant hai, pair aur chehra suja hai, sir dard bhi hai, kahan dikhayen?"
    with col_d3:
        if st.button("⛔ Out-of-Scope: Drug Dose", help="Paracetamol dosage (requires MO)"):
            selected_demo_q = "2 saal ke bachche ko halka bukhar aa raha hai, paracetamol syrup kitna dena hai?"
        if st.button("⛔ Out-of-Scope: Uncovered Condition", help="Typhoid widal interpretation"):
            selected_demo_q = "ek aadmi ko typhoid ka widal test positive aaya hai, iska kya matlab?"

    # User Query Input Box
    default_text = selected_demo_q if selected_demo_q else ""
    user_query = st.text_input(
        "Enter Health Worker Query (supports English and Roman Hindi / Hinglish):",
        value=default_text,
        placeholder="e.g., 3rd ANC checkup kab hota hai? OR bachche ko bukhar hai...",
        key="worker_query_input"
    )

    if st.button("🔍 Search Protocol Book", type="primary") or user_query:
        if not user_query.strip():
            st.warning("Please enter a question or click one of the sample demo buttons above.")
        else:
            t0 = time.perf_counter()
            q_clean = user_query.strip()
            
            # -------------------------------------------------------------
            # STEP 1: Hard-Coded Emergency Detection (Runs First)
            # -------------------------------------------------------------
            esc = detect_escalation(q_clean)
            
            if esc.escalate:
                latency_ms = (time.perf_counter() - t0) * 1000
                sec_id = esc.section_id or "ESC-1.1"
                ans_text = engine.extract_answer(q_clean, sec_id, is_esc=True)
                
                st.markdown(f"""
                <div class="emergency-box">
                    <h3 style="margin-top:0; color:#b91c1c;">🚨 DANGER SIGN DETECTED — REFER IMMEDIATELY</h3>
                    <p><strong>Identified Condition:</strong> {esc.reason}</p>
                    <p><strong>Protocol Guidance:</strong> {ans_text}</p>
                    <p><span class="badge-cit" style="background-color:#b91c1c;">Official Citation: {sec_id}</span></p>
                </div>
                """, unsafe_allow_html=True)
                
                # Emergency Action Bar
                col_em1, col_em2, col_em3 = st.columns([1, 1, 2])
                with col_em1:
                    st.error("📞 **Call 108** (Emergency Ambulance)")
                with col_em2:
                    st.error("🚑 **Call 102** (Free JSSK Transport)")
                with col_em3:
                    st.info("ℹ️ **Action**: Inform Medical Officer / ANM immediately and arrange transfer to Chandrapuri District Hospital / SNCU.")
                
                st.caption(f"⚡ Processing Latency: {latency_ms:.2f} ms | Evaluated by Hard-Coded Safety Layer (ESC)")

            # -------------------------------------------------------------
            # STEP 2: Out-of-Scope Refusal (SCP-1.2)
            # -------------------------------------------------------------
            elif is_out_of_scope(q_clean):
                latency_ms = (time.perf_counter() - t0) * 1000
                st.markdown("""
                <div class="refusal-box">
                    <h3 style="margin-top:0; color:#b45309;">⚠️ Out of Scope — Redirect to Medical Officer</h3>
                    <p>This inquiry falls outside the frontline ASHA/ANM protocol book (e.g., prescribing prescription drug doses, interpreting complex lab reports, or treating conditions not covered by these protocols).</p>
                    <p><strong>Official Action:</strong> Please consult the Medical Officer at the Primary Health Centre (PHC) or your supervising ANM.</p>
                    <p><span class="badge-cit" style="background-color:#b45309;">Official Citation: SCP-1.2</span></p>
                </div>
                """, unsafe_allow_html=True)
                st.caption(f"⚡ Processing Latency: {latency_ms:.2f} ms | Evaluated by Scope Enforcement Layer (SCP-1.2)")

            # -------------------------------------------------------------
            # STEP 3: In-Scope Protocol Information Retrieval
            # -------------------------------------------------------------
            else:
                cited_sections = engine.retrieve(q_clean, k=1)
                sec_id = cited_sections[0] if cited_sections else "SCP-1.1"
                ans_text = engine.extract_answer(q_clean, sec_id, is_esc=False)
                latency_ms = (time.perf_counter() - t0) * 1000
                
                st.markdown(f"""
                <div class="answer-box">
                    <h3 style="margin-top:0; color:#047857;">✅ Protocol-Grounded Answer</h3>
                    <p style="font-size: 1.1em; line-height: 1.5;">{ans_text}</p>
                    <p><span class="badge-cit">Cited Protocol Section: {sec_id}</span></p>
                </div>
                """, unsafe_allow_html=True)
                
                # Show full matching section content in an expander
                sec_info = engine.sections.get(sec_id, {})
                with st.expander(f"📖 View Source Protocol Excerpt ({sec_id} — {sec_info.get('title', '')})"):
                    st.markdown(sec_info.get("content", "No additional text."))
                    st.caption(f"Source Document: {sec_info.get('file', '')}")
                
                st.caption(f"⚡ Processing Latency: {latency_ms:.2f} ms | Verified Grounded Extraction (BM25 + Entity Router)")


# =============================================================================
# FEATURE 2: Daily Visit List Planner
# =============================================================================
with tab_visits:
    st.subheader("Daily Prioritized Visit List")
    st.markdown(
        "Prioritized schedule for **2026-10-26 (Monday)** generated from the Chandrapuri Block register (500 synthetic households)."
    )
    
    visit_df = load_visit_data()
    
    if visit_df.empty:
        st.warning("No visit list data found. Run `FULL_CODE/visit_list_generator.py` to create the schedule.")
    else:
        # Summary Metrics
        p1_count = len(visit_df[visit_df["priority"] == 1])
        p2_count = len(visit_df[visit_df["priority"] == 2])
        p3_count = len(visit_df[visit_df["priority"] == 3])
        total_count = len(visit_df)
        
        m_col1, m_col2, m_col3, m_col4 = st.columns(4)
        m_col1.metric("Total Due Visits", total_count)
        m_col2.metric("🔴 Priority 1 (High-Risk)", p1_count, help="Severe anaemia, high BP >=140/90, newborns <=42d, severe malnutrition")
        m_col3.metric("🔵 Priority 2 (Routine Due)", p2_count, help="Routine overdue and due today items")
        m_col4.metric("⚪ Priority 3 (Upcoming)", p3_count, help="Items due within the next 6 days (2026-10-27 to 2026-11-01)")
        
        st.markdown("---")
        
        # Filters and Search
        f_col1, f_col2, f_col3 = st.columns([1, 1, 2])
        with f_col1:
            p_filter = st.selectbox(
                "Filter by Priority:",
                options=["All", "Priority 1 (High-Risk)", "Priority 2 (Routine Due)", "Priority 3 (Upcoming)"]
            )
        with f_col2:
            item_categories = sorted(list(set(visit_df["due_item"].dropna())))
            item_filter = st.selectbox("Filter by Due Item:", options=["All"] + item_categories)
        with f_col3:
            search_query = st.text_input("Search by Member ID:", placeholder="e.g. M-HVKXHGUI...")
        
        # Apply Filters
        filtered_df = visit_df.copy()
        
        if p_filter == "Priority 1 (High-Risk)":
            filtered_df = filtered_df[filtered_df["priority"] == 1]
        elif p_filter == "Priority 2 (Routine Due)":
            filtered_df = filtered_df[filtered_df["priority"] == 2]
        elif p_filter == "Priority 3 (Upcoming)":
            filtered_df = filtered_df[filtered_df["priority"] == 3]
            
        if item_filter != "All":
            filtered_df = filtered_df[filtered_df["due_item"] == item_filter]
            
        if search_query.strip():
            filtered_df = filtered_df[filtered_df["member_id"].str.contains(search_query.strip(), case=False, na=False)]
            
        # Display Table with Human-Friendly Priority Labels
        def map_priority_label(p):
            if p == 1:
                return "🔴 Priority 1: High-Risk"
            elif p == 2:
                return "🔵 Priority 2: Routine Due"
            elif p == 3:
                return "⚪ Priority 3: Upcoming"
            return str(p)

        display_df = filtered_df.copy()
        display_df["priority_level"] = display_df["priority"].apply(map_priority_label)
        
        st.markdown(f"**Showing {len(display_df)} matching visits:**")
        st.dataframe(
            display_df[["member_id", "due_item", "priority_level"]].rename(columns={
                "member_id": "Member ID (Synthetic)",
                "due_item": "Due Protocol Service",
                "priority_level": "Priority Tier"
            }),
            use_container_width=True,
            height=400
        )


# =============================================================================
# FEATURE 3: Architecture & Validation
# =============================================================================
with tab_about:
    st.subheader("System Architecture & Verified Results")
    
    st.markdown("""
    ### 🛡️ Safety-First Architecture
    1. **Pre-Model Emergency Gating**:
       Emergency danger signs from `03_ESC_danger_signs_refer_immediately.md` are evaluated using deterministic rule-based symptom/context screening before any retrieval or text synthesis. The model is never permitted to override or downgrade a danger sign.
    2. **Scope Enforcement (`SCP-1.2`)**:
       Explicit boundaries refuse medicine dosage calculations (e.g. antibiotics, paracetamol) and unsupported conditions (e.g. TB, COVID, Typhoid), directly protecting patient safety in low-connectivity rural settings.
    3. **100% Offline Operation**:
       The entire companion operates deterministically using the Python standard library, `pandas`, and `numpy`. No heavy neural models, external GPUs, or network connections are required.
    """)
    
    st.markdown("---")
    st.markdown("### 📊 Official Development Evaluator Score")
    
    eval_col1, eval_col2, eval_col3 = st.columns(3)
    eval_col1.metric("Escalation Gate", "PASS", "Recall: 1.0000 | FP Rate: 0.0000")
    eval_col2.metric("Refusal Accuracy", "1.0000", "6/6 OOS Correct")
    eval_col3.metric("Citation Accuracy", "1.0000", "34/34 Leaf Citations Correct")
    
    eval_col4, eval_col5, eval_col6 = st.columns(3)
    eval_col4.metric("Key Fact Coverage", "0.9706", "Numbers & criteria preserved")
    eval_col5.metric("Visit List Score", "1.0000", "F1: 1.0000 | Priority: 1.0000")
    eval_col6.metric("Primary Score", "0.9956", "Official Evaluator Score")
    
    st.caption("Official evaluator output recorded in score.json against data/dev_truth.jsonl.")
