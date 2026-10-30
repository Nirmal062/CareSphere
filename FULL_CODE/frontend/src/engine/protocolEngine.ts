import * as protocolsData from '../data/protocols.json';
import { ProtocolDocument, ProtocolSection, AskResponse } from '../types';
import { detectEscalation } from './emergencyDetector';
import { isOutOfScope } from './refusalDetector';

const rawData = protocolsData as any;
const allDocs: ProtocolDocument[] = Array.isArray(rawData) ? rawData : (rawData.default || []);

export const protocolSectionsMap: { [id: string]: ProtocolSection } = {};
export const allProtocolSectionsList: ProtocolSection[] = [];

for (const doc of allDocs) {
  for (const sec of doc.sections) {
    protocolSectionsMap[sec.section_id] = sec;
    allProtocolSectionsList.push(sec);
  }
}

const ROUTING_RULES: [RegExp, string][] = [
  [/\banc\b.*(check-up|check up|schedule|timing|plan|kitne|kab|how many)|(check-up|check up|schedule).*anc\b/i, 'ANC-1.2'],
  [/\b(anc check[- ]?ups?|anc schedule|schedule for anc|anc timing)\b/i, 'ANC-1.2'],
  [/\b(red ifa|lal goli|ifa dose|ifa goli|ifa tablet|ifa|ఎరుపు ifa)\b/i, 'ANC-2.2'],
  [/\boverdue kab\b|overdue maana|kab overdue|\boverdue\b/i, 'VIS-1.3'],
  [/\bbcg\b/i, 'IMM-2.1'],
  [/\bpenta\b|\bpentavalent\b/i, 'IMM-2.2'],
  [/\bmr[- ]?1\b|\bmr[- ]?2\b|\bmeasles\b/i, 'IMM-2.3'],
  [/\bvitamin[- ]?a\b/i, 'IMM-2.4'],
  [/\bje\b|japanese encephalitis/i, 'IMM-2.4'],
  [/\bfipv\b/i, 'IMM-2.6'],
  [/\btd[- ]?1\b|\btd[- ]?2\b|\btd booster\b/i, 'IMM-4.1'],
  [/\b(4th anc|chautha anc|chauthi anc|fourth anc|4వ anc|4th anc)\b/i, 'ANC-1.2'],
  [/\b(3rd anc|teesra anc|third anc|3వ anc)\b/i, 'ANC-1.2'],
  [/\b(2nd anc|doosra anc|second anc|2వ anc)\b/i, 'ANC-1.2'],
  [/\bpmsma\b/i, 'ANC-1.3'],
  [/\bcalcium\b|క్యాల్షియం/i, 'ANC-2.3'],
  [/\balbendazole\b|keede.*dawai|నులిపురుగు/i, 'ANC-2.4'],
  [/\bjssk\b|drop.*back|free.*transport|muft.*gaadi/i, 'ANC-5.3'],
  [/\bhb\b|\bhaemoglobin\b|రక్తహీనత/i, 'ANC-3.1'],
  [/\b(caesarean|operation)\b.*hbnc|\bhbnc.*(caesarean|operation)\b/i, 'HBNC-1.1'],
  [/\b(hospital|institutional).*delivery.*hbnc|\bhbnc.*(kitni visit|42 din)\b/i, 'HBNC-1.1'],
  [/\b(nehla|nehlana|nahana|bathe|bathing|స్నానం)\b/i, 'HBNC-2.2'],
  [/\bmaa se.*pooch|mother.*check.*visit\b/i, 'HBNC-3.1'],
  [/\bmuac\b.*(tape|green|hari|peeli|lal)|(tape|green).*muac\b/i, 'NUT-1.2'],
  [/\b(pair|feet|foot).*sujan|sujan.*(pair|feet)|oedema|pitting\b/i, 'NUT-1.1'],
  [/\b(exercise|kasrat|physical activity|నడక)\b/i, 'NCD-3.1'],
  [/\b(fasting sugar|diabetes confirm|sugar test.*confirm)\b/i, 'NCD-1.3'],
  [/\bors\b.*(ulti|vomit)|(ulti|vomit).*ors\b/i, 'CHD-1.2'],
  [/\bsaans.*(gin|count|tez maane|cut-off|breaths per minute)\b/i, 'CHD-3.1']
];

/**
 * Detect language of query (Telugu, Hindi, or English)
 */
export function detectQueryLanguage(text: string): 'en' | 'te' | 'hi' {
  // Telugu Unicode range \u0C00-\u0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';
  // Hindi / Devanagari Unicode range \u0900-\u097F
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  // Roman Telugu
  if (/\b(eppudu|ivvali|garbhini|pillalu|kadupu|raktam|noppi|pettali|cheyali|vaccine lu|manchi|mandulu|talli|bidda|snanam|jwaram)\b/i.test(text)) {
    return 'te';
  }
  // Roman Hindi
  if (/\b(kab|kya|kaise|kitna|kitni|dena|chahiye|bachcha|bachche|garbh|prasav|mahina|doodh|goli|dawai|bukhar|khoon|hbnc|anc)\b/i.test(text)) {
    return 'hi';
  }
  return 'en';
}

