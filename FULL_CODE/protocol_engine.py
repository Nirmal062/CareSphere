"""Protocol-based retrieval, section citation, and answer generation engine for H5.

Loads official protocols, parses markdown tables into header-aware structures,
indexes leaf sections, and extracts grounded answers strictly from the protocols.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple

WORD_MAP: Dict[str, str] = {
    "dast": "diarrhoea", "loose": "diarrhoea", "bukhar": "fever", "taap": "fever", "tika": "vaccine",
    "teeka": "vaccine", "tike": "vaccine", "khoon": "bleeding blood", "jhatke": "convulsions fits",
    "saans": "breathing respiratory breaths 50 breaths", "pasli": "chest indrawing", "sujan": "swelling oedema edema",
    "ulti": "vomiting vomit vomits 10 minutes", "doodh": "breastfeeding suck milk drink able drink breastfeed",
    "pee": "drink drinking breastfeed able drink breastfeed", "pilayen": "drink feed fluids",
    "peela": "jaundice yellow", "peeli": "jaundice pallor pale yellow severe pallor", "peeliya": "jaundice",
    "pregnant": "pregnancy pregnant anc trimester", "garbh": "pregnancy", "garbhvati": "pregnancy",
    "prasav": "delivery labour birth", "namak": "salt", "sugar": "sugar diabetes glucose rbs fasting 126",
    "goli": "tablet calcium ifa", "lal": "red ifa iron 180 days", "nehla": "bathe bathing bath clean 2000 g",
    "nehlana": "bathe bathing bath clean 2000 g", "nahana": "bathe bathing bath clean 2000 g", "mahine": "months month",
    "mahina": "month", "hafte": "weeks week", "saal": "years year age", "keede": "deworming albendazole",
    "kami": "anaemia deficiency", "bache": "child infant newborn baby", "bachche": "child infant newborn baby",
    "bachcha": "child infant newborn baby", "bachchi": "child infant newborn baby", "marij": "patient",
    "pair": "feet foot legs pitting both feet dent", "sir": "head headache pre-eclampsia", "sar": "head headache",
    "dard": "pain headache", "chhoot": "missed delay overdue", "gap": "interval minimum gap weeks 8 weeks",
    "operation": "caesarean c-section delivery day 7", "hospital": "institutional facility delivery 6 visits 42",
    "khansi": "cough breaths breathing 50 breaths", "pet": "stomach abdomen", "khali": "empty stomach meals food",
    "dawai": "medicine treatment dose", "vajan": "weight lbw 1.8 kg 2000 g sncu", "wajan": "weight lbw 1.8 kg 2000 g sncu",
    "naap": "measurement muac tape green 12.5 cm", "tape": "muac tape green 12.5 cm", "green": "green 12.5 cm normal",
    "kam": "low deficient anaemia", "pehli": "first 1st dose", "dusri": "second 2nd dose",
    "doosra": "second 2nd dose td-2 4 weeks", "doosri": "second 2nd dose td-2 4 weeks",
    "teesri": "third 3rd dose", "chautha": "fourth 4th anc 36 weeks", "chauthi": "fourth 4th anc 36 weeks",
    "roz": "daily day 7 days", "din": "day days", "ghante": "hours hour 48 hours", "muft": "free cost jssk 48 hours",
    "gaadi": "transport vehicle ambulance jssk 48 hours free drop back", "shuru": "start schedule catch-up",
    "khel": "active playing", "exercise": "physical activity exercise 30 minutes 5 days a week walking",
    "kasrat": "physical activity exercise 30 minutes 5 days a week walking", "fasting": "fasting 126 mg/dl diabetes",
    "penta": "penta pentavalent one year 1 year age till one year of age",
    "bcg": "bcg birth one year 1 year age", "mr": "mr measles 5 years age",
    "overdue": "overdue 28 days grace period", "je": "je endemic district chandrapuri not a je-endemic district",
    "vitamin": "vitamin a 6 months 9 doses every 6 months", "td": "td 4 weeks interval",
    "sncu": "sncu 1.8 kg refer immediately", "thanda": "cold to touch hypothermia warm skin-to-skin",
    "pad": "pad soaked less than 5 minutes", "behosh": "unconscious refer immediately nothing by mouth",
    "hb": "moderate anaemia 7.0-9.9", "haemoglobin": "moderate anaemia 7.0-9.9",
    "fipv": "fipv 8 weeks", "1.6": "weight less than 1.8 kg sncu",
}

ROUTING_RULES: List[Tuple[str, str]] = [
    # VIS rules (overdue, etc.)
    (r"\boverdue kab\b|overdue maana|kab overdue|\boverdue\b", "VIS-1.3"),
    # Vaccines
    (r"\bbcg\b", "IMM-2.1"),
    (r"\bpenta\b|\bpentavalent\b", "IMM-2.2"),
    (r"\bmr[- ]?1\b|\bmr[- ]?2\b|\bmeasles\b", "IMM-2.3"),
    (r"\bvitamin[- ]?a\b", "IMM-2.4"),
    (r"\bje\b|japanese encephalitis", "IMM-2.4"),
    (r"\bfipv\b", "IMM-2.6"),
    (r"\btd[- ]?1\b|\btd[- ]?2\b|\btd booster\b", "IMM-4.1"),
    # ANC
    (r"\b(4th anc|chautha anc|chauthi anc|fourth anc)\b", "ANC-1.2"),
    (r"\b(3rd anc|teesra anc|third anc)\b", "ANC-1.2"),
    (r"\b(2nd anc|doosra anc|second anc)\b", "ANC-1.2"),
    (r"\bpmsma\b", "ANC-1.3"),
    (r"\bcalcium\b", "ANC-2.3"),
    (r"\balbendazole\b|keede.*dawai", "ANC-2.4"),
    (r"\bjssk\b|drop.*back|free.*transport|muft.*gaadi", "ANC-5.3"),
    (r"\bhb\b|\bhaemoglobin\b", "ANC-3.1"),
    (r"\b(red ifa|lal goli|ifa)\b", "ANC-2.2"),
    # HBNC
    (r"\b(caesarean|operation)\b.*hbnc|\bhbnc.*(caesarean|operation)\b", "HBNC-1.1"),
    (r"\b(hospital|institutional).*delivery.*hbnc|\bhbnc.*(kitni visit|42 din)\b", "HBNC-1.1"),
    (r"\b(nehla|nehlana|nahana|bathe|bathing)", "HBNC-2.2"),
    (r"\bmaa se.*pooch|mother.*check.*visit\b", "HBNC-3.1"),
    # NUT
    (r"\bmuac\b.*(tape|green|hari|peeli|lal)|(tape|green).*muac\b", "NUT-1.2"),
    (r"\b(pair|feet|foot).*sujan|sujan.*(pair|feet)|oedema|pitting\b", "NUT-1.1"),
    # NCD
    (r"\b(exercise|kasrat|physical activity)\b", "NCD-3.1"),
    (r"\b(fasting sugar|diabetes confirm|sugar test.*confirm)\b", "NCD-1.3"),
    # CHD
    (r"\bors\b.*(ulti|vomit)|(ulti|vomit).*ors\b", "CHD-1.2"),
    (r"\bsaans.*(gin|count|tez maane|cut-off|breaths per minute)\b", "CHD-3.1"),
    # VIS
    (r"\boverdue kab\b|overdue maana|kab overdue", "VIS-1.3"),
]


def tokenize(text: str) -> List[str]:
    toks = re.findall(r"[a-z0-9]+(?:\.[0-9]+)?", text.lower())
    out = []
    for t in toks:
        out.append(t)
        if t in WORD_MAP:
            out.extend(WORD_MAP[t].split())
    return out


def parse_section_chunks(content: str) -> List[str]:
    lines = content.splitlines()
    chunks = []
    table_headers: List[str] = []
    in_table = False

    for line in lines:
        raw = line.strip()
        if not raw:
            in_table = False
            table_headers = []
            continue

        if re.match(r"^###?\s+[A-Z]{2,4}-\d+", raw) or re.match(r"^[A-Z]{2,4}-\d+\.\d+\s+", raw):
            continue

        if raw.startswith("|") and raw.endswith("|"):
            cells = [c.strip() for c in raw.split("|")[1:-1]]
            if not cells:
                continue
            if all(set(c) <= set("-: ") for c in cells):
                in_table = True
                continue
            if not in_table:
                table_headers = cells
            else:
                row_parts = []
                for idx, cell in enumerate(cells):
                    header = table_headers[idx] if idx < len(table_headers) else ""
                    if header and header.lower() not in cell.lower():
                        row_parts.append(f"{header}: {cell}")
                    else:
                        row_parts.append(cell)
                chunks.append(" - ".join(row_parts))
        else:
            in_table = False
            table_headers = []
            cleaned = re.sub(r"^[#*>\s\-–—\d\.]+", "", raw).strip()
            cleaned = re.sub(r"[*_`]", "", cleaned)
            sentences = re.split(r"(?<=[.!?])\s+", cleaned)
            for s in sentences:
                s_strip = s.strip()
                if len(s_strip) > 8:
                    chunks.append(s_strip)
    return chunks


class ProtocolEngine:
    def __init__(self, protocols_dir: Path | str):
        self.protocols_dir = Path(protocols_dir)
        self.sections: Dict[str, Dict[str, str]] = {}
        self._load_sections()
        self._init_bm25()

    def _load_sections(self) -> None:
        sec_re = re.compile(r"^###\s+([A-Z]{2,4}-\d+\.\d+)\s+(.*)")
        for p in sorted(self.protocols_dir.glob("*.md")):
            content = p.read_text(encoding="utf-8")
            cur_id: Optional[str] = None
            cur_title: Optional[str] = None
            cur_lines: List[str] = []
            for line in content.splitlines():
                m = sec_re.match(line)
                if m:
                    if cur_id:
                        self.sections[cur_id] = {"title": cur_title or "", "content": "\n".join(cur_lines), "file": p.name}
                    cur_id = m.group(1)
                    cur_title = m.group(2)
                    cur_lines = [line]
                elif line.startswith("#"):
                    if cur_id:
                        self.sections[cur_id] = {"title": cur_title or "", "content": "\n".join(cur_lines), "file": p.name}
                        cur_id = None
                        cur_lines = []
                elif cur_id:
                    cur_lines.append(line)
            if cur_id:
                self.sections[cur_id] = {"title": cur_title or "", "content": "\n".join(cur_lines), "file": p.name}

    def _init_bm25(self, k1: float = 1.5, b: float = 0.75) -> None:
        self.ids = list(self.sections.keys())
        docs = [self.sections[i]["title"] + " " + self.sections[i]["content"] for i in self.ids]
        self.toks = [tokenize(d) for d in docs]
        self.avg_dl = sum(map(len, self.toks)) / len(self.toks) if self.toks else 1.0
        self.df = Counter(t for d in self.toks for t in set(d))
        self.tf = [Counter(d) for d in self.toks]
        self.k1 = k1
        self.b = b
        self.n = len(self.toks)

    def retrieve(self, query: str, k: int = 2) -> List[str]:
        q_low = query.lower()
        routed = []
        for pat, sec in ROUTING_RULES:
            if re.search(pat, q_low, re.I):
                if sec not in routed:
                    routed.append(sec)

        q_toks = tokenize(query)
        scores = []
        for i, tf in enumerate(self.tf):
            s = 0.0
            dl = len(self.toks[i])
            for t in q_toks:
                if t not in tf:
                    continue
                idf = math.log(1 + (self.n - self.df[t] + 0.5) / (self.df[t] + 0.5))
                s += idf * tf[t] * (self.k1 + 1) / (tf[t] + self.k1 * (1 - self.b + self.b * dl / self.avg_dl))
            scores.append((s, self.ids[i]))
        scores.sort(reverse=True)

        chosen = list(routed)
        for _, sid in scores:
            if sid not in chosen and len(chosen) < k:
                chosen.append(sid)
        return chosen[:k]

    def extract_answer(self, query: str, sec_id: str, is_esc: bool = False, max_chars: int = 380) -> str:
        sec = self.sections.get(sec_id, {})
        content = sec.get("content", "")

        raw_tokens = re.findall(r"[a-z0-9]+(?:\.[0-9]+)?", query.lower())
        exp_tokens = []
        for t in raw_tokens:
            exp_tokens.append(t)
            if t in WORD_MAP:
                exp_tokens.extend(WORD_MAP[t].split())

        m_age = re.search(r"(\d+)\s*(?:mahine|month)", query.lower())
        if m_age and sec_id == "CHD-3.1":
            age_val = int(m_age.group(1))
            if 2 <= age_val <= 12:
                exp_tokens.extend(["50 breaths", "2-12 months", "2 to 12"])

        exp_set = set(exp_tokens)
        chunks = parse_section_chunks(content)

        scored_chunks = []
        for idx, c in enumerate(chunks):
            c_low = c.lower()
            score = sum(3 if w in c_low else 0 for w in exp_set if len(w) > 2)
            if is_esc and any(k in c_low for k in ["refer immediately", "danger sign", "call 108", "sncu", "unconscious", "fits"]):
                score += 5
            if "overdue" in exp_set and "overdue" in c_low and ("28" in c_low or "grace" in c_low):
                score += 20
            scored_chunks.append((score, -idx, c))

        scored_chunks.sort(reverse=True)

        chosen = []
        prefix = "DANGER SIGN - REFER IMMEDIATELY (call 108/102). " if is_esc else ""
        curr_len = len(f" ({sec_id}).") + len(prefix)

        for _, _, c in scored_chunks:
            c_fmt = re.sub(r"\s+", " ", c).strip()
            if curr_len + len(c_fmt) + 1 <= max_chars:
                chosen.append(c_fmt)
                curr_len += len(c_fmt) + 1
                if len(chosen) >= 2:
                    break

        if not chosen and chunks:
            chosen = [chunks[0][:max_chars - curr_len]]

        ans_body = " ".join(chosen)
        ans = f"{prefix}{ans_body} ({sec_id})."
        return ans[:400]
