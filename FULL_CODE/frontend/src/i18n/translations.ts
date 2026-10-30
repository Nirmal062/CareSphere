export type Language = 'en' | 'te' | 'hi';

export interface Translations {
  [key: string]: {
    en: string;
    te: string;
    hi: string;
  };
}

export const translations: Translations = {
  appTitle: {
    en: "CareSphere",
    te: "CareSphere (కేర్‌స్పియర్)",
    hi: "CareSphere (केयरस्फेयर)"
  },
  appSubtitle: {
    en: "Frontline Health-Worker Companion",
    te: "ఫ్రంట్‌లైన్ ఆరోగ్య సహాయకురాలు",
    hi: "फ्रंटलाइन स्वास्थ्य कार्यकर्ता साथी"
  },
  subcentreActiveBadge: {
    en: "Chandrapuri Block • Sub-Centre Active",
    te: "చంద్రపురి బ్లాక్ • సబ్-సెంటర్ యాక్టివ్",
    hi: "चंद्रापुरी ब्लॉक • उप-केंद्र सक्रिय"
  },
  sunlightModeToggle: {
    en: "Sunlight Mode",
    te: "ఎండ వెలుతురు మోడ్",
    hi: "धूप मोड (Sunlight)"
  },
  offlineActiveBadge: {
    en: "Offline Active",
    te: "ఆఫ్‌లైన్ క్రియాశీలం",
    hi: "ऑफलाइन सक्रिय"
  },
  understandingSymptomHeader: {
    en: "Understanding the Symptom & Presentation",
    te: "లక్షణాల ప్రాథమిక అవగాహన",
    hi: "लक्षण एवं नैदानिक स्थिति की समझ"
  },
  safeReliefCareHeader: {
    en: "Immediate Safe Relief & Permissible First-Line Care",
    te: "తక్షణ సురక్షిత ఉపశమనం & ఫ్రంట్‌లైన్ ప్రాథమిక సంరక్షణ",
    hi: "तत्काल सुरक्षित राहत एवं मानक प्राथमिक उपचार"
  },
  redFlagWarningHeader: {
    en: "Red-Flag Danger Signs (Immediate Hospital Escalation)",
    te: "ప్రమాద సంకేతాలు (తక్షణ ఆసుపత్రి ఎస్కలేషన్)",
    hi: "खतरे के लाल-झंडे संकेत (तत्काल अस्पताल रेफरल)"
  },
  verifiedProtocolRefHeader: {
    en: "Verified Protocol Reference & Citation",
    te: "ధృవీకరించబడిన అధికారిక ప్రోటోకాల్ సూచన",
    hi: "सत्यापित आधिकारिक प्रोटोकॉल संदर्भ"
  },
  careConnectTitle: {
    en: "Care Connect • Sub-Centre Support & Referral",
    te: "కేర్ కనెక్ట్ • సబ్-సెంటర్ మద్దతు & రిఫరల్",
    hi: "केयर कनेक्ट • उप-केंद्र समर्थन एवं रेफरल"
  },
  callMedicalOfficer: {
    en: "Call Medical Officer",
    te: "వైద్య అధికారికి కాల్ చేయండి",
    hi: "पीएचसी चिकित्सा अधिकारी को कॉल करें"
  },
  shareWhatsappBtn: {
    en: "Share via WhatsApp",
    te: "వాట్సాప్ ద్వారా పంపండి",
    hi: "व्हाट्सएप द्वारा साझा करें"
  },
  triggerSirenBtn: {
    en: "🚨 Trigger Sound Siren",
    te: "🚨 సౌండ్ సైరన్ మోగించండి",
    hi: "🚨 सायरन अलार्म बजाएं"
  },
  stopSirenBtn: {
    en: "Stop Siren Alarm",
    te: "సైరన్ ఆపండి",
    hi: "सायरन बंद करें"
  },
  smsReferralBtn: {
    en: "2G SMS Referral",
    te: "2G ఎస్ఎంఎస్ రిఫరల్",
    hi: "2G एसएमएस रेफरल"
  },
  call108DirectBtn: {
    en: "Call 108 Ambulance",
    te: "108 అంబులెన్స్ కాల్",
    hi: "108 एम्बुलेंस कॉल"
  },
  shakirSamAlert: {
    en: "RED TAPE (< 11.5 cm) — Severe Acute Malnutrition (SAM) • Priority 1 Immediate NRC Referral",
    te: "ఎరుపు టేప్ (< 11.5 సెం.మీ) — తీవ్ర పోషకాహార లోపం (SAM) • ప్రాధాన్యత 1 తక్షణ NRC రిఫరల్",
    hi: "लाल टेप (< 11.5 सेमी) — अति तीव्र कुपोषण (SAM) • प्राथमिकता 1 तत्काल NRC रेफरल"
  },
  shakirMamAlert: {
    en: "YELLOW TAPE (11.5 - 12.4 cm) — Moderate Acute Malnutrition (MAM) • Nutrition Counselling",
    te: "పసుపు టేప్ (11.5 - 12.4 సెం.మీ) — మధ్యస్థ పోషకాహార లోపం (MAM) • పోషణ కౌన్సిలింగ్",
    hi: "पीला टेप (11.5 - 12.4 सेमी) — मध्यम कुपोषण (MAM) • पोषण परामर्श"
  },
  shakirNormalAlert: {
    en: "GREEN TAPE (≥ 12.5 cm) — Normal Nutrition Status • Routine Growth Monitoring",
    te: "ఆకుపచ్చ టేప్ (≥ 12.5 సెం.మీ) — సాధారణ పోషకాహార స్థాయి • సాధారణ పర్యవేక్షణ",
    hi: "हरा टेप (≥ 12.5 सेमी) — सामान्य पोषण स्तर • नियमित निगरानी"
  },
  hbLevelLabel: {
    en: "Haemoglobin (Hb) Level (g/dL)",
    te: "రక్తంలో హిమోగ్లోబిన్ (Hb) స్థాయి (g/dL)",
    hi: "हीमोग्लोबिन (Hb) स्तर (g/dL)"
  },
  hbSevereAlert: {
    en: "Severe Anaemia (Hb < 7.0 g/dL) — Priority 1 Escalation Required",
    te: "తీవ్ర రక్తహీనత (Hb < 7.0 g/dL) — ప్రాధాన్యత 1 అత్యవసర రిఫరల్ అవసరం",
    hi: "गंभीर एनीमिया (Hb < 7.0 g/dL) — प्राथमिकता 1 तत्काल रेफरल आवश्यक"
  },
  immunizationStatusLabel: {
    en: "Active Immunization Status",
    te: "ప్రస్తుత టీకాల స్థితి",
    hi: "सक्रिय टीकाकरण स्थिति"
  },
  subcentreTag: {
    en: "Sub-Centre Health Decision Support",
    te: "సబ్-సెంటర్ ఆరోగ్య నిర్ణయ మద్దతు వేదిక",
    hi: "उप-केंद्र स्वास्थ्य निर्णय समर्थन प्रणाली"
  },
  offlineModeBadge: {
    en: "Local Edge Engine",
    te: "స్థానిక ప్రాసెసింగ్ క్రియాశీలం",
    hi: "स्थानीय एज इंजन सक्रिय"
  },
  connectivityStatus: {
    en: "Local Decision Engine Active",
    te: "స్థానిక నిర్ణయ ఇంజిన్ యాక్టివ్",
    hi: "स्थानीय निर्णय इंजन सक्रिय"
  },
  navDashboard: {
    en: "Today's Field Mission",
    te: "నేటి ఫీల్డ్ మిషన్",
    hi: "आज का फील्ड मिशन"
  },
  navAssistant: {
    en: "Protocol Assistant",
    te: "ప్రోటోకాల్ అసిస్టెంట్",
    hi: "प्रोटोकॉल सहायक"
  },
  navVisits: {
    en: "Daily Visit List",
    te: "రోజువారీ గృహ సందర్శనలు",
    hi: "दैनिक गृह भ्रमण सूची"
  },
  navProtocols: {
    en: "Protocol Guidelines",
    te: "అధికారిక మార్గదర్శకాలు",
    hi: "प्रोटोकॉल दिशानिर्देश"
  },
  navSafety: {
    en: "Safety & Audit",
    te: "భద్రత & ఆడిట్",
    hi: "सुरक्षा और ऑडिट"
  },
  dueBadge: {
    en: "346 Due",
    te: "346 బకాయిలు",
    hi: "346 देय"
  },
  docsBadge: {
    en: "9 Docs",
    te: "9 పత్రాలు",
    hi: "9 दस्तावेज"
  },
  headerCurrentDate: {
    en: "Live Device Time",
    te: "ప్రస్తుత పరికరం సమయం",
    hi: "डिवाइस का समय"
  },
  headerScheduleDate: {
    en: "Register Schedule Date",
    te: "రిజిస్టర్ షెడ్యూల్ తేదీ",
    hi: "रजिस्टर शेड्यूल तिथि"
  },
  escalationGate: {
    en: "Safety Gate",
    te: "భద్రతా గేట్",
    hi: "सुरक्षा गेट"
  },
  gatePass: {
    en: "ACTIVE (100% Recall)",
    te: "యాక్టివ్ (100% రికాల్)",
    hi: "सक्रिय (100% रिकॉल)"
  },
  cpuActive: {
    en: "Active (Local Engine)",
    te: "యాక్టివ్ (స్థానిక ఇంజిన్)",
    hi: "सक्रिय (लोकल इंजन)"
  },
  emergencyContactsTitle: {
    en: "Emergency Referral Hotlines",
    te: "అత్యవసర రిఫరల్ ఫోన్ నంబర్లు",
    hi: "आपातकालीन रेफरल हेल्पलाइन"
  },
  ambulance108: {
    en: "108 Ambulance",
    te: "108 అంబులెన్స్",
    hi: "108 एम्बुलेंस"
  },
  ambulance108Sub: {
    en: "Immediate Medical Emergency",
    te: "తక్షణ అత్యవసర వైద్య రవాణా",
    hi: "तत्काल चिकित्सा आपातकाल"
  },
  jssk102: {
    en: "102 JSSK Transport",
    te: "102 ఉచిత రవాణా (JSSK)",
    hi: "102 जननी शिशु सुरक्षा (JSSK)"
  },
  jssk102Sub: {
    en: "Free for Pregnant Women & Sick Infants",
    te: "గర్భిణులు & అనారోగ్య శిశువులకు ఉచితం",
    hi: "गर्भवती और नवजात शिशुओं के लिए मुफ्त परिवहन"
  },
  districtHospitalSNCU: {
    en: "District Hospital SNCU Referral",
    te: "జిల్లా ఆసుపత్రి SNCU రిఫరల్",
    hi: "District Hospital SNCU Referral"
  },
  infoNoticeTitle: {
    en: "Clinical Decision Support & Data Notice",
    te: "క్లినికల్ నిర్ణయ మద్దతు & డేటా సమాచారం",
    hi: "Clinical Decision Support & Data Notice"
  },
  compactDisclaimer: {
    en: "CareSphere is a clinical decision-support companion designed to assist qualified Auxiliary Nurse Midwives (ANMs) and ASHA workers. All household registers, patient IDs, and visit records in this demonstration environment are synthetic. CareSphere assists but never replaces certified clinical judgment. In all life-threatening emergencies, immediate referral must be initiated.",
    te: "CareSphere అనేది అర్హత కలిగిన ఏఎన్‌ఎంలు మరియు ఆశా కార్యకర్తలకు సహాయపడే క్లినికల్ నిర్ణయ-మద్దతు వేదిక. ఈ ప్రదర్శనలోని అన్ని గృహాల రిజిస్టర్లు, రోగి ఐడీలు మరియు సందర్శన రికార్డులు సింథటిక్ (కల్పితం). ఇది క్లినికల్ నిర్ణయాలకు మార్గదర్శనం చేస్తుంది కానీ వైద్యుల స్థానాన్ని భర్తీ చేయదు. ప్రాణాంతక అత్యవసర పరిస్థితుల్లో తక్షణమే రిఫర్ చేయాలి.",
    hi: "CareSphere is a clinical decision-support companion designed to assist qualified Auxiliary Nurse Midwives (ANMs) and ASHA workers. All household registers, patient IDs, and visit records in this demonstration environment are synthetic. CareSphere assists but never replaces certified clinical judgment. In all life-threatening emergencies, immediate referral must be initiated."
  },
  missionHeroTitle: {
    en: "Today's Field Mission",
    te: "నేటి ఫీల్డ్ మిషన్",
    hi: "Today's Field Mission"
  },
  missionHeroDesc: {
    en: "Prioritized maternal, infant, and household health visits scheduled for Chandrapuri Block sub-centre.",
    te: "చంద్రపురి బ్లాక్ సబ్-సెంటర్ పరిధిలోని తల్లీపిల్లల మరియు గృహ ఆరోగ్య ప్రాధాన్యతా సందర్శనలు.",
    hi: "Prioritized maternal, infant, and household health visits scheduled for Chandrapuri Block sub-centre."
  },
  progressTitle: {
    en: "Shift Completion Progress",
    te: "నేటి సేవల పూర్తి పురోగతి",
    hi: "Shift Completion Progress"
  },
  completedCount: {
    en: "Completed",
    te: "పూర్తయినవి",
    hi: "Completed"
  },
  pendingCount: {
    en: "Pending",
    te: "మిగిలి ఉన్నవి",
    hi: "Pending"
  },
  markDoneBtn: {
    en: "Mark Done",
    te: "పూర్తయింది",
    hi: "पूर्ण चिह्नित करें"
  },
  markPendingBtn: {
    en: "Undo",
    te: "రద్దు చేయి",
    hi: "Undo"
  },
  completedBadge: {
    en: "Done Today",
    te: "ఈరోజు పూర్తయింది",
    hi: "Done Today"
  },
  missionP1Focus: {
    en: "Immediate Priority 1 Actions Required",
    te: "తక్షణ ప్రాధాన్యత 1 అత్యవసర చర్యలు",
    hi: "Immediate Priority 1 Actions Required"
  },
  p1ActionRequired: {
    en: "28 High-Risk cases require home visits or hospital escalation today",
    te: "ఈరోజు 28 అత్యవసర గృహ సందర్శనలు లేదా ఆసుపత్రి రిఫరల్స్ అవసరం",
    hi: "28 High-Risk cases require home visits or hospital escalation today"
  },
  p1Title: {
    en: "Priority 1 High-Risk",
    te: "ప్రాధాన్యత 1: తీవ్ర ప్రమాదం",
    hi: "प्राथमिकता 1: अति-गंभीर"
  },
  p1Subtitle: {
    en: "High-Risk Due Today",
    te: "అత్యవసర సందర్శనలు",
    hi: "High-Risk Due Today"
  },
  p1Desc: {
    en: "Severe anaemia (<7g/dL), BP >=140/90, newborns <=42d, severe acute malnutrition",
    te: "తీవ్ర రక్తహీనత (<7g/dL), అధిక బీపీ (>=140/90), నవజాత శిశువులు (<=42 రోజులు), తీవ్ర పోషకాహార లోపం",
    hi: "Severe anaemia (<7g/dL), BP >=140/90, newborns <=42d, severe acute malnutrition"
  },
  p2Title: {
    en: "Priority 2 Routine Due",
    te: "ప్రాధాన్యత 2: సాధారణ గడువు",
    hi: "प्राथमिकता 2: नियमित देय"
  },
  p2Subtitle: {
    en: "Routine Due Today",
    te: "ఈరోజు చేయాల్సిన సాధారణ పనులు",
    hi: "Routine Due Today"
  },
  p2Desc: {
    en: "Overdue vaccinations, routine ANC checkups, and standard monthly NCD/MUAC followups",
    te: "ఓవర్‌డ్యూ టీకాలు, సాధారణ ANC తనిఖీలు, నెలవారీ NCD/MUAC ఫాలోఅప్‌లు",
    hi: "Overdue vaccinations, routine ANC checkups, and standard monthly NCD/MUAC followups"
  },
  p3Title: {
    en: "Priority 3 Upcoming",
    te: "ప్రాధాన్యత 3: రాబోయేవి",
    hi: "प्राथमिकता 3: आगामी"
  },
  p3Subtitle: {
    en: "Upcoming (Next 6 Days)",
    te: "వచ్చే 6 రోజులలో గడువు",
    hi: "Upcoming (Next 6 Days)"
  },
  p3Desc: {
    en: "Immunizations & visits maturing between 27 Oct 2026 and 01 Nov 2026",
    te: "27 అక్టోబర్ 2026 నుండి 01 నవంబర్ 2026 మధ్య గడువు తేదీ సమీపించే సేవలు",
    hi: "Immunizations & visits maturing between 27 Oct 2026 and 01 Nov 2026"
  },
  benchmarkTitle: {
    en: "Protocol Engine Accuracy",
    te: "ప్రోటోకాల్ ఇంజిన్ ఖచ్చితత్వం",
    hi: "Protocol Engine Accuracy"
  },
  benchmarkScore: {
    en: "99.56% Clinical Precision",
    te: "99.56% క్లినికల్ ఖచ్చితత్వం",
    hi: "99.56% Clinical Precision"
  },
  benchmarkDesc: {
    en: "100% Emergency Recall, 0 False Alarms, 100% Citation Grounding",
    te: "100% అత్యవసర గుర్తింపు, 0 తప్పుడు అలారాలు, 100% ఖచ్చితమైన కొటేషన్లు",
    hi: "100% Emergency Recall, 0 False Alarms, 100% Citation Grounding"
  },
  quickAction1Title: {
    en: "Health Protocol Assistant",
    te: "ఆరోగ్య ప్రోటోకాల్ అసిస్టెంట్",
    hi: "Health Protocol Assistant"
  },
  quickAction1Desc: {
    en: "Ask questions by voice or text in Telugu or English. Instant protocol grounding with exact citations.",
    te: "వాయిస్ లేదా టైపింగ్ ద్వారా తెలుగు లేదా ఇంగ్లీషులో ప్రశ్నలు అడగండి. ఖచ్చితమైన కొటేషన్లతో సమాధానాలు.",
    hi: "Ask questions by voice or text in Telugu or English. Instant protocol grounding with exact citations."
  },
  quickAction1Btn: {
    en: "Open Voice & Text Assistant",
    te: "అసిస్టెంట్‌ను తెరవండి",
    hi: "Open Voice & Text Assistant"
  },
  quickAction2Title: {
    en: "Prioritized Household Register",
    te: "ప్రాధాన్యతా గృహ రిజిస్టర్",
    hi: "Prioritized Household Register"
  },
  quickAction2Desc: {
    en: "View and filter 346 due services across Chandrapuri Block by ASHA, village, and risk category.",
    te: "గ్రామం, ఆశా కార్యకర్త మరియు క్లినికల్ రిస్క్ ప్రకారం 346 బకాయి సేవలను పరిశీలించండి.",
    hi: "View and filter 346 due services across Chandrapuri Block by ASHA, village, and risk category."
  },
  quickAction2Btn: {
    en: "Open 346 Due Visits",
    te: "346 సందర్శనలను చూడండి",
    hi: "Open 346 Due Visits"
  },
  quickAction3Title: {
    en: "Clinical Knowledge Base",
    te: "క్లినికల్ నాలెడ్జ్ బేస్",
    hi: "Clinical Knowledge Base"
  },
  quickAction3Desc: {
    en: "Browse 107 indexed leaf sections covering ANC, IMM, HBNC, NUT, NCD, CHD, and ESC.",
    te: "ANC, IMM, HBNC, NUT, NCD, CHD మరియు ESC విభాగాలలోని 107 సెక్షన్లను పరిశీలించండి.",
    hi: "Browse 107 indexed leaf sections covering ANC, IMM, HBNC, NUT, NCD, CHD, and ESC."
  },
  quickAction3Btn: {
    en: "Explore 9 Guidelines",
    te: "9 మార్గదర్శకాలను చూడండి",
    hi: "Explore 9 Guidelines"
  },
  ashaRosterTitle: {
    en: "Field ASHA Worker Roster",
    te: "ఫీల్డ్ ఆశా కార్యకర్తల జాబితా",
    hi: "Field ASHA Worker Roster"
  },
  fiveAshas: {
    en: "5 Active ASHAs",
    te: "5 మంది క్రియాశీల ఆశాలు",
    hi: "5 Active ASHAs"
  },
  assistantTitle: {
    en: "Protocol Decision Assistant",
    te: "ప్రోటోకాల్ నిర్ణయ సహాయకుడు",
    hi: "स्वास्थ्या सहायक — प्रोटोकॉल निर्णय प्रणाली"
  },
  assistantIntro: {
    en: "Ask clinical questions regarding Antenatal Care, UIP Immunization intervals, Newborn Care (HBNC), Malnutrition (MUAC), or Chronic Diseases. Speak aloud or type in Telugu script, Roman Telugu, or English. CareSphere prioritizes emergency screening first, refuses out-of-scope medication advice, and grounds answers in official protocols.",
    te: "గర్భధారణ సంరక్షణ (ANC), పిల్లల టీకాల షెడ్యూల్ (UIP), నవజాత శిశు సంరక్షణ (HBNC), పోషకాహార లోపం (MUAC) లేదా దీర్ఘకాలిక వ్యాధుల గురించి మాట్లాడి లేదా టైప్ చేసి అడగండి. అత్యవసర ప్రమాద సంకేతాలను తక్షణమే గుర్తిస్తుంది, అనుమతి లేని మందుల మోతాదులను తిరస్కరిస్తుంది మరియు అధికారిక మార్గదర్శకాల ఆధారంగా సమాధానాలు ఇస్తుంది.",
    hi: "राष्ट्रीय स्वास्थ्य मिशन (NHM) प्रोटोकॉल पर आधारित निर्णय साथी। मातृत्व, बाल टीकाकरण, कुपोषण, दस्त और गैर-संचारी रोगों (NCD) पर सटीक सलाह पाएं।"
  },
  supportedLangs: {
    en: "Supported: Voice & Text • Telugu (తెలుగు) • Roman Telugu • English",
    te: "మద్దతు: వాయిస్ & టైపింగ్ • తెలుగు • రోమన్ తెలుగు • ఇంగ్లీష్",
    hi: "अंग्रेजी • తెలుగు • हिन्दी (ऑफलाइन वॉयस व टेक्स्ट)"
  },
  sampleQuestionsTitle: {
    en: "Quick Clinical Inquiries (Click to run):",
    te: "శీఘ్ర క్లినికల్ ప్రశ్నలు (పరీక్షించడానికి క్లిక్ చేయండి):",
    hi: "Quick Clinical Inquiries (Click to run):"
  },
  inputPlaceholder: {
    en: "Ask a question about healthcare protocols (e.g., 4th ANC checkup schedule, newborn danger signs, fIPV vaccine interval)...",
    te: "ఆరోగ్య ప్రోటోకాల్స్ గురించి ప్రశ్న అడగండి (ఉదా: 4వ ANC షెడ్యూల్, నవజాత శిశువు ప్రమాద సూచనలు)...",
    hi: "लक्षण, आयु, दवा या प्रोटोकॉल पूछें (उदा. 3rd ANC कब कराना है? दस्त में ओआरएस की मात्रा?)..."
  },
  searchProtocolBtn: {
    en: "Ask Protocol",
    te: "ప్రోటోకాల్ అడగండి",
    hi: "प्रोटोकॉल खोजें"
  },
  searchingBtn: {
    en: "Consulting Protocol Engine...",
    te: "ప్రోటోకాల్ పరిశీలిస్తోంది...",
    hi: "प्रोटोकॉल खोज रहे हैं..."
  },
  pressEnterNotice: {
    en: "Press Enter to ask (Shift+Enter for a new line) • Microphone available for voice dictation",
    te: "శోధించడానికి Enter నొక్కండి (కొత్త లైన్ కోసం Shift+Enter) • వాయిస్ కోసం మైక్రోఫోన్ ఉపయోగించండి",
    hi: "पूछने के लिए Enter दबाएं"
  },
  navHistory: {
    en: "Visit History",
    te: "సందర్శనల చరిత్ర",
    hi: "Visit History"
  },
  historyTitle: {
    en: "Completed Household Visits History",
    te: "పూర్తయిన గృహ సందర్శనల చరిత్ర",
    hi: "Completed Household Visits History"
  },
  historySubtitle: {
    en: "Verified audit trail of completed field visits in Chandrapuri Block",
    te: "చంద్రపురి బ్లాక్‌లో పూర్తయిన ఫీల్డ్ సందర్శనల ధృవీకరించబడిన రికార్డు",
    hi: "Verified audit trail of completed field visits in Chandrapuri Block"
  },
  backToVisits: {
    en: "Back to Daily Visits",
    te: "రోజువారీ సందర్శనలకు తిరిగి వెళ్లండి",
    hi: "Back to Daily Visits"
  },
  completedAt: {
    en: "Completed Time",
    te: "పూర్తయిన సమయం",
    hi: "Completed Time"
  },
  undoVisit: {
    en: "Reopen Visit",
    te: "మళ్లీ సందర్శించండి (రద్దు)",
    hi: "Reopen Visit"
  },
  noCompletedVisits: {
    en: "No visits marked as completed yet",
    te: "ఇంకా ఏ సందర్శనలు పూర్తి కాలేదు",
    hi: "No visits marked as completed yet"
  },
  noCompletedVisitsDesc: {
    en: "When you mark visits as completed in Daily Visits, they will be archived here with full patient details.",
    te: "రోజువారీ సందర్శనల పట్టికలో సందర్శనను పూర్తి చేసినప్పుడు, అవి రోగి వివరాలతో సహా ఇక్కడ కనిపిస్తాయి.",
    hi: "When you mark visits as completed in Daily Visits, they will be archived here with full patient details."
  },
  goToVisits: {
    en: "Go to Daily Visits",
    te: "రోజువారీ సందర్శనలకు వెళ్లండి",
    hi: "Go to Daily Visits"
  },
  viewHistoryBtn: {
    en: "View History",
    te: "చరిత్రను చూడండి",
    hi: "View History"
  },
  visitCompletedToast: {
    en: "Visit marked as completed successfully",
    te: "సందర్శన విజయవంతంగా పూర్తయింది",
    hi: "Visit marked as completed successfully"
  },
  visitReopenedToast: {
    en: "Visit reopened and moved back to active Daily Visits",
    te: "సందర్శన మళ్లీ యాక్టివ్ జాబితాకు తరలించబడింది",
    hi: "Visit reopened and moved back to active Daily Visits"
  },
  voiceStartBtn: {
    en: "Start Voice",
    te: "వాయిస్ ప్రారంభించండి",
    hi: "माइक द्वारा पूछें"
  },
  voiceListening: {
    en: "Listening... Speak your question now",
    te: "వింటోంది... ఇప్పుడు మీ ప్రశ్న అడగండి",
    hi: "सुन रहा है... बोलिए"
  },
  voiceStopBtn: {
    en: "Stop Recording",
    te: "రికార్డింగ్ ఆపండి",
    hi: "बोलना रोकें"
  },
  voiceAutoReadOn: {
    en: "Auto-Speak: ON",
    te: "వాయిస్ సమాధానం: ఆన్",
    hi: "ऑटो-रीड: चालू"
  },
  voiceAutoReadOff: {
    en: "Auto-Speak: OFF",
    te: "వాయిస్ సమాధానం: ఆఫ్",
    hi: "ऑटो-रीड: बंद"
  },
  readAloudBtn: {
    en: "Listen Aloud",
    te: "వాయిస్‌లో వినండి",
    hi: "सुनें (वॉयस)"
  },
  stopAudioBtn: {
    en: "Stop Audio",
    te: "ఆడియో ఆపండి",
    hi: "रोकें"
  },
  voiceNotSupported: {
    en: "Voice speech recognition is not supported in this browser. You can type queries normally.",
    te: "ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ అందుబాటులో లేదు. మీరు టైప్ చేసి అడగవచ్చు.",
    hi: "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है"
  },
  voicePermissionDenied: {
    en: "Microphone permission was denied. Please allow microphone access in browser settings.",
    te: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి బ్రౌజర్ సెట్టింగ్స్‌లో మైక్రోఫోన్ అనుమతించండి.",
    hi: "Microphone permission was denied. Please allow microphone access in browser settings."
  },
  voiceNetworkNotice: {
    en: "Offline Field Mode Active: Cloud speech recognition is unavailable without internet. Use 1-tap clinical voice prompts below or type your question.",
    te: "ఆఫ్‌లైన్ ఫీల్డ్ మోడ్ క్రియాశీలం: ఇంటర్నెట్ లేనప్పుడు క్లౌడ్ వాయిస్ అందుబాటులో ఉండదు. క్రింది శీఘ్ర ప్రశ్నలను నొక్కండి లేదా టైప్ చేయండి.",
    hi: "Offline Field Mode Active: Cloud speech recognition is unavailable without internet. Use 1-tap clinical voice prompts below or type your question."
  },
  offlineQuickPrompts: {
    en: "Offline Clinical Voice Shortcuts (1-Tap)",
    te: "ఆఫ్‌లైన్ క్లినికల్ శీఘ్ర ప్రశ్నలు (సింగిల్ ట్యాప్)",
    hi: "1-टैप ऑफलाइन वॉयस शॉर्टकट"
  },
  micLanguage: {
    en: "Voice Language:",
    te: "వాయిస్ భాష:",
    hi: "माइक भाषा"
  },
  listenEnglishBtn: {
    en: "Listen in English",
    te: "ఆంగ్లంలో వినండి",
    hi: "अंग्रेजी में सुनें"
  },
  teluguVoiceMissing: {
    en: "Telugu TTS voice is not installed in your browser/OS. The complete Telugu answer is shown above. Click 'Listen in English' to hear audio guidance.",
    te: "మీ బ్రౌజర్‌లో తెలుగు వాయిస్ అందుబాటులో లేదు. పూర్తి తెలుగు సమాధానం పైన చూడవచ్చు. ఆడియో కోసం 'ఆంగ్లంలో వినండి' ఉపయోగించండి.",
    hi: "Telugu TTS voice is not installed in your browser/OS. The complete Telugu answer is shown above. Click 'Listen in English' to hear audio guidance."
  },
  audioPlaying: {
    en: "Playing audio...",
    te: "ఆడియో ప్లే అవుతోంది...",
    hi: "Playing audio..."
  },
  speechTestBtn: {
    en: "Test Speaker",
    te: "స్పీకర్ పరీక్ష",
    hi: "ऑडियो टेस्ट"
  },
  submitSpokenBtn: {
    en: "Submit Spoken Question",
    te: "ఈ ప్రశ్నను పంపండి",
    hi: "पूछें"
  },
  dangerSignDetected: {
    en: "DANGER SIGN DETECTED — IMMEDIATE ESCALATION REQUIRED",
    te: "ప్రమాద సంకేతం గుర్తించబడింది — తక్షణమే అత్యవసర రిఫరల్ చేయండి",
    hi: "गंभीर खतरे का संकेत — तत्काल रेफर करें"
  },
  outOfScopeRefusal: {
    en: "Scope Advisory — Redirect to Medical Officer (SCP-1.2)",
    te: "సేవా పరిధి దాటినది — మెడికల్ ఆఫీసర్‌కి రిఫర్ చేయండి (SCP-1.2)",
    hi: "प्रोटोकॉल कार्यक्षेत्र से बाहर — चिकित्सा अधिकारी को रेफर करें"
  },
  groundedAnswerTitle: {
    en: "Protocol-Grounded Answer",
    te: "ప్రోటోకాల్ ఆధారిత ఖచ్చితమైన సమాధానం",
    hi: "सत्यापित फ्रंटलाइन प्रोटोकॉल निर्देश"
  },
  recommendedActionHeader: {
    en: "Recommended Clinical Action",
    te: "సూచించిన క్లినికల్ చర్య",
    hi: "अनुशंसित कार्य निर्देश:"
  },
  urgencyHeader: {
    en: "Urgency Level",
    te: "అత్యవసర స్థాయి",
    hi: "Urgency Level"
  },
  officialCitationHeader: {
    en: "Protocol Citation",
    te: "అధికారిక ప్రోటోకాల్ కొటేషన్",
    hi: "Protocol Citation"
  },
  sourceExcerptHeader: {
    en: "View Official Source Excerpt",
    te: "అధికారిక మార్గదర్శక పాఠాన్ని చూడండి",
    hi: "आधिकारिक स्रोत संदर्भ व उद्धरण"
  },
  toggleLanguageBtn: {
    en: "తెలుగులో సమాధానం చూడండి (View in Telugu)",
    te: "View Answer in English (ఆంగ్లంలో చూడండి)",
    hi: "తెలుగులో సమాధానం చూడండి (View in Telugu)"
  },
  copyAnswerBtn: {
    en: "Copy Answer",
    te: "సమాధానాన్ని కాపీ చేయండి",
    hi: "कॉपी करें"
  },
  copiedSuccess: {
    en: "Copied to clipboard",
    te: "క్లిప్‌బోర్డ్‌కి కాపీ చేయబడింది",
    hi: "Copied to clipboard"
  },
  visitsTitle: {
    en: "Daily Prioritized Visit Schedule",
    te: "రోజువారీ ప్రాధాన్యతా గృహ సందర్శన షెడ్యూల్",
    hi: "Daily Prioritized Visit Schedule"
  },
  visitsSubtitle: {
    en: "Evaluated for 2026-10-26 across 500 households in Chandrapuri Block.",
    te: "చంద్రపురి బ్లాక్‌లోని 500 గృహాలలో 2026-10-26 నాటికి లెక్కించబడిన షెడ్యూల్.",
    hi: "Evaluated for 2026-10-26 across 500 households in Chandrapuri Block."
  },
  totalDueLabel: {
    en: "Total Due Items:",
    te: "మొత్తం బకాయి సేవలు:",
    hi: "Total Due Items:"
  },
  allVisitsFilter: {
    en: "All Visits",
    te: "అన్ని సందర్శనలు",
    hi: "सभी भ्रमण"
  },
  searchPlaceholder: {
    en: "Search by member ID (e.g. M-0VOH6K5B), patient name, or village...",
    te: "సభ్యుని ID (ఉదా. M-0VOH6K5B), రోగి పేరు లేదా గ్రామం ద్వారా వెతకండి...",
    hi: "नाम, सदस्य आईडी, गाँव या सेवा खोजें..."
  },
  filterBtn: {
    en: "Filter",
    te: "ఫిల్టర్ చేయండి",
    hi: "Filter"
  },
  colPriority: {
    en: "Priority",
    te: "ప్రాధాన్యత",
    hi: "Priority"
  },
  colPatient: {
    en: "Member / Patient",
    te: "సభ్యుడు / రోగి",
    hi: "Member / Patient"
  },
  colDueService: {
    en: "Due Service",
    te: "చేయాల్సిన సేవ",
    hi: "Due Service"
  },
  colCategory: {
    en: "Category",
    te: "విభాగం",
    hi: "Category"
  },
  colVillageHouse: {
    en: "Village & House",
    te: "గ్రామం & ఇంటి నంబర్",
    hi: "Village & House"
  },
  colStatus: {
    en: "Status",
    te: "స్థితి",
    hi: "Status"
  },
  colActions: {
    en: "Actions",
    te: "చర్యలు",
    hi: "Actions"
  },
  inspectBtn: {
    en: "Inspect",
    te: "వివరాలు",
    hi: "विवरण देखें"
  },
  modalTitle: {
    en: "Household Member Profile",
    te: "గృహ సభ్యుని పూర్తి వివరాలు",
    hi: "Household Member Profile"
  },
  relationLabel: {
    en: "Relation to Head:",
    te: "కుటుంబ యజమానితో సంబంధం:",
    hi: "Relation to Head:"
  },
  headLabel: {
    en: "Head of Household:",
    te: "కుటుంబ పెద్ద పేరు:",
    hi: "Head of Household:"
  },
  genderLabel: {
    en: "Gender",
    te: "లింగం",
    hi: "लिंग"
  },
  dobLabel: {
    en: "Date of Birth",
    te: "పుట్టిన తేదీ",
    hi: "जन्म तिथि"
  },
  assignedAsha: {
    en: "Assigned ASHA:",
    te: "కేటాయించిన ఆశా:",
    hi: "Assigned ASHA:"
  },
  householdIdLabel: {
    en: "Household ID:",
    te: "గృహ ID:",
    hi: "Household ID:"
  },
  clinicalHistoryHeader: {
    en: "Clinical Register History",
    te: "క్లినికల్ రిజిస్టర్ చరిత్ర",
    hi: "Clinical Register History"
  },
  explainablePriorityTitle: {
    en: "Clinical Priority Justification",
    te: "క్లినికల్ ప్రాధాన్యత సమర్థన & కారణం",
    hi: "Clinical Priority Justification"
  },
  ruleTriggerLabel: {
    en: "Trigger Condition:",
    te: "ట్రిగ్గర్ షరతు:",
    hi: "ट्रिगर शर्त:"
  },
  protocolRuleRef: {
    en: "Official Protocol Rule:",
    te: "అధికారిక ప్రోటోకాల్ నిబంధన:",
    hi: "आधिकारिक प्रोटोकॉल नियम:"
  },
  closeBtn: {
    en: "Close",
    te: "మూసివేయి",
    hi: "बंद करें"
  },
  auditTitle: {
    en: "Clinical Safety Architecture & Verification",
    te: "క్లినికల్ భద్రతా విధానం & ధృవీకరణ",
    hi: "नैदानिक सुरक्षा वास्तुकला और ऑडिट"
  },
  auditDesc: {
    en: "CareSphere implements a deterministic three-tier safety gate ensuring instant escalation of maternal-child danger signs and strict refusal of out-of-scope medication advice.",
    te: "CareSphere మూడు అంచెల భద్రతా విధానాన్ని అమలు చేస్తుంది. ఇది తల్లీపిల్లల ప్రమాద సంకేతాలను తక్షణమే రిఫర్ చేస్తుంది మరియు మందుల ప్రిస్క్రిప్షన్లను తిరస్కరిస్తుంది.",
    hi: "CareSphere एक त्रि-स्तरीय सुरक्षा गेट लागू करता है जो मातृ-शिशु खतरे के संकेतों का तत्काल रेफरल और अधिकार-क्षेत्र से बाहर की दवाओं का सख्त इनकार सुनिश्चित करता है।"
  },
  threeTierTitle: {
    en: "Three-Tier Deterministic Safety Architecture",
    te: "మూడు అంచెల నిర్ధారిత భద్రతా విధానం",
    hi: "त्रि-स्तरीय निर्धारणात्मक सुरक्षा वास्तुकला"
  },
  tier1Name: {
    en: "Tier 1: Emergency Pre-Screening (ESC)",
    te: "1వ అంచె: అత్యవసర ప్రమాద సంకేతాల గుర్తింపు (ESC)",
    hi: "स्तर 1: आपातकालीन पूर्व-जांच (ESC)"
  },
  tier2Name: {
    en: "Tier 2: Scope Refusal (SCP-1.2)",
    te: "2వ అంచె: సేవా పరిమితి తిరస్కరణ (SCP-1.2)",
    hi: "स्तर 2: कार्यक्षेत्र सीमा इनकार (SCP-1.2)"
  },
  tier3Name: {
    en: "Tier 3: Grounded Protocol Engine",
    te: "3వ అంచె: ప్రోటోకాల్ ఆధారిత సమాచార సేకరణ",
    hi: "स्तर 3: आधारित प्रोटोकॉल इंजन"
  },
  protocolsHeading: {
    en: "Official Clinical Protocol Guidelines",
    te: "అధికారిక క్లినికల్ ప్రోటోకాల్ మార్గదర్శకాలు",
    hi: "राष्ट्रीय स्वास्थ्य मिशन आधिकारिक दिशानिर्देश"
  },
  protocolsSubheading: {
    en: "CareSphere is grounded in 9 official GoI guidelines across 107 leaf sections.",
    te: "భారత ప్రభుత్వం జారీ చేసిన 9 అధికారిక మార్గదర్శకాలలోని 107 లీఫ్ సెక్షన్లపై ఆధారపడి ఉంది.",
    hi: "भारत सरकार के 9 अधिकृत प्रोटोकॉल दस्तावेजों के 107 सेक्शंस।"
  },
  searchProtocolsPlaceholder: {
    en: "Search protocol sections, drugs, or clinical criteria...",
    te: "సెక్షన్లు, మందులు లేదా మార్గదర్శకాలతో వెతకండి...",
    hi: "प्रोटोकॉल सेक्शंस, दवाएं या नियम खोजें..."
  },
  targetTimelineHeader: {
    en: "Target Timeline & Eligibility Criteria",
    te: "లక్ష్య కాలక్రమం & అర్హత ప్రమాణాలు",
    hi: "लक्ष्य समयरेखा और पात्रता मानदंड"
  },
  stepByStepActionHeader: {
    en: "Step-by-Step Frontline Clinical Protocol",
    te: "దశలవారీ ఫ్రంట్‌లైన్ క్లినికల్ ప్రోటోకాల్",
    hi: "चरणबद्ध फ्रंटलाइन नैदानिक प्रोटोकॉल"
  },
  mandatoryTestsHeader: {
    en: "Mandatory Tests & Clinical Measurements",
    te: "తప్పనిసరి పరీక్షలు & క్లినికల్ కొలతలు",
    hi: "अनिवार्य जांच और परीक्षण"
  },
  medicationsSupplementsHeader: {
    en: "Prescribed Medications & Supplements",
    te: "సూచించిన మందులు & సప్లిమెంట్లు",
    hi: "निर्धारित दवाएं और पूरक आहार"
  },
  dangerSignsHeader: {
    en: "Danger Signs & Immediate Referral Thresholds",
    te: "ప్రమాద సంకేతాలు & తక్షణ రెఫరల్ పరిమితులు",
    hi: "खतरे के लक्षण और तत्काल रेफरल सीमा"
  },
  officialSourcesHeader: {
    en: "Official Government of India Citations & References",
    te: "భారత ప్రభుత్వ అధికారిక మూలాలు & సూచనలు",
    hi: "आधिकारिक सरकारी स्रोत और संदर्भ"
  },
  completeVisitModalTitle: {
    en: "Complete Visit & Clinical Summary",
    te: "గృహ సందర్శన పూర్తి & క్లినికల్ సారాంశం",
    hi: "गृह भ्रमण पूर्णता व नैदानिक सारांश"
  },
  completeVisitSubtitle: {
    en: "Record observations, dispensed medicines, and schedule the next follow-up.",
    te: "పరిశీలనలు, అందించిన మందులు మరియు తదుపరి ఫాలో-అప్ వివరాలను నమోదు చేయండి.",
    hi: "भ्रमण के दौरान दिए गए परामर्श, दवाएं और आगामी योजना दर्ज करें।"
  },
  clinicalNotesLabel: {
    en: "Clinical Observations / Field Notes (Optional):",
    te: "క్లినికల్ పరిశీలనలు / ఫీల్డ్ నోట్స్ (ఐచ్ఛికం):",
    hi: "नैदानिक टिप्पणियां / फील्ड नोट्स (वैकल्पिक):"
  },
  clinicalNotesPlaceholder: {
    en: "Enter patient symptoms, observed conditions, advice given, or special remarks...",
    te: "రోగి లక్షణాలు, సూచించిన సలహాలు లేదా ప్రత్యేక గమనికలను రాయండి...",
    hi: "रोगी की स्थिति, मापे गए लक्षण, दिए गए परामर्श या विशेष टिप्पणियां लिखें..."
  },
  dispensedMedsLabel: {
    en: "Medicines & Essential Supplies Dispensed:",
    te: "పంపిణీ చేసిన మందులు & అవసరమైన సామాగ్రి:",
    hi: "वितरित दवाएं व आवश्यक स्वास्थ्य सामग्री:"
  },
  nextFollowUpDateLabel: {
    en: "Next Follow-Up Visit Date (Optional):",
    te: "తదుపరి ఫాలో-అప్ సందర్శన తేదీ (ఐచ్ఛికం):",
    hi: "अगली फॉलो-अप भ्रमण तिथि (वैकल्पिक):"
  },
  saveAndMarkDoneBtn: {
    en: "Save & Mark as Done",
    te: "సేవ్ చేసి పూర్తయినట్లు గుర్తించండి",
    hi: "सुरक्षित करें व पूर्ण करें"
  },
  skipNotesAndMarkDoneBtn: {
    en: "Skip Notes & Mark Done",
    te: "నోట్స్ లేకుండా పూర్తయినట్లు గుర్తించండి",
    hi: "बिना नोट्स के पूर्ण करें"
  },
  cancelBtn: {
    en: "Cancel",
    te: "రద్దు చేయండి",
    hi: "रद्द करें"
  },
  registerPatientTitle: {
    en: "Register New Patient / Household Member",
    te: "కొత్త రోగి / కుటుంబ సభ్యుడిని నమోదు చేయండి",
    hi: "नया रोगी / परिवार सदस्य पंजीकृत करें"
  },
  registerPatientSubtitle: {
    en: "Add to Chandrapuri Register on-the-fly and generate immediate visit entry.",
    te: "చంద్రపురి రిజిస్టర్‌లో వెంటనే చేర్చి రోజువారీ సందర్శనల జాబితాకు జోడించండి.",
    hi: "चंद्रपुरी उप-केंद्र रजिस्टर में तुरंत नया सदस्य जोड़ें और भ्रमण सूची में शामिल करें।"
  },
  fullNameLabel: {
    en: "Full Name",
    te: "పూర్తి పేరు",
    hi: "पूरा नाम"
  },
  genderFemale: {
    en: "Female",
    te: "స్త్రీ",
    hi: "महिला"
  },
  genderMale: {
    en: "Male",
    te: "పురుషుడు",
    hi: "पुरुष"
  },
  genderOther: {
    en: "Other",
    te: "ఇతర",
    hi: "अन्य"
  },
  ageLabel: {
    en: "Age (Years)",
    te: "వయస్సు (సంవత్సరాలు)",
    hi: "आयु (वर्ष)"
  },
  villageLabel: {
    en: "Village / Hamlet",
    te: "గ్రామం / నివాసం",
    hi: "गाँव / टोला"
  },
  houseNoLabel: {
    en: "House Number",
    te: "ఇంటి నంబరు",
    hi: "घर संख्या (House No)"
  },
  healthCategoryLabel: {
    en: "Health Track / Category",
    te: "ఆరోగ్య విభాగం / కేటగిరీ",
    hi: "स्वास्थ्य श्रेणी / ट्रैक"
  },
  catPregnant: {
    en: "Pregnant Woman (ANC)",
    te: "గర్భిణీ స్త్రీ (ANC)",
    hi: "गर्भवती महिला (ANC)"
  },
  catInfant: {
    en: "Newborn / Infant (0-1 yr)",
    te: "నవజాత శిశువు (0-1 సం)",
    hi: "नवजात / शिशु (0-1 वर्ष)"
  },
  catChild: {
    en: "Child (1-5 yrs / Nutrition)",
    te: "చిన్నపిల్లలు (1-5 సం / పోషణ)",
    hi: "बच्चा (1-5 वर्ष / पोषण)"
  },
  catAdultNCD: {
    en: "Adult NCD (BP / Sugar)",
    te: "వయోజన దీర్ఘకాలిక వ్యాధులు (BP / షుగర్)",
    hi: "वयस्क (उच्च रक्तचाप / मधुमेह)"
  },
  catGeneral: {
    en: "General Household Care",
    te: "సాధారణ గృహ సంరక్షణ",
    hi: "अन्य सामान्य फॉलो-अप"
  },
  lmpDateLabel: {
    en: "Last Menstrual Period (LMP)",
    te: "చివరి రుతుక్రమ తేదీ (LMP)",
    hi: "अंतिम माहवारी तिथि (LMP)"
  },
  eddAutoCalcLabel: {
    en: "Expected Date of Delivery (EDD - 280 Days)",
    te: "ప్రసవ అంచనా తేదీ (EDD - 280 రోజులు)",
    hi: "प्रसव की संभावित तिथि (EDD - 280 दिन)"
  },
  birthWeightLabel: {
    en: "Birth Weight (kg)",
    te: "పుట్టినప్పుడు బరువు (కేజీలు)",
    hi: "जन्म के समय वजन (किग्रा)"
  },
  muacLabel: {
    en: "Mid-Upper Arm Circumference - MUAC (cm)",
    te: "చేతి మధ్య చుట్టుకొలత - MUAC (సెం.మీ)",
    hi: "मध्य बांह की परिधि - MUAC (सेमी)"
  },
  systolicBpLabel: {
    en: "Systolic BP (Upper mmHg)",
    te: "సిస్టోలిక్ BP (పై కొలత mmHg)",
    hi: "सिस्टोलिक BP (ऊपर का mmHg)"
  },
  diastolicBpLabel: {
    en: "Diastolic BP (Lower mmHg)",
    te: "డయాస్టోలిక్ BP (క్రింది కొలత mmHg)",
    hi: "डायस्टोलिक BP (नीचे का mmHg)"
  },
  bloodSugarLabel: {
    en: "Random Blood Sugar (mg/dL)",
    te: "రక్తంలో చక్కెర శాతం (mg/dL)",
    hi: "रैंडम ब्लड शुगर (mg/dL)"
  },
  symptomsLabel: {
    en: "Symptoms & Problem Description",
    te: "లక్షణాలు & సమస్య వివరణ",
    hi: "पहचाने गए लक्षण / समस्या का विवरण"
  },
  symptomsPlaceholder: {
    en: "Describe identified symptoms or reasons for visit...",
    te: "రోగి వివరించిన లక్షణాలు లేదా సందర్శన కారణాన్ని రాయండి...",
    hi: "रोगी द्वारा बताए गए मुख्य लक्षण या स्वास्थ्य शिकायतें लिखें..."
  },
  assignedPriorityLabel: {
    en: "Auto-Assigned Clinical Priority:",
    te: "స్వయంచాలకంగా నిర్ణయించబడిన ప్రాధాన్యత:",
    hi: "स्वचालित निर्धारित प्राथमिकता:"
  },
  p1HighRiskReason: {
    en: "Priority 1 (Critical): High-risk criteria detected (Severe HTN / MUAC < 11.5cm / Danger signs)",
    te: "P1 తీవ్ర ప్రమాదం: ప్రమాద లక్షణాలు లేదా తీవ్ర రక్తపోటు / పోషకాహార లోపం గుర్తించబడింది",
    hi: "P1 अति-गंभीर: खतरे के लक्षण या उच्च रक्तचाप / गंभीर कुपोषण उपस्थित"
  },
  p2RoutineReason: {
    en: "Priority 2 (Routine): Scheduled protocol due under standard timeline",
    te: "P2 సాధారణ గడువు: ప్రామాణిక ప్రోటోకాల్ ప్రకారం సాధారణ సేవా గడువు",
    hi: "P2 नियमित: मानक प्रोटोकॉल समयरेखा के अनुसार देय"
  },
  p3UpcomingReason: {
    en: "Priority 3 (Upcoming): Routine observation and upcoming health follow-up",
    te: "P3 రాబోయేవి: సాధారణ పర్యవేక్షణ మరియు రాబోయే ఫాలో-అప్",
    hi: "P3 आगामी: नियमित फॉलो-अप व निगरानी"
  },
  registerAndAddBtn: {
    en: "Register & Add to Daily Visits",
    te: "నమోదు చేసి రోజువారీ జాబితాకు చేర్చండి",
    hi: "रजिस्टर करें व भ्रमण सूची में जोड़ें"
  },
  detailedBreakdownTitle: {
    en: "Detailed Protocol Breakdown & Clinical Guide",
    te: "విస్తృత క్లినికల్ ప్రోటోకాల్ విశ్లేషణ",
    hi: "विस्तृत नैदानिक प्रोटोकॉल विवरण"
  },
  keyMetricsAndCutoffs: {
    en: "Key Metrics & Clinical Cut-offs:",
    te: "కీలక కొలతలు & క్లినికల్ పరిమితులు:",
    hi: "प्रमुख नैदानिक सीमाएं और कट-ऑफ मान:"
  },
  drugAdministrationRules: {
    en: "Drug Administration Rules & Cautions:",
    te: "మందుల వినియోగ నిబంధనలు & జాగ్రత్తలు:",
    hi: "दवा देने के नियम और सावधानियां:"
  },
  frontlineActionSteps: {
    en: "ASHA / ANM Frontline Action Steps:",
    te: "ఆశా / ఏఎన్‌ఎం ఫ్రంట్‌లైన్ కార్యాచరణ చర్యలు:",
    hi: "आशा कार्यकर्ता के लिए फील्ड कार्य निर्देश:"
  },
  escalationCriteriaTitle: {
    en: "Referral & Escalation Triggers:",
    te: "రిఫరల్ & అత్యవసర మార్గదర్శకాలు:",
    hi: "रेफरल और आपातकालीन चेतावनी स्तर:"
  },
};

export function getTranslation(key: string, lang: Language): string {
  const item = translations[key];
  if (!item) return key;
  return item[lang] || item['en'] || key;
}
