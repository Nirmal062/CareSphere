import * as protocolsData from '../data/protocols.json';
import { ProtocolDocument, ProtocolSection, AskResponse, Language } from '../types';
import { detectEscalation } from './emergencyDetector';
import { isOutOfScope } from './refusalDetector';

const rawData = protocolsData as any;
const allDocs: ProtocolDocument[] = Array.isArray(rawData) ? rawData : (rawData.default || []);

// Index all 107 sections in a fast lookup map
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
  [/\b(red ifa|lal goli|ifa|ఎరుపు ifa)\b/i, 'ANC-2.2'],
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

/**
 * Searches and retrieves the best matching protocol section ID
 */
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
 * Evaluates a frontline healthcare question completely offline.
 * Adheres strictly to the safety escalation hierarchy:
 * 1. Emergency detection (ESC) -> Always runs first.
 * 2. Scope boundary refusal (SCP-1.2) -> Deflects non-protocol topics.
 * 3. Grounded protocol section retrieval (< 5ms latency).
 */
export function evaluateProtocolQuery(question: string, lang: Language = 'en'): AskResponse {
  const t0 = Date.now();
  const qTrim = question.trim();

  // Tier 1: Emergency Escalation Check
  const esc = detectEscalation(qTrim);
  if (esc.escalate) {
    const secId = esc.section_id || 'ESC-1.1';
    const sec = protocolSectionsMap[secId] || {
      section_id: secId,
      title: esc.reason || 'Emergency Danger Sign',
      content: 'Refer immediately to District Hospital / FRU via 108/102 ambulance.'
    };

    return {
      question: qTrim,
      is_emergency: true,
      is_out_of_scope: false,
      status: 'EMERGENCY',
      answer: `DANGER SIGN - REFER IMMEDIATELY (call 108/102). ${esc.reason || 'Life-threatening danger sign'}. Transfer immediately to District Hospital / FRU (${secId}).`,
      answer_en: `DANGER SIGN - REFER IMMEDIATELY (call 108/102). ${esc.reason || 'Life-threatening danger sign'}. (${secId}).`,
      answer_te: `ప్రమాద సంకేతం - తక్షణమే 108/102 కి కాల్ చేసి ఆసుపత్రికి తరలించండి. ${esc.reason || 'అత్యవసర పరిస్థితి'} (${secId}).`,
      answer_hi: `गंभीर खतरे का संकेत - तुरंत 108/102 एम्बुलेंस बुलाएं और रेफरल अस्पताल भेजें (${secId})।`,
      answer_language: lang,
      recommended_action: 'Initiate immediate emergency referral. Call 108/102 and transfer to District Hospital SNCU/FRU.',
      recommended_action_te: 'వెంటనే 108/102 కి కాల్ చేసి రోగిని తక్షణమే అత్యవసర రిఫరల్ ఆసుపత్రికి తరలించండి.',
      recommended_action_hi: 'तुरंत 108/102 पर कॉल करें और मरीज को जिला अस्पताल/SNCU ट्रांसफर करें।',
      urgency_level: 'CRITICAL',
      condition: esc.reason,
      condition_te: 'అత్యవసర ప్రమాద సంకేతం',
      condition_hi: 'आपातकालीन खतरे का संकेत',
      citations: [secId],
      source_title: sec.title,
      source_excerpt: sec.content,
      latency_ms: Date.now() - t0
    };
  }

  // Tier 2: Check for Compound / Partially Supported Query
  const compound = checkCompoundQuery(qTrim);
  if (compound) {
    const secId = matchProtocolSection(compound.supported);
    const sec = protocolSectionsMap[secId] || allProtocolSectionsList[0];
    const summary = sec.clinical_actions?.[0] || sec.content.slice(0, 240);
    return {
      question: qTrim,
      is_emergency: false,
      is_out_of_scope: false,
      status: 'GROUNDED_ANSWER',
      answer: `${summary} (${secId}). [Note: "${compound.unsupported}" is outside frontline protocol scope. Consult PHC Medical Officer (SCP-1.2)].`,
      answer_en: `${summary} (${secId}). [Note: "${compound.unsupported}" referred to Medical Officer (SCP-1.2)].`,
      answer_te: `అధికారిక మార్గదర్శకం: ${summary} (${secId}). గమనిక: మిగిలిన అంశం కోసం దయచేసి PHC డాక్టర్‌ను సంప్రదించండి (SCP-1.2).`,
      answer_hi: `आधिकारिक दिशानिर्देश: ${summary} (${secId})। नोट: शेष प्रश्न के लिए प्राथमिक चिकित्सा अधिकारी से संपर्क करें (SCP-1.2)।`,
      answer_language: lang,
      recommended_action: `Administer verified protocol care (${secId}). Refer non-protocol question to PHC Medical Officer.`,
      recommended_action_te: 'ధృవీకరించబడిన ప్రోటోకాల్ సేవలను అందించండి. ఇతర సమస్యలపై డాక్టర్ సలహా తీసుకోండి.',
      recommended_action_hi: 'प्रोटोकॉल देखभाल प्रदान करें। गैर-प्रोटोकॉल प्रश्न के लिए चिकित्सा अधिकारी को रेफर करें।',
      urgency_level: 'ROUTINE',
      citations: [secId, 'SCP-1.2'],
      source_title: sec.title,
      source_excerpt: sec.content,
      latency_ms: Date.now() - t0
    };
  }

  // Tier 3: Out of Scope Refusal Check
  if (isOutOfScope(qTrim)) {
    return {
      question: qTrim,
      is_emergency: false,
      is_out_of_scope: true,
      status: 'OUT_OF_SCOPE',
      answer: '⚠️ I am CareSphere, an offline clinical decision companion for frontline ASHA/ANM workers. I can only assist with verified protocol guidelines (maternal care, immunization, malnutrition, fever/diarrhea, and routine NCDs). Please consult your PHC Medical Officer for other topics (SCP-1.2).',
      answer_en: '⚠️ I am CareSphere, an offline clinical decision companion for frontline ASHA/ANM workers. Please consult your PHC Medical Officer for other topics (SCP-1.2).',
      answer_te: '⚠️ నేను కేర్‌స్పియర్ (CareSphere), అధికారిక ఫ్రంట్‌లైన్ క్లినికల్ సహాయకురాలిని. ఇతర అంశాల కోసం దయచేసి PHC వైద్య అధికారిని సంప్రదించండి (SCP-1.2).',
      answer_hi: '⚠️ मैं केयरस्फेयर, फ्रंटलाइन स्वास्थ्य कार्यकर्ता साथी हूँ। कृपया अन्य विषयों के लिए पीएचसी चिकित्सा अधिकारी से संपर्क करें (SCP-1.2)।',
      answer_language: lang,
      recommended_action: 'Consult the Medical Officer at the Primary Health Centre (PHC) or appropriate department.',
      recommended_action_te: 'ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) వైద్య అధికారిని సంప్రదించండి.',
      recommended_action_hi: 'प्राथमिक स्वास्थ्य केंद्र (PHC) के चिकित्सा अधिकारी से संपर्क करें।',
      urgency_level: 'CAUTION',
      condition: 'Topic outside frontline protocol boundary',
      condition_te: 'ప్రోటోకాల్ పరిధి దాటిన అంశం',
      condition_hi: 'प्रोटोकॉल कार्यक्षेत्र से बाहर का विषय',
      citations: ['SCP-1.2'],
      source_title: 'Boundary Rules and Redirection',
      source_excerpt: 'Refer all queries outside frontline protocol scope to Medical Officer (SCP-1.2).',
      latency_ms: Date.now() - t0
    };
  }

  // Tier 3: Grounded Protocol Retrieval
  const secId = matchProtocolSection(qTrim);
  const sec = protocolSectionsMap[secId] || allProtocolSectionsList[0];
  const summary = sec.clinical_actions?.[0] || sec.content.slice(0, 240);

  return {
    question: qTrim,
    is_emergency: false,
    is_out_of_scope: false,
    status: 'GROUNDED_ANSWER',
    answer: `${summary} (${secId}).`,
    answer_en: `${summary} (${secId}).`,
    answer_te: `అధికారిక మార్గదర్శకం: ${summary} (${secId}).`,
    answer_hi: `आधिकारिक दिशानिर्देश: ${summary} (${secId})।`,
    answer_language: lang,
    recommended_action: 'Follow official protocol timeline and counsel the family during the home visit.',
    recommended_action_te: 'ప్రోటోకాల్ మార్గదర్శకాల ప్రకారం సేవలను అందించి కుటుంబానికి కౌన్సిలింగ్ ఇవ్వండి.',
    recommended_action_hi: 'मानक प्रोटोकॉल समयरेखा का पालन करें और परिवार को परामर्श दें।',
    urgency_level: 'ROUTINE',
    citations: [secId],
    source_title: sec.title,
    source_excerpt: sec.content,
    latency_ms: Date.now() - t0
  };
}
