"""Rule-based out-of-scope question detector for H5.

Implements official guidance from SCP-1.2:
- Medicine doses, choices or changes not in protocols (antibiotics, paracetamol, etc.)
- Conditions not covered (TB, dengue, typhoid, widal, cancer, thyroid, HIV, rabies, bedwetting)
- Family planning, abortion, contraception
- Sex determination of the foetus (PC-PNDT)
- Administrative / app issues (salary, incentive, login, OTP, ration, certificates)
"""
from __future__ import annotations
import re

OOS_PATTERNS = [
    # Medicine doses / choices not in protocols
    r"\b(amoxicillin|cefixime|azithromycin|ciprofloxacin|metronidazole|antibiotic|paracetamol|crocin|combiflam|cough syrup|metformin dose|insulin kitna|amlodipine|cetirizine)\b",
    r"\b(kitni goli du|kitna syrup|kitni dose|dose kitni|kitna dose|kitna mg|kitne drop du|dawai kitni|paracetamol.*kitna|kitna dena hai|give me medicine|which medicine|medicine for this|koyi dawa|dawa de do)\b",
    # Conditions not covered
    r"\b(tb |tuberculosis|dengue|typhoid|widal|malaria test kitna|thyroid|cancer|hiv|aids|rabies|dog bite|kutta kata|bistar geela|bedwetting|skin allergy|daad|khujli|fungal)\b",
    # Surgery / specialized treatments
    r"\b(surgery|operation.*(gallbladder|appendix|hernia|cataract|piles)|chemotherapy|radiation)\b",
    # Family planning / abortion
    r"\b(copper[- ]?t|mala[- ]?n|condom|garbhnirodhak|antargarbhashayi|abortion|garbhpat|mifepristone|misoprostol)\b",
    # Sex determination
    r"\b(ladka hoga ya ladki|sex determination|ling jaanch|beta hoga ya beti|gender)\b",
    # Administrative / app / scheme issues
    r"\b(salary|manpathe|maandey|vetan|incentive|paisa nahi aaya|portal login|app login|otp nahi|u-win.*(login|otp|error)|ration card|ayushman card|death certificate|birth certificate|praman patra)\b",
    # COVID / pandemic boosters
    r"\b(covid|corona|booster dose)\b",
    # Non-health domain / general knowledge / tech / finance queries
    r"\b(loan|interest rate|personal loan|home loan|emi|bank account|credit card|finance|stock market|cryptocurrency|mutual fund)\b",
    r"\b(code|coding|python|javascript|java|c\+\+|html|css|for loop|function|sql|database|software|github|programming)\b",
    r"\b(cricket|football|world cup|movie|cinema|actor|actress|song|box office|ticket|entertainment)\b",
    r"\b(weather|temperature today|weather forecast|climate change|rain forecast)\b",
    r"\b(capital of|president of|prime minister of|history of|write an essay|essay on|joke|riddle|recipe|food delivery)\b"
]

def is_out_of_scope(question: str) -> bool:
    """Return True if question falls under SCP-1.2 out-of-scope topics."""
    q = question.lower()
    return any(re.search(pat, q, re.I) for pat in OOS_PATTERNS)
