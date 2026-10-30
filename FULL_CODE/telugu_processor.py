"""Telugu language support and query normalization processor for H5 Frontline Companion.

Provides:
1. Detection of Telugu script (తెలుగు) and Romanized Telugu (e.g. 'garbhini', 'eppudu cheyinchali').
2. Telugu-to-Canonical query normalization for emergency detection, refusal detection, and BM25 retrieval.
3. Pre-translated, protocol-verified Telugu answers, recommended actions, and emergency guidance.
4. 100% offline, deterministic execution without external cloud translation APIs.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple

# Detect Telugu Unicode script
TELUGU_SCRIPT_RE = re.compile(r"[\u0C00-\u0C7F]")

# Common Roman Telugu marker words
ROMAN_TELUGU_WORDS = {
    "garbhini", "garbhavati", "eppudu", "cheyinchali", "ivvali", "enta", "ento", 
    "bidda", "sisuvu", "pillalu", "puttina", "baruvu", "kaampu", "prasavam", 
    "raktham", "spruha", "ledu", "undi", "jwaram", "virechanalu", "teeka", "teekalu", 
    "talanoppi", "mukham", "vaapu", "kaallu", "paalu", "thaagadam", "aakali", 
    "mandulu", "golilu", "nalugava", "moodava", "rendava", "modati", "dhaara", 
    "vyavadhi", "antuvyadhi", "kallu", "tiragadam", "vomiting", "moorcha"
}

# Telugu Script to English / Protocol Token Normalization Map
TELUGU_SCRIPT_MAP: Dict[str, str] = {
    # Maternal & ANC
    "గర్భిణీ": "pregnant pregnancy anc",
    "గర్భవతి": "pregnant pregnancy anc",
    "గర్భం": "pregnant pregnancy",
    "చెకప్": "checkup anc",
    "చెకప్‌లు": "checkups anc",
    "నాలుగో": "fourth 4th anc 36 weeks",
    "నాలుగవ": "fourth 4th anc 36 weeks",
    "మూడో": "third 3rd anc",
    "మూడవ": "third 3rd anc",
    "రెండో": "second 2nd anc",
    "రెండవ": "second 2nd anc",
    "మొదటి": "first 1st anc",
    "ఎప్పుడు": "when weeks timeline",
    "చేయించాలి": "conduct visit due",
    "రక్తం": "blood bleeding haemoglobin anaemia",
    "రక్తహీనత": "anaemia hb haemoglobin",
    "రక్తస్రావం": "bleeding haemorrhage heavy bleeding",
    "నొప్పి": "pain headache",
    "తలపోటు": "headache pre-eclampsia",
    "తల నొప్పి": "headache pre-eclampsia",
    "వాపు": "swelling oedema edema",
    "ముఖం వాపు": "face swelling pre-eclampsia",
    "కాళ్ళ వాపు": "feet oedema swelling pitting",
    "బీపీ": "bp blood pressure hypertension 140/90",
    "బ్లడ్ ప్రెజర్": "bp blood pressure hypertension",
    "షుగర్": "sugar diabetes glucose rbs fasting 126",
    "మధుమేహం": "sugar diabetes glucose",
    "ఐరన్": "iron ifa red ifa tablet 180 days",
    "కాల్షియం": "calcium tablet anc",
    "నట్టల మందు": "albendazole deworming keede",
    "ఉచిత రవాణా": "free transport jssk ambulance 48 hours",
    "కాన్పు": "delivery labour birth",
    "ప్రసవం": "delivery labour birth",

    # Child & Immunization
    "టీకా": "vaccine immunization schedule",
    "టీకాలు": "vaccine immunization schedule",
    "డోస్": "dose vaccine",
    "డోసులు": "doses vaccine",
    "వ్యవధి": "interval minimum gap weeks",
    "కనీస వ్యవధి": "minimum gap interval weeks 8 weeks",
    "జ్వరం": "fever bukhar 7 days",
    "విరేచనాలు": "diarrhoea dast loose motions ors zinc",
    "నీళ్ల విరేచనాలు": "diarrhoea watery stools ors",
    "శిశువు": "infant newborn baby child",
    "బిడ్డ": "child infant baby newborn",
    "పిల్లలు": "child children infant",
    "పిల్లాడు": "child baby",
    "పుట్టిన": "born birth newborn",
    "బరువు": "weight birth weight kg",
    "తక్కువ బరువు": "low birth weight lbw 1.8 kg sncu",
    "పాలు తాగలేకపోవడం": "unable to drink suck feed breastfeed",
    "తాగట్లేదు": "not able to drink suck feed",
    "ఫిట్స్": "fits convulsions seizure jhatke",
    "మూర్ఛ": "fits convulsions seizure",
    "స్పృహ లేదు": "unconscious behosh refer immediately",
    "స్పృహ కోల్పోవడం": "loss of consciousness unconscious",
    "చల్లగా": "cold to touch hypothermia warm skin-to-skin",
    "శ్వాస": "breathing respiratory breaths fast breathing",
    "దగ్గు": "cough breaths fast breathing",
    "పోషకాహార లోపం": "malnutrition muac tape",
    "టేప్": "muac tape green 12.5 cm yellow red",
    "కొలత": "measurement muac",
    "ఆకుపచ్చ": "green 12.5 cm normal",
    "ఎరుపు": "red severe acute malnutrition sam",
    "పసుపు": "yellow moderate acute malnutrition mam",

    # Specific Vaccines in Telugu
    "బీసీజీ": "bcg birth one year 1 year age",
    "పెంటా": "penta pentavalent one year",
    "ఎంఆర్": "mr measles rubella 5 years",
    "విటమిన్ ఎ": "vitamin a 6 months 9 doses",
    "ఎఫ్ఐపీవీ": "fipv 8 weeks",
    "పోలియో": "opv polio birth 5 years",
    "టీడీ": "td tetanus adult 4 weeks interval",

    # Refusal & Out-of-Scope in Telugu
    "ఎంత ఇవ్వాలి": "dosage kitna dose medicine dosage",
    "ఎంత మోతాదు": "dosage dose calculation",
    "పారాసిటమాల్": "paracetamol syrup dose",
    "యాంటీబయాటిక్": "antibiotic amoxicillin dose",
    "టైఫాయిడ్": "typhoid widal test",
    "డెంగ్యూ": "dengue test",
    "క్యాన్సర్": "cancer treatment",
    "క్షయ": "tuberculosis tb",
    "గర్భస్రావం": "abortion garbhpat",
    "లింగ నిర్ధారణ": "sex determination gender",
    "జీతం": "salary incentive maandey",
    "లాగిన్": "portal login password otp",
}

# Roman Telugu to Canonical English/Protocol Map
ROMAN_TELUGU_MAP: Dict[str, str] = {
    "garbhini": "pregnant pregnancy anc",
    "garbhavati": "pregnant pregnancy anc",
    "prasavam": "delivery birth labour",
    "kaampu": "delivery birth",
    "bidda": "child infant newborn baby",
    "sisuvu": "infant newborn baby child",
    "pillalu": "child children infant",
    "puttina": "born birth newborn",
    "baruvu": "weight birth weight kg",
    "teeka": "vaccine immunization schedule",
    "teekalu": "vaccine immunization schedule",
    "nalugava": "fourth 4th anc 36 weeks",
    "moodava": "third 3rd anc",
    "rendava": "second 2nd anc",
    "modati": "first 1st anc",
    "eppudu": "when timeline weeks",
    "cheyinchali": "conduct visit due",
    "vyavadhi": "minimum gap interval weeks",
    "jwaram": "fever bukhar",
    "virechanalu": "diarrhoea dast ors",
    "raktham": "blood bleeding anaemia",
    "spruha": "unconscious behosh",
    "ledu": "not absent zero",
    "undi": "present exists",
    "talanoppi": "headache pre-eclampsia",
    "vaapu": "swelling oedema edema",
    "mukham": "face swelling",
    "kaallu": "feet pitting oedema",
    "paalu": "milk breastfeeding suck drink",
    "thaagadam": "drinking feeding sucking",
    "aakali": "feeding appetite",
    "mandulu": "medicine drug dose",
    "golilu": "tablet medicine",
    "enta": "how much dose calculation",
    "ivvali": "give administer dose",
    "moorcha": "fits convulsions",
    "fits": "fits convulsions",
    "challa": "cold hypothermia",
    "swasa": "breathing fast breaths",
    "daggu": "cough breathing",
}


def is_telugu_text(text: str) -> bool:
    """Check if query is written in Telugu script or Roman Telugu."""
    if TELUGU_SCRIPT_RE.search(text):
        return True
    
    # Check Roman Telugu words
    tokens = set(re.findall(r"[a-z]+", text.lower()))
    matches = tokens.intersection(ROMAN_TELUGU_WORDS)
    return len(matches) >= 2 or (len(matches) == 1 and any(w in matches for w in ["garbhini", "eppudu", "cheyinchali", "teeka", "teekalu", "baruvu", "bidda"]))


def detect_query_language(text: str) -> str:
    """Return 'te' if Telugu (script or Roman), else 'en'."""
    return "te" if is_telugu_text(text) else "en"


def normalize_telugu_query(query: str) -> str:
    """Translate Telugu keywords and concepts into canonical protocol query string.
    
    Preserves numbers, vaccine names, acronyms (ANC, fIPV, BCG, Hb, BP, MUAC),
    and appends canonical protocol terms to allow standard retrieval.
    """
    normalized = query
    extra_tokens = []

    # 1. Check Telugu script matches
    for te_word, canonical in TELUGU_SCRIPT_MAP.items():
        if te_word in normalized:
            extra_tokens.append(canonical)

    # 2. Check Roman Telugu matches
    lower_q = query.lower()
    for rom_word, canonical in ROMAN_TELUGU_MAP.items():
        if re.search(r"\b" + re.escape(rom_word) + r"\b", lower_q):
            extra_tokens.append(canonical)

    # Combine original query (with numbers/acronyms preserved) + normalized concepts
    if extra_tokens:
        return f"{query} {' '.join(extra_tokens)}"
    return query


# =============================================================================
# TELUGU EMERGENCY & OUT-OF-SCOPE PATTERNS
# =============================================================================

def check_telugu_emergency(query: str) -> Optional[Tuple[str, str, str]]:
    """Check if a Telugu query represents a danger sign.
    
    Returns (section_id, english_reason, telugu_reason) or None.
    """
    q = query.lower()

    # ESC-4.4: Low birth weight (< 1.8 kg) in Telugu
    if (re.search(r"(1\.\s*[0-7]|1\.[0-7])\s*(kg|కిలో|కిలోలు)", q) or re.search(r"\b1[0-7]00\s*(g|గ్రాములు)", q)) and (
        re.search(r"పుట్టిన|బిడ్డ|శిశువు|పాప|బాబు|బరువు|puttina|bidda|sisuvu|baruvu", q)
    ):
        return ("ESC-4.4", "Birth weight below 1.8 kg", "పుట్టిన బిడ్డ బరువు 1.8 కిలోల కంటే తక్కువగా ఉంది (SNCU కు వెంటనే తరలించాలి)")

    # ESC-1.1 / ESC-3.1: Bleeding in pregnancy or postpartum
    if re.search(r"రక్తస్రావం|రక్తం చాలా|అధిక రక్తం|రక్తం ఆగట్లేదు|రక్తం కారు|తీవ్ర రక్త|bleeding", q):
        if re.search(r"గర్భ|నెలలు|కడుపు|trimester|pregnant", q):
            return ("ESC-1.1", "Vaginal bleeding during pregnancy", "గర్భధారణ సమయంలో రక్తస్రావం (వెంటనే రిఫర్ చేయండి)")
        return ("ESC-3.1", "Severe bleeding (postpartum or antepartum)", "తీవ్ర రక్తస్రావం (వెంటనే రిఫర్ చేయండి)")

    # ESC-3.1: Heavy bleeding after delivery
    if re.search(r"కాన్పు|ప్రసవం|డెలివరీ|prasav|kaampu|delivery", q) and re.search(r"రక్తం చాలా|అధిక రక్తస్రావం|రక్తం ఆగట్లేదు|raktham|heavy bleeding", q):
        return ("ESC-3.1", "Heavy bleeding after delivery", "ప్రసవానంతర అధిక రక్తస్రావం (వెంటనే రిఫర్ చేయండి)")

    # ESC-5.1: Convulsions / fits
    if re.search(r"ఫిట్స్|మూర్ఛ|వణుకు|fits|convulsion|moorcha|jhatke", q):
        return ("ESC-5.1", "Convulsions", "పిల్లలలో ఫిట్స్ లేదా మూర్ఛ (వెంటనే రిఫర్ చేయండి)")

    # ESC-1.4 / ESC-6.3: Unconsciousness
    if re.search(r"స్పృహ లేదు|స్పృహ తప్పింది|మత్తుగా ఉంది|పలకట్లేదు|spruha ledu|unconscious", q):
        sec = "ESC-6.3" if re.search(r"షుగర్|డయాబెటిస్|sugar|diabetes", q) else "ESC-1.4"
        return (sec, "Unconscious person", "స్పృహ కోల్పోయిన స్థితి (వెంటనే రిఫర్ చేయండి)")

    # ESC-2.3: Pregnancy with facial swelling + severe headache (Pre-eclampsia)
    pregnant = bool(re.search(r"గర్భిణీ|గర్భవతి|నెలావిడ|garbhini|pregnant|garbhavati", q))
    if pregnant and re.search(r"ముఖం వాపు|ముఖం వాచింది|mukham.*vaapu|face.*swell", q) and re.search(r"తల నొప్పి|తలపోటు|talanoppi|headache|కళ్ళు తిరగడం", q):
        return ("ESC-2.3", "Possible pre-eclampsia danger signs", "గర్భిణీలో ముఖం వాపు మరియు తీవ్రమైన తలనొప్పి (ప్రీ-ఎక్లాంప్సియా ప్రమాద సూచన)")
    if pregnant and re.search(r"తీవ్రమైన తలనొప్పి|చూపు మందగించడం|కళ్ళు సరిగ్గా కనిపించట్లేదు", q):
        return ("ESC-2.3", "Possible pre-eclampsia danger sign", "గర్భిణీలో తీవ్రమైన తలనొప్పి / చూపు మందగించడం (ప్రీ-ఎక్లాంప్సియా)")

    # ESC-5.1: Child unable to drink or feed
    if re.search(r"బిడ్డ|పాప|బాబు|శిశువు|పిల్లాడు|bidda|sisuvu|baby", q) and re.search(r"పాలు తాగట్లేదు|పాలు తాగలేకపోవడం|తాగడం మానేసింది|paalu.*thaagadam.*ledu|unable to drink|not able to suck", q):
        return ("ESC-5.1", "Child unable to drink or feed", "శిశువు పాలు తాగలేకపోవడం / రొమ్ము పాలు తీసుకోలేకపోవడం")

    # ESC-5.4: Fever lasting > 7 days in a child
    if re.search(r"జ్వరం|fever|jwaram", q) and re.search(r"(7|8|9|10|15)\s*(రోజుల|rojula|days)|వారం కంటే ఎక్కువ", q):
        if re.search(r"పిల్లాడు|బిడ్డ|శిశువు|పాప|బాబు|bidda|child", q):
            return ("ESC-5.4", "Fever lasting more than 7 days", "పిల్లలలో 7 రోజుల కంటే ఎక్కువ రోజులు నిరంతరం జ్వరం ఉండటం")

    # ESC-4.3: Newborn cold to touch
    if re.search(r"నవజాత|బిడ్డ|శిశువు|పుట్టిన|newborn|bidda", q) and re.search(r"చల్లగా ఉంది|శరీరం చల్లబడింది|స్పర్శకు చల్లగా|cold to touch|challa", q):
        return ("ESC-4.3", "Newborn cold to touch", "నవజాత శిశువు శరీరం చల్లబడటం (హైపోథెర్మియా - వెంటనే వెచ్చదనం కల్పించి రిఫర్ చేయండి)")

    return None


def check_telugu_out_of_scope(query: str) -> bool:
    """Check if a Telugu query falls under SCP-1.2 out-of-scope topics."""
    q = query.lower()

    # Drug dosages
    if re.search(r"పారాసిటమాల్|యాంటీబయాటిక్|మందు ఎంత|ఎంత డోస్|ఎంత ఇవ్వాలి|ఎన్ని చుక్కలు|ఎన్ని మాత్రలు|paracetamol enta|dose enta|enta ivvali", q):
        return True

    # Conditions not covered
    if re.search(r"టైఫాయిడ్|వైడల్ టెస్ట్|డెంగ్యూ|క్యాన్సర్|క్షయ|టిబి|హెచ్ఐవి|ఎయిడ్స్|కుక్క కాటు|రాబీస్|typhoid|widal|cancer|tb|hiv|dog bite", q):
        return True

    # Family planning / abortion
    if re.search(r"గర్భస్రావం|గర్భస్రావం మందులు|అబార్షన్|కాపర్-టి|మాత్రలు గర్భనిరోధక|abortion|copper-t", q):
        return True

    # Sex determination
    if re.search(r"అబ్బాయా అమ్మాయా|లింగ నిర్ధారణ|బాబు పుడతాడా పాప పుడుతుందా|sex determination|gender test", q):
        return True

    # Administrative
    if re.search(r"జీతం రాలేదు|ఆశా జీతం|యూ-విన్ లాగిన్|ఓటీపీ|రేషన్ కార్డు|ఆయుష్మాన్ కార్డు|మరణ ధ్రువీకరణ|salary|u-win login|otp", q):
        return True

    return False


# =============================================================================
# GROUNDED TELUGU TRANSLATIONS FOR OFFICIAL PROTOCOLS
# =============================================================================

# Verified protocol leaf answers in Telugu (strictly aligned with GoI protocols)
PROTOCOL_TELUGU_ANSWERS: Dict[str, Dict[str, str]] = {
    "ANC-1.2": {
        "title_te": "ANC తనిఖీల కాలపట్టిక (ANC-1.2)",
        "answer_te": "ప్రతి గర్భిణీ స్త్రీకి కనీసం నాలుగు ANC తనిఖీలు తప్పనిసరిగా చేయించాలి: 1వ చెకప్: 12 వారాల లోపు (సాధ్యమైనంత త్వరగా); 2వ చెకప్: 14 నుండి 26 వారాల మధ్య; 3వ చెకప్: 28 నుండి 34 వారాల మధ్య; 4వ చెకప్: 36 వారాల నుండి ప్రసవం వరకు.",
        "action_te": "గర్భిణీకి 4వ ANC తనిఖీని 36 వారాలు దాటిన తర్వాత షెడ్యూల్ చేయండి మరియు రవాణా ఏర్పాట్లను సమీక్షించండి.",
    },
    "ANC-1.3": {
        "title_te": "ప్రధానమంత్రి సురక్షిత మాతృత్వ అభియాన్ - PMSMA (ANC-1.3)",
        "answer_te": "PMSMA క్లినిక్‌లు ప్రతి నెలా 9వ తేదీన నిర్వహించబడతాయి. 2వ మరియు 3వ త్రైమాసికంలో ఉన్న గర్భిణీ స్త్రీలను వైద్య అధికారి లేదా గైనకాలజిస్ట్ వద్దకు సమగ్ర పరీక్షల కోసం రిఫర్ చేయాలి.",
        "action_te": "2వ లేదా 3వ త్రైమాసిక గర్భిణులను సమీప పీహెచ్‌సీలో జరిగే PMSMA క్లినిక్‌కి రిఫర్ చేయండి.",
    },
    "ANC-2.2": {
        "title_te": "ఐరన్ మరియు ఫోలిక్ యాసిడ్ - IFA సప్లిమెంటేషన్ (ANC-2.2)",
        "answer_te": "1వ త్రైమాసికం (12 వారాలు) ముగిసిన తర్వాత ప్రతి గర్భిణీ స్త్రీకి రోజుకు ఒక ఎర్ర IFA మాత్ర (100 mg ఎలిమెంటల్ ఐరన్ + 500 mcg ఫోలిక్ యాసిడ్) చొప్పున కనీసం 180 రోజుల పాటు ఇవ్వాలి. తీవ్ర రక్తహీనత ఉంటే వెంటనే మెడికల్ ఆఫీసర్‌కి చూపించాలి.",
        "action_te": "IFA మాత్రలను రోజుకు ఒకటి చొప్పున భోజనం తర్వాత తీసుకోవాలని సూచించండి; టీ/కాఫీతో పాటు తీసుకోరాదు.",
    },
    "ANC-2.3": {
        "title_te": "గర్భధారణలో కాల్షియం సప్లిమెంటేషన్ (ANC-2.3)",
        "answer_te": "గర్భం దాల్చిన 14 వారాల తర్వాత ప్రతిరోజూ 2 కాల్షియం మాత్రలు (మొత్తం 1000 mg) ఇవ్వాలి. కాల్షియం మాత్రను మరియు IFA మాత్రను ఎప్పుడూ ఒకేసారి కలిపి తీసుకోకూడదు; వాటి మధ్య కనీసం 2 గంటల వ్యవధి ఉండాలి.",
        "action_te": "కాల్షియం మరియు ఐరన్ మాత్రలను వేర్వేరు సమయాల్లో (ఉదయం/సాయంత్రం) తీసుకోవాలని తెలపండి.",
    },
    "ANC-2.4": {
        "title_te": "నట్టల నివారణ - అల్బెండజోల్ (ANC-2.4)",
        "answer_te": "మొదటి త్రైమాసికం తర్వాత (14 వారాల దాటిన తర్వాత) గర్భిణీ స్త్రీకి ఒక సింగిల్ డోస్ అల్బెండజోల్ 400 mg మాత్ర నమిలి మింగడానికి ఇవ్వాలి. మొదటి త్రైమాసికంలో ఎట్టి పరిస్థితుల్లోనూ ఇవ్వకూడదు.",
        "action_te": "రెండవ త్రైమాసికంలో అల్బెండజోల్ 400 mg ఒకే మోతాదులో ఇవ్వండి.",
    },
    "ANC-3.1": {
        "title_te": "రక్తహీనత వర్గీకరణ మరియు హిమోగ్లోబిన్ పరిమితులు (ANC-3.1)",
        "answer_te": "గర్భిణీలలో హిమోగ్లోబిన్ (Hb) స్థాయిలు: సాధారణం: 11.0 g/dL లేదా అంతకంటే ఎక్కువ; తేలికపాటి రక్తహీనత: 10.0–10.9 g/dL; మధ్యస్థ రక్తహీనత: 7.0–9.9 g/dL; తీవ్రమైన రక్తహీనత: 7.0 g/dL కంటే తక్కువ. తీవ్రమైన రక్తహీనత ఉన్నవారిని వెంటనే రక్త మార్పిడి లేదా చికిత్స కోసం జిల్లా ఆసుపత్రికి రిఫర్ చేయాలి.",
        "action_te": "Hb < 7.0 g/dL ఉన్నవారిని తక్షణమే అత్యవసరంగా రిఫర్ చేయండి.",
    },
    "ANC-5.3": {
        "title_te": "జననీ శిశు సురక్షా కార్యక్రమం - JSSK ఉచిత రవాణా (ANC-5.3)",
        "answer_te": "JSSK పథకం కింద అన్ని ప్రభుత్వ ఆరోగ్య కేంద్రాలలో గర్భిణీ స్త్రీలకు మరియు అనారోగ్యంతో ఉన్న నవజాత శిశువులకు ఉచిత రవాణా (102/108), ఉచిత మందులు, ఉచిత పరీక్షలు మరియు ప్రసవానంతరం 48 గంటల పాటు ఉచిత బస మరియు భోజనం లభిస్తాయి.",
        "action_te": "ప్రసవానికి ప్రభుత్వ ఆసుపత్రికి వెళ్ళడానికి లేదా డిశ్చార్జ్ తర్వాత ఇంటికి రావడానికి 102 అంబులెన్స్‌ని ఉపయోగించండి.",
    },
    "IMM-2.1": {
        "title_te": "బీసీజీ టీకా మార్గదర్శకాలు (IMM-2.1)",
        "answer_te": "BCG టీకాను పుట్టిన వెంటనే లేదా సాధ్యమైనంత త్వరగా ఇవ్వాలి. పుట్టినప్పుడు ఇవ్వకపోతే, శిశువుకు ఒక సంవత్సరం వయస్సు వచ్చే వరకు ఎప్పుడైనా ఇవ్వవచ్చు. ఒక సంవత్సరం దాటిన తర్వాత BCG ఇవ్వకూడదు.",
        "action_te": "పుట్టిన వెంటనే ఎడమ చేతి పైభాగంలో ఇంట్రాడెర్మల్ గా 0.05 ml BCG టీకా వేయించండి.",
    },
    "IMM-2.2": {
        "title_te": "పెంటావాలెంట్ టీకా షెడ్యూల్ (IMM-2.2)",
        "answer_te": "పెంటావాలెంట్ టీకాను 6, 10 మరియు 14 వారాల వయస్సులో (Penta-1, Penta-2, Penta-3) ఇస్తారు. రెండు డోసుల మధ్య కనీసం 4 వారాలు (28 రోజులు) వ్యవధి ఉండాలి. ఒక సంవత్సరం వయస్సు వరకు మాత్రమే పెంటావాలెంట్ ఇవ్వవచ్చు; సంవత్సరం దాటిన తర్వాత ఇవ్వకూడదు.",
        "action_te": "తదుపరి పెంటా డోసుకు కనీసం 28 రోజుల వ్యవధి ఉండేలా చూసుకోండి.",
    },
    "IMM-2.3": {
        "title_te": "మీజిల్స్-రుబెల్లా - MR టీకా (IMM-2.3)",
        "answer_te": "MR-1 టీకాను 9 నెలలు నిండిన తర్వాత (276 రోజులు) ఇవ్వాలి. MR-2 టీకాను 16–24 నెలల వయస్సులో ఇవ్వాలి. రెండు డోసుల మధ్య కనీసం 4 వారాల (28 రోజులు) విరామం ఉండాలి. MR టీకాను 5 సంవత్సరాల వయస్సు వరకు క్యాచ్-అప్ కింద ఇవ్వవచ్చు.",
        "action_te": "9 నెలలు నిండిన వెంటనే మొదటి MR డోసు వేయించండి.",
    },
    "IMM-2.4": {
        "title_te": "విటమిన్ ఎ మరియు జపనీస్ ఎన్సెఫాలిటిస్ (IMM-2.4)",
        "answer_te": "విటమిన్ ఎ మొదటి మోతాదు (1 లక్ష IU) 9వ నెలలో MR-1 తో పాటు ఇవ్వాలి. ఆ తర్వాత 5 సంవత్సరాల వయస్సు వరకు ప్రతి 6 నెలలకు ఒకసారి 2 లక్షల IU చొప్పున మొత్తం 9 మోతాదులు పూర్తి చేయాలి. చంద్రపురి బ్లాక్ JE-ఎండెమిక్ జిల్లా కానందున ఇక్కడ JE టీకా ఇవ్వబడదు.",
        "action_te": "విటమిన్ ఎ చుక్కలను ప్రతి 6 నెలల వ్యవధిలో క్రమం తప్పకుండా నమోదు చేయండి.",
    },
    "IMM-2.6": {
        "title_te": "ఫ్రాక్షనల్ ఐపీవీ - fIPV టీకా (IMM-2.6)",
        "answer_te": "fIPV టీకాను 6 వారాలు (fIPV-1), 14 వారాలు (fIPV-2) మరియు 9 నెలల వయస్సులో (fIPV-3) ఇంట్రాడెర్మల్ గా ఇస్తారు. fIPV-1 మరియు fIPV-2 మధ్య కనీస వ్యవధి ఖచ్చితంగా 8 వారాలు (56 రోజులు) ఉండాలి.",
        "action_te": "fIPV మోతాదుల మధ్య కనీసం 8 వారాల (56 రోజుల) వ్యవధి తప్పనిసరిగా పాటించాలి.",
    },
    "IMM-4.1": {
        "title_te": "గర్భిణీలకు టిటనస్-డిఫ్తీరియా - Td టీకా (IMM-4.1)",
        "answer_te": "గర్భం నిర్ధారణ అయిన వెంటనే Td-1 ఇవ్వాలి. Td-1 ఇచ్చిన 4 వారాల (28 రోజులు) తర్వాత Td-2 ఇవ్వాలి. గత 3 సంవత్సరాలలో 2 Td డోసులు తీసుకున్న రికార్డు ఉంటే, ప్రస్తుత గర్భంలో కేవలం ఒక Td బూస్టర్ మాత్రమే ఇవ్వాలి.",
        "action_te": "గర్భధారణ మొదట్లో Td-1, ఆపై 4 వారాల తర్వాత Td-2 నమోదు చేయండి.",
    },
    "HBNC-1.1": {
        "title_te": "గృహ ఆధారిత నవజాత శిశు సంరక్షణ - HBNC సందర్శనలు (HBNC-1.1)",
        "answer_te": "ఆసుపత్రిలో కాన్పు జరిగితే ఆశా కార్యకర్త 6 సార్లు గృహ సందర్శన చేయాలి (రోజులు 3, 7, 14, 21, 28, 42). ఇంట్లో కాన్పు జరిగితే మొదటి రోజుతో కలిపి మొత్తం 7 సార్లు సందర్శించాలి (రోజులు 1, 3, 7, 14, 21, 28, 42). సిజేరియన్ కాన్పులో కూడా మొదటి సందర్శన 3వ రోజున ప్రారంభమవుతుంది.",
        "action_te": "నవజాత శిశువు మరియు బాలింతను 42 రోజుల వరకు నిర్ణీత రోజులలో క్రమం తప్పకుండా సందర్శించండి.",
    },
    "HBNC-2.2": {
        "title_te": "నవజాత శిశువు స్నానం మరియు వెచ్చదనం (HBNC-2.2)",
        "answer_te": "పుట్టిన శిశువుకు మొదటి 48 గంటల పాటు స్నానం చేయించకూడదు (హైపోథెర్మియా నివారణకు). 2000 గ్రాముల కంటే తక్కువ బరువున్న శిశువుకు లేదా అనారోగ్యంతో ఉన్న శిశువుకు కనీసం 7 రోజుల వరకు లేదా శిశువు బరువు పెరిగే వరకు స్నానం చేయించరాదు; కేవలం మెత్తటి తడి గుడ్డతో తుడవాలి.",
        "action_te": "శిశువును వెచ్చగా ఉంచండి, కంగారూ మదర్ కేర్ (KMC) అందించండి, మొదటి 48 గంటలు స్నానం చేయించవద్దు.",
    },
    "NUT-1.2": {
        "title_te": "మధ్య చేయి చుట్టుకొలత - MUAC టేప్ రీడింగ్ (NUT-1.2)",
        "answer_te": "6 నుండి 59 నెలల పిల్లలలో MUAC కొలత: ఆకుపచ్చ (>= 12.5 cm): సాధారణ పోషకాహార స్థితి; పసుపు (11.5–12.4 cm): మధ్యస్థ తీవ్ర పోషకాహార లోపం (MAM); ఎరుపు (< 11.5 cm): తీవ్రమైన పోషకాహార లోపం (SAM). ఎరుపు రంగు రీడింగ్ లేదా రెండు కాళ్ళలో వాపు ఉంటే వెంటనే NRC కి రిఫర్ చేయాలి.",
        "action_te": "MUAC < 11.5 cm ఉన్న పిల్లలను తక్షణమే పోషకాహార పునరావాస కేంద్రం (NRC) కు పంపించండి.",
    },
    "NUT-1.1": {
        "title_te": "ద్వైపాక్షిక గుంటపడే వాపు గుర్తింపు (NUT-1.1)",
        "answer_te": "రెండు కాళ్ళ పాదాల పైభాగంలో బొటనవేలితో 3 సెకన్ల పాటు సున్నితంగా నొక్కినప్పుడు గుంట పడి అలాగే ఉంటే దానిని బైలేటరల్ పిట్టింగ్ ఎడెమా అంటారు. ఇది తీవ్రమైన పోషకాహార లోపానికి సంకేతం; బరువుతో సంబంధం లేకుండా వెంటనే NRC కి రిఫర్ చేయాలి.",
        "action_te": "పిల్లలలో రెండు పాదాల వాపు కనిపిస్తే వెంటనే ఆసుపత్రికి రిఫర్ చేయండి.",
    },
    "NCD-1.3": {
        "title_te": "మధుమేహం - రక్తంలో చక్కెర నిర్ధారణ ప్రమాణాలు (NCD-1.3)",
        "answer_te": "ఉదయం ఖాళీ కడుపుతో (Fasting) రక్తంలో గ్లూకోజ్ స్థాయి 126 mg/dL లేదా అంతకంటే ఎక్కువ ఉంటే, లేదా యాదృచ్ఛిక (Random - RBS) స్థాయి 200 mg/dL లేదా అంతకంటే ఎక్కువ ఉంటే మధుమేహాన్ని నిర్ధారించడానికి వైద్య అధికారి వద్దకు పంపించాలి.",
        "action_te": "ఫాస్టింగ్ బ్లడ్ షుగర్ >= 126 mg/dL ఉన్న రోగిని పీహెచ్‌సీ మెడికల్ ఆఫీసర్ వద్దకు పంపించండి.",
    },
    "NCD-3.1": {
        "title_te": "జీవనశైలి మార్పులు మరియు శారీరక శ్రమ (NCD-3.1)",
        "answer_te": "రక్తపోటు మరియు మధుమేహం నియంత్రణకు వారానికి కనీసం 5 రోజులు, రోజుకు 30 నిమిషాల పాటు చురుకైన నడక లేదా శారీరక వ్యాయామం చేయాలి. ఆహారంలో ఉప్పు రోజుకు 5 గ్రాముల కంటే తక్కువగా తీసుకోవాలి మరియు పొగాకు/మద్యపానం మానేయాలి.",
        "action_te": "రోజుకు 30 నిమిషాల నడక మరియు తక్కువ ఉప్పు తీసుకోవాలని అవగాహన కల్పించండి.",
    },
    "CHD-1.2": {
        "title_te": "విరేచనాల నివారణ - ORS మరియు జింక్ చికిత్స (CHD-1.2)",
        "answer_te": "పిల్లలలో విరేచనాలు ప్రారంభమైన వెంటనే ఇంట్లోనే తయారుచేసిన ORS ద్రావణాన్ని ప్రతి విరేచనం తర్వాత తాగించాలి. వాంతులు చేసుకుంటే 10 నిమిషాలు ఆగి, చిన్న చెంచాతో నెమ్మదిగా పట్టించాలి. 14 రోజుల పాటు నిరంతరంగా జింక్ మాత్రలు ఇవ్వాలి.",
        "action_te": "ORS ప్యాకెట్‌ని ఒక లీటరు శుభ్రమైన నీటిలో కలిపి 24 గంటల లోపు తాగించండి.",
    },
    "CHD-3.1": {
        "title_te": "తీవ్ర శ్వాసకోశ ఇన్ఫెక్షన్ - వేగవంతమైన శ్వాస గుర్తింపు (CHD-3.1)",
        "answer_te": "పిల్లవాడు ప్రశాంతంగా ఉన్నప్పుడు ఒక నిమిషం పాటు శ్వాసల సంఖ్యను లెక్కించాలి: 2 నెలల లోపు: నిమిషానికి 60 లేదా అంతకంటే ఎక్కువ; 2–11 నెలలు: నిమిషానికి 50 లేదా అంతకంటే ఎక్కువ; 12–59 నెలలు: నిమిషానికి 40 లేదా అంతకంటే ఎక్కువ. ఈ పరిమితి దాటితే న్యుమోనియాగా గుర్తించి వెంటనే రిఫర్ చేయాలి.",
        "action_te": "నిమిషానికి శ్వాసల సంఖ్య పరిమితి మించితే లేదా ఛాతీ లోపలికి లాగితే వెంటనే ఆసుపత్రికి పంపండి.",
    },
    "VIS-1.3": {
        "title_te": "గడువు ముగిసిన సేవలు - ఓవర్‌డ్యూ నిర్వచనం (VIS-1.3)",
        "answer_te": "ప్రోటోకాల్ ప్రకారం ఏదైనా షెడ్యూల్ చేసిన సేవ లేదా టీకా నిర్దేశిత తేదీ నుండి 28 రోజుల వ్యవధి (Grace Period) దాటిన తర్వాత కూడా తీసుకోకపోతే దానిని 'ఓవర్‌డ్యూ (Overdue)' గా పరిగణిస్తారు. ఓవర్‌డ్యూ అయిన కేసులను ఆశా కార్యకర్త వెంటనే సందర్శించాలి.",
        "action_te": "28 రోజుల గ్రేస్ పీరియడ్ దాటిన అన్ని సేవలనూ ప్రాధాన్యత 2 కింద తక్షణమే సందర్శించండి.",
    },
    "SCP-1.2": {
        "title_te": "ఆశా సేవా పరిమితులు మరియు వైద్య అధికారికి రెఫరల్ (SCP-1.2)",
        "answer_te": "ఈ ప్రశ్న ఫ్రంట్‌లైన్ ఆశా/ఏఎన్‌ఎం ప్రోటోకాల్ పరిధికి మించినది (ఉదాహరణకు: పారాసిటమాల్ లేదా యాంటీబయాటిక్స్ మోతాదు లెక్కించడం, క్లిష్టమైన ల్యాబ్ రిపోర్టుల వివరణ, లేదా ప్రోటోకాల్‌లో లేని వ్యాధులకు చికిత్స చేయడం). రోగిని ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) వైద్య అధికారి లేదా పర్యవేక్షక ఏఎన్‌ఎం వద్దకు పంపించండి.",
        "action_te": "ఎట్టి పరిస్థితుల్లోనూ స్వతంత్రంగా ప్రిస్క్రిప్షన్ మందులు ఇవ్వవద్దు; ప్రాథమిక ఆరోగ్య కేంద్రం మెడికల్ ఆఫీసర్‌ని సంప్రదించండి.",
    },
    "ESC-4.4": {
        "title_te": "నవజాత శిశువు తక్కువ బరువు - అత్యవసర SNCU రెఫరల్ (ESC-4.4)",
        "answer_te": "నవజాత శిశువు పుట్టిన బరువు 1.8 కిలోల కంటే తక్కువగా ఉంటే, అది అత్యవసర ప్రమాద సంకేతం. శిశువును తక్షణమే స్పెషల్ న్యూబోర్న్ కేర్ యూనిట్ (SNCU) ఉన్న రిఫరల్ ఆసుపత్రికి తరలించాలి. తరలించే సమయంలో శిశువుకు కంగారూ మదర్ కేర్ (KMC) అందిస్తూ శరీరం వెచ్చగా ఉండేలా చూడాలి.",
        "action_te": "వెంటనే 108 అంబులెన్స్ పిలిపించి శిశువును చంద్రపురి జిల్లా ఆసుపత్రి SNCU కు తరలించండి.",
    },
    "ESC-2.3": {
        "title_te": "ప్రీ-ఎక్లాంప్సియా ప్రమాద సూచనలు - తక్షణ అత్యవసర రెఫరల్ (ESC-2.3)",
        "answer_te": "గర్భధారణలో ముఖం వాపు మరియు తీవ్రమైన తలనొప్పి, లేదా కళ్ళు సరిగ్గా కనిపించకపోవడం ప్రీ-ఎక్లాంప్సియా లేదా ఎక్లాంప్సియాకు సంకేతం. ఇది తల్లికి మరియు బిడ్డకు ప్రాణాంతకం కావచ్చు. ఎటువంటి ఆలస్యం లేకుండా వెంటనే ఫస్ట్ రెఫరల్ యూనిట్ (FRU) లేదా జిల్లా ఆసుపత్రికి తరలించాలి.",
        "action_te": "వెంటనే 108/102 అంబులెన్స్ ద్వారా గర్భిణీని అత్యవసర ఆసుపత్రికి తరలించండి.",
    },
    "ESC-3.1": {
        "title_te": "ప్రసవానంతర తీవ్ర రక్తస్రావం - పోస్ట్‌పార్టమ్ హెమరేజ్ (ESC-3.1)",
        "answer_te": "ప్రసవం తర్వాత 5 నిమిషాల కంటే తక్కువ సమయంలోనే బట్టలు లేదా ప్యాడ్ పూర్తిగా తడిసిపోయేలా విపరీతంగా రక్తం కారడం తీవ్రమైన అత్యవసర పరిస్థితి. ఇది ప్రాణాంతకం. రక్తస్రావం ఆపడానికి మరియు రక్త మార్పిడి కోసం వెంటనే సమీపంలోని సి-సెక్షన్/బ్లడ్ బ్యాంక్ సౌకర్యం ఉన్న ఆసుపత్రికి తరలించాలి.",
        "action_te": "తక్షణమే 108 అంబులెన్స్ పిలిపించి రోగిని పడుకోబెట్టి జిల్లా ఆసుపత్రికి తరలించండి.",
    },
    "ESC-5.1": {
        "title_te": "పిల్లలలో ప్రమాద సంకేతాలు - మూర్ఛ లేదా పాలు తాగలేకపోవడం (ESC-5.1)",
        "answer_te": "పిల్లలలో ఫిట్స్ (మూర్ఛ), మెలకువ లేకపోవడం, లేదా పాలు అస్సలు తాగలేకపోవడం తీవ్రమైన ప్రాణాంతక వ్యాధి సంకేతం. శిశువు నోటిలో ఏమీ పోయకూడదు మరియు శ్వాస మార్గాన్ని శుభ్రంగా ఉంచి వెంటనే ఆసుపత్రికి తరలించాలి.",
        "action_te": "వెంటనే 108 అంబులెన్స్ ద్వారా రిఫరల్ ఆసుపత్రికి తరలించండి; నోటి ద్వారా ఏమీ ఇవ్వవద్దు.",
    },
    "ESC-1.4": {
        "title_te": "స్పృహ కోల్పోయిన వ్యక్తి - తక్షణ అత్యవసర చర్య (ESC-1.4)",
        "answer_te": "వ్యక్తి స్పృహ కోల్పోవడం అత్యవసర పరిస్థితి. నోటి ద్వారా నీరు లేదా ఎలాంటి మందులు పోయకూడదు. శ్వాస మార్గం సాఫీగా ఉండేలా రోగిని ఒక పక్కకు ఒరిగించి పడుకోబెట్టి వెంటనే 108 అంబులెన్స్ ద్వారా అత్యవసర ఆసుపత్రికి తరలించాలి.",
        "action_te": "రోగిని పక్కకు తిప్పి పడుకోబెట్టండి (రికవరీ పొజిషన్), నోటి ద్వారా ఏమీ ఇవ్వవద్దు, వెంటనే 108కి కాల్ చేయండి.",
    },
    "ESC-5.4": {
        "title_te": "పిల్లలలో 7 రోజుల కంటే ఎక్కువ జ్వరం (ESC-5.4)",
        "answer_te": "పిల్లలలో నిరంతరంగా 7 రోజుల కంటే ఎక్కువ రోజులు జ్వరం ఉండటం తీవ్రమైన ఇన్ఫెక్షన్ లేదా మలేరియా/ఇతర ప్రమాద సంకేతం. వెంటనే పూర్తి రక్త పరీక్షలు మరియు చికిత్స కోసం ప్రాథమిక ఆరోగ్య కేంద్రం లేదా సబ్-డివిజనల్ ఆసుపత్రికి పంపాలి.",
        "action_te": "వైద్య అధికారికి వెంటనే రిఫర్ చేసి అవసరమైన రక్త పరీక్షలు చేయించండి.",
    },
    "ESC-4.3": {
        "title_te": "నవజాత శిశువు హైపోథెర్మియా - శరీరం చల్లబడటం (ESC-4.3)",
        "answer_te": "నవజాత శిశువు శరీరం స్పర్శకు చల్లగా ఉండటం హైపోథెర్మియాకు సూచిక. శిశువును తడి బట్టలను తొలగించి, తల్లి ఛాతీపై చర్మంతో చర్మం తగిలేలా (KMC) ఉంచి వెచ్చదనం కల్పించాలి మరియు వెంటనే రిఫరల్ ఆసుపత్రికి తరలించాలి.",
        "action_te": "వెంటనే కంగారూ కేర్ (KMC) అందించి శిశువును వెచ్చగా ఉంచండి మరియు ఆసుపత్రికి తీసుకెళ్ళండి.",
    }
}


def get_telugu_protocol_details(sec_id: str) -> Optional[Dict[str, str]]:
    """Retrieve pre-translated Telugu details for a given protocol section."""
    return PROTOCOL_TELUGU_ANSWERS.get(sec_id)
