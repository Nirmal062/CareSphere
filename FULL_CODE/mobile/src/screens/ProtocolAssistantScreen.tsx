import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Share,
  Platform
} from 'react-native';
import * as Speech from 'expo-speech';
import * as SMS from 'expo-sms';
import { Audio } from 'expo-av';
import {
  Search,
  Mic,
  Send,
  PhoneCall,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Share2,
  BellRing,
  Sparkles,
  MessageSquare,
  CloudDownload
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { evaluateProtocolQuery } from '../engine/protocolEngine';
import { getStructuredClinicalGuidance } from '../engine/clinicalGuidance';
import { AskResponse } from '../types';
import { FirstTimeSetupModal } from '../components/FirstTimeSetupModal';
import { UpdateManagerModal } from '../components/UpdateManagerModal';


const OFFLINE_CLINICAL_PROMPTS = [
  {
    category: 'Maternal (ANC)',
    icon: '🤰',
    en: '3rd ANC check-up kab hota hai?',
    te: 'గర్భిణీకి 3వ ANC పరీక్ష ఎప్పుడు చేయాలి?',
    hi: 'तीसरी एएनसी (ANC) जांच कब करानी होती है?'
  },
  {
    category: 'Emergency (ESC)',
    icon: '🚨',
    en: 'Bleeding in third trimester of pregnancy',
    te: 'నెలలు నిండిన గర్భిణీకి తీవ్ర రక్తస్రావం',
    hi: 'गर्भावस्था की तीसरी तिमाही में तेज रक्तस्राव'
  },
  {
    category: 'Emergency (ESC)',
    icon: '🚨',
    en: 'Baby lethargic and not sucking milk',
    te: 'శిశువు పాలు తాగడం లేదు మరియు మగతగా ఉంది',
    hi: 'शिशु सुस्त है और दूध नहीं पी रहा है'
  },
  {
    category: 'Child Care (CHD)',
    icon: '💧',
    en: 'Child diarrhoea ORS and zinc dosage',
    te: 'పిల్లలలో విరేచనాలు - ORS మరియు జింక్ మోతాదు',
    hi: 'बच्चे में दस्त — ओआरएस और जिंक की खुराक'
  },
  {
    category: 'Newborn (HBNC)',
    icon: '👶',
    en: 'Baby birth weight 1.6 kg HBNC schedule',
    te: 'పుట్టినప్పుడు బరువు 1.6 కేజీలు ఉన్న శిశువు సంరక్షణ',
    hi: 'नवजात शिशु का जन्म वजन 1.6 किग्रा HBNC देखभाल'
  },
  {
    category: 'Scope (SCP)',
    icon: '🛡️',
    en: 'Can ASHA prescribe Amoxicillin antibiotic?',
    te: 'ఆశా కార్యకర్త యాంటీబయాటిక్ మందులు రాయవచ్చా?',
    hi: 'क्या आशा कार्यकर्ता एमोक्सिसिलिन एंटीबायोटिक लिख सकती है?'
  }
];

export const ProtocolAssistantScreen: React.FC = () => {
  const { language, t, isSunlightMode } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sirenSound, setSirenSound] = useState<Audio.Sound | null>(null);
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);


  const structuredGuidance = useMemo(() => {
    if (!response) return null;
    return getStructuredClinicalGuidance(response, language);
  }, [response, language]);

  // Handle Query Submission (Offline < 5ms)
  const handleAsk = (textToAsk?: string) => {
    const q = (textToAsk || query).trim();
    if (!q) return;

    setLoading(true);
    stopSpeaking();
    stopSiren();

    const result = evaluateProtocolQuery(q, language);
    setResponse(result);
    setLoading(false);

    // Auto-scroll to top to present answer
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);

    // Auto-play siren if emergency
    if (result.is_emergency) {
      playSiren();
    }
  };

  // Offline TTS Integration using expo-speech
  const speakGuidance = () => {
    if (!response || !structuredGuidance) return;
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    const speechText = `${structuredGuidance.understanding}. Safe first line care: ${structuredGuidance.firstLineCare.join('. ')}. Red flags to watch: ${structuredGuidance.redFlags.join('. ')}.`;
    const speechLang = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

    setIsSpeaking(true);
    Speech.speak(speechText, {
      language: speechLang,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  // Offline Siren using expo-av
  const playSiren = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true
      });
      // Sound siren using built-in alert tone
      setIsSirenActive(true);
    } catch (e) {
      console.warn('Audio setup error:', e);
    }
  };

  const stopSiren = async () => {
    if (sirenSound) {
      try {
        await sirenSound.stopAsync();
        await sirenSound.unloadAsync();
      } catch {}
      setSirenSound(null);
    }
    setIsSirenActive(false);
  };

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopSiren();
    };
  }, []);

  // 1-Tap 2G SMS Dispatch using expo-sms
  const handleSendSms = async () => {
    if (!structuredGuidance) return;
    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      await SMS.sendSMSAsync(
        ['108'],
        structuredGuidance.referralSmsText
      );
    } else {
      Linking.openURL(`sms:108?body=${encodeURIComponent(structuredGuidance.referralSmsText)}`);
    }
  };

  // Share via WhatsApp / Native Share
  const handleShareWhatsApp = async () => {
    if (!structuredGuidance) return;
    try {
      await Share.share({
        message: structuredGuidance.referralWaText
      });
    } catch {}
  };

  return (
    <>
      <ScrollView
      ref={scrollViewRef}
      style={[styles.container, isSunlightMode && styles.sunlightContainer]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Top Clinical Header Tag */}
      <View style={styles.topBadgeRow}>
        <View style={styles.badgePill}>
          <View style={styles.dotPulse} />
          <Text style={styles.badgeText}>{t('subcentreBadge')}</Text>
        </View>
        <TouchableOpacity
          style={styles.offlineBtnPill}
          onPress={() => setShowUpdateModal(true)}
          accessibilityLabel="Open Protocol Sync Manager"
        >
          <CloudDownload size={13} color="#047857" style={{ marginRight: 4 }} />
          <Text style={styles.offlinePill}>{t('offlineActive')} (v1.0.4)</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP SECTION: ANSWER / TRIAGE RESULT CARD                   */}
      {/* ------------------------------------------------------------- */}
      {response && structuredGuidance && (
        <View style={[
          styles.answerCard,
          response.is_emergency ? styles.emergencyBorder : response.is_out_of_scope ? styles.refusalBorder : styles.groundedBorder
        ]}>
          {/* Header row with status & citation */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              {response.is_emergency ? (
                <AlertTriangle size={22} color="#dc2626" />
              ) : response.is_out_of_scope ? (
                <ShieldAlert size={22} color="#d97706" />
              ) : (
                <CheckCircle2 size={22} color="#047857" />
              )}
              <Text style={[
                styles.cardStatusText,
                response.is_emergency ? styles.emergencyText : response.is_out_of_scope ? styles.refusalText : styles.groundedText
              ]}>
                {response.is_emergency ? 'EMERGENCY DANGER SIGN' : response.is_out_of_scope ? 'SCOPE DEFLECTION' : 'VERIFIED PROTOCOL'}
              </Text>
            </View>

            <View style={styles.citationBadge}>
              <Text style={styles.citationBadgeText}>{response.citations[0]}</Text>
            </View>
          </View>

          {/* Audio & Action Buttons */}
          <View style={styles.audioRow}>
            <TouchableOpacity
              onPress={speakGuidance}
              style={[styles.audioBtn, isSpeaking && styles.audioBtnActive]}
            >
              {isSpeaking ? <VolumeX size={16} color="#047857" /> : <Volume2 size={16} color="#047857" />}
              <Text style={styles.audioBtnText}>{isSpeaking ? 'Stop Audio' : 'Listen Aloud'}</Text>
            </TouchableOpacity>

            {response.is_emergency && (
              <TouchableOpacity
                onPress={isSirenActive ? stopSiren : playSiren}
                style={[styles.sirenBtn, isSirenActive && styles.sirenBtnActive]}
              >
                <BellRing size={16} color="#fff" />
                <Text style={styles.sirenBtnText}>{isSirenActive ? 'Stop Siren' : 'Alert Siren'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 1. Understanding the Symptom */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>1. UNDERSTANDING CLINICAL PRESENTATION</Text>
            <Text style={styles.sectionBody}>{structuredGuidance.understanding}</Text>
          </View>

          {/* 2. Immediate Safe Relief & First-Line Care */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>2. IMMEDIATE SAFE FIRST-LINE CARE</Text>
            {structuredGuidance.firstLineCare.map((step, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <View style={[styles.bulletDot, response.is_emergency && { backgroundColor: '#dc2626' }]} />
                <Text style={styles.bulletText}>{step}</Text>
              </View>
            ))}
          </View>

          {/* 3. Red-Flag Danger Signs Checklist */}
          <View style={[styles.sectionBlock, styles.redFlagBlock]}>
            <Text style={styles.redFlagTitle}>3. RED-FLAG DANGER SIGNS (HOSPITAL ESCALATION)</Text>
            {structuredGuidance.redFlags.map((rf, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.redFlagText}>{rf}</Text>
              </View>
            ))}
          </View>

          {/* 4. Verified Protocol Reference */}
          <View style={styles.protocolRefBlock}>
            <Text style={styles.protocolRefLabel}>Official Citation:</Text>
            <Text style={styles.protocolRefText}>{structuredGuidance.protocolRef}</Text>
          </View>

          {/* Care Connect 1-Tap Actions */}
          <View style={styles.careConnectContainer}>
            <Text style={styles.careConnectHeading}>Care Connect • Frontline Emergency Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                onPress={() => Linking.openURL('tel:108')}
                style={styles.call108Btn}
              >
                <PhoneCall size={18} color="#fff" />
                <Text style={styles.btnBoldText}>Call 108 Ambulance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendSms}
                style={styles.smsBtn}
              >
                <MessageSquare size={18} color="#fff" />
                <Text style={styles.btnBoldText}>2G SMS Referral</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShareWhatsApp}
                style={styles.shareBtn}
              >
                <Share2 size={18} color="#fff" />
                <Text style={styles.btnBoldText}>Share Referral</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MIDDLE SECTION: SEARCH INPUT WITH MIC & SEND BUTTON        */}
      {/* ------------------------------------------------------------- */}
      <View style={styles.searchConsole}>
        <View style={styles.inputContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            style={styles.textInput}
            multiline
          />
        </View>

        <View style={styles.consoleBtnRow}>
          <TouchableOpacity
            onPress={() => handleAsk(query)}
            style={styles.micBtn}
          >
            <Mic size={20} color="#047857" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleAsk(query)}
            disabled={loading || !query.trim()}
            style={[styles.sendBtn, (!query.trim() || loading) && styles.sendBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Send size={18} color="#fff" />
                <Text style={styles.sendBtnText}>Ask Guidance</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM SECTION: 1-TAP OFFLINE CLINICAL SHORTCUTS          */}
      {/* ------------------------------------------------------------- */}
      <View style={styles.shortcutsCard}>
        <View style={styles.shortcutsHeader}>
          <Sparkles size={18} color="#047857" />
          <Text style={styles.shortcutsTitle}>1-TAP OFFLINE CLINICAL SHORTCUTS</Text>
        </View>
        <Text style={styles.shortcutsSubtitle}>Instant offline protocol guidance for frontline ASHA rounds</Text>

        <View style={styles.shortcutsGrid}>
          {OFFLINE_CLINICAL_PROMPTS.map((item, idx) => {
            const promptText = language === 'hi' ? item.hi : language === 'te' ? item.te : item.en;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setQuery(promptText);
                  handleAsk(promptText);
                }}
                style={styles.shortcutChip}
              >
                <Text style={styles.shortcutIcon}>{item.icon}</Text>
                <View style={styles.shortcutTextWrap}>
                  <Text style={styles.shortcutCategory}>{item.category}</Text>
                  <Text style={styles.shortcutBody} numberOfLines={2}>{promptText}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>

    <FirstTimeSetupModal
      visible={showSetupModal}
      onClose={() => setShowSetupModal(false)}
    />
    <UpdateManagerModal
      visible={showUpdateModal}
      onClose={() => setShowUpdateModal(false)}
    />
  </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  offlineBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD'
  },

  sunlightContainer: {
    backgroundColor: '#ffffff'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  topBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  dotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#047857',
    marginRight: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46'
  },
  offlinePill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  answerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3
  },
  groundedBorder: {
    borderColor: '#047857'
  },
  emergencyBorder: {
    borderColor: '#dc2626',
    backgroundColor: '#FFF5F5'
  },
  refusalBorder: {
    borderColor: '#d97706',
    backgroundColor: '#FFFBEB'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardStatusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  groundedText: {
    color: '#047857'
  },
  emergencyText: {
    color: '#dc2626'
  },
  refusalText: {
    color: '#d97706'
  },
  citationBadge: {
    backgroundColor: '#047857',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  citationBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  audioRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  audioBtnActive: {
    backgroundColor: '#D1FAE5'
  },
  audioBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857'
  },
  sirenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  sirenBtnActive: {
    backgroundColor: '#991b1b'
  },
  sirenBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff'
  },
  sectionBlock: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 4,
    letterSpacing: 0.5
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#1E293B',
    fontWeight: '500'
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#047857',
    marginTop: 7
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
    fontWeight: '500'
  },
  redFlagBlock: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5'
  },
  redFlagTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    marginBottom: 6
  },
  warningIcon: {
    fontSize: 13
  },
  redFlagText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#7F1D1D',
    lineHeight: 17
  },
  protocolRefBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14
  },
  protocolRefLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  protocolRefText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857'
  },
  careConnectContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12
  },
  careConnectHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  call108Btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44
  },
  smsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#047857',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44
  },
  btnBoldText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  },
  searchConsole: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    marginBottom: 10
  },
  searchIcon: {
    marginTop: 2,
    marginRight: 8
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    minHeight: 40,
    textAlignVertical: 'top'
  },
  consoleBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#047857',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 44
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8'
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700'
  },
  shortcutsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  shortcutsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  shortcutsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857'
  },
  shortcutsSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12
  },
  shortcutsGrid: {
    gap: 8
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  shortcutIcon: {
    fontSize: 20,
    marginRight: 10
  },
  shortcutTextWrap: {
    flex: 1
  },
  shortcutCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 2
  },
  shortcutBody: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B'
  }
});
