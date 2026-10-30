"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOutOfScope = isOutOfScope;
/**
 * Rule-based out-of-scope question detector for CareSphere Mobile (SCP-1.2).
 * Fast regex checking for medicine prescribing, non-covered conditions, and general queries (< 1ms).
 */
const OOS_PATTERNS = [
    // Medicine doses / choices not in protocols
    /\b(amoxicillin|cefixime|azithromycin|ciprofloxacin|metronidazole|antibiotic|crocin|combiflam|cough syrup|metformin dose|insulin kitna|amlodipine|cetirizine)\b/i,
    /\b(kitni goli du|kitna syrup|kitni dose|dose kitni|kitna dose|kitna mg|kitne drop du|dawai kitni|paracetamol.*kitna|kitna dena hai|give me medicine|which medicine|medicine for this|koyi dawa|dawa de do)\b/i,
    // Conditions not covered
    /\b(tb |tuberculosis|dengue|typhoid|widal|malaria test kitna|thyroid|cancer|hiv|aids|rabies|dog bite|kutta kata|bistar geela|bedwetting|skin allergy|daad|khujli|fungal)\b/i,
    // Surgery / specialized treatments
    /\b(surgery|operation.*(gallbladder|appendix|hernia|cataract|piles)|chemotherapy|radiation)\b/i,
    // Family planning / abortion
    /\b(copper[- ]?t|mala[- ]?n|condom|garbhnirodhak|antargarbhashayi|abortion|garbhpat|mifepristone|misoprostol)\b/i,
    // Sex determination
    /\b(ladka hoga ya ladki|sex determination|ling jaanch|beta hoga ya beti|gender)\b/i,
    // Administrative / app / scheme issues
    /\b(salary|manpathe|maandey|vetan|incentive|paisa nahi aaya|portal login|app login|otp nahi|u-win.*(login|otp|error)|ration card|ayushman card|death certificate|birth certificate|praman patra)\b/i,
    // COVID / pandemic boosters
    /\b(covid|corona|booster dose)\b/i,
    // Non-health domain / general knowledge / tech / finance queries
    /\b(loan|interest rate|personal loan|home loan|emi|bank account|credit card|finance|stock market|cryptocurrency|mutual fund)\b/i,
    /\b(code|coding|python|javascript|java|c\+\+|html|css|for loop|function|sql|database|software|github|programming)\b/i,
    /\b(cricket|football|world cup|movie|cinema|actor|actress|song|box office|ticket|entertainment)\b/i,
    /\b(weather|temperature today|weather forecast|climate change|rain forecast)\b/i,
    /\b(capital of|president of|prime minister of|history of|write an essay|essay on|joke|riddle|recipe|food delivery)\b/i
];
function isOutOfScope(question) {
    const q = question.toLowerCase();
    return OOS_PATTERNS.some((pattern) => pattern.test(q));
}
