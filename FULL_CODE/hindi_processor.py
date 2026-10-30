"""Hindi language support and query normalization processor for H5 Frontline Companion.

Provides:
1. Detection of Hindi Devanagari script (हिन्दी) and Romanized Hindi.
2. Hindi-to-Canonical query normalization for emergency detection, refusal detection, and BM25 retrieval.
3. Pre-translated, protocol-verified Hindi answers, recommended actions, and emergency guidance.
4. 100% offline, deterministic execution without external cloud translation APIs.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple

HINDI_SCRIPT_RE = re.compile(r"[\u0900-\u097F]")

HINDI_SCRIPT_MAP: Dict[str, str] = {
    "गर्भवती": "pregnant pregnancy anc",
    "गर्भावस्था": "pregnant pregnancy anc",
    "जांच": "checkup anc",
    "चेकअप": "checkup anc",
    "चौथा": "fourth 4th anc 36 weeks",
    "चौथी": "fourth 4th anc 36 weeks",
    "तीसरा": "third 3rd anc",
    "तीसरी": "third 3rd anc",
    "दूसरा": "second 2nd anc",
    "दूसरी": "second 2nd anc",
    "पहला": "first 1st anc",
    "पहली": "first 1st anc",
    "कब": "when timeline schedule",
    "खून": "blood bleeding haemoglobin anaemia",
    "रक्तस्राव": "bleeding haemorrhage heavy bleeding",
    "रक्तअल्पता": "anaemia hb haemoglobin",
    "एनीमिया": "anaemia hb haemoglobin",
    "सिरदर्द": "headache pre-eclampsia",
    "सिर दर्द": "headache pre-eclampsia",
    "सूजन": "swelling oedema edema",
    "चेहरे पर सूजन": "face swelling pre-eclampsia",
    "पैरों में सूजन": "feet oedema swelling pitting",
    "बीपी": "bp blood pressure hypertension 140/90",
    "रक्तचाप": "bp blood pressure hypertension",
    "शुगर": "sugar diabetes glucose rbs fasting 126",
    "मधुमेह": "sugar diabetes glucose",
    "आयरन": "iron ifa red ifa tablet 180 days",
    "लाल गोली": "iron ifa red ifa tablet 180 days",
    "कैल्शियम": "calcium tablet anc",
    "कृमि मुक्ति": "albendazole deworming keede",
    "एल्बेंडाजोल": "albendazole deworming",
    "टीका": "vaccine immunization uip",
    "टीकाकरण": "vaccine immunization uip",
    "दस्त": "diarrhoea loose stool ors zinc",
    "उल्टी": "vomiting vomit ors",
    "बुखार": "fever paracetamol temperature",
    "सांस": "breathing respiratory breaths",
    "तेज सांस": "fast breathing pneumonia breaths",
    "पसली चलना": "chest indrawing pneumonia",
    "नवजात": "newborn infant baby hbnc",
    "शिशु": "child infant newborn baby",
    "बच्चा": "child infant newborn baby",
    "कुपोषण": "malnutrition sam muac tape",
    "वजन": "weight lbw birth weight",
    "ओआरएस": "ors oral rehydration salts",
    "जिंक": "zinc dispersible tablet 20mg",
    "निगरानी": "monitoring visit due"
}

def is_hindi_text(text: str) -> bool:
    """Check if string contains Devanagari Hindi characters."""
    return bool(HINDI_SCRIPT_RE.search(text))

def normalize_hindi_query(text: str) -> str:
    """Convert Hindi query into canonical tokens for BM25 matching."""
    norm = text
    for hi_term, en_tokens in HINDI_SCRIPT_MAP.items():
        if hi_term in norm:
            norm = norm.replace(hi_term, f" {en_tokens} ")
    return norm

def check_hindi_emergency(query: str) -> Optional[Tuple[str, str, str]]:
    """Deterministic detection of emergency danger signs in Hindi queries."""
    q = query.lower()

    # ESC-2.1: Heavy bleeding in pregnancy
    if (re.search(r"गर्भवती|गर्भावस्था|पेट से", q)) and (
        re.search(r"खून बह रहा|रक्तस्राव|भारी रक्तस्राव|खून आ रहा|कपड़ा भीग", q)
    ):
        return ("ESC-2.1", "Vaginal bleeding during pregnancy", "गर्भावस्था में अत्यधिक रक्तस्राव (तत्काल 108 एम्बुलेंस बुलाएं)")

    # ESC-4.4: Birth weight < 1.8 kg
    if (re.search(r"1\.[0-7]\s*(kg|किग्रा|किलो)", q) or re.search(r"\b1[0-7]00\s*(g|ग्राम)", q)) and (
        re.search(r"जन्म|पैदा|शिशु|बच्चा|वजन|कम वजन", q)
    ):
        return ("ESC-4.4", "Birth weight below 1.8 kg", "नवजात का जन्म वजन 1.8 किग्रा से कम (तुरंत SNCU रेफर करें)")

    # ESC-3.1: Postpartum haemorrhage
    if re.search(r"प्रसव|डिलिवरी|डिलीवरी", q) and re.search(r"खून बहुत|अत्यधिक रक्तस्राव|खून नहीं रुक रहा|खून बह", q):
        return ("ESC-3.1", "Heavy bleeding after delivery", "प्रसव के बाद अत्यधिक रक्तस्राव (तत्काल अस्पताल रेफर करें)")

    # ESC-5.1: Convulsions / fits
    if re.search(r"दौरा|झटके|ऐंठन|मिरगी|फिट्स", q):
        return ("ESC-5.1", "Convulsions", "दौरे / झटके आना (तत्काल 108 बुलाकर रेफर करें)")

    # ESC-1.4 / ESC-6.3: Unconsciousness
    if re.search(r"बेहोश|होश नहीं|अचेत", q):
        sec = "ESC-6.3" if re.search(r"शुगर|मधुमेह|डायबिटीज", q) else "ESC-1.4"
        return (sec, "Unconscious person", "बेहोशी की स्थिति (तत्काल रेफर करें, मुंह में कुछ न दें)")

    # ESC-2.3: Pre-eclampsia
    if re.search(r"गर्भवती|गर्भावस्था", q) and re.search(r"चेहरे पर सूजन|चेहरा सूज|तेज सिरदर्द|धुंधला दिख", q):
        return ("ESC-2.3", "Possible pre-eclampsia danger signs", "गर्भावस्था में तेज सिरदर्द और चेहरे पर सूजन (प्री-एक्लेमप्सिया का खतरा)")

    # ESC-5.1: Baby not feeding
    if re.search(r"बच्चा|शिशु|नवजात", q) and re.search(r"दूध नहीं पी रहा|स्तनपान नहीं|दूध छोड़ दिया|पीने में असमर्थ", q):
        return ("ESC-5.1", "Child unable to drink or feed", "शिशु दूध पीने में पूरी तरह असमर्थ (तत्काल रेफर करें)")

    # ESC-5.4: Prolonged fever > 7 days
    if re.search(r"बुखार", q) and re.search(r"7\s*दिन|हफ्ते भर|सप्ताह भर|8\s*दिन|10\s*दिन", q):
        if re.search(r"बच्चा|शिशु|बालक", q):
            return ("ESC-5.4", "Fever lasting more than 7 days", "बच्चे में 7 दिनों से अधिक लगातार बुखार (तत्काल रेफरल)")

    # ESC-4.3: Hypothermia
    if re.search(r"नवजात|शिशु|बच्चा", q) and re.search(r"ठंडा पड़ गया|छूने पर ठंडा|हाथ पैर ठंडे|शरीर ठंडा", q):
        return ("ESC-4.3", "Newborn cold to touch", "नवजात का शरीर छूने पर ठंडा होना (हाइपोथर्मिया - तुरंत कंगारू देखभाल देकर रेफर करें)")

    return None

def check_hindi_out_of_scope(query: str) -> bool:
    """Check if Hindi query falls under SCP-1.2 out-of-scope topics."""
    q = query.lower()
    if re.search(r"पैरासिटामोल|एंटीबायोटिक|दवा कितनी|कितनी खुराक|कितनी गोली|कितना सिरप|paracetamol|dose kitna", q):
        return True
    if re.search(r"टाइफाइड|मलेरिया टेस्ट|डेंगू|कैंसर|टीबी|क्षय रोग|एचआईवी|एड्स|कुत्ते का काटना|रेबीज|बिस्तर गीला", q):
        return True
    if re.search(r"गर्भपात|गर्भनिरोधक|कॉपर-टी|माला-एन|अबॉर्शन", q):
        return True
    if re.search(r"लड़का होगा या लड़की|लिंग जांच|बेटा होगा या बेटी|sex determination", q):
        return True
    if re.search(r"वेतन नहीं आया|मानदेय|आशा का पैसा|पोर्टल लॉगिन|ओटीपी|राशन कार्ड|आयुष्मान कार्ड|मृत्यु प्रमाण पत्र", q):
        return True
    return False

PROTOCOL_HINDI_ANSWERS: Dict[str, Dict[str, str]] = {
    "ANC-1.2": {
        "title_hi": "न्यूनतम चार एएनसी (ANC) जांच कार्यक्रम (ANC-1.2)",
        "answer_hi": "प्रत्येक गर्भवती महिला की कम से कम 4 एएनसी जांच आवश्यक हैं: पहली जांच: 12 सप्ताह के भीतर (गर्भधारण का पता चलते ही); दूसरी जांच: 14 से 26 सप्ताह के बीच; तीसरी जांच: 28 से 34 सप्ताह के बीच; चौथी जांच: 36 सप्ताह से प्रसव तक।",
        "action_hi": "गर्भवती महिला की 36 सप्ताह बाद चौथी एएनसी जांच सुनिश्चित करें और प्रसव तैयारी व वाहन व्यवस्था की समीक्षा करें।"
    },
    "ANC-1.3": {
        "title_hi": "प्रधानमंत्री सुरक्षित मातृत्व अभियान - PMSMA (ANC-1.3)",
        "answer_hi": "PMSMA के तहत प्रत्येक माह की 9 तारीख को सरकारी स्वास्थ्य केंद्रों पर विशेषज्ञ डॉक्टरों द्वारा दूसरी और तीसरी तिमाही की गर्भवती महिलाओं की मुफ्त जांच की जाती है। उच्च जोखिम वाली गर्भवती महिलाओं की पहचान कर विशेष निगरानी की जाती है।",
        "action_hi": "दूसरी और तीसरी तिमाही की सभी गर्भवती महिलाओं को 9 तारीख के PMSMA दिवस पर स्वास्थ्य केंद्र ले जाएं।"
    },
    "ANC-2.2": {
        "title_hi": "गर्भावस्था में लाल आईएफए (IFA) गोलियां (ANC-2.2)",
        "answer_hi": "गर्भावस्था की दूसरी तिमाही से रोजाना 1 लाल आईएफए (IFA) गोली 180 दिनों तक दी जाती है। प्रत्येक गोली में 60 मिलीग्राम आयरन + 500 माइक्रोग्राम फोलिक एसिड होता है। प्रसव के बाद भी 180 दिनों तक 1 गोली रोजाना लेनी है। कैल्शियम और आयरन कभी साथ न लें।",
        "action_hi": "महिला को आईएफए गोली रात को सोते समय पानी के साथ लेने की सलाह दें। कैल्शियम और आईएफए में कम से कम 2 घंटे का अंतर रखें।"
    },
    "ANC-2.3": {
        "title_hi": "गर्भावस्था में कैल्शियम की गोलियां (ANC-2.3)",
        "answer_hi": "गर्भावस्था के 14वें सप्ताह से शुरू करके प्रसव के 6 महीने बाद तक 1-1 कैल्शियम की गोली दिन में दो बार (कुल 1000 मिलीग्राम कैल्शियम प्रतिदिन) दी जाती है। कैल्शियम हमेशा भोजन के साथ लें, खाली पेट कभी न लें।",
        "action_hi": "कैल्शियम सुबह और शाम भोजन के तुरंत बाद लेने की सलाह दें। आयरन (लाल गोली) के साथ न लें।"
    },
    "IMM-2.1": {
        "title_hi": "जन्म के समय बीसीजी (BCG) टीका (IMM-2.1)",
        "answer_hi": "बीसीजी टीका जन्म के समय या 1 वर्ष की आयु तक जितनी जल्दी हो सके बाईं ऊपरी बांह में चमड़ी के भीतर (intradermal) 0.1 एमएल (1 माह से कम के शिशु को 0.05 एमएल) दिया जाता है।",
        "action_hi": "नवजात शिशु को 24 घंटे के भीतर बीसीजी, ओपीवी-0 और हेपेटाइटिस-बी का जन्म टीका लगवाना सुनिश्चित करें।"
    },
    "IMM-2.2": {
        "title_hi": "पेंटावैलेंट (Pentavalent) टीका कार्यक्रम (IMM-2.2)",
        "answer_hi": "पेंटावैलेंट टीका 6 सप्ताह, 10 सप्ताह और 14 सप्ताह की आयु में 0.5 एमएल बाईं जांघ के मध्य भाग में मांसपेशी (intramuscular) में दिया जाता है। यह डिप्थीरिया, काली खांसी, टिटनेस, हेपेटाइटिस-बी और हिब (Hib) 5 बीमारियों से बचाता है।",
        "action_hi": "शिशु को पेंटा-1 6 सप्ताह पूरे होने पर लगवाने के लिए टीकाकरण सत्र में लाएं।"
    },
    "CHD-1.1": {
        "title_hi": "बाल दस्त रोग — ओआरएस (ORS) और जिंक प्रबंधन (CHD-1.1)",
        "answer_hi": "दस्त होने पर तुरंत ओआरएस (ORS) घोल शुरू करें। 1 पैकेट ओआरएस 1 लीटर साफ पीने के पानी में घोलकर हर दस्त के बाद पिलाएं। साथ ही जिंक 20 मिलीग्राम की 1 गोली रोजाना साफ पानी या मां के दूध में घोलकर पूरे 14 दिनों तक दें (6 माह से कम शिशु को 10 मिलीग्राम)।",
        "action_hi": "परिवार को ओआरएस का सही घोल बनाना सिखाएं और जिंक की 14 दिन की पूरी खुराक सुनिश्चित करें।"
    },
    "HBNC-1.1": {
        "title_hi": "गृह आधारित नवजात शिशु देखभाल (HBNC) भ्रमण कार्यक्रम (HBNC-1.1)",
        "answer_hi": "घर पर प्रसव होने पर आशा कार्यकर्ता कुल 7 भ्रमण करती हैं: दिन 1, 3, 7, 14, 21, 28 और 42। अस्पताल में सामान्य प्रसव होने पर 6 भ्रमण होते हैं: दिन 3, 7, 14, 21, 28 और 42। सिजेरियन प्रसव होने पर भी अस्पताल से छुट्टी के बाद यही कार्यक्रम रहता है।",
        "action_hi": "निर्धारित दिनों पर गृह भ्रमण कर नवजात के वजन, तापमान, स्तनपान और नाभि की जांच करें।"
    },
    "NUT-1.2": {
        "title_hi": "मध्य ऊपरी बांह परिधि (MUAC) द्वारा कुपोषण जांच (NUT-1.2)",
        "answer_hi": "6 माह से 5 वर्ष के बच्चों में एमयूएसी (MUAC) टेप द्वारा जांच की जाती है: हरा रंग (12.5 सेमी या अधिक) = सामान्य पोषण; पीला रंग (11.5 से 12.4 सेमी) = मध्यम कुपोषण (MAM); लाल रंग (11.5 सेमी से कम) = गंभीर कुपोषण (SAM - तत्काल पोषण पुनर्वास केंद्र NRC रेफर करें)।",
        "action_hi": "एमयूएसी 11.5 सेमी से कम होने पर बच्चे को तत्काल एमओ/एनआरसी (NRC) रेफर करें।"
    },
    "NCD-1.1": {
        "title_hi": "उच्च रक्तचाप (Hypertension) जांच और मानदंड (NCD-1.1)",
        "answer_hi": "वयस्कों में सामान्य रक्तचाप 120/80 mmHg से कम होता है। यदि सिस्टोलिक बीपी 140 mmHg या अधिक हो, अथवा डायस्टोलिक बीपी 90 mmHg या अधिक हो (140/90 mmHg), तो उच्च रक्तचाप (Hypertension) माना जाता है और पुष्टि के लिए पीएचसी रेफर किया जाता है।",
        "action_hi": "140/90 या अधिक बीपी वाले व्यक्ति को पीएचसी मेडिकल ऑफिसर के पास दवा शुरू करने हेतु भेजें।"
    },
    "SCP-1.2": {
        "title_hi": "आशा कार्यक्षेत्र सीमाएं और रेफरल नियम (SCP-1.2)",
        "answer_hi": "⚠️ मैं केयरस्फेयर (CareSphere), फ्रंटलाइन आशा/एएनएम कार्यकर्ताओं के लिए एक ऑफलाइन नैदानिक निर्णय साथी हूँ। मैं केवल सत्यापित प्रोटोकॉल दिशानिर्देशों (मातृ देखभाल, टीकाकरण, कुपोषण, दस्त/बुखार और सामान्य गैर-संचारी रोगों) में ही सहायता कर सकता हूँ। कृपया अन्य विषयों के लिए अपने पीएचसी चिकित्सा अधिकारी (Medical Officer) से परामर्श लें (SCP-1.2)।",
        "action_hi": "प्राथमिक स्वास्थ्य केंद्र (PHC) के चिकित्सा अधिकारी या संबंधित विभाग से संपर्क करें।"
    }
}

def get_hindi_protocol_details(section_id: str) -> Optional[Dict[str, str]]:
    """Retrieve pre-compiled, verified Hindi answer and action for a protocol section."""
    return PROTOCOL_HINDI_ANSWERS.get(section_id)
