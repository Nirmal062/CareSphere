/**
 * CareSphere Native Scope Refusal Gate (MoHFW Directives & SCP-1.2 Compliance).
 *
 * Enforces strict frontline worker clinical safety:
 * - Refuses unauthorized prescription antibiotics (Amoxicillin, Ciprofloxacin, Metronidazole, etc.)
 * - Refuses clinical decisions for conditions outside frontline community protocols (TB, Dengue, Typhoid, Cancer, HIV)
 * - Refuses PC-PNDT prenatal sex determination requests
 * - Refuses non-health domains (coding, IT, loans, entertainment)
 *
 * Guarantees: refused = true, escalate = false, citation = [SCP-1.2].
 */

export interface RefusalResult {
  refused: boolean;
  citation?: string;
  reason?: string;
  refusalText?: string;
}

const OOS_PATTERNS = [
  // 1. Prescription antibiotics and unapproved medications (MoHFW Sec 6.4)
  /\b(amoxicillin|cefixime|azithromycin|ciprofloxacin|metronidazole|antibiotic|antibiotics|crocin|combiflam|cough syrup|metformin dose|insulin kitna|amlodipine|cetirizine)\b/i,
  /\b(kitni goli du|kitna syrup|kitni dose|dose kitni|kitna dose|kitna mg|kitne drop du|dawai kitni|paracetamol.*kitna|kitna dena hai|give me medicine|which medicine|medicine for this|koyi dawa|dawa de do)\b/i,
  
  // 2. Conditions not covered in Chandrapuri Sub-Centre protocols
  /\b(tb |tuberculosis|dengue|typhoid|widal|malaria test kitna|thyroid|cancer|hiv|aids|rabies|dog bite|kutta kata|bistar geela|bedwetting|skin allergy|daad|khujli|fungal)\b/i,
  
  // 3. Surgical procedures
  /\b(surgery|operation.*(gallbladder|appendix|hernia|cataract|piles)|chemotherapy|radiation)\b/i,
  
  // 4. Family planning / abortion
  /\b(copper[- ]?t|mala[- ]?n|condom|garbhnirodhak|antargarbhashayi|abortion|garbhpat|mifepristone|misoprostol)\b/i,
  
  // 5. Sex determination (PC-PNDT Act compliance)
  /\b(ladka hoga ya ladki|sex determination|ling jaanch|beta hoga ya beti|gender of fetus|foetal sex)\b/i,
  
  // 6. Administrative / app issues
  /\b(salary|manpathe|maandey|vetan|incentive|paisa nahi aaya|portal login|app login|otp nahi|u-win.*(login|otp|error)|ration card|ayushman card|death certificate|birth certificate|praman patra)\b/i,
  
  // 7. COVID / booster shots
  /\b(covid|corona|booster dose)\b/i,
  
  // 8. General knowledge / financial / IT queries
  /\b(loan|interest rate|personal loan|home loan|emi|bank account|credit card|finance|stock market|cryptocurrency|mutual fund)\b/i,
  /\b(code|coding|python|javascript|java|c\+\+|html|css|binary search tree|for loop|function|sql|database|software|github|programming)\b/i,
  /\b(cricket|football|world cup|movie|cinema|actor|actress|song|box office|ticket|entertainment)\b/i,
  /\b(weather|temperature today|weather forecast|climate change|rain forecast)\b/i,
  /\b(capital of|president of|prime minister of|history of|write an essay|essay on|joke|riddle|recipe|food delivery)\b/i
];

/**
 * Check whether query falls out-of-scope under protocol boundary rules.
 */
export function isQueryOutOfScope(question: string): boolean {
  const q = question.toLowerCase();
  return OOS_PATTERNS.some((pattern) => pattern.test(q));
}

/**
 * Evaluate scope refusal with standardized protocol citations and multilingual messages.
 */
export function detectScopeRefusal(question: string, lang: 'en' | 'te' | 'hi' = 'en'): RefusalResult {
  if (!isQueryOutOfScope(question)) {
    return { refused: false };
  }

  let text =
    'This question falls outside the Sub-Centre community protocols. Under MoHFW frontline guidelines, prescription antibiotics, clinical diagnosis of uncovered conditions, and non-health queries cannot be answered by frontline workers. Please refer the patient to the Primary Health Centre (PHC) Medical Officer for clinical evaluation.';

  if (lang === 'te') {
    text =
      'ఈ ప్రశ్న ఉప-కేంద్ర ప్రోటోకాల్ పరిధికి వెలుపల ఉంది. MoHFW మార్గదర్శకాల ప్రకారం, ప్రిస్క్రిప్షన్ యాంటీబయాటిక్స్ మరియు ఇతర వ్యాధులకు సంబంధించి చికిత్స కోసం ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) వైద్యాధికారిని సంప్రదించాలి.';
  } else if (lang === 'hi') {
    text =
      'यह प्रश्न उप-स्वास्थ्य केंद्र प्रोटोकॉल के दायरे से बाहर है। MoHFW दिशानिर्देशों के अनुसार, एंटीबायोटिक्स व अन्य विशेषज्ञ बीमारियों की सलाह के लिए कृपया प्राथमिक स्वास्थ्य केंद्र (PHC) के चिकित्सा अधिकारी से संपर्क करें।';
  }

  return {
    refused: true,
    citation: 'SCP-1.2',
    reason: 'Out-of-scope query under MoHFW Section 6.4 / Protocol SCP-1.2',
    refusalText: text
  };
}
