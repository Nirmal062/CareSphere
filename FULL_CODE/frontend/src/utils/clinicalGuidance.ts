import { AskResponse } from '../types';

export interface StructuredClinicalGuidance {
  understanding: string;
  firstLineCare: string[];
  redFlags: string[];
  protocolRef: string;
  referralSmsText: string;
  referralWaText: string;
}

/**
 * Returns structured, empathetic, and actionable 4-part clinical guidance
 * matching MoHFW / IMNCI frontline health-worker protocols.
 */
export function getStructuredClinicalGuidance(
  response: AskResponse,
  lang: 'en' | 'te' | 'hi' = 'en'
): StructuredClinicalGuidance {
  const citation = response.citations?.[0] || 'MoHFW-1.0';
  const query = response.question.toLowerCase();
  const isEmergency = response.is_emergency;
  const isRefusal = response.is_out_of_scope;

  // -------------------------------------------------------------
  // 1. EMERGENCY ESCALATION CASES (ESC-1.x to ESC-4.x)
  // -------------------------------------------------------------
  if (isEmergency) {
    if (lang === 'te') {
      return {
        understanding: "తీవ్రమైన అత్యవసర ప్రమాద సంకేతం గుర్తించబడింది. ఈ లక్షణం తల్లి లేదా శిశువు యొక్క ప్రాణానికి తక్షణ ముప్పును సూచిస్తుంది. తక్షణ ఆసుపత్రి ఎస్కలేషన్ అవసరం.",
        firstLineCare: [
          "తక్షణమే 108 లేదా 102 అత్యవసర అంబులెన్స్‌కు కాల్ చేసి అత్యవసర రవాణా ఏర్పాటు చేయండి.",
          "రోగిని ఎడమ పక్కకు వాల్చి (Left lateral tilt) శ్వాసనాళం సాఫీగా ఉండేలా ఉంచండి.",
          "మూర్ఛలు (fits) లేదా అపస్మారక స్థితిలో ఉన్నప్పుడు నోటి ద్వారా ఎటువంటి ద్రవాలు లేదా మందులు ఇవ్వవద్దు.",
          "రోగిని మరియు శిశువును వెచ్చని దుప్పటితో కప్పి హైపోథెర్మియా (చలి వణకు) రాకుండా చూడండి."
        ],
        redFlags: [
          "విపరీతమైన రక్తస్రావం (5 నిమిషాల్లో ప్యాడ్ తడిసిపోవడం).",
          "మూర్ఛలు (Convulsions / Fits) లేదా అపస్మారక స్థితి.",
          "తీవ్రమైన శ్వాస ఆడకపోవడం లేదా పిల్లికూతలు (Chest indrawing / Stridor).",
          "శిశువు బరువు 1.8 కేజీల కంటే తక్కువ లేదా పాలు తాగకపోవడం."
        ],
        protocolRef: `[MoHFW Emergency Protocol ${citation}]`,
        referralSmsText: `EMERGENCY REFERRAL: Patient at Chandrapuri Sub-Centre. Danger sign: ${response.condition_te || response.condition}. Priority P1. Protocol: [MoHFW ${citation}]. Dispatch 108.`,
        referralWaText: `🚨 *CareSphere Emergency Referral*\n*Sub-Centre:* Chandrapuri Block\n*Danger Sign:* ${response.condition_te || response.condition}\n*Immediate Action:* Call 108 / Transfer to FRU/SNCU\n*Citation:* [MoHFW ${citation}]`
      };
    } else if (lang === 'hi') {
      return {
        understanding: "गंभीर आपातकालीन खतरे का संकेत पहचाना गया है। यह लक्षण माता या शिशु के जीवन के लिए तत्काल जोखिम को दर्शाता है और तुरंत अस्पताल रेफरल अनिवार्य है।",
        firstLineCare: [
          "तुरंत 108 या 102 एम्बुलेंस को कॉल करें और आपातकालीन अस्पताल रेफरल शुरू करें।",
          "गर्भवती महिला को बाईं करवट (Left lateral tilt) लिटाएं ताकि रक्त प्रवाह और सांस का मार्ग सुचारू रहे।",
          "दौरे (Convulsions) या बेहोशी की स्थिति में मुंह से कोई भी तरल या दवा बिल्कुल न दें।",
          "माता और शिशु को गर्म कंबल से ढककर रखें ताकि हाइपोथर्मिया से बचाव हो सके।"
        ],
        redFlags: [
          "तेज रक्तस्राव (5 मिनट से कम में पैड पूरी तरह भीगना)।",
          "दौरे (झटके / Fits) पड़ना या बेहोश होना।",
          "सांस लेने में अत्यधिक कठिनाई या छाती का अंदर धंसना (Chest indrawing)।",
          "शिशु का वजन 1.8 किग्रा से कम होना या स्तनपान करने में असमर्थ होना।"
        ],
        protocolRef: `[MoHFW Emergency Protocol ${citation}]`,
        referralSmsText: `EMERGENCY REFERRAL: Patient at Chandrapuri Sub-Centre. Danger sign: ${response.condition_hi || response.condition}. Priority P1. Protocol: [MoHFW ${citation}]. Dispatch 108.`,
        referralWaText: `🚨 *केयरस्फेयर आपातकालीन रेफरल*\n*उप-केंद्र:* चंद्रापुरी ब्लॉक\n*खतरे का संकेत:* ${response.condition_hi || response.condition}\n*तत्काल कार्रवाई:* 108 एम्बुलेंस / एफआरयू रेफरल\n*संदर्भ:* [MoHFW ${citation}]`
      };
    } else {
      return {
        understanding: "Critical emergency danger sign detected. This clinical presentation indicates immediate risk to maternal or neonatal life requiring urgent hospital resuscitation and transfer.",
        firstLineCare: [
          "Dispatch 108 / 102 emergency ambulance immediately for urgent transfer to First Referral Unit (FRU) or District Hospital SNCU.",
          "Place pregnant mother in left-lateral tilt position to relieve inferior vena cava compression and maintain oxygenation.",
          "Strictly NOTHING BY MOUTH during convulsions, fits, or altered consciousness to prevent aspiration.",
          "Wrap mother and infant warmly in dry, clean blankets with cap and socks to prevent hypothermia during transport."
        ],
        redFlags: [
          "Severe heavy bleeding (soaking sanitary pad in less than 5 minutes).",
          "Convulsions, fits, or loss of consciousness.",
          "Respiratory distress, stridor, or severe chest indrawing.",
          "Infant birth weight < 1.8 kg or total refusal/inability to suck breast milk."
        ],
        protocolRef: `[MoHFW Emergency Protocol ${citation}]`,
        referralSmsText: `EMERGENCY REFERRAL: Patient at Chandrapuri Sub-Centre. Danger sign: ${response.condition}. Priority P1. Protocol: [MoHFW ${citation}]. Dispatch 108 immediately.`,
        referralWaText: `🚨 *CareSphere Emergency Referral*\n*Sub-Centre:* Chandrapuri Block\n*Danger Sign:* ${response.condition}\n*Immediate Action:* Call 108 Ambulance / FRU Transfer\n*Protocol Citation:* [MoHFW ${citation}]`
      };
    }
  }

  // -------------------------------------------------------------
  // 2. OUT-OF-SCOPE REFUSAL (SCP-1.2)
  // -------------------------------------------------------------
  if (isRefusal) {
    if (lang === 'te') {
      return {
        understanding: "ఈ ప్రశ్న ఫ్రంట్‌లైన్ ఆశా/ఏఎన్‌ఎం మార్గదర్శకాల పరిధి దాటిన అంశం (యాంటీబయాటిక్స్ ప్రిస్క్రిప్షన్, శస్త్రచికిత్సలు లేదా అనుబంధ వైద్య విషయాలు).",
        firstLineCare: [
          "ఆశా కార్యకర్తలు తమ సేవా పరిధికి మించి యాంటీబయాటిక్స్ లేదా ప్రత్యేక చికిత్సలు సిఫార్సు చేయకూడదు.",
          "రోగిని ప్రాథమిక ఆరోగ్య కేంద్రం (PHC) వైద్య అధికారి వద్దకు లేదా సీహెచ్‌సీ ప్రత్యేక విభాగానికి పంపించండి.",
          "సాధారణ ప్రథమ చికిత్స, తగినంత తాగునీరు మరియు విశ్రాంతిని సూచించండి."
        ],
        redFlags: [
          "తీవ్రమైన నొప్పి, అధిక జ్వరం లేదా రోగి పరిస్థితి క్షీణించడం.",
          "సొంత వైద్యం వల్ల అలర్జీలు లేదా దుష్ప్రభావాలు రావడం."
        ],
        protocolRef: "[MoHFW Scope & Redirection Protocol SCP-1.2]",
        referralSmsText: `CareSphere Clinical Referral: Patient inquiry outside frontline scope. Referred to PHC Medical Officer for evaluation. Protocol: [MoHFW SCP-1.2].`,
        referralWaText: `📋 *CareSphere Clinical Referral*\n*Sub-Centre:* Chandrapuri Block\n*Notice:* Topic outside frontline protocol boundary\n*Recommendation:* Refer to PHC Medical Officer (SCP-1.2)`
      };
    } else if (lang === 'hi') {
      return {
        understanding: "यह प्रश्न फ्रंटलाइन आशा/एएनएम प्रोटोकॉल के आधिकारिक कार्यक्षेत्र से बाहर है (जैसे एंटीबायोटिक्स लिखना, सर्जरी या अन्य गैर-अनुमोदित चिकित्सा विषय)।",
        firstLineCare: [
          "आशा कार्यकर्ता अपनी अधिकृत सीमा से बाहर एंटीबायोटिक्स या विशेष दवाएं निर्धारित नहीं कर सकती हैं।",
          "रोगी को प्राथमिक स्वास्थ्य केंद्र (PHC) के चिकित्सा अधिकारी (Medical Officer) के पास जाने की सलाह दें।",
          "रोगी को पर्याप्त तरल पदार्थ, आराम और स्वच्छता बनाए रखने का परामर्श दें।"
        ],
        redFlags: [
          "तीव्र दर्द, तेज बुखार या रोगी की स्थिति बिगड़ना।",
          "बिना डॉक्टर की सलाह के एंटीबायोटिक या अन्य दवाएं लेना।"
        ],
        protocolRef: "[MoHFW Scope & Redirection Protocol SCP-1.2]",
        referralSmsText: `CareSphere Clinical Referral: Patient inquiry outside frontline scope. Referred to PHC Medical Officer for evaluation. Protocol: [MoHFW SCP-1.2].`,
        referralWaText: `📋 *केयरस्फेयर रेफरल*\n*उप-केंद्र:* चंद्रापुरी ब्लॉक\n*सूचना:* आशा कार्यक्षेत्र सीमा से बाहर का विषय\n*सलाह:* पीएचसी चिकित्सा अधिकारी से परामर्श लें (SCP-1.2)`
      };
    } else {
      return {
        understanding: "This topic falls outside the approved frontline ASHA/ANM protocol scope (such as prescribing antibiotics, surgical procedures, or specialist therapies).",
        firstLineCare: [
          "Frontline workers must strictly adhere to scope boundaries and never prescribe unapproved prescription antibiotics or advanced medications.",
          "Counsel the patient and family to visit the Primary Health Centre (PHC) for direct physician examination by the Medical Officer.",
          "Provide general supportive care: adequate hydration, clean nutrition, and rest."
        ],
        redFlags: [
          "High fever, persistent severe pain, or progressive clinical deterioration.",
          "Adverse reactions from unverified self-medication."
        ],
        protocolRef: "[MoHFW Scope & Redirection Protocol SCP-1.2]",
        referralSmsText: `CareSphere Clinical Referral: Patient inquiry outside frontline scope. Referred to PHC Medical Officer for physician evaluation. Protocol: [MoHFW SCP-1.2].`,
        referralWaText: `📋 *CareSphere Clinical Referral*\n*Sub-Centre:* Chandrapuri Block\n*Notice:* Query outside frontline protocol boundary\n*Recommended Action:* Consult PHC Medical Officer (SCP-1.2)`
      };
    }
  }

  // -------------------------------------------------------------
  // 3. GROUNDED CLINICAL PROTOCOL (DIARRHEA & ORS / ZINC)
  // -------------------------------------------------------------
  if (citation.startsWith('CHD-1') || query.includes('diarrh') || query.includes('ors') || query.includes('zinc') || query.includes('dast') || query.includes('విరేచన')) {
    if (lang === 'te') {
      return {
        understanding: "విరేచనాలు శరీరంలోని నీరు మరియు ముఖ్యమైన లవణాలను (ఎలక్ట్రోలైట్లు) వేగంగా కోల్పోయేలా చేస్తాయి. దీనివల్ల డీహైడ్రేషన్ (నిర్జలీకరణం) రాకుండా నిరోధించడమే ప్రధాన లక్ష్యం.",
        firstLineCare: [
          "ORS ద్రావణం తయారీ: 1 పూర్తి ORS ప్యాకెట్‌ను ఖచ్చితంగా 1 లీటరు శుభ్రమైన తాగునీటిలో లేదా మరిగించి చల్లార్చిన నీటిలో పూర్తిగా కలపండి. ద్రావణాన్ని మరిగించవద్దు; 24 గంటల తర్వాత మిగిలిన ద్రావణాన్ని పారబోయండి.",
          "ఇవ్వవలసిన విధానం: ప్రతి విరేచనం తర్వాత శుభ్రమైన గిన్నె మరియు చెంచాతో కొద్దికొద్దిగా తాగించండి (చిన్న పిల్లలకు 50-100 మి.లీ, పెద్ద పిల్లలకు 100-200 మి.లీ).",
          "జింక్ సప్లిమెంట్: జింక్ 20 మి.గ్రా మాత్రను (6 నెలల లోపు శిశువులకు 10 మి.గ్రా) తల్లి పాలలో లేదా నీటిలో కరిగించి రోజూ ఒకసారి వరుసగా 14 రోజుల పాటు తప్పక ఇవ్వాలి — విరేచనాలు తగ్గినప్పటికీ 14 రోజులు పూర్తి చేయాలి.",
          "తల్లిపాలు మరియు పోషకాహారం: తల్లిపాలు తాగించడం ఎట్టి పరిస్థితుల్లోనూ ఆపకూడదు; నిరంతరం తాగిస్తూ ఉండాలి."
        ],
        redFlags: [
          "పిల్లవాడు నీరు తాగలేకపోవడం లేదా స్పృహతప్పి మగతగా ఉండటం.",
          "కళ్ళు గుంటలు పడటం, చర్మం గిల్లితే చాలా నెమ్మదిగా (> 2 సెకన్లు) యథాస్థితికి రావడం.",
          "మలంలో రక్తం కనిపించడం లేదా తీవ్రమైన జ్వరం రావడం."
        ],
        protocolRef: `[IMNCI Diarrhoea Protocol ${citation}]`,
        referralSmsText: `CareSphere Protocol Guidance: Child Diarrhea management initiated with ORS (1L) + Zinc (20mg daily x 14d). Sub-Centre: Chandrapuri. Protocol: [IMNCI ${citation}].`,
        referralWaText: `💧 *CareSphere Diarrhoea Protocol*\n*Guideline:* ORS 1L preparation + Zinc 20mg dispersible tablets once daily for 14 days\n*Continue:* Uninterrupted breastfeeding\n*Protocol Citation:* [IMNCI ${citation}]`
      };
    } else if (lang === 'hi') {
      return {
        understanding: "दस्त के कारण शिशु के शरीर से पानी और आवश्यक लवणों (इलेक्ट्रोलाइट्स) की तेजी से कमी हो जाती है। समय पर उचित देखभाल से डिहाइड्रेशन (निर्जलीकरण) की गंभीर स्थिति से शत-प्रतिशत बचाव संभव है।",
        firstLineCare: [
          "ओआरएस (ORS) घोल बनाने का सही तरीका: ओआरएस का 1 पूरा पैकेट ठीक 1 लीटर साफ पीने के पानी (या उबले एवं ठंडे पानी) में घोलें। घोल को कभी न उबालें; 24 घंटे के बाद बचा हुआ घोल फेंक दें।",
          "देने का तरीका: हर पतले दस्त के बाद साफ कटोरी-चम्मच से थोड़ा-थोड़ा पिलाएं (शिशु को 50-100 मिली, बड़े बच्चे को 100-200 मिली)।",
          "जिंक की खुराक: जिंक 20 मिलीग्राम की घुलनशील गोली (6 माह से छोटे शिशु को 10 मिलीग्राम) मां के दूध या पानी में घोलकर 14 दिनों तक लगातार रोजाना एक बार दें — दस्त रुकने के बाद भी 14 दिन का कोर्स पूरा करें।",
          "स्तनपान जारी रखें: मां का दूध बार-बार पिलाते रहें और उम्र के अनुसार सुपाच्य आहार देते रहें।"
        ],
        redFlags: [
          "बच्चा सुस्त या बेहोश हो, पानी या दूध पीने में असमर्थ हो।",
          "आंखें धंसी हुई हों और पेट की त्वचा चुटकी काटने पर बहुत धीरे (> 2 सेकंड) वापस जाए।",
          "मल में खून आ रहा हो या लगातार उल्टियां हो रही हों।"
        ],
        protocolRef: `[IMNCI Diarrhoea Protocol ${citation}]`,
        referralSmsText: `CareSphere Protocol Guidance: Child Diarrhea management with ORS (1L) + Zinc (20mg x 14 days). Sub-Centre: Chandrapuri. Protocol: [IMNCI ${citation}].`,
        referralWaText: `💧 *केयरस्फेयर दस्त प्रबंधन प्रोटोकॉल*\n*उपचार:* ओआरएस (1 लीटर) + जिंक 20 मिग्रा (14 दिन लगातार)\n*विशेष:* स्तनपान निरंतर जारी रखें\n*संदर्भ:* [IMNCI ${citation}]`
      };
    } else {
      return {
        understanding: "Diarrhoea leads to rapid loss of water and essential electrolytes, putting the child at risk of dehydration. Timely oral rehydration restores fluid balance and protects gut function.",
        firstLineCare: [
          "ORS Preparation: Dissolve 1 complete ORS sachet into exactly 1 litre (1000 mL) of clean drinking or boiled-and-cooled water. Do not boil the prepared solution; discard any unused solution after 24 hours.",
          "Administration: Offer frequent small sips using a clean cup and spoon after every loose stool (50-100 mL for infants under 2 years; 100-200 mL for children 2-5 years).",
          "Zinc Supplementation: Administer Zinc 20 mg dispersible tablet (10 mg for infants < 6 months) dissolved in expressed breast milk or clean water once daily for 14 consecutive days — complete the full 14 days even after loose stools resolve to regenerate gut mucosa.",
          "Feeding: Continue frequent, uninterrupted breastfeeding and age-appropriate nutritious feeding."
        ],
        redFlags: [
          "Child is lethargic, unconscious, or unable to drink/breastfeed.",
          "Sunken eyes, or skin pinch goes back very slowly (> 2 seconds).",
          "Blood in stool or persistent vomiting preventing oral intake."
        ],
        protocolRef: `[IMNCI Diarrhoea Protocol ${citation}]`,
        referralSmsText: `CareSphere Protocol Guidance: Child Diarrhea treated with 1L ORS + Zinc 20mg x 14d. Sub-Centre: Chandrapuri. Protocol: [IMNCI ${citation}].`,
        referralWaText: `💧 *CareSphere Diarrhoea Protocol*\n*Care Plan:* 1L ORS solution + Zinc 20mg dispersible tablets daily for 14 days\n*Crucial:* Continue frequent breastfeeding\n*Protocol Citation:* [IMNCI ${citation}]`
      };
    }
  }

  // -------------------------------------------------------------
  // 4. MATERNAL ANTENATAL CARE (ANC-1.x, ANC-2.x)
  // -------------------------------------------------------------
  if (citation.startsWith('ANC') || query.includes('anc') || query.includes('pregnant') || query.includes('ifa') || query.includes('calcium') || query.includes('గర్భ')) {
    if (lang === 'te') {
      return {
        understanding: "గర్భధారణ సమయంలో తల్లి మరియు బిడ్డ ఆరోగ్య స్థితిని క్రమం తప్పకుండా పర్యవేక్షించడం చాలా ముఖ్యం. ఇది రక్తహీనత, అధిక రక్తపోటు (ప్రీ-ఎక్లాంప్సియా) మరియు పోషకాహార లోపాలను నివారిస్తుంది.",
        firstLineCare: [
          "కనీసం 4 ANC పరీక్షలు: 1వ పరీక్ష: 12 వారాల్లోపు; 2వ పరీక్ష: 14-26 వారాలు; 3వ పరీక్ష: 28-34 వారాలు; 4వ పరీక్ష: 36 వారాల నుండి ప్రసవం వరకు. ప్రతి నెలా 9వ తేదీన PMSMA రోజున వైద్యుని వద్ద ఉచిత తనిఖీ చేయించండి.",
          "ఐరన్ ఫోలిక్ యాసిడ్ (Red IFA): రెండవ త్రైమాసికం నుండి రోజూ 1 ఎరుపు IFA మాత్ర చొప్పున వరుసగా 180 రోజుల పాటు వేసుకోవాలి. నిమ్మరసం లేదా సి-విటమిన్ ఉన్న నీటితో తీసుకుంటే ఐరన్ బాగా శోషించబడుతుంది.",
          "జాగ్రత్త: IFA మాత్రలను పాలు, టీ, కాఫీ లేదా క్యాల్షియం మాత్రలతో కలిపి వేసుకోకూడదు. క్యాల్షియం (500mg రోజుకు 2 సార్లు) మరియు IFA మధ్య కనీసం 2 గంటల వ్యవధి పాటించాలి.",
          "నులిపురుగుల నివారణ: రెండవ త్రైమాసికంలో ఒకసారి ఆల్బెండజోల్ (Albendazole 400mg) ఒక మాత్ర వేయించండి."
        ],
        redFlags: [
          "యోని నుండి రక్తస్రావం (Bleeding per vaginum).",
          "తీవ్రమైన తలనొప్పి, కంటిచూపు మసకబారడం లేదా ముఖం/కాళ్ళపై ఆకస్మిక వాపు (BP ≥ 140/90 mmHg).",
          "శిశువు కదలికలు తగ్గడం లేదా తీవ్రమైన కడుపునొప్పి."
        ],
        protocolRef: `[MoHFW Maternal Health Protocol ${citation}]`,
        referralSmsText: `CareSphere ANC Schedule: 4 ANC visits, Red IFA 180d, Calcium 500mg bd. Sub-Centre: Chandrapuri. Protocol: [MoHFW ${citation}].`,
        referralWaText: `🤰 *CareSphere ANC Protocol*\n*Key Care:* Minimum 4 ANC visits, Red IFA (180 days with lemon water), Calcium 500mg bd (2h gap)\n*PMSMA:* 9th of every month\n*Protocol Citation:* [MoHFW ${citation}]`
      };
    } else if (lang === 'hi') {
      return {
        understanding: "गर्भावस्था के दौरान नियमित जांच माता और गर्भस्थ शिशु की वृद्धि, हीमोग्लोबिन स्तर और रक्तचाप की निगरानी के लिए अत्यंत आवश्यक है, जिससे जटिलताओं से बचाव होता है।",
        firstLineCare: [
          "न्यूनतम 4 एएनसी (ANC) जांच: 1st: 12 सप्ताह के भीतर; 2nd: 14-26 सप्ताह; 3rd: 28-34 सप्ताह; 4th: 36 सप्ताह से प्रसव तक। हर महीने की 9 तारीख को PMSMA दिवस पर विशेषज्ञ डॉक्टर से जांच कराएं।",
          "आयरन फोलिक एसिड (Red IFA): दूसरी तिमाही से रोजाना 1 लाल आईएफए गोली लगातार 180 दिनों तक लें। बेहतर अवशोषण के लिए नींबू पानी या आंवला रस के साथ लें।",
          "विशेष नियम: आईएफए की गोली कभी भी दूध, चाय या कैल्शियम के साथ न लें। कैल्शियम (500 मिग्रा दिन में 2 बार) और आईएफए के बीच कम से कम 2 घंटे का अंतर रखें।",
          "पेट के कीड़े की दवा: दूसरी तिमाही में एल्बेंडाजोल 400 मिग्रा की एक गोली अवश्य दें।"
        ],
        redFlags: [
          "योनि से रक्तस्राव (Bleeding) होना।",
          "तेज सिरदर्द, धुंधला दिखना या चेहरे-पैरों पर अचानक सूजन (रक्तचाप ≥ 140/90 mmHg)।",
          "गर्भ में शिशु की हलचल कम होना या तेज पेट दर्द।"
        ],
        protocolRef: `[MoHFW Maternal Health Protocol ${citation}]`,
        referralSmsText: `CareSphere ANC Schedule: 4 ANC visits, Red IFA 180d, Calcium 500mg bd. Sub-Centre: Chandrapuri. Protocol: [MoHFW ${citation}].`,
        referralWaText: `🤰 *केयरस्फेयर मातृ स्वास्थ्य प्रोटोकॉल*\n*प्रमुख दिशानिर्देश:* न्यूनतम 4 ANC जांच, लाल IFA (180 दिन नींबू पानी के साथ), कैल्शियम 500 मिग्रा (2 घंटे का अंतराल)\n*संदर्भ:* [MoHFW ${citation}]`
      };
    } else {
      return {
        understanding: "Antenatal care (ANC) systematically monitors maternal physiology, fetal well-being, maternal haemoglobin, and blood pressure to detect and prevent obstetric risks early.",
        firstLineCare: [
          "Minimum 4 ANC Visits: 1st within 12 weeks; 2nd between 14-26 weeks; 3rd between 28-34 weeks; 4th from 36 weeks to term. Bring every pregnant woman for specialist evaluation on the 9th of every month (PMSMA day).",
          "Iron & Folic Acid (Red IFA): One Red IFA tablet (100mg iron + 0.5mg folic acid) daily for 180 consecutive days starting from the second trimester. Advise ingestion with lemon water or citrus fluids to enhance absorption.",
          "Strict Administration Rule: Never take IFA with milk, tea, coffee, or calcium tablets. Maintain a mandatory 2-hour interval between Calcium (500mg twice daily from 14 weeks) and IFA.",
          "Deworming: Single dose Albendazole 400mg tablet in the second trimester (after 12 weeks)."
        ],
        redFlags: [
          "Any vaginal bleeding during pregnancy (requires immediate 108 referral).",
          "Severe persistent headache, blurred vision, or sudden facial oedema (BP ≥ 140/90 mmHg).",
          "Reduced fetal movements or severe epigastric/abdominal pain."
        ],
        protocolRef: `[MoHFW Maternal Health Protocol ${citation}]`,
        referralSmsText: `CareSphere ANC Protocol: 4 visits, Red IFA 180d, Calcium 500mg bd. Sub-Centre: Chandrapuri. Protocol: [MoHFW ${citation}].`,
        referralWaText: `🤰 *CareSphere ANC Protocol*\n*Clinical Schedule:* Minimum 4 ANC check-ups, Red IFA 180 days with citrus water, Calcium 500mg bd\n*PMSMA:* 9th of every month\n*Protocol Citation:* [MoHFW ${citation}]`
      };
    }
  }

  // -------------------------------------------------------------
  // 5. NEWBORN HBNC & LOW BIRTH WEIGHT (HBNC-1.x, HBNC-2.x)
  // -------------------------------------------------------------
  if (citation.startsWith('HBNC') || query.includes('hbnc') || query.includes('weight') || query.includes('bath') || query.includes('newborn') || query.includes('పుట్టిన')) {
    if (lang === 'te') {
      return {
        understanding: "నవజాత శిశువు యొక్క మొదటి 42 రోజులు అత్యంత కీలకమైనవి. ఈ సమయంలో వెచ్చదనం కాపాడటం (హైపోథెర్మియా నివారణ) మరియు సంక్రమణల నుండి రక్షణ కల్పించడం శిశు మరణాలను అరికడుతుంది.",
        firstLineCare: [
          "HBNC హోమ్ విజిట్స్ షెడ్యూల్: ఆసుపత్రి కాన్పు అయితే 6 సందర్శనలు (డే 3, 7, 14, 21, 28, 42); ఇంటి కాన్పు అయితే డే 1 తో కలిపి మొత్తం 7 సందర్శనలు.",
          "కంగారూ మదర్ కేర్ (KMC): తక్కువ బరువు ఉన్న శిశువులకు (< 2000g) తల్లి లేదా కుటుంబ సభ్యుల రొమ్ముపై చర్మంతో చర్మం తగిలేలా (skin-to-skin) వెచ్చని టోపీ మరియు సాక్స్‌లతో ఉంచాలి.",
          "స్నానం వాయిదా: సాధారణ శిశువుకు కనీసం 48 గంటల వరకు స్నానం చేయించవద్దు; 2000 గ్రాముల కంటే తక్కువ బరువున్న శిశువులకు బరువు 2000 గ్రాములకు చేరే వరకు స్నానం చేయించకూడదు (గోరువెచ్చని గుడ్డతో తుడవాలి).",
          "తల్లిపాలు: పుట్టిన 1 గంటలోపు ముర్రుపాలు తప్పక పట్టించాలి; ఎటువంటి బాహ్య ద్రవాలు (తేనె, నీరు) ఇవ్వకూడదు."
        ],
        redFlags: [
          "పుట్టినప్పుడు బరువు 1.8 కేజీల కంటే తక్కువ ఉండటం (తక్షణ SNCU రిఫరల్).",
          "శిశువు చల్లబడిపోవడం (పాదాలు చల్లగా ఉండటం / హైపోథెర్మియా).",
          "పాలు తాగలేకపోవడం, మగతగా ఉండటం లేదా ఒళ్ళు పచ్చబడటం (కామెర్లు అరచేతులు/అరికాళ్ళ వరకు వ్యాపించడం)."
        ],
        protocolRef: `[MoHFW HBNC Protocol ${citation}]`,
        referralSmsText: `CareSphere HBNC Newborn Protocol: KMC for LBW, delay bath till 2000g, 6-7 home visits. Sub-Centre: Chandrapuri. Protocol: [MoHFW ${citation}].`,
        referralWaText: `👶 *CareSphere HBNC Protocol*\n*Care Plan:* 6/7 home visits, KMC skin-to-skin, delay bathing till 2000g, immediate breastfeeding\n*Protocol Citation:* [MoHFW ${citation}]`
      };
    } else if (lang === 'hi') {
      return {
        understanding: "नवजात शिशु के पहले 42 दिन जीवन के लिए सबसे संवेदनशील होते हैं। शरीर का तापमान स्थिर रखना, संक्रमण से बचाव और समय पर वजन की निगरानी शिशु स्वास्थ्य की कुंजी है।",
        firstLineCare: [
          "गृह भ्रमण (HBNC) समयरेखा: संस्थागत प्रसव पर 6 visits (दिन 3, 7, 14, 21, 28, 42); गृह प्रसव पर दिन 1 सहित 7 visits.",
          "कंगारू मदर केयर (KMC): कम वजन (< 2000 ग्राम) वाले नवजात को मां या परिजन की छाती पर त्वचा से त्वचा सटाकर (skin-to-skin) गर्म टोपी व मोजों के साथ रखें।",
          "नहलाना टालें: सामान्य वजन वाले बच्चे को कम से कम 48 घंटे तक न नहलाएं; 2000 ग्राम से कम वजन वाले शिशु को वजन 2000 ग्राम होने तक बिल्कुल न नहलाएं (गुनगुने कपड़े से पोंछें)।",
          "स्तनपान: जन्म के 1 घंटे के भीतर केवल मां का पहला गाढ़ा दूध (कोलोस्ट्रम) पिलाएं; कोई भी घुट्टी या शहद न दें।"
        ],
        redFlags: [
          "जन्म वजन 1.8 किग्रा से कम होना (तत्काल एसएनसीयू/SNCU रेफरल)।",
          "शिशु का शरीर ठंडा पड़ना (हाइपोथर्मिया)।",
          "दूध न पीना, सुस्त होना या हथेलियों और तलवों तक पीलिया फैलना।"
        ],
        protocolRef: `[MoHFW HBNC Protocol ${citation}]`,
        referralSmsText: `CareSphere HBNC Protocol: KMC skin-to-skin, delay bath till 2000g, 6-7 visits. Sub-Centre: Chandrapuri. Protocol: [MoHFW ${citation}].`,
        referralWaText: `👶 *केयरस्फेयर नवजात HBNC प्रोटोकॉल*\n*देखभाल:* 6 या 7 गृह भ्रमण, केएमसी (त्वचा से त्वचा संपर्क), 2000 ग्राम तक नहलाना टालें\n*संदर्भ:* [MoHFW ${citation}]`
      };
    } else {
      return {
        understanding: "The neonatal period (first 42 days) carries the highest physiological vulnerability. Strict thermal protection, infection control, and optimal nutrition prevent neonatal hypothermia and sepsis.",
        firstLineCare: [
          "HBNC Visit Schedule: 6 visits for institutional births (Days 3, 7, 14, 21, 28, 42); 7 visits for home births (including Day 1).",
          "Kangaroo Mother Care (KMC): Provide continuous skin-to-skin contact between mother's chest and infant with warm cap and socks for all low birth weight babies (< 2000g).",
          "Delay Bathing: Delay first bath for at least 48 hours for normal infants; NEVER bathe low birth weight infants (< 2000g) until they reach 2000g (sponge with warm damp cloth).",
          "Exclusive Breastfeeding: Initiate within 1 hour of delivery; feed colostrum; strictly avoid prelacteal feeds (no honey, water, or animal milk)."
        ],
        redFlags: [
          "Birth weight < 1.8 kg (requires immediate SNCU referral via 108/102).",
          "Hypothermia (cold to touch, axillary temperature < 35.4°C).",
          "Inability to suck, lethargy, or deep jaundice extending to palms and soles."
        ],
        protocolRef: `[MoHFW HBNC Protocol ${citation}]`,
        referralSmsText: `CareSphere HBNC Protocol: KMC skin-to-skin, delay bath till 2000g, 6/7 home visits. Sub-Centre: Chandrapuri. Protocol: [MoHFW ${citation}].`,
        referralWaText: `👶 *CareSphere HBNC Protocol*\n*Care Schedule:* 6/7 visits, KMC skin-to-skin for LBW, delay bathing until 2000g, exclusive colostrum feeding\n*Protocol Citation:* [MoHFW ${citation}]`
      };
    }
  }

  // -------------------------------------------------------------
  // 6. DEFAULT GENERAL PROTOCOL (IMM, NCD, NUT, etc.)
  // -------------------------------------------------------------
  const excerptText = response.answer_en || response.answer;
  if (lang === 'te') {
    return {
      understanding: "ఇది జాతీయ ఆరోగ్య మిషన్ (NHM) మరియు అధికారిక ప్రభుత్వ ప్రోటోకాల్ మార్గదర్శకాల ప్రకారం ధృవీకరించబడిన ఫ్రంట్‌లైన్ క్లినికల్ సమాచారం.",
      firstLineCare: [
        response.recommended_action_te || response.recommended_action || "ప్రోటోకాల్ మార్గదర్శకాల ప్రకారం నిర్ణీత సమయంలో సేవలను అందించి కుటుంబానికి కౌన్సిలింగ్ ఇవ్వండి.",
        excerptText.slice(0, 200),
        "అన్ని వివరాలను MCP కార్డ్ మరియు సబ్-సెంటర్ విజిట్ రిజిస్టర్‌లో నమోదు చేయండి."
      ],
      redFlags: [
        "రోగి పరిస్థితి ఆకస్మికంగా క్షీణించడం లేదా సూచిక విలువలలో తీవ్ర వ్యత్యాసం.",
        "లక్షణాలు తగ్గకపోతే లేదా సంక్లిష్టతలు కనిపిస్తే తక్షణమే PHC కి రెఫర్ చేయండి."
      ],
      protocolRef: `[MoHFW Protocol ${citation}]`,
      referralSmsText: `CareSphere Sub-Centre Clinical Guidance: Protocol ${citation} verified. Actions logged for Chandrapuri Block.`,
      referralWaText: `📋 *CareSphere Clinical Protocol*\n*Section:* ${citation}\n*Guideline:* ${excerptText.slice(0, 160)}...\n*Reference:* [MoHFW ${citation}]`
    };
  } else if (lang === 'hi') {
    return {
      understanding: "यह राष्ट्रीय स्वास्थ्य मिशन (NHM) एवं भारत सरकार के आधिकारिक प्रोटोकॉल दिशानिर्देशों द्वारा सत्यापित फ्रंटलाइन जानकारी है।",
      firstLineCare: [
        response.recommended_action_hi || response.recommended_action || "आधिकारिक प्रोटोकॉल समयरेखा के अनुसार सेवाएं प्रदान करें और परिवार को परामर्श दें।",
        excerptText.slice(0, 200),
        "सभी जांच एवं दवा वितरण का विवरण एमसीपी कार्ड और गृह भ्रमण रजिस्टर में दर्ज करें।"
      ],
      redFlags: [
        "रोगी की स्थिति में अप्रत्याशित गिरावट या उच्च खतरे के लक्षण।",
        "दवा या परामर्श के बाद भी सुधार न होने पर प्राथमिक स्वास्थ्य केंद्र रेफर करें।"
      ],
      protocolRef: `[MoHFW Protocol ${citation}]`,
      referralSmsText: `CareSphere Sub-Centre Guidance: Protocol ${citation} applied. Sub-Centre: Chandrapuri.`,
      referralWaText: `📋 *केयरस्फेयर नैदानिक दिशानिर्देश*\n*प्रोटोकॉल खंड:* ${citation}\n*मानक विवरण:* ${excerptText.slice(0, 160)}...\n*संदर्भ:* [MoHFW ${citation}]`
    };
  } else {
    return {
      understanding: "This clinical guidance is directly grounded in official Ministry of Health and Family Welfare (MoHFW) and National Health Mission (NHM) frontline standard operating procedures.",
      firstLineCare: [
        response.recommended_action || "Adhere to official protocol timeline and counsel the family during the home visit.",
        excerptText.slice(0, 200),
        "Document all delivered health interventions, dates, and dosages in the MCP card and household register."
      ],
      redFlags: [
        "Unfavourable clinical response, severe illness, or emergent danger signs.",
        "Transfer immediately to Primary Health Centre (PHC) Medical Officer if baseline stability is not maintained."
      ],
      protocolRef: `[MoHFW Protocol ${citation}]`,
      referralSmsText: `CareSphere Sub-Centre Guidance: Protocol ${citation} applied for Chandrapuri Block.`,
      referralWaText: `📋 *CareSphere Frontline Protocol*\n*Section:* ${citation}\n*Standard Guidance:* ${excerptText.slice(0, 160)}...\n*Citation:* [MoHFW ${citation}]`
    };
  }
}
