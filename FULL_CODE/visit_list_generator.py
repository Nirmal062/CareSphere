"""Official Protocol-based Daily Visit List Generator for H5.

Implements all rules from protocol document 09_VIS_daily_visit_list_rules.md:
- Date of evaluation: 2026-10-26 (Monday).
- Pregnant women: ANC check-ups (ANC-1 to ANC-4), Td in pregnancy (Td-1, Td-2, Td-BST), HRP-followup.
- Children: Complete UIP vaccine schedule with upper age bounds, previous dose requirements, and minimum intervals.
- Newborns: Home-based newborn care (HBNC-D1, D3, D7, D14, D21, D28, D42) by institutional vs home delivery.
- Malnutrition: Monthly MUAC screening for children 6-59 months (MUAC-check).
- Chronic Diseases (NCD): Monthly BP and blood sugar follow-up (BP-followup, Sugar-followup).
- High-Risk Prioritization: High-risk members get Priority 1 for overdue/due_today items; others Priority 2; upcoming Priority 3.
"""
from __future__ import annotations

import argparse
from datetime import date, timedelta
from pathlib import Path
import re
from typing import Optional, Tuple

import pandas as pd

TODAY = date(2026, 10, 26)

ANC_WINDOWS = {
    1: (0, 84),
    2: (98, 182),
    3: (196, 238),
    4: (252, 280),
}

HBNC_SCHEDULE = {
    "institution": [3, 7, 14, 21, 28, 42],
    "home": [1, 3, 7, 14, 21, 28, 42],
}

# Vaccine table from VIS-3.1:
# code, due_age_days, not_after_days, prev_dose_code, min_gap_days
VACCINE_RULES = [
    ("BCG", 0, 365, None, None),
    ("HepB-0", 0, 0, None, None),
    ("OPV-0", 0, 15, None, None),
    ("OPV-1", 42, 1825, None, None),
    ("OPV-2", 70, 1825, "OPV-1", 28),
    ("OPV-3", 98, 1825, "OPV-2", 28),
    ("Penta-1", 42, 365, None, None),
    ("Penta-2", 70, 365, "Penta-1", 28),
    ("Penta-3", 98, 365, "Penta-2", 28),
    ("RVV-1", 42, 365, None, None),
    ("RVV-2", 70, 365, "RVV-1", 28),
    ("RVV-3", 98, 365, "RVV-2", 28),
    ("fIPV-1", 42, 365, None, None),
    ("fIPV-2", 98, 365, "fIPV-1", 56),
    ("fIPV-3", 276, 729, "fIPV-2", 56),
    ("PCV-1", 42, 365, None, None),
    ("PCV-2", 98, 729, "PCV-1", 60),
    ("PCV-B", 276, 729, "PCV-2", 60),
    ("MR-1", 276, 1825, None, None),
    ("MR-2", 490, 1825, "MR-1", 28),
    ("OPV-B", 490, 1825, "OPV-3", 180),
    ("DPT-B1", 490, 2554, "Penta-3", 180),
    ("DPT-B2", 1827, 2554, "DPT-B1", None),
]


def item_key(s: str) -> str:
    """Normalize item keys ignoring punctuation, case, and spaces."""
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def parse_date(s: Optional[str]) -> Optional[date]:
    if not s or not isinstance(s, str):
        return None
    try:
        return date.fromisoformat(s.strip())
    except ValueError:
        return None


def parse_bp(bp_str: Optional[str]) -> Optional[Tuple[int, int]]:
    """Parse blood pressure string like '140/90' or '175 / 105'."""
    if not bp_str or not isinstance(bp_str, str):
        return None
    m = re.match(r"^\s*(\d+)\s*/\s*(\d+)\s*$", bp_str.strip())
    if not m:
        return None
    sys_val, dia_val = int(m.group(1)), int(m.group(2))
    if sys_val == 0 and dia_val == 0:
        return None
    return sys_val, dia_val


def is_member_high_risk(r: pd.Series) -> bool:
    """Determine whether a member is high-risk per VIS-5.1."""
    dob = parse_date(r.get("dob"))

    # 1. Pregnant woman: last Hb < 7.0 g/dL or last ANC BP >= 140/90
    if r.get("pregnant") == "Y":
        hb_val = r.get("last_hb_gdl")
        if hb_val:
            try:
                if float(hb_val) < 7.0:
                    return True
            except ValueError:
                pass
        bp = parse_bp(r.get("last_anc_bp"))
        if bp and (bp[0] >= 140 or bp[1] >= 90):
            return True

    # 2. Baby <= 42 days old
    if dob and (TODAY - dob).days <= 42:
        return True

    # 3. Child aged 184–1824 days with MUAC < 11.5 cm or bilateral pitting oedema == 'Y'
    if dob and 184 <= (TODAY - dob).days <= 1824:
        if r.get("bilateral_pitting_oedema") == "Y":
            return True
        muac_val = r.get("last_muac_cm")
        if muac_val:
            try:
                if float(muac_val) < 11.5:
                    return True
            except ValueError:
                pass

    # 4. NCD patient whose last recorded BP >= 140/90
    ncd = str(r.get("ncd_condition") or "")
    if "HTN" in ncd or "DM" in ncd:
        bp = parse_bp(r.get("last_bp_reading"))
        if bp and (bp[0] >= 140 or bp[1] >= 90):
            return True

    return False


