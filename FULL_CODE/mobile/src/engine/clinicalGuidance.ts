import { AskResponse, Language } from '../types';

export interface StructuredClinicalGuidance {
  understanding: string;
  firstLineCare: string[];
  redFlags: string[];
  protocolRef: string;
  referralSmsText: string;
  referralWaText: string;
}

export function getStructuredClinicalGuidance(
  response: AskResponse,
  lang: Language = 'en'
): StructuredClinicalGuidance {
  const citation = response.citations?.[0] || 'MoHFW-1.0';
  const query = response.question.toLowerCase();
  const isEmergency = response.is_emergency;
  const isRefusal = response.is_out_of_scope;

  // 1. EMERGENCY ESCALATION
  if (isEmergency) {
    if (lang === 'te') {
      return {
        understanding: 'తీవ్రమైన అత్యవసర ప్రమాద సంకేతం గుర్తించబడింది. ఈ లక్షణం తల్లి లేదా శిశువు యొక్క ప్రాణానికి తక్షణ ముప్పును సూచిస్తుంది. తక్షణ ఆసుపత్రి ఎస్కలేషన్ అవసరం.',
        firstLineCare: [
          'తక్షణమే 108 లేదా 102 అత్యవసర అంబులెన్స్‌కు కాల్ చేసి అత్యవసర రవాణా ఏర్పాటు చేయండి.',
          'రోగిని ఎడమ పక్కకు వాల్చి (Left lateral tilt) శ్వాసనాళం సాఫీగా ఉండేలా ఉంచండి.',
          'మూర్ఛలు లేదా అపస్మారక స్థితిలో ఉన్నప్పుడు నోటి ద్వారా ఎటువంటి ద్రవాలు లేదా మందులు ఇవ్వవద్దు.',
          'రోగిని మరియు శిశువును వెచ్చని దుప్పటితో కప్పి హైపోథెర్మియా రాకుండా చూడండి.'
        ],
        redFlags: [
          'విపరీతమైన రక్తస్రావం (5 నిమిషాల్లో ప్యాడ్ తడిసిపోవడం).',
          'మూర్ఛలు (Convulsions / Fits) లేదా అపస్మారక స్థితి.',
          'తీవ్రమైన శ్వాస ఆడకపోవడం లేదా పిల్లికూతలు (Chest indrawing / Stridor).',
          'శిశువు బరువు 1.8 కేజీల కంటే తక్కువ లేదా పాలు తాగకపోవడం.'
        ],
        protocolRef: `[MoHFW Emergency Protocol ${citation}]`,
        referralSmsText: `EMERGENCY REFERRAL: Patient at Chandrapuri Sub-Centre. Danger sign: ${response.condition_te || response.condition}. Priority P1. Protocol: [MoHFW ${citation}]. Dispatch 108.`,
        referralWaText: `🚨 *CareSphere Emergency Referral*\n*Sub-Centre:* Chandrapuri Block\n*Danger Sign:* ${response.condition_te || response.condition}\n*Immediate Action:* Call 108 / Transfer to FRU/SNCU\n*Citation:* [MoHFW ${citation}]`
      };
    } else if (lang === 'hi') {
      return {
        understanding: 'गंभीर आपातकालीन खतरे का संकेत पहचाना गया है। यह लक्षण माता या शिशु के जीवन के लिए तत्काल जोखिम को दर्शाता है और तुरंत अस्पताल रेफरल अनिवार्य है।',
        firstLineCare: [
          'तुरंत 108 या 102 एम्बुलेंस को कॉल करें और आपातकालीन अस्पताल रेफरल शुरू करें।',
          'गर्भवती महिला को बाईं करवट (Left lateral tilt) लिटाएं ताकि रक्त प्रवाह और सांस का मार्ग सुचारू रहे।',
          'दौरे या बेहोशी की स्थिति में मुंह से कोई भी तरल या दवा बिल्कुल न दें।',
          'माता और शिशु को गर्म कंबल से ढककर रखें ताकि हाइपोथर्मिया से बचाव हो सके।'
        ],
        redFlags: [
          'तेज रक्तस्राव (5 मिनट से कम में पैड पूरी तरह भीगना)।',
          'दौरे (झटके / Fits) पड़ना या बेहोश होना।',
          'सांस लेने में अत्यधिक कठिनाई या छाती का अंदर धंसना (Chest indrawing)।',
          'शिशु का वजन 1.8 किग्रा से कम होना या स्तनपान करने में असमर्थ होना।'
        ],
        protocolRef: `[MoHFW Emergency Protocol ${citation}]`,
        referralSmsText: `EMERGENCY REFERRAL: Patient at Chandrapuri Sub-Centre. Danger sign: ${response.condition_hi || response.condition}. Priority P1. Protocol: [MoHFW ${citation}]. Dispatch 108.`,
        referralWaText: `🚨 *केयरस्फेयर आपातकालीन रेफरल*\n*उप-केंद्र:* चंद्रापुरी ब्लॉक\n*खतरे का संकेत:* ${response.condition_hi || response.condition}\n*तत्काल कार्रवाई:* 108 एम्बुलेंस / एफआरयू रेफरल\n*संदर्भ:* [MoHFW ${citation}]`
      };
    } else {
      return {
        understanding: 'Critical emergency danger sign detected. This clinical presentation indicates immediate risk to maternal or neonatal life requiring urgent hospital resuscitation and transfer.',
        firstLineCare: [
          'Dispatch 108 / 102 emergency ambulance immediately for urgent transfer to First Referral Unit (FRU) or District Hospital SNCU.',
          'Place pregnant mother in left-lateral tilt position to relieve inferior vena cava compression and maintain oxygenation.',
          'Strictly NOTHING BY MOUTH during convulsions, fits, or altered consciousness to prevent aspiration.',
          'Wrap mother and infant warmly in dry, clean blankets with cap and socks to prevent hypothermia during transport.'
        ],
        redFlags: [
          'Severe heavy bleeding (soaking sanitary pad in less than 5 minutes).',
          'Convulsions, fits, or loss of consciousness.',
          'Respiratory distress, stridor, or severe chest indrawing.',
          'Infant birth weight < 1.8 kg or total refusal/inability to suck breast milk.'
        ],
        protocolRef: `[MoHFW Emergency Protocol ${citation}]`,
        referralSmsText: `EMERGENCY REFERRAL: Patient at Chandrapuri Sub-Centre. Danger sign: ${response.condition}. Priority P1. Protocol: [MoHFW ${citation}]. Dispatch 108 immediately.`,
        referralWaText: `🚨 *CareSphere Emergency Referral*\n*Sub-Centre:* Chandrapuri Block\n*Danger Sign:* ${response.condition}\n*Immediate Action:* Call 108 Ambulance / FRU Transfer\n*Protocol Citation:* [MoHFW ${citation}]`
      };
    }
  }

  // 2. OUT OF SCOPE REFUSAL
  if (isRefusal) {
    if (lang === 'te') {
      return {
        understanding: 'ఈ ప్రశ్న ఫ్రంట్‌లైన్ ఆశా/ఏఎన్‌ఎం మార్గదర్శకాల పరిధి దాటిన అంశం (యాంటీబయాటిక్స్ ప్రిస్క్రిప్షన్, శస్త్రచికిత్సలు లేదా అనుబంధ వైద్య విషయాలు).',
        firstLineCare: [
          'ఆశా కార్యకర్తలు తమ సేవా పరిధికి మించి యాంటీబయాటిక్స్ లేదా ప్రత్యేక చికిత్సలు సిఫార్సు చేయకూడదు.',
          'రోగిని ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) వైద్య అధికారి వద్దకు లేదా సీహెచ్‌సీ ప్రత్యేక విభాగానికి పంపించండి.',
          'సాధారణ ప్రథమ చికిత్స, తగినంత తాగునీరు మరియు విశ్రాంతిని సూచించండి.'
        ],
        redFlags: [
          'తీవ్రమైన నొప్పి, అధిక జ్వరం లేదా రోగి పరిస్థితి క్షీణించడం.',
          'సొంత వైద్యం వల్ల అలర్జీలు లేదా దుష్ప్రభావాలు రావడం.'
        ],
        protocolRef: '[MoHFW Scope & Redirection Protocol SCP-1.2]',
        referralSmsText: `CareSphere Clinical Referral: Patient inquiry outside frontline scope. Referred to PHC Medical Officer for evaluation. Protocol: [MoHFW SCP-1.2].`,
        referralWaText: `📋 *CareSphere Clinical Referral*\n*Sub-Centre:* Chandrapuri Block\n*Notice:* Topic outside frontline protocol boundary\n*Recommendation:* Refer to PHC Medical Officer (SCP-1.2)`
      };
    } else if (lang === 'hi') {
      return {
        understanding: 'यह प्रश्न फ्रंटलाइन आशा/एएनएम प्रोटोकॉल के आधिकारिक कार्यक्षेत्र से बाहर है (जैसे एंटीबायोटिक्स लिखना, सर्जरी या अन्य गैर-अनुमोदित चिकित्सा विषय)।',
        firstLineCare: [
          'आशा कार्यकर्ता अपनी अधिकृत सीमा से बाहर एंटीबायोटिक्स या विशेष दवाएं निर्धारित नहीं कर सकती हैं।',
          'रोगी को प्राथमिक स्वास्थ्य केंद्र (PHC) के चिकित्सा अधिकारी से परामर्श लेने की सलाह दें।',
          'रोगी को पर्याप्त तरल पदार्थ, आराम और स्वच्छता बनाए रखने का परामर्श दें।'
        ],
        redFlags: [
          'तीव्र दर्द, तेज बुखार या रोगी की स्थिति बिगड़ना।',
          'बिना डॉक्टर की सलाह के दवाएं लेना।'
        ],
        protocolRef: '[MoHFW Scope & Redirection Protocol SCP-1.2]',
        referralSmsText: `CareSphere Clinical Referral: Patient inquiry outside frontline scope. Referred to PHC Medical Officer for evaluation. Protocol: [MoHFW SCP-1.2].`,
        referralWaText: `📋 *केयरस्फेयर रेफरल*\n*उप-केंद्र:* चंद्रापुरी ब्लॉक\n*सूचना:* आशा कार्यक्षेत्र सीमा से बाहर का विषय\n*सलाह:* पीएचसी चिकित्सा अधिकारी से परामर्श लें (SCP-1.2)`
      };
    } else {
      return {
        understanding: 'This topic falls outside the approved frontline ASHA/ANM protocol scope (such as prescribing antibiotics, surgical procedures, or specialist therapies).',
        firstLineCare: [
          'Frontline workers must strictly adhere to scope boundaries and never prescribe unapproved prescription antibiotics or advanced medications.',
          'Counsel the patient and family to visit the Primary Health Centre (PHC) for direct physician examination by the Medical Officer.',
          'Provide general supportive care: adequate hydration, clean nutrition, and rest.'
        ],
        redFlags: [
          'High fever, persistent severe pain, or progressive clinical deterioration.',
          'Adverse reactions from unverified self-medication.'
        ],
        protocolRef: '[MoHFW Scope & Redirection Protocol SCP-1.2]',
        referralSmsText: `CareSphere Clinical Referral: Patient inquiry outside frontline scope. Referred to PHC Medical Officer for physician evaluation. Protocol: [MoHFW SCP-1.2].`,
        referralWaText: `📋 *CareSphere Clinical Referral*\n*Sub-Centre:* Chandrapuri Block\n*Notice:* Query outside frontline protocol boundary\n*Recommended Action:* Consult PHC Medical Officer (SCP-1.2)`
      };
    }
  }

  // 3. DIARRHEA & ORS / ZINC
  if (citation.startsWith('CHD-1') || query.includes('diarrh') || query.includes('ors') || query.includes('zinc') || query.includes('dast') || query.includes('విరేచన')) {
    return {
      understanding: lang === 'te' 
        ? 'విరేచనాలు శరీరంలోని నీరు మరియు ముఖ్యమైన లవణాలను వేగంగా కోల్పోయేలా చేస్తాయి. డీహైడ్రేషన్ నివారించడమే ప్రధాన లక్ష్యం.'
        : lang === 'hi'
        ? 'दस्त के कारण शिशु के शरीर से पानी और आवश्यक लवणों की कमी हो जाती है। ओआरएस और जिंक से त्वरित रिकवरी संभव है।'
        : 'Diarrhoea leads to rapid loss of water and essential electrolytes, putting the child at risk of dehydration. Timely oral rehydration restores fluid balance.',
      firstLineCare: [
        'ORS Solution: Dissolve 1 complete ORS sachet into exactly 1 litre (1000 mL) of clean drinking or boiled-and-cooled water. Do not boil prepared solution; discard unused after 24 hours.',
        'Administration: Offer frequent small sips with clean cup & spoon after every loose stool (50-100 mL for infants < 2y; 100-200 mL for 2-5y).',
        'Zinc Supplementation: Administer Zinc 20mg dispersible tablet (10mg for infants < 6m) dissolved in breast milk or water once daily for 14 consecutive days — complete full 14 days even after loose stools resolve.',
        'Feeding: Continue frequent, uninterrupted breastfeeding and age-appropriate feeding.'
      ],
      redFlags: [
        'Child is lethargic, unconscious, or unable to drink/breastfeed.',
        'Sunken eyes, or skin pinch goes back very slowly (> 2 seconds).',
        'Blood in stool or persistent vomiting preventing oral intake.'
      ],
      protocolRef: `[IMNCI Diarrhoea Protocol ${citation}]`,
      referralSmsText: `CareSphere Protocol Guidance: Child Diarrhea treated with 1L ORS + Zinc 20mg x 14d. Sub-Centre: Chandrapuri. Protocol: [IMNCI ${citation}].`,
      referralWaText: `💧 *CareSphere Diarrhoea Protocol*\n*Care Plan:* 1L ORS solution + Zinc 20mg daily for 14 days\n*Crucial:* Continue frequent breastfeeding\n*Protocol Citation:* [IMNCI ${citation}]`
    };
  }

  // 4. MATERNAL ANTENATAL CARE
  if (citation.startsWith('ANC') || query.includes('anc') || query.includes('pregnant') || query.includes('ifa') || query.includes('calcium') || query.includes('గర్భ')) {
    return {
      understanding: lang === 'te'
        ? 'గర్భధారణ సమయంలో తల్లి మరియు బిడ్డ ఆరోగ్య స్థితిని క్రమం తప్పకుండా పర్యవేక్షించడం రక్తహీనత మరియు ప్రీ-ఎక్లాంప్సియాను నివారిస్తుంది.'
        : lang === 'hi'
        ? 'गर्भावस्था के दौरान नियमित जांच माता और गर्भस्थ शिशु की वृद्धि, हीमोग्लोबिन स्तर और रक्तचाप की निगरानी के लिए अत्यंत आवश्यक है।'
        : 'Antenatal care (ANC) systematically monitors maternal physiology, fetal growth, maternal haemoglobin, and blood pressure to detect risks early.',
      firstLineCare: [
        'Minimum 4 ANC Visits: 1st within 12 weeks; 2nd 14-26 weeks; 3rd 28-34 weeks; 4th 36 weeks to term. Bring woman on 9th of every month for PMSMA check-up.',
        'Iron & Folic Acid (Red IFA): One Red IFA tablet (100mg elemental iron + 0.5mg folic acid) daily for 180 days starting in 2nd trimester. Ingest with lemon water or citrus fluids.',
        'Strict Warning: Never take IFA with milk, tea, coffee, or calcium tablets. Maintain a mandatory 2-hour interval between Calcium (500mg twice daily from 14w) and IFA.',
        'Deworming: Albendazole 400mg single dose in the second trimester (after 12 weeks).'
      ],
      redFlags: [
        'Any vaginal bleeding during pregnancy (requires immediate 108 referral).',
        'Severe persistent headache, blurred vision, or facial oedema (BP ≥ 140/90 mmHg).',
        'Reduced fetal movements or severe abdominal pain.'
      ],
      protocolRef: `[MoHFW Maternal Health Protocol ${citation}]`,
      referralSmsText: `CareSphere ANC Protocol: 4 visits, Red IFA 180d, Calcium 500mg bd. Sub-Centre: Chandrapuri. Protocol: [MoHFW ${citation}].`,
      referralWaText: `🤰 *CareSphere ANC Protocol*\n*Clinical Schedule:* Minimum 4 ANC check-ups, Red IFA 180 days with citrus water, Calcium 500mg bd\n*PMSMA:* 9th of every month\n*Protocol Citation:* [MoHFW ${citation}]`
    };
  }

  // 5. NEWBORN HBNC
  if (citation.startsWith('HBNC') || query.includes('hbnc') || query.includes('weight') || query.includes('bath') || query.includes('newborn') || query.includes('పుట్టిన')) {
    return {
      understanding: lang === 'te'
        ? 'నవజాత శిశువు యొక్క మొదటి 42 రోజులు వెచ్చదనం కాపాడటం (హైపోథెర్మియా నివారణ) మరియు తల్లిపాలు అతి ముఖ్యం.'
        : lang === 'hi'
        ? 'नवजात शिशु के पहले 42 दिन शरीर का तापमान स्थिर रखना, संक्रमण से बचाव और समय पर वजन की निगरानी आवश्यक है।'
        : 'The neonatal period (first 42 days) requires strict thermal protection, infection control, and optimal nutrition to prevent neonatal sepsis.',
      firstLineCare: [
        'HBNC Schedule: 6 visits for institutional births (Days 3, 7, 14, 21, 28, 42); 7 visits for home births (including Day 1).',
        'Kangaroo Mother Care (KMC): Provide continuous skin-to-skin contact between mother’s chest and infant with warm cap and socks for all low birth weight babies (< 2000g).',
        'Delay Bathing: Delay first bath for at least 48 hours for normal infants; NEVER bathe low birth weight infants (< 2000g) until they reach 2000g.',
        'Exclusive Breastfeeding: Initiate within 1 hour of delivery; feed colostrum; strictly avoid prelacteal feeds.'
      ],
      redFlags: [
        'Birth weight < 1.8 kg (requires immediate SNCU referral via 108/102).',
        'Hypothermia (cold to touch, axillary temperature < 35.4°C).',
        'Inability to suck, lethargy, or deep jaundice extending to palms and soles.'
      ],
      protocolRef: `[MoHFW HBNC Protocol ${citation}]`,
      referralSmsText: `CareSphere HBNC Protocol: KMC skin-to-skin, delay bath till 2000g, 6/7 visits. Sub-Centre: Chandrapuri. Protocol: [MoHFW ${citation}].`,
      referralWaText: `👶 *CareSphere HBNC Protocol*\n*Care Schedule:* 6/7 visits, KMC skin-to-skin for LBW, delay bathing until 2000g, exclusive colostrum feeding\n*Protocol Citation:* [MoHFW ${citation}]`
    };
  }

  // 6. DEFAULT GENERAL PROTOCOL
  const excerpt = response.answer_en || response.answer;
  return {
    understanding: 'This clinical guidance is directly grounded in official Ministry of Health and Family Welfare (MoHFW) and National Health Mission (NHM) frontline standard operating procedures.',
    firstLineCare: [
      response.recommended_action || 'Adhere to official protocol timeline and counsel the family during the home visit.',
      excerpt.slice(0, 220),
      'Document all delivered health interventions, dates, and dosages in the MCP card and household register.'
    ],
    redFlags: [
      'Unfavourable clinical response, severe illness, or emergent danger signs.',
      'Transfer immediately to Primary Health Centre (PHC) Medical Officer if baseline stability is not maintained.'
    ],
    protocolRef: `[MoHFW Protocol ${citation}]`,
    referralSmsText: `CareSphere Sub-Centre Guidance: Protocol ${citation} applied for Chandrapuri Block.`,
    referralWaText: `📋 *CareSphere Frontline Protocol*\n*Section:* ${citation}\n*Standard Guidance:* ${excerpt.slice(0, 160)}...\n*Citation:* [MoHFW ${citation}]`
  };
}
