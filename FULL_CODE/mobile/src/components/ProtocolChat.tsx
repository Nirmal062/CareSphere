import React, { useState, useRef, useMemo } from 'react';
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
  Platform,
  Alert
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
  CloudDownload,
  Sun,
  SunMedium
} from 'lucide-react-native';
import { useLanguage } from '../context/LanguageContext';
import { evaluateProtocolQuery } from '../engine/protocolEngine';
import { getStructuredClinicalGuidance } from '../engine/clinicalGuidance';
import { AskResponse } from '../types';
import { SetupModal } from './SetupModal';

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

export const ProtocolChat: React.FC = () => {
  const { language, setLanguage, t, isSunlightMode, toggleSunlightMode } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const structuredGuidance = useMemo(() => {
    if (!response) return null;
    return getStructuredClinicalGuidance(
      response.cited_section_id || 'ANC-1.1',
      response.answer,
      language
    );
  }, [response, language]);

  const handleAsk = async (textToAsk?: string) => {
    const q = (textToAsk || query).trim();
    if (!q) return;

    setLoading(true);
    setResponse(null);
    stopSpeaking();

    try {
      // Offline local evaluation
      const res = await evaluateProtocolQuery(q);
      setResponse(res);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      Alert.alert('Protocol Error', err.message || 'Error evaluating protocol query');
    } finally {
      setLoading(false);
    }
  };

  const handleCall108 = () => {
    Linking.openURL('tel:108').catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate emergency call to 108.');
    });
  };

  const handleSend2GSMS = async () => {
    if (!response) return;
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS Unavailable', '2G SMS referral service is not supported on this device.');
      return;
    }

    const message = `[CARESPHERE EMERGENCY REFERRAL]\nVillage: Chandrapuri Block\nCondition: ${response.condition || 'Emergency'}\nSection: ${response.cited_section_id}\nProtocol: Immediate transfer via 108 to District Hospital FRU.`;
    await SMS.sendSMSAsync(['108', '102'], message);
  };

  const handleShareReferral = async () => {
    if (!response) return;
    try {
      await Share.share({
        title: 'CareSphere Clinical Referral Note',
        message: `CareSphere Clinical Action:\nStatus: ${response.status}\nProtocol Citation: ${response.cited_section_id}\n\nClinical Guidance:\n${response.answer}\n\nAction Required:\n${response.action_required}`
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else if (response) {
      const langCode = language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      setIsSpeaking(true);
      Speech.speak(response.answer, {
        language: langCode,
        pitch: 1.0,
        rate: 0.95,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  return (
    <View style={[styles.container, isSunlightMode && styles.sunlightContainer]}>
      {/* Top Clinical Header */}
      <View style={styles.topHeader}>
        <View style={styles.appBadge}>
          <Text style={styles.appName}>CareSphere</Text>
          <View style={styles.subCentreBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.subCentreText}>Chandrapuri Sub-Centre</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Sunlight Mode Toggle */}
          <TouchableOpacity onPress={toggleSunlightMode} style={styles.iconBtn}>
            {isSunlightMode ? <Sun size={18} color="#D97706" /> : <SunMedium size={18} color="#64748B" />}
          </TouchableOpacity>

          {/* Sync Button */}
          <TouchableOpacity onPress={() => setShowSetupModal(true)} style={styles.syncBtn}>
            <CloudDownload size={14} color="#047857" />
            <Text style={styles.syncBtnText}>Sync</Text>
          </TouchableOpacity>

          {/* Trilingual Selector */}
          <View style={styles.langSelector}>
            {(['en', 'te', 'hi'] as const).map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, language === l && styles.langBtnActive]}
                onPress={() => setLanguage(l)}
              >
                <Text style={[styles.langBtnText, language === l && styles.langBtnTextActive]}>
                  {l === 'en' ? 'EN' : l === 'te' ? 'తె' : 'हि'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Response Card (if available) */}
        {response ? (
          <View style={[
            styles.responseCard,
            response.status === 'EMERGENCY' && styles.cardEmergency,
            response.status === 'OUT_OF_SCOPE' && styles.cardOutOfScope
          ]}>
            {/* Status Header */}
            <View style={styles.cardHeader}>
              <View style={[
                styles.statusBadge,
                response.status === 'EMERGENCY' && styles.statusBadgeEmergency,
                response.status === 'OUT_OF_SCOPE' && styles.statusBadgeOutOfScope
              ]}>
                {response.status === 'EMERGENCY' ? (
                  <ShieldAlert size={14} color="#DC2626" />
                ) : response.status === 'OUT_OF_SCOPE' ? (
                  <AlertTriangle size={14} color="#D97706" />
                ) : (
                  <CheckCircle2 size={14} color="#047857" />
                )}
                <Text style={[
                  styles.statusBadgeText,
                  response.status === 'EMERGENCY' && styles.statusTextEmergency,
                  response.status === 'OUT_OF_SCOPE' && styles.statusTextOutOfScope
                ]}>
                  {response.status === 'EMERGENCY'
                    ? 'EMERGENCY ESCALATION'
                    : response.status === 'OUT_OF_SCOPE'
                    ? 'OUT-OF-SCOPE REFUSAL'
                    : 'GROUNDED PROTOCOL ANSWER'}
                </Text>
              </View>

              <View style={styles.cardHeaderActions}>
                <TouchableOpacity onPress={handleToggleSpeech} style={styles.audioBtn}>
                  {isSpeaking ? <VolumeX size={16} color="#DC2626" /> : <Volume2 size={16} color="#047857" />}
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShareReferral} style={styles.audioBtn}>
                  <Share2 size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Protocol Leaf Citation */}
            <View style={styles.citationRow}>
              <Text style={styles.citationLabel}>OFFICIAL PROTOCOL CITATION:</Text>
              <View style={styles.citationBadge}>
                <Text style={styles.citationText}>{response.cited_section_id}</Text>
              </View>
            </View>

            {/* Answer Text */}
            <Text style={styles.answerText}>{response.answer}</Text>

            {/* Action Required Callout */}
            <View style={[
              styles.actionBox,
              response.status === 'EMERGENCY' && styles.actionBoxEmergency
            ]}>
              <Text style={styles.actionTitle}>
                {response.status === 'EMERGENCY' ? '🚨 IMMEDIATE ACTION REQUIRED' : 'CLINICAL ACTION REQUIRED'}
              </Text>
              <Text style={styles.actionText}>{response.action_required}</Text>
            </View>

            {/* Emergency Action Buttons */}
            {response.status === 'EMERGENCY' && (
              <View style={styles.emergencyActionsRow}>
                <TouchableOpacity style={styles.call108Btn} onPress={handleCall108}>
                  <PhoneCall size={16} color="#FFFFFF" />
                  <Text style={styles.call108Text}>1-Tap Call 108</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.smsBtn} onPress={handleSend2GSMS}>
                  <Send size={16} color="#B91C1C" />
                  <Text style={styles.smsText}>2G SMS Referral</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeIconBox}>
              <Sparkles size={24} color="#047857" />
            </View>
            <Text style={styles.welcomeTitle}>Grounded Healthcare CDSS</Text>
            <Text style={styles.welcomeSubtitle}>
              Strictly dataset-grounded protocol assistance across 107 leaf sections. Ask questions in English, Telugu, or Hindi.
            </Text>
          </View>
        )}

        {/* Quick Danger Chips */}
        <Text style={styles.quickLabel}>QUICK CLINICAL SCENARIOS</Text>
        <View style={styles.chipsGrid}>
          {OFFLINE_CLINICAL_PROMPTS.map((item, idx) => {
            const label = language === 'te' ? item.te : language === 'hi' ? item.hi : item.en;
            return (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => {
                  setQuery(label);
                  handleAsk(label);
                }}
              >
                <Text style={styles.chipIcon}>{item.icon}</Text>
                <Text style={styles.chipText} numberOfLines={2}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Query Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Ask maternal, child, or emergency question..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleAsk()}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !query.trim() && styles.sendBtnDisabled]}
          onPress={() => handleAsk()}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={17} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Setup Modal */}
      <SetupModal
        visible={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  sunlightContainer: {
    backgroundColor: '#FEF9C3'
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  appBadge: {
    flex: 1
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  subCentreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981'
  },
  subCentreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  iconBtn: {
    padding: 6
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857'
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2
  },
  langBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  langBtnActive: {
    backgroundColor: '#047857'
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  langBtnTextActive: {
    color: '#FFFFFF'
  },
  chatScroll: {
    flex: 1
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 16
  },
  welcomeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  welcomeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 }
    })
  },
  cardEmergency: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5'
  },
  cardOutOfScope: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  audioBtn: {
    padding: 4
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  statusBadgeEmergency: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  statusBadgeOutOfScope: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857'
  },
  statusTextEmergency: {
    color: '#DC2626'
  },
  statusTextOutOfScope: {
    color: '#D97706'
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  citationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B'
  },
  citationBadge: {
    backgroundColor: '#047857',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  citationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800'
  },
  answerText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 20,
    marginBottom: 12
  },
  actionBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10
  },
  actionBoxEmergency: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA'
  },
  actionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    marginBottom: 4
  },
  actionText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 16
  },
  emergencyActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  call108Btn: {
    flex: 1,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12
  },
  call108Text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  smsBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12
  },
  smsText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800'
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8
  },
  chipsGrid: {
    gap: 8
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    gap: 8
  },
  chipIcon: {
    fontSize: 16
  },
  chipText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    fontWeight: '600'
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A'
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#047857',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8'
  }
});