/**
 * Decomposes compound queries into supported and unsupported clauses.
 */
function checkCompoundQuery(query: string): { supported: string; unsupported: string } | null {
  let clauses = query.split(/(?<=[?.!,;])\s+|\s+(?:and also|aur sath me|and can I|aur kya)\s+/i);
  if (clauses.length < 2) {
    clauses = query.split(/\s+(?:and|aur|mariyu|tatha|lekin|but)\s+/i);
  }
  if (clauses.length >= 2) {
    const supported: string[] = [];
    const unsupported: string[] = [];
    for (const c of clauses) {
      const cClean = c.trim();
      if (!cClean) continue;
      if (isOutOfScope(cClean)) {
        unsupported.push(cClean);
      } else {
        const cLower = cClean.toLowerCase();
        const hasAnchor = [
          "anc", "pmsma", "ifa", "calcium", "albendazole", "td", "hb", "anaemia",
          "hypertension", "bp", "pre-eclampsia", "eclampsia", "vaccine", "bcg", "opv",
          "penta", "rvv", "fipv", "pcv", "mr", "dpt", "je", "vitamin a", "hbnc",
          "breastfeeding", "lbw", "birth weight", "cord", "muac", "sam", "mam", "ncd",
          "diabetes", "blood sugar", "ors", "zinc", "diarrhoea", "fever", "breathing",
          "visit", "register", "pregnant", "pregnancy", "mother", "baby", "child"
        ].some(term => cLower.includes(term));
        if (hasAnchor) {
          supported.push(cClean);
        }
      }
    }
    if (supported.length > 0 && unsupported.length > 0) {
      return { supported: supported.join(', '), unsupported: unsupported.join(', ') };
    }
  }
  return null;
}

export function matchProtocolSection(query: string): string {
  const q = query.toLowerCase();
  for (const [pattern, secId] of ROUTING_RULES) {
    if (pattern.test(q)) {
      return secId;
    }
  }

  // Token-based keyword ranking across 107 sections
  const words = q.split(/\W+/).filter((w) => w.length > 2);
  let bestId = 'ANC-1.1';
  let bestScore = -1;

  for (const sec of allProtocolSectionsList) {
    let score = 0;
    const content = (sec.title + ' ' + sec.content + ' ' + (sec.clinical_actions?.join(' ') || '')).toLowerCase();
    for (const w of words) {
      if (content.includes(w)) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      bestId = sec.section_id;
    }
  }

  return bestId;
}

/**
 * Evaluates a frontline healthcare question completely offline in < 2ms latency.
 */
