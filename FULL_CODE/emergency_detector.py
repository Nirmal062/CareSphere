"""Rule-based emergency screening for H5 (Step 1 & Step 2).

Uses the hackathon's ESC danger-sign protocol. This is a prototype for the
hackathon dataset, not a clinical decision tool.
"""
from __future__ import annotations
import re
from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class Escalation:
    escalate: bool
    section_id: Optional[str] = None
    reason: Optional[str] = None


def _has(text: str, *patterns: str) -> bool:
    return any(re.search(p, text, flags=re.I) for p in patterns)


def detect_escalation(question: str) -> Escalation:
    """Return the first matching protocol danger sign, else no escalation.

    Text is normalized lightly; rules deliberately use symptom/context pairs
    where possible to reduce false alarms on near-boundary questions.
    """
    q = re.sub(r"\s+", " ", question.lower()).strip()

    # ESC-3.1: heavy bleeding after delivery
    if _has(q, r"delivery|delivered|bachcha paida|prasav|जच्च") and _has(
        q, r"khoon bahut|heavy bleeding|bleeding.*pad|pad.*(3|4|5) minute|pad.*soak|khoon beh"
    ):
        return Escalation(True, "ESC-3.1", "Heavy bleeding after delivery")

    # ESC-6.3 / ESC-1.4: unconsciousness is an emergency; diabetes context is especially important.
    if _has(q, r"behosh|unconscious|hosh nahi|not conscious|loss of consciousness"):
        return Escalation(True, "ESC-6.3" if _has(q, r"sugar|diabet|insulin|glucose") else "ESC-1.4", "Unconscious person")

    # ESC-5.1: fits / convulsions in a child
    if _has(q, r"jhatke|jhatka|fits|convulsion|seizure|daura|झटके"):
        return Escalation(True, "ESC-5.1", "Convulsions")

    # ESC-2.3: pregnancy with facial swelling and headache / severe pre-eclampsia symptoms
    pregnant = _has(q, r"pregnan|mahine pregnant|mahina pregnant|garbh|गर्भ|hamila|\b[4-9] mahina hai\b|\b[4-9] mahine ki\b")
    if pregnant and _has(q, r"chehra.*suj|face.*swell|swelling of the face|chehre pe sujan|muh.*suj") and _has(q, r"sir dard|headache|sar dard|vision|dhundhla"):
        return Escalation(True, "ESC-2.3", "Possible pre-eclampsia danger signs")
    if pregnant and _has(q, r"severe headache|bahut tez sir dard|blurring of vision|dhundhla dikh"):
        return Escalation(True, "ESC-2.3", "Possible pre-eclampsia danger sign")

    # ESC-5.1: child unable to drink or feed
    if _has(q, r"baby|newborn|bachcha|bachche|infant") and _has(q, r"not able to drink|doodh nahi pee|doodh nahi pi|unable to suck|feed.*band"):
        return Escalation(True, "ESC-5.1", "Child unable to drink or feed")

    # ESC-5.4: daily fever for more than 7 days in a child
    if _has(q, r"bukhar|fever|taap|ताप") and _has(q, r"\b(8|9|10|11|12|13|14|15)\s*(?:din|days)\b|\b(?:more than 7|over 7|7 din se zyada|7 days)\b"):
        if _has(q, r"bachch|bachi|child|year|saal|varsh|mul|मुल"):
            return Escalation(True, "ESC-5.4", "Fever lasting more than 7 days")

    # ESC-4.4: very low birth weight (< 1.8 kg)
    if _has(q, r"(1\.\s*[0-7]|1\.[0-7])\s*kg|\b1[0-7]00\s*g") and _has(q, r"bachch|baby|newborn|paida|janm|birth|kg|जन्म"):
        return Escalation(True, "ESC-4.4", "Birth weight below 1.8 kg")

    # ESC-2.6: pregnancy with inability to keep fluids down / excessive vomiting
    if pregnant and _has(q, r"ulti|vomit|vomiting") and _has(q, r"paani.*(nahi|nahin|tik)|unable to (drink|keep)|kuch.*(nahi|nahin).*pet|excessive"):
        return Escalation(True, "ESC-2.6", "Excessive vomiting / unable to take fluids")

    # ESC-2.5: pregnancy with severe pallor and breathlessness
    if pregnant and _has(q, r"bahut peeli|severe pallor|very pale|pale") and _has(q, r"saans phool|breathless|breathlessness|difficult breathing"):
        return Escalation(True, "ESC-2.5", "Severe pallor with breathlessness")

    # ESC-4.3: newborn cold to touch
    if _has(q, r"(10|11|12|15|20) din ka|newborn|naya janma|newly born|नवजात") and _has(q, r"thanda|cold to touch|body cold|chhune pe thanda"):
        return Escalation(True, "ESC-4.3", "Newborn cold to touch")

    # Other high-confidence protocol danger signs
    if _has(q, r"pregnan|pregnancy|garbh|गर्भ") and _has(q, r"bleeding|khoon aa|vagina se khoon|paani.*leak|baby.*movement.*(kam|band)|movement.*absent"):
        return Escalation(True, "ESC-2.1", "Pregnancy danger sign")
    if _has(q, r"chest pain|seene mein dard|seene me dard|chest pressure") and _has(q, r"sweat|pasina|breath|saans|diabet|diabetes"):
        return Escalation(True, "ESC-6.1", "Possible heart attack")
    if _has(q, r"face.*weak|one side.*weak|bol nahi pa|speech.*loss|sudden.*vision"):
        return Escalation(True, "ESC-6.2", "Possible stroke")
    if _has(q, r"breathing.*(difficult|fast)|saans.*(tez|nahi le|phool)|chest indrawing|pasli chal") and _has(q, r"baby|newborn|bachcha|child|bachche|infant") and not _has(q, r"kitni.*(tez|fast)|how many.*(fast|breaths)|kitna.*(fast|tez).*(maane|consider)|rate.*threshold"):
        return Escalation(True, "ESC-5.2", "Child breathing danger sign")

    return Escalation(False)
