/**
 * Hard-coded Out-of-Scope (SCP-1.2) boundary filters for CareSphere.
 * Enforces strict frontline scope rejection across English, Telugu, Roman Telugu, and Hindi (< 1ms latency).
 */
export const OUT_OF_SCOPE_REGEX =
  /\b(amoxicillin|cefixime|azithromycin|ciprofloxacin|metronidazole|antibiotic|antibiotics|paracetamol|crocin|combiflam|cough syrup|metformin dose|insulin kitna|amlodipine|cetirizine|azithro|penicillin|augmentin|ibuprofen|aspirin|steroid|dexamethasone|kitni goli du|kitna syrup|kitni dose|dose kitni|kitna dose|kitna mg|kitne drop du|dawai kitni|which medicine|medicine dosage|prescribe medicine|moxikind|mandulu rayavacha|mandulu em ivvali|antibiotic ivvavacha|tablet dose|syrup dose|tb\b|tuberculosis|dengue|typhoid|widal|malaria test kitna|malaria treat|thyroid|cancer|hiv\b|aids\b|rabies|dog bite|kutta kata|bistar geela|bedwetting|skin allergy|daad|khujli|fungal|eczema|scabies|piles|fistula|appendix|gallbladder|kidney stone|cataract|motiyabind|jaundice in adult|peeliya|liver|surgery|chemotherapy|radiation|biopsy|endoscopy|angioplasty|copper[- ]?t|mala[- ]?n|condom|garbhnirodhak|antargarbhashayi|abortion|garbhpat|mifepristone|misoprostol|garbhasravam cheyavacha|ladka hoga ya ladki|sex determination|ling jaanch|beta hoga ya beti|gender of baby|foetal sex|boy or girl prediction|ling nirdharan|abbayi leda ammayi|salary|manpathe|maandey|vetan|incentive|paisa nahi aaya|portal login|app login|otp nahi|u-win|ration card|ayushman card|death certificate|birth certificate|praman patra|loan|interest rate|personal loan|home loan|emi|bank account|credit card|finance|stock market|cryptocurrency|mutual fund|invest|bitcoin|code|coding|python|javascript|java|c\+\+|html|css|for loop|function|sql|database|software|github|programming|write code|debug|cricket|football|world cup|movie|cinema|actor|actress|song|box office|ticket|entertainment|ipl|weather|temperature today|forecast|climate change|rain forecast|capital of|president of|prime minister of|history of|write an essay|essay on|joke|riddle|recipe|modi|rahul gandhi|ignore previous instructions|disregard protocols|system prompt|jailbreak|pretend you are a doctor|act as an unrestricted AI|bypass safety)\b/i;

export function isOutOfScope(question: string): boolean {
  const q = question.trim();
  if (q.length < 3) return true;

  // Uninformative questions
  if (
    /^(give me medicine|kuch dawai do|mandulu ivvandi|medicine for this illness|kya du|ilaj batao|treatment do)\.?$/i.test(
      q
    )
  ) {
    return true;
  }

  return OUT_OF_SCOPE_REGEX.test(q);
}