export function evaluateProtocolQuery(question: string, preferredLang?: string): AskResponse {
  const t0 = Date.now();
  const qTrim = question.trim();

  // Detect query language if not explicitly provided or if query has language-specific script
  const detectedLang = detectQueryLanguage(qTrim);
  const lang = (preferredLang === 'te' || preferredLang === 'hi' || preferredLang === 'en')
    ? (detectedLang !== 'en' ? detectedLang : preferredLang)
    : detectedLang;

  // Tier 1: Emergency Escalation Check
  const esc = detectEscalation(qTrim);
  if (esc.escalate) {
    const secId = esc.section_id || 'ESC-1.1';
    const sec = protocolSectionsMap[secId] || {
      section_id: secId,
      title: esc.reason || 'Emergency Danger Sign',
      content: 'Refer immediately to District Hospital / FRU via 108/102 ambulance.'
    };

    const reasonEn = esc.reason || 'Life-threatening danger sign';
    const ansEn = `DANGER SIGN - REFER IMMEDIATELY (call 108/102). ${reasonEn}. Transfer immediately to District Hospital / FRU [${secId}].`;
    const ansTe = `ప్రమాద సంకేతం - తక్షణమే 108/102 కి కాల్ చేసి ఆసుపత్రికి తరలించండి. ${reasonEn} [${secId}].`;
    const ansHi = `गंभीर खतरे का संकेत - तुरंत 108/102 एम्बुलेंस बुलाएं और रेफरल अस्पताल भेजें। ${reasonEn} [${secId}]।`;

    const recActionEn = 'Initiate immediate emergency referral. Call 108/102 and transfer to District Hospital SNCU/FRU.';
    const recActionTe = 'వెంటనే 108/102 కి కాల్ చేసి రోగిని తక్షణమే అత్యవసర రిఫరల్ ఆసుపత్రికి తరలించండి.';
    const recActionHi = 'तुरंत 108/102 पर कॉल करें और मरीज को जिला अस्पताल/SNCU ट्रांसफर करें।';

    return {
      question: qTrim,
      is_emergency: true,
      is_out_of_scope: false,
      status: 'EMERGENCY',
      answer: lang === 'hi' ? ansHi : (lang === 'te' ? ansTe : ansEn),
      answer_en: ansEn,
      answer_te: ansTe,
      answer_hi: ansHi,
      answer_language: lang,
      recommended_action: lang === 'hi' ? recActionHi : (lang === 'te' ? recActionTe : recActionEn),
      recommended_action_te: recActionTe,
      recommended_action_hi: recActionHi,
      urgency_level: 'CRITICAL',
      urgency_label_te: 'అత్యవసరం (CRITICAL)',
      urgency_label_hi: 'अत्यंत गंभीर (CRITICAL)',
      condition: reasonEn,
      condition_te: 'అత్యవసర ప్రమాద సంకేతం',
      condition_hi: 'आपातकालीन खतरे का संकेत',
      citations: [secId],
      source_title: sec.title,
      source_title_te: `అత్యవసర ప్రోటోకాల్: ${sec.title}`,
      source_title_hi: `आपातकालीन प्रोटोकॉल: ${sec.title}`,
      source_excerpt: sec.content,
      emergency_contacts: [
        { name: 'Emergency Ambulance', number: '108', description: 'Immediate dispatch for critical red flags' },
        { name: 'Janani Shishu Vahan', number: '102', description: 'Free obstetric & infant referral transport' },
        { name: 'Chandrapuri Medical Officer', number: '+91-94400-12345', description: 'Sub-centre clinical consultation' }
      ],
      latency_ms: Date.now() - t0
    };
  }

  // Tier 2: Check for Compound / Partially Supported Query
  const compound = checkCompoundQuery(qTrim);
  if (compound) {
    const secId = matchProtocolSection(compound.supported);
    const sec = protocolSectionsMap[secId] || allProtocolSectionsList[0];
    const summary = sec.clinical_actions?.[0] || sec.content.slice(0, 240);

    const ansEn = `${summary} [${secId}]. [Note: "${compound.unsupported}" is outside frontline protocol scope. Consult PHC Medical Officer (SCP-1.2)].`;
    const ansTe = `అధికారిక మార్గదర్శకం: ${summary} [${secId}]. [గమనిక: "${compound.unsupported}" అంశం ఆశా సేవా పరిధికి మించినది. దయచేసి PHC డాక్టర్‌ను సంప్రదించండి (SCP-1.2)].`;
    const ansHi = `आधिकारिक दिशानिर्देश: ${summary} [${secId}]। [नोट: "${compound.unsupported}" फ्रंटलाइन कार्यक्षेत्र से बाहर है। प्राथमिक चिकित्सा अधिकारी से संपर्क करें (SCP-1.2)]।`;

    const recActionEn = `Administer verified protocol care [${secId}]. Refer non-protocol question to PHC Medical Officer.`;
    const recActionTe = `ధృవీకరించబడిన ప్రోటోకాల్ సేవలను అందించండి [${secId}]. ఇతర సమస్యలపై డాక్టర్ సలహా తీసుకోండి.`;
    const recActionHi = `प्रोटोकॉल देखभाल प्रदान करें [${secId}]। गैर-प्रोटोकॉल प्रश्न के लिए चिकित्सा अधिकारी को रेफर करें।`;

    return {
      question: qTrim,
      is_emergency: false,
      is_out_of_scope: false,
      status: 'GROUNDED_ANSWER',
      answer: lang === 'hi' ? ansHi : (lang === 'te' ? ansTe : ansEn),
      answer_en: ansEn,
      answer_te: ansTe,
      answer_hi: ansHi,
      answer_language: lang,
      recommended_action: lang === 'hi' ? recActionHi : (lang === 'te' ? recActionTe : recActionEn),
      recommended_action_te: recActionTe,
      recommended_action_hi: recActionHi,
      urgency_level: 'ROUTINE',
      urgency_label_te: 'సాధారణం (ROUTINE)',
      urgency_label_hi: 'नियमित (ROUTINE)',
      citations: [secId, 'SCP-1.2'],
      source_title: sec.title,
      source_title_te: sec.title,
      source_title_hi: sec.title,
      source_excerpt: sec.content,
      emergency_contacts: [],
      latency_ms: Date.now() - t0
    };
  }

  // Tier 3: Out of Scope Refusal Check
  if (isOutOfScope(qTrim)) {
    const refusalEn = '⚠️ I am CareSphere, an offline clinical decision companion for frontline ASHA/ANM workers. I can only assist with verified protocol guidelines (maternal care, immunization, malnutrition, fever/diarrhea, and routine NCDs). Please consult your PHC Medical Officer for other topics [SCP-1.2].';
    const refusalTe = '⚠️ నేను కేర్‌స్పియర్ (CareSphere), ఫ్రంట్‌లైన్ ఆశా/ఏఎన్‌ఎం కార్యకర్తల కోసం అధికారిక క్లినికల్ సహాయకురాలిని. ఇతర అంశాల కోసం దయచేసి PHC వైద్య అధికారిని సంప్రదించండి [SCP-1.2].';
    const refusalHi = '⚠️ मैं केयरस्फेयर, फ्रंटलाइन स्वास्थ्य कार्यकर्ता साथी हूँ। मैं केवल सत्यापित प्रोटोकॉल दिशानिर्देशों में सहायता कर सकता हूँ। अन्य विषयों के लिए पीएचसी चिकित्सा अधिकारी से संपर्क करें [SCP-1.2]।';

    const recActionEn = 'Consult the Medical Officer at the Primary Health Centre (PHC) or appropriate department.';
    const recActionTe = 'ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) వైద్య అధికారిని సంప్రదించండి.';
    const recActionHi = 'प्राथमिक स्वास्थ्य केंद्र (PHC) के चिकित्सा अधिकारी से संपर्क करें।';

    return {
      question: qTrim,
      is_emergency: false,
      is_out_of_scope: true,
      status: 'OUT_OF_SCOPE',
      answer: lang === 'hi' ? refusalHi : (lang === 'te' ? refusalTe : refusalEn),
      answer_en: refusalEn,
      answer_te: refusalTe,
      answer_hi: refusalHi,
      answer_language: lang,
      recommended_action: lang === 'hi' ? recActionHi : (lang === 'te' ? recActionTe : recActionEn),
      recommended_action_te: recActionTe,
      recommended_action_hi: recActionHi,
      urgency_level: 'CAUTION',
      urgency_label_te: 'హెచ్చరిక - పరిధి దాటినది (CAUTION)',
      urgency_label_hi: 'चेतावनी - कार्यक्षेत्र से बाहर (CAUTION)',
      condition: 'Topic outside frontline protocol boundary',
      condition_te: 'ప్రోటోకాల్ పరిధి దాటిన అంశం',
      condition_hi: 'प्रोटोकॉल कार्यक्षेत्र से बाहर का विषय',
      citations: ['SCP-1.2'],
      source_title: 'Boundary Rules and Redirection',
      source_title_te: 'ఆశా సేవా పరిమితులు మరియు వైద్య అధికారికి రెఫరల్',
      source_title_hi: 'आशा कार्यक्षेत्र सीमाएं और रेफरल नियम',
      source_excerpt: 'Refer all queries outside frontline protocol scope to Medical Officer (SCP-1.2).',
      emergency_contacts: [],
      latency_ms: Date.now() - t0
    };
  }

  // Tier 4: Grounded Protocol Retrieval
  const secId = matchProtocolSection(qTrim);
  const sec = protocolSectionsMap[secId] || allProtocolSectionsList[0];
  const summary = sec.clinical_actions?.[0] || sec.content.slice(0, 240);

  const ansEn = `${summary} [${secId}].`;
  const ansTe = `అధికారిక మార్గదర్శకం: ${summary} [${secId}].`;
  const ansHi = `आधिकारिक दिशानिर्देश: ${summary} [${secId}]।`;

  const recActionEn = 'Follow official protocol timeline and counsel the family during the home visit.';
  const recActionTe = 'ప్రోటోకాల్ మార్గదర్శకాల ప్రకారం సేవలను అందించి కుటుంబానికి కౌన్సిలింగ్ ఇవ్వండి.';
  const recActionHi = 'मानक प्रोटोकॉल समयरेखा का पालन करें और परिवार को परामर्श दें।';

  return {
    question: qTrim,
    is_emergency: false,
    is_out_of_scope: false,
    status: 'GROUNDED_ANSWER',
    answer: lang === 'hi' ? ansHi : (lang === 'te' ? ansTe : ansEn),
    answer_en: ansEn,
    answer_te: ansTe,
    answer_hi: ansHi,
    answer_language: lang,
    recommended_action: lang === 'hi' ? recActionHi : (lang === 'te' ? recActionTe : recActionEn),
    recommended_action_te: recActionTe,
    recommended_action_hi: recActionHi,
    urgency_level: 'ROUTINE',
    urgency_label_te: 'సాధారణం (ROUTINE)',
    urgency_label_hi: 'नियमित (ROUTINE)',
    citations: [secId],
    source_title: sec.title,
    source_title_te: sec.title,
    source_title_hi: sec.title,
    source_excerpt: sec.content,
    emergency_contacts: [],
    latency_ms: Date.now() - t0
  };
}