def build_daily_visit_list(reg: pd.DataFrame) -> pd.DataFrame:
    """Build the prioritized daily visit list for the entire register."""
    rows = []

    for _, r in reg.iterrows():
        mid = r["member_id"]
        dob = parse_date(r.get("dob"))
        is_hr = is_member_high_risk(r)

        # -------------------------------------------------------------
        # 1. High-Risk Pregnancy Follow-up (VIS-2.3)
        # -------------------------------------------------------------
        if r.get("pregnant") == "Y":
            hrp = False
            hb_val = r.get("last_hb_gdl")
            if hb_val:
                try:
                    if float(hb_val) < 7.0:
                        hrp = True
                except ValueError:
                    pass
            bp = parse_bp(r.get("last_anc_bp"))
            if bp and (bp[0] >= 140 or bp[1] >= 90):
                hrp = True
            if hrp:
                rows.append((mid, "HRP-followup", 1))

        # -------------------------------------------------------------
        # 2. ANC Check-ups (VIS-2.1)
        # -------------------------------------------------------------
        if r.get("pregnant") == "Y" and parse_date(r.get("lmp_date")):
            lmp = parse_date(r["lmp_date"])
            done_dates = [d for d in (r.get("anc_visit_dates") or "").split(";") if d.strip()]
            k = len(done_dates) + 1
            if k in ANC_WINDOWS:
                opens_d, closes_d = ANC_WINDOWS[k]
                open_date = lmp + timedelta(days=opens_d)
                close_date = lmp + timedelta(days=closes_d)

                if open_date <= TODAY + timedelta(days=6):
                    if open_date > TODAY:
                        priority = 3
                    elif TODAY <= close_date:
                        priority = 1 if is_hr else 2
                    else:
                        priority = 1 if is_hr else 2
                    rows.append((mid, f"ANC-{k}", priority))

        # -------------------------------------------------------------
        # 3. Td in Pregnancy (VIS-2.2)
        # -------------------------------------------------------------
        if r.get("pregnant") == "Y":
            anc_dates = [parse_date(d) for d in (r.get("anc_visit_dates") or "").split(";") if d.strip()]
            first_anc = min(anc_dates) if anc_dates else None

            td_given = {}
            for entry in (r.get("td_doses") or "").split(";"):
                if ":" in entry:
                    c, dt = entry.split(":", 1)
                    parsed_dt = parse_date(dt)
                    if parsed_dt:
                        td_given[item_key(c)] = parsed_dt

            if r.get("td_booster_eligible") == "Y":
                if item_key("Td-BST") not in td_given and first_anc:
                    due_d = first_anc
                    if due_d <= TODAY + timedelta(days=6):
                        priority = 3 if due_d > TODAY else (1 if is_hr else 2)
                        rows.append((mid, "Td-BST", priority))
            else:
                if item_key("Td-1") not in td_given:
                    if first_anc:
                        due_d = first_anc
                        if due_d <= TODAY + timedelta(days=6):
                            priority = 3 if due_d > TODAY else (1 if is_hr else 2)
                            rows.append((mid, "Td-1", priority))
                elif item_key("Td-2") not in td_given:
                    td1_date = td_given[item_key("Td-1")]
                    due_d = td1_date + timedelta(days=28)
                    if due_d <= TODAY + timedelta(days=6):
                        priority = 3 if due_d > TODAY else (1 if is_hr else 2)
                        rows.append((mid, "Td-2", priority))

        # -------------------------------------------------------------
        # 4. Child Vaccines (VIS-3.1)
        # -------------------------------------------------------------
        if dob and (TODAY - dob).days <= 2554:
            child_age = (TODAY - dob).days
            given_vaccines = {}
            for entry in (r.get("child_vaccines") or "").split(";"):
                if ":" in entry:
                    c, dt = entry.split(":", 1)
                    p_dt = parse_date(dt)
                    k_vac = item_key(c)
                    if p_dt:
                        if k_vac not in given_vaccines or p_dt < given_vaccines[k_vac]:
                            given_vaccines[k_vac] = p_dt

            for code, due_age, not_after, prev_code, min_gap in VACCINE_RULES:
                ckey = item_key(code)
                if ckey in given_vaccines:
                    continue
                if child_age > not_after:
                    continue

                prev_date = None
                if prev_code:
                    pkey = item_key(prev_code)
                    if pkey not in given_vaccines:
                        continue
                    prev_date = given_vaccines[pkey]

                due_d = dob + timedelta(days=due_age)
                if prev_date and min_gap:
                    due_d = max(due_d, prev_date + timedelta(days=min_gap))

                if (due_d - dob).days > not_after:
                    continue

                if due_d <= TODAY + timedelta(days=6):
                    priority = 3 if due_d > TODAY else (1 if is_hr else 2)
                    rows.append((mid, code, priority))

        # -------------------------------------------------------------
        # 5. HBNC Visits for Newborns (VIS-4.1)
        # -------------------------------------------------------------
        if dob and (TODAY - dob).days <= 42:
            place = r.get("place_of_delivery") if r.get("place_of_delivery") in HBNC_SCHEDULE else "institution"
            sched = HBNC_SCHEDULE[place]
            done_hbnc = set()
            for v in (r.get("hbnc_visits_done") or "").split(";"):
                if v.strip().isdigit():
                    done_hbnc.add(int(v.strip()))

            past_visits = [d for d in sched if dob + timedelta(days=d - 1) <= TODAY]
            latest_past = past_visits[-1] if past_visits else None

            if latest_past and latest_past not in done_hbnc:
                # Newborn <= 42 days is always high risk -> priority 1
                rows.append((mid, f"HBNC-D{latest_past}", 1))
            else:
                future_visits = [d for d in sched if dob + timedelta(days=d - 1) > TODAY]
                if future_visits:
                    next_fut = future_visits[0]
                    v_date = dob + timedelta(days=next_fut - 1)
                    if v_date <= TODAY + timedelta(days=6) and next_fut not in done_hbnc:
                        rows.append((mid, f"HBNC-D{next_fut}", 3))

        # -------------------------------------------------------------
        # 6. MUAC Check (VIS-5.2)
        # -------------------------------------------------------------
        if dob:
            age_days = (TODAY - dob).days
            if 178 <= age_days <= 1824:
                last_m_d = parse_date(r.get("last_muac_date"))
                due_d = last_m_d + timedelta(days=30) if last_m_d else dob + timedelta(days=184)
                if due_d <= TODAY + timedelta(days=6):
                    priority = 3 if due_d > TODAY else (1 if is_hr else 2)
                    rows.append((mid, "MUAC-check", priority))

        # -------------------------------------------------------------
        # 7. NCD Monthly Follow-up (VIS-5.3)
        # -------------------------------------------------------------
        ncd = str(r.get("ncd_condition") or "")
        if "HTN" in ncd:
            last_bp_d = parse_date(r.get("last_bp_check_date"))
            if not last_bp_d:
                rows.append((mid, "BP-followup", 1 if is_hr else 2))
            else:
                due_d = last_bp_d + timedelta(days=30)
                if due_d <= TODAY + timedelta(days=6):
                    priority = 3 if due_d > TODAY else (1 if is_hr else 2)
                    rows.append((mid, "BP-followup", priority))

        if "DM" in ncd:
            last_sugar_d = parse_date(r.get("last_sugar_check_date"))
            if not last_sugar_d:
                rows.append((mid, "Sugar-followup", 1 if is_hr else 2))
            else:
                due_d = last_sugar_d + timedelta(days=30)
                if due_d <= TODAY + timedelta(days=6):
                    priority = 3 if due_d > TODAY else (1 if is_hr else 2)
                    rows.append((mid, "Sugar-followup", priority))

    df = pd.DataFrame(rows, columns=["member_id", "due_item", "priority"])
    df["key"] = df["member_id"] + "|" + df["due_item"].map(item_key)
    df = df.drop_duplicates(subset=["key"]).drop(columns=["key"])
    return df


def main():
    parser = argparse.ArgumentParser(description="Generate official H5 visit list.")
    parser.add_argument("--register", default="data/household_register.csv", help="Path to household register CSV")
    parser.add_argument("--out", default="submission_dev", help="Output directory")
    args = parser.parse_args()

    reg_path = Path(args.register)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Reading register from {reg_path}...")
    reg = pd.read_csv(reg_path, dtype=str, keep_default_na=False)
    print(f"Total register members: {len(reg)}")

    visit_df = build_daily_visit_list(reg)
    out_file = out_dir / "H5_visit_list.csv"
    visit_df.to_csv(out_file, index=False, encoding="utf-8")
    print(f"Generated {len(visit_df)} visit list rows -> {out_file}")


if __name__ == "__main__":
    main()
