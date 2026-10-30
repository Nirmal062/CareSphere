import { EscalationResult } from '../types';

function hasMatch(text: string, ...patterns: string[]): boolean {
  return patterns.some((p) => new RegExp(p, 'i').test(text));
}

/**
 * Deterministic rule-based emergency screening for CareSphere Mobile.
 * Pure TypeScript implementation of official ESC danger-sign protocol (< 2ms latency).
 */
export function detectEscalation(question: string): EscalationResult {
  const q = question.toLowerCase().replace(/\s+/g, ' ').trim();

  // ESC-3.1: Heavy bleeding after delivery
  if (
    hasMatch(q, 'delivery', 'delivered', 'bachcha paida', 'prasav', 'జచ్చ', 'కాన్పు') &&
    hasMatch(q, 'khoon bahut', 'heavy bleeding', 'bleeding.*pad', 'pad.*(3|4|5) minute', 'pad.*soak', 'khoon beh', 'రక్తస్రావం')
  ) {
    return { escalate: true, section_id: 'ESC-3.1', reason: 'Heavy bleeding after delivery' };
  }

  // ESC-6.3 / ESC-1.4: Unconsciousness
  if (hasMatch(q, 'behosh', 'unconscious', 'hosh nahi', 'not conscious', 'loss of consciousness', 'స్పృహ', 'మగత')) {
    const isDiabetic = hasMatch(q, 'sugar', 'diabet', 'insulin', 'glucose');
    return {
      escalate: true,
      section_id: isDiabetic ? 'ESC-6.3' : 'ESC-1.4',
      reason: isDiabetic ? 'Unconscious diabetic person' : 'Unconscious person'
    };
  }

  // ESC-5.1: Fits / convulsions
  if (hasMatch(q, 'jhatke', 'jhatka', 'fits', 'convulsion', 'seizure', 'daura', 'झटके', 'మూర్ఛ', 'ఫిట్స్')) {
    return { escalate: true, section_id: 'ESC-5.1', reason: 'Convulsions' };
  }

  // ESC-2.3: Pregnancy with facial swelling, headache, blurring of vision
  const pregnant = hasMatch(q, 'pregnan', 'mahine pregnant', 'mahina pregnant', 'garbh', 'गर्भ', 'hamila', '\\b[4-9] mahina hai\\b', 'గర్భ');
  if (
    pregnant &&
    hasMatch(q, 'chehra.*suj', 'face.*swell', 'swelling of the face', 'chehre pe sujan', 'muh.*suj', 'ముఖం.*వాపు') &&
    hasMatch(q, 'sir dard', 'headache', 'sar dard', 'vision', 'dhundhla', 'తలనొప్పి', 'చూపు')
  ) {
    return { escalate: true, section_id: 'ESC-2.3', reason: 'Possible pre-eclampsia danger signs' };
  }
  if (pregnant && hasMatch(q, 'severe headache', 'bahut tez sir dard', 'blurring of vision', 'dhundhla dikh', 'తీవ్ర తలనొప్పి')) {
    return { escalate: true, section_id: 'ESC-2.3', reason: 'Possible pre-eclampsia danger sign' };
  }

  // ESC-5.1: Child unable to drink or feed
  if (
    hasMatch(q, 'baby', 'newborn', 'bachcha', 'bachche', 'infant', 'శిశువు', 'బిడ్డ') &&
    hasMatch(q, 'not able to drink', 'doodh nahi pee', 'doodh nahi pi', 'unable to suck', 'feed.*band', 'పాలు తాగ')
  ) {
    return { escalate: true, section_id: 'ESC-5.1', reason: 'Child unable to drink or feed' };
  }

  // ESC-5.4: Daily fever for more than 7 days in a child
  if (
    hasMatch(q, 'bukhar', 'fever', 'taap', 'ताप', 'జ్వరం') &&
    hasMatch(q, '\\b(8|9|10|11|12|13|14|15)\\s*(?:din|days)\\b', '\\b(?:more than 7|over 7|7 din se zyada|7 days|7 రోజులు)\\b') &&
    hasMatch(q, 'bachch', 'bachi', 'child', 'year', 'saal', 'varsh', 'mul', 'मुल', 'పిల్ల')
  ) {
    return { escalate: true, section_id: 'ESC-5.4', reason: 'Fever lasting more than 7 days' };
  }

  // ESC-4.4: Very low birth weight (< 1.8 kg)
  if (
    hasMatch(q, '(1\\.\\s*[0-7]|1\\.[0-7])\\s*kg', '\\b1[0-7]00\\s*g') &&
    hasMatch(q, 'bachch', 'baby', 'newborn', 'paida', 'janm', 'birth', 'kg', 'జన్మ', 'బరువు')
  ) {
    return { escalate: true, section_id: 'ESC-4.4', reason: 'Birth weight below 1.8 kg' };
  }

  // ESC-2.6: Pregnancy with excessive vomiting / unable to take fluids
  if (
    pregnant &&
    hasMatch(q, 'ulti', 'vomit', 'vomiting', 'వాంతులు') &&
    hasMatch(q, 'paani.*(nahi|nahin|tik)', 'unable to (drink|keep)', 'kuch.*(nahi|nahin).*pet', 'excessive')
  ) {
    return { escalate: true, section_id: 'ESC-2.6', reason: 'Excessive vomiting / unable to take fluids' };
  }

  // ESC-2.5: Pregnancy with severe pallor and breathlessness
  if (
    pregnant &&
    hasMatch(q, 'bahut peeli', 'severe pallor', 'very pale', 'pale', 'రక్తహీనత') &&
    hasMatch(q, 'saans phool', 'breathless', 'breathlessness', 'difficult breathing', 'శ్వాస')
  ) {
    return { escalate: true, section_id: 'ESC-2.5', reason: 'Severe pallor with breathlessness' };
  }

  // ESC-4.3: Newborn cold to touch
  if (
    hasMatch(q, '(10|11|12|15|20) din ka', 'newborn', 'naya janma', 'newly born', 'नवजात', 'శిశువు') &&
    hasMatch(q, 'thanda', 'cold to touch', 'body cold', 'chhune pe thanda', 'చల్ల')
  ) {
    return { escalate: true, section_id: 'ESC-4.3', reason: 'Newborn cold to touch' };
  }

  // ESC-2.1: Pregnancy bleeding or fluid leak
  if (
    hasMatch(q, 'pregnan', 'pregnancy', 'garbh', 'गर्भ', 'గర్భ') &&
    hasMatch(q, 'bleeding', 'khoon aa', 'vagina se khoon', 'paani.*leak', 'baby.*movement.*(kam|band)', 'movement.*absent', 'రక్తస్రావం')
  ) {
    return { escalate: true, section_id: 'ESC-2.1', reason: 'Pregnancy danger sign' };
  }

  // ESC-6.1: Possible heart attack
  if (
    hasMatch(q, 'chest pain', 'seene mein dard', 'seene me dard', 'chest pressure', 'ఛాతీ నొప్పి') &&
    hasMatch(q, 'sweat', 'pasina', 'breath', 'saans', 'diabet', 'diabetes')
  ) {
    return { escalate: true, section_id: 'ESC-6.1', reason: 'Possible heart attack' };
  }

  // ESC-6.2: Possible stroke
  if (hasMatch(q, 'face.*weak', 'one side.*weak', 'bol nahi pa', 'speech.*loss', 'sudden.*vision')) {
    return { escalate: true, section_id: 'ESC-6.2', reason: 'Possible stroke' };
  }

  // ESC-5.2: Child breathing danger sign
  if (
    hasMatch(q, 'breathing.*(difficult|fast)', 'saans.*(tez|nahi le|phool)', 'chest indrawing', 'pasli chal', 'శ్వాస') &&
    hasMatch(q, 'baby', 'newborn', 'bachcha', 'child', 'bachche', 'infant') &&
    !hasMatch(q, 'kitni.*(tez|fast)', 'how many.*(fast|breaths)', 'rate.*threshold')
  ) {
    return { escalate: true, section_id: 'ESC-5.2', reason: 'Child breathing danger sign' };
  }

  return { escalate: false };
}
