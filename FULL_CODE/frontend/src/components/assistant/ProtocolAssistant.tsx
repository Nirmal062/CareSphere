import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Send, 
  Search,
  X,
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  PhoneCall, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Languages,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Info,
  HelpCircle,
  Sparkles,
  BellRing,
  MessageSquare,
  Share2
} from 'lucide-react';
import { AskResponse } from '../../types';
import localProtocolsData from '../../data/protocols.json';
import { askProtocolAssistant } from '../../services/api';
import { evaluateProtocolQuery, detectQueryLanguage } from '../../engine/protocolEngine';
import { useLanguage } from '../../context/LanguageContext';
import { getStructuredClinicalGuidance } from '../../utils/clinicalGuidance';

export const ProtocolAssistant: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExcerpt, setShowExcerpt] = useState(false);
  const [viewLanguage, setViewLanguage] = useState<'en' | 'te' | 'hi'>(language === 'te' ? 'te' : language === 'hi' ? 'hi' : 'en');

  // Synchronize viewLanguage immediately whenever the global UI language changes in the header
  useEffect(() => {
    setViewLanguage(language === 'te' ? 'te' : language === 'hi' ? 'hi' : 'en');
  }, [language]);

  const handleSwitchLanguage = (lang: 'en' | 'te' | 'hi') => {
    setViewLanguage(lang);
    setLanguage(lang);
  };

  // Voice State: Speech-to-Text (Microphone)
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [micLanguage, setMicLanguage] = useState<'te' | 'hi' | 'en'>(language === 'te' ? 'te' : language === 'hi' ? 'hi' : 'en');
  const [recognizedInterim, setRecognizedInterim] = useState('');
  const recognitionRef = useRef<any>(null);

  // Voice State: Text-to-Speech (Speaker)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasTeluguVoice, setHasTeluguVoice] = useState(false);
  const [hasHindiVoice, setHasHindiVoice] = useState(false);
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    try {
      return localStorage.getItem('caresphere_auto_speak') === 'true';
    } catch {
      return false;
    }
  });
  const [copied, setCopied] = useState(false);
  const [showVoiceHelp, setShowVoiceHelp] = useState(false);
  const [showOfflinePrompts, setShowOfflinePrompts] = useState(true);
  const lastSpokenQueryRef = useRef<string | null>(null);
  const answerCardRef = useRef<HTMLDivElement | null>(null);

  // Audio Siren State (Dual-tone emergency siren via Web Audio API)
  const [sirenActive, setSirenActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const toggleEmergencySiren = () => {
    if (sirenActive) {
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
        audioContextRef.current = null;
      }
      setSirenActive(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';

        const startTime = ctx.currentTime;
        // Dual-tone frequency cycling for 12 seconds
        for (let i = 0; i < 20; i++) {
          osc.frequency.setValueAtTime(960, startTime + i * 0.6);       // High emergency pitch (960 Hz)
          osc.frequency.setValueAtTime(720, startTime + i * 0.6 + 0.3); // Low emergency pitch (720 Hz)
        }

        gain.gain.setValueAtTime(0.25, startTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        setSirenActive(true);

        setTimeout(() => {
          if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch {}
            audioContextRef.current = null;
            setSirenActive(false);
          }
        }, 12000);
      } catch (e) {
        console.warn('AudioContext siren failed:', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
      }
    };
  }, []);

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
      category: 'Newborn (HBNC)',
      icon: '👶',
      en: 'Baby birth weight 1.6 kg HBNC schedule',
      te: 'పుట్టినప్పుడు బరువు 1.6 కేజీలు ఉన్న శిశువు సంరక్షణ',
      hi: 'नवजात शिशु का जन्म वजन 1.6 किग्रा HBNC देखभाल'
    },
    {
      category: 'Child Care (CHD)',
      icon: '💧',
      en: 'Child diarrhoea ORS and zinc dosage',
      te: 'పిల్లలలో విరేచనాలు - ORS మరియు జింక్ మోతాదు',
      hi: 'बच्चे में दस्त — ओआरएस और जिंक की खुराक'
    },
    {
      category: 'Immunisation (IMM)',
      icon: '💉',
      en: 'Penta-1 vaccine due age and site',
      te: 'పెంటా-1 టీకా ఏ వయసులో ఇవ్వాలి?',
      hi: 'पेंटा-1 टीका किस उम्र में और कहां लगाया जाता है?'
    },
    {
      category: 'Chronic NCD (HTN/DM)',
      icon: '🩺',
      en: 'Blood pressure 160/100 mmHg guidelines',
      te: 'అధిక రక్తపోటు 160/100 ఉన్న రోగికి మార్గదర్శకాలు',
      hi: 'रक्तचाप 160/100 mmHg होने पर सरकारी दिशानिर्देश'
    },
    {
      category: 'Scope (SCP)',
      icon: '🛡️',
      en: 'Can ASHA prescribe Amoxicillin antibiotic?',
      te: 'ఆశా కార్యకర్త యాంటీబయాటిక్ మందులు రాయవచ్చా?',
      hi: 'क्या आशा कार्यकर्ता एमोक्सिसिलिन एंटीबायोटिक लिख सकती है?'
    }
  ];

  // Sync mic language when global UI language changes
  useEffect(() => {
    setMicLanguage(language === 'te' ? 'te' : language === 'hi' ? 'hi' : 'en');
  }, [language]);

  // Check SpeechRecognition support on mount
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      console.warn('SpeechRecognition is not supported in this browser.');
    }
  }, []);

  // Initialize SpeechSynthesis Voices asynchronously
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      const foundTe = voices.some(v => 
        v.lang.toLowerCase().startsWith('te') || 
        v.name.toLowerCase().includes('telugu')
      );
      const foundHi = voices.some(v => 
        v.lang.toLowerCase().startsWith('hi') || 
        v.name.toLowerCase().includes('hindi')
      );
      setHasTeluguVoice(foundTe);
      setHasHindiVoice(foundHi);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Toggle Auto-Speak setting
  const toggleAutoSpeak = () => {
    setAutoSpeak((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('caresphere_auto_speak', String(next));
      } catch {}
      return next;
    });
  };

  // Start / Stop Microphone Listening
  const toggleListening = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setVoiceNotice(t('voiceNotSupported'));
      return;
    }

    // Stop if currently listening
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    // Stop any ongoing speech playback before listening
    stopSpeaking();
    setVoiceNotice(null);
    setRecognizedInterim('');

    // CRITICAL: Always instantiate a NEW SpeechRecognition instance.
    // The W3C specification strictly prohibits calling start() twice on the same instance.
    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false; // Capture single statement
      recognition.interimResults = true; // Show live transcription
      recognition.maxAlternatives = 1;
      recognition.lang = micLanguage === 'hi' ? 'hi-IN' : (micLanguage === 'te' ? 'te-IN' : 'en-IN');

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript;
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        const combined = (finalTranscript || interimTranscript).trim();
        if (combined) {
          setInputQuery(combined);
          setRecognizedInterim(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setIsListening(false);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceNotice(t('voicePermissionDenied'));
        } else if (event.error === 'no-speech') {
          setVoiceNotice(language === 'te' 
            ? 'మాటలు గుర్తించబడలేదు. దయచేసి మైక్రోఫోన్‌కు దగ్గరగా మాట్లాడండి.' 
            : 'No speech was detected. Please speak closer to your microphone.');
        } else if (event.error === 'audio-capture') {
          setVoiceNotice(language === 'te' 
            ? 'మైక్రోఫోన్ కనుగొనబడలేదు. దయచేసి ఆడియో ఇన్‌పుట్‌ను తనిఖీ చేయండి.' 
            : 'No microphone was found. Please check your audio input device.');
        } else if (event.error === 'network') {
          setVoiceNotice(t('voiceNetworkNotice'));
          setShowOfflinePrompts(true);
        } else if (event.error === 'language-not-supported') {
          setVoiceNotice(language === 'te' 
            ? 'ఈ బ్రౌజర్‌లో తెలుగు వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. ఇంగ్లీషుకు మారండి లేదా టైప్ చేయండి.' 
            : 'Telugu speech is not supported by your browser engine. Switch mic language to English or type your question.');
        } else if (event.error !== 'aborted') {
          setVoiceNotice(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setVoiceNotice(`Microphone error: ${err.message || err}`);
    }
  };

  // Speak text aloud using SpeechSynthesis
  const speakText = (text: string, lang: 'en' | 'te' | 'hi') => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    setTtsNotice(null);

    // Clean markdown formatting symbols for natural pronunciation
    const cleanText = text
      .replace(/[*_#`[\]()]/g, ' ')
      .replace(/•/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cleanText) return;

    // Handle Telugu Voice Availability on User's System
    if (lang === 'te' && !hasTeluguVoice) {
      setTtsNotice(t('teluguVoiceMissing'));
      // If no Telugu voice exists, speak in default English voice or prompt fallback
      const enVoice = availableVoices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (enVoice && response?.answer_en) {
        // Offer English version so user actually hears clinical guidance
        const utterance = new SpeechSynthesisUtterance(response.answer_en.replace(/[*_#`[\]()]/g, ' '));
        utterance.lang = 'en-IN';
        utterance.voice = enVoice;
        utterance.rate = 0.95;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-IN';
    utterance.rate = 0.95;

    // Select suitable voice matching language
    const targetPrefix = lang === 'hi' ? 'hi' : lang === 'te' ? 'te' : 'en';
    const matchedVoice = availableVoices.find(v => 
      v.lang.toLowerCase().startsWith(targetPrefix) || 
      v.name.toLowerCase().includes(lang === 'hi' ? 'hindi' : lang === 'te' ? 'telugu' : 'india')
    ) || availableVoices.find(v => v.lang.toLowerCase().startsWith('en'));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Test speaker diagnostic
  const handleTestSpeaker = () => {
    const testPhrase = language === 'te' 
      ? (hasTeluguVoice ? "నమస్కారం, కేర్‌స్పియర్ ఆడియో వ్యవస్థ సరిగ్గా పనిచేస్తోంది." : "CareSphere audio system is functioning properly.")
      : "CareSphere frontline audio system is functioning properly.";
    speakText(testPhrase, hasTeluguVoice && language === 'te' ? 'te' : 'en');
  };

  const handleSubmit = async (qToAsk?: string) => {
    const q = (qToAsk || inputQuery).trim();
    if (!q) return;

    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    }
    stopSpeaking();
    if (sirenActive) toggleEmergencySiren();

    setInputQuery(q);
    setLoading(true);
    setError(null);
    setResponse(null);
    setShowExcerpt(false);
    setTtsNotice(null);

    try {
      // Auto-detect question language if user spoke/typed in Telugu or Hindi
      const detectedQueryLang = detectQueryLanguage(q);
      const queryLang = detectedQueryLang !== 'en' ? detectedQueryLang : language;

      const res = await askProtocolAssistant(q, queryLang);
      setResponse(res);
      const targetLang = (res.answer_language === 'hi' || queryLang === 'hi') ? 'hi' : (res.answer_language === 'te' || queryLang === 'te') ? 'te' : 'en';
      setViewLanguage(targetLang);
      if (detectedQueryLang !== 'en' && detectedQueryLang !== language) {
        setLanguage(detectedQueryLang);
      }

      // Smoothly scroll to the top Answer Card so user sees the clinical result immediately
      setTimeout(() => {
        if (answerCardRef.current) {
          answerCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Auto-read response aloud if enabled and not already spoken
      if (autoSpeak && lastSpokenQueryRef.current !== q) {
        lastSpokenQueryRef.current = q;
        const textToSpeak = targetLang === 'hi'
          ? (res.answer_hi || res.answer)
          : targetLang === 'te'
          ? (res.answer_te || res.answer)
          : (res.answer_en || res.answer);
        setTimeout(() => {
          speakText(textToSpeak, targetLang);
        }, 350);
      }
    } catch (err: any) {
      console.error('QA Assistant error:', err);
      setError(err.message || 'An error occurred while evaluating the query.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!response) return;
    if (structuredGuidance) {
      const copyText = `[CareSphere CDSS Clinical Guidance]
1. UNDERSTANDING:
${structuredGuidance.understanding}

2. IMMEDIATE SAFE RELIEF & FIRST-LINE CARE:
${structuredGuidance.firstLineCare.map((step) => `• ${step}`).join('\n')}

3. RED-FLAG DANGER SIGNS:
${structuredGuidance.redFlags.map((rf) => `⚠️ ${rf}`).join('\n')}

4. OFFICIAL REFERENCE:
${structuredGuidance.protocolRef}`;
      navigator.clipboard.writeText(copyText);
    } else {
      const answerText = viewLanguage === 'hi'
        ? (response.answer_hi || response.answer)
        : viewLanguage === 'te' 
        ? (response.answer_te || response.answer) 
        : (response.answer_en || response.answer);
      navigator.clipboard.writeText(answerText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Match section from protocols.json for Deep Clinical Breakdown
  const matchedSection = useMemo(() => {
    if (!response?.citations?.[0]) return null;
    const targetId = response.citations[0];
    for (const doc of localProtocolsData as any[]) {
      const sec = doc.sections.find((s: any) => s.section_id === targetId);
      if (sec) return sec;
    }
    return null;
  }, [response]);

  // Structured 4-part clinical guidance (Understanding, Safe First-Line Care, Red Flags, Protocol Reference)
  const structuredGuidance = useMemo(() => {
    if (!response) return null;
    return getStructuredClinicalGuidance(response, viewLanguage);
  }, [response, viewLanguage]);

  // Determine which text to show based on viewLanguage (Trilingual: en, te, hi)
  const displayedAnswer = useMemo(() => {
    if (!response) return '';
    if (viewLanguage === 'hi') {
      if (response.answer_hi) return response.answer_hi;
      const local = evaluateProtocolQuery(response.question, 'hi');
      return local.answer_hi || local.answer;
    } else if (viewLanguage === 'te') {
      if (response.answer_te) return response.answer_te;
      const local = evaluateProtocolQuery(response.question, 'te');
      return local.answer_te || local.answer;
    } else {
      if (response.answer_en) return response.answer_en;
      const local = evaluateProtocolQuery(response.question, 'en');
      return local.answer_en || local.answer;
    }
  }, [response, viewLanguage]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Introduction Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#047857] flex items-center justify-center border border-emerald-200 shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#047857]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t('assistantTitle')}
              </h2>
              <p className="text-[11px] text-emerald-800 font-medium">
                {t('supportedLangs')}
              </p>
            </div>
          </div>

          {/* Voice Auto-Speak Toggle & Diagnostics */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={toggleAutoSpeak}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[36px] ${
                autoSpeak 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs' 
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle automatic speech synthesis for answers"
            >
              {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-emerald-700" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>{autoSpeak ? t('voiceAutoReadOn') : t('voiceAutoReadOff')}</span>
            </button>

            <button
              onClick={() => setShowVoiceHelp(!showVoiceHelp)}
              className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-200"
              title="Voice Assistant Diagnostics & Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {t('assistantIntro')}
        </p>

        {/* Voice Diagnostics & Device Audio Panel */}
        {showVoiceHelp && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 text-slate-700">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>Voice Hardware & Browser Diagnostics:</span>
              <button
                onClick={handleTestSpeaker}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-[11px] transition-colors"
              >
                🔊 {t('speechTestBtn')}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <strong>Speech-to-Text:</strong>{' '}
                {speechSupported ? (
                  <span className="text-emerald-700 font-bold">Supported (Web Speech API)</span>
                ) : (
                  <span className="text-red-700 font-bold">Not supported in this browser</span>
                )}
              </div>
              <div>
                <strong>Text-to-Speech:</strong>{' '}
                <span className="text-emerald-700 font-bold">Supported ({availableVoices.length} voices loaded)</span>
              </div>
              <div>
                <strong>Telugu TTS Voice:</strong>{' '}
                {hasTeluguVoice ? (
                  <span className="text-emerald-700 font-bold">Installed (Native Telugu Audio)</span>
                ) : (
                  <span className="text-amber-700 font-bold">Not installed in OS (English audio fallback active)</span>
                )}
              </div>
              <div>
                <strong>Active Mic Mode:</strong>{' '}
                <span className="font-mono font-bold text-teal-800">{micLanguage === 'te' ? 'Telugu (te-IN)' : 'English (en-IN)'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Voice Error/Notice Banner */}
        {voiceNotice && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button 
              onClick={() => setVoiceNotice(null)}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TTS Info Notice */}
        {ttsNotice && (
          <div className="p-3 bg-teal-50 border border-teal-200 text-teal-950 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-teal-700 shrink-0" />
              <span>{ttsNotice}</span>
            </div>
            <button 
              onClick={() => setTtsNotice(null)}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 px-2 py-0.5 rounded cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Top Section: Answer & Triage Result (Above Question) */}
      <div ref={answerCardRef} className="scroll-mt-6" />

      {/* Evaluation Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs text-red-700 flex items-start gap-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Evaluation Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Response Card States */}
      {response && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* CASE 1: EMERGENCY DANGER SIGN */}
          {response.is_emergency && (
            <div className="bg-red-50/95 border-2 border-red-600 rounded-3xl p-5 sm:p-6 text-red-950 space-y-4 shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-xs">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                      🚨 {t('dangerSignDetected')}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-red-950 mt-1">
                      {viewLanguage === 'hi' && response.condition_hi ? response.condition_hi : viewLanguage === 'te' && response.condition_te ? response.condition_te : response.condition}
                    </h3>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="bg-red-700 text-white text-xs font-mono font-bold px-3 py-1 rounded-xl shadow-2xs">
                    {response.citations[0]}
                  </span>
                </div>
              </div>

              {/* Action Toolbar: Language Switch, Speak Aloud, English Audio Fallback, Copy */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-red-100/70 p-2.5 rounded-2xl text-xs">
                <div className="flex items-center gap-1.5 font-medium text-red-900">
                  <Languages className="w-4 h-4 text-red-700" />
                  <span>Language: <strong>{viewLanguage === 'te' ? 'తెలుగు' : viewLanguage === 'hi' ? 'हिन्दी' : 'English'}</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Read Aloud Button */}
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(displayedAnswer, viewLanguage)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSpeaking ? 'bg-red-600 text-white animate-pulse' : 'bg-white text-red-900 hover:bg-red-50 border border-red-200'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? t('stopAudioBtn') : t('readAloudBtn')}</span>
                  </button>

                  {/* Fallback English Audio if Native TTS is unavailable */}
                  {((viewLanguage === 'te' && !hasTeluguVoice) || (viewLanguage === 'hi' && !hasHindiVoice)) && (
                    <button
                      onClick={() => speakText(response.answer_en, 'en')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-red-50 text-red-900 border border-red-200 rounded-xl text-xs font-semibold cursor-pointer"
                      title="Listen in English Audio"
                    >
                      <Volume2 className="w-3 h-3 text-red-700" />
                      <span>{t('listenEnglishBtn')}</span>
                    </button>
                  )}

                  {/* Copy Answer */}
                  <button
                    onClick={handleCopyAnswer}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-red-50 text-red-900 border border-red-200 rounded-xl text-xs font-semibold cursor-pointer"
                    title={t('copyAnswerBtn')}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Trilingual Toggle Pill */}
                  <div className="inline-flex bg-red-200/60 p-0.5 rounded-xl border border-red-300">
                    <button
                      onClick={() => handleSwitchLanguage('en')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'en' ? 'bg-red-700 text-white shadow-2xs' : 'text-red-900 hover:text-red-950'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleSwitchLanguage('te')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'te' ? 'bg-red-700 text-white shadow-2xs' : 'text-red-900 hover:text-red-950'
                      }`}
                    >
                      తె
                    </button>
                    <button
                      onClick={() => handleSwitchLanguage('hi')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'hi' ? 'bg-red-700 text-white shadow-2xs' : 'text-red-900 hover:text-red-950'
                      }`}
                    >
                      हि
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. Understanding the Symptom & Condition */}
              {structuredGuidance && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200 space-y-2 shadow-2xs">
                  <div className="text-[11px] font-extrabold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>{t('understandingSymptomHeader')}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {structuredGuidance.understanding}
                  </p>
                </div>
              )}

              {/* 2. Immediate Safe Relief & Emergency First-Line Steps */}
              {structuredGuidance && structuredGuidance.firstLineCare.length > 0 && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-red-200 space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-extrabold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('safeReliefCareHeader')}</span>
                  </div>
                  <ul className="space-y-2 pl-1">
                    {structuredGuidance.firstLineCare.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-2 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Red-Flag Danger Signs Checklist */}
              {structuredGuidance && structuredGuidance.redFlags.length > 0 && (
                <div className="bg-[#FEF2F2] p-4 sm:p-5 rounded-2xl border border-red-300 space-y-2.5">
                  <div className="text-[11px] font-extrabold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                    <span>{t('redFlagWarningHeader')}</span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {structuredGuidance.redFlags.map((rf, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-red-950 font-bold leading-relaxed">
                        <span className="text-red-600 shrink-0">⚠️</span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Verified Protocol Reference */}
              {structuredGuidance && (
                <div className="bg-red-100/90 px-4 py-2.5 rounded-xl border border-red-200 text-xs text-red-950 font-mono font-bold flex items-center justify-between">
                  <span>{t('verifiedProtocolRefHeader')}:</span>
                  <span className="text-red-900 underline">{structuredGuidance.protocolRef}</span>
                </div>
              )}

              {/* Immediate Action Buttons (Call 108, 2G SMS Referral, Sound Siren, 102 JSSK) */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold text-red-950 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-red-600 animate-pulse" />
                    <span className="uppercase tracking-wider font-extrabold">
                      {viewLanguage === 'te' ? 'తక్షణ అత్యవసర చర్యలు (1-ట్యాప్):' : viewLanguage === 'hi' ? 'तत्काल आपातकालीन सेवाएं (1-टैप):' : 'Immediate Emergency Takeover Actions (1-Tap):'}
                    </span>
                  </div>
                  <span className="text-[10px] text-red-700 font-bold uppercase tracking-wider bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                    Offline Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* 1. Direct Call 108 */}
                  <a
                    href="tel:108"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#dc2626] hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-700/25 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                  >
                    <div>
                      <div className="text-[10px] text-red-200 uppercase font-semibold">Toll-Free Ambulance</div>
                      <div className="text-sm font-extrabold flex items-center gap-1.5">
                        <span>Call 108</span>
                        <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                      </div>
                    </div>
                  </a>

                  {/* 2. Direct 2G SMS Referral */}
                  <a
                    href={`sms:108?body=${encodeURIComponent(
                      structuredGuidance?.referralSmsText || `EMERGENCY REFERRAL - Chandrapuri Sub-Centre: ${response.condition || 'Danger Sign'} (Protocol ${response.citations[0] || 'ESC-1.1'}).`
                    )}`}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-700/20 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                    title="Send 2G SMS Referral to Emergency Control Room"
                  >
                    <div>
                      <div className="text-[10px] text-amber-100 uppercase font-semibold">2G Feature Phone SMS</div>
                      <div className="text-sm font-extrabold flex items-center gap-1.5">
                        <span>{t('smsReferralBtn')}</span>
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </a>

                  {/* 3. Audible Sound Siren Trigger */}
                  <button
                    type="button"
                    onClick={toggleEmergencySiren}
                    className={`flex items-center justify-between p-3.5 rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer text-left min-h-[44px] ${
                      sirenActive
                        ? 'bg-red-900 text-white ring-4 ring-red-400 animate-pulse'
                        : 'bg-slate-900 hover:bg-black text-white'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] text-red-300 uppercase font-semibold">Audible Medical Siren</div>
                      <div className="text-sm font-extrabold flex items-center gap-1.5">
                        <span>{sirenActive ? t('stopSirenBtn') : t('triggerSirenBtn')}</span>
                        <BellRing className={`w-3.5 h-3.5 ${sirenActive ? 'animate-spin' : ''}`} />
                      </div>
                    </div>
                  </button>

                  {/* 4. Call 102 JSSK Transport */}
                  <a
                    href="tel:102"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-md shadow-red-800/20 active:scale-95 transition-all cursor-pointer min-h-[44px]"
                  >
                    <div>
                      <div className="text-[10px] text-red-200 uppercase font-semibold">JSSK Maternal Transport</div>
                      <div className="text-sm font-extrabold">Call 102</div>
                    </div>
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Care Connect Referral Bar for Emergency */}
              {structuredGuidance && (
                <div className="mt-3 p-3.5 bg-white/95 rounded-2xl border border-red-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-red-700" />
                    <span className="font-bold text-red-950">{t('careConnectTitle')}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(structuredGuidance.referralWaText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t('shareWhatsappBtn')}</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-red-200 text-[11px] text-red-800 flex items-center justify-between font-mono">
                <span>Deterministic Emergency Gate</span>
                <span>Latency: {response.latency_ms} ms</span>
              </div>
            </div>
          )}

          {/* CASE 2: OUT OF SCOPE REFUSAL */}
          {response.is_out_of_scope && (
            <div className="bg-amber-50/95 border-2 border-amber-500 rounded-3xl p-5 sm:p-6 text-amber-950 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      {t('outOfScopeRefusal')}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-amber-950 mt-1">
                      {viewLanguage === 'hi' ? 'पीएचसी चिकित्सा अधिकारी से संपर्क करें' : viewLanguage === 'te' ? 'ప్రాథమిక ఆరోగ్య కేంద్రం వైద్య అధికారిని సంప్రదించండి' : 'Redirect to Medical Officer'}
                    </h3>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="bg-amber-600 text-white text-xs font-mono font-bold px-3 py-1 rounded-xl shadow-2xs">
                    SCP-1.2
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-100/70 p-2.5 rounded-2xl text-xs">
                <div className="flex items-center gap-1.5 font-medium text-amber-900">
                  <Languages className="w-4 h-4 text-amber-700" />
                  <span>Language: <strong>{viewLanguage === 'te' ? 'తెలుగు' : viewLanguage === 'hi' ? 'हिन्दी' : 'English'}</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(displayedAnswer, viewLanguage)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSpeaking ? 'bg-amber-600 text-white animate-pulse' : 'bg-white text-amber-900 hover:bg-amber-50 border border-amber-200'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? t('stopAudioBtn') : t('readAloudBtn')}</span>
                  </button>

                  {((viewLanguage === 'te' && !hasTeluguVoice) || (viewLanguage === 'hi' && !hasHindiVoice)) && (
                    <button
                      onClick={() => speakText(response.answer_en, 'en')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold cursor-pointer"
                      title="Listen in English Audio"
                    >
                      <Volume2 className="w-3 h-3 text-amber-700" />
                      <span>{t('listenEnglishBtn')}</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyAnswer}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold cursor-pointer"
                    title={t('copyAnswerBtn')}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <div className="inline-flex bg-amber-200/60 p-0.5 rounded-xl border border-amber-300">
                    <button
                      onClick={() => handleSwitchLanguage('en')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'en' ? 'bg-amber-700 text-white shadow-2xs' : 'text-amber-900 hover:text-amber-950'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleSwitchLanguage('te')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'te' ? 'bg-amber-700 text-white shadow-2xs' : 'text-amber-900 hover:text-amber-950'
                      }`}
                    >
                      తె
                    </button>
                    <button
                      onClick={() => handleSwitchLanguage('hi')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'hi' ? 'bg-amber-700 text-white shadow-2xs' : 'text-amber-900 hover:text-amber-950'
                      }`}
                    >
                      हि
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. Understanding Scope Boundary */}
              {structuredGuidance && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-2">
                  <div className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>{t('understandingSymptomHeader')}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {structuredGuidance.understanding}
                  </p>
                </div>
              )}

              {/* 2. Permissible Supportive Care & Redirection Steps */}
              {structuredGuidance && structuredGuidance.firstLineCare.length > 0 && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-2">
                  <div className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('safeReliefCareHeader')}</span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {structuredGuidance.firstLineCare.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Red-Flag Warning Checklist */}
              {structuredGuidance && structuredGuidance.redFlags.length > 0 && (
                <div className="bg-amber-100/60 p-4 rounded-2xl border border-amber-300 space-y-2">
                  <div className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>{t('redFlagWarningHeader')}</span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {structuredGuidance.redFlags.map((rf, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-amber-950 font-bold">
                        <span className="text-amber-700 shrink-0">⚠️</span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Verified Protocol Reference */}
              {structuredGuidance && (
                <div className="bg-amber-100/90 px-4 py-2.5 rounded-xl border border-amber-200 text-xs text-amber-950 font-mono font-bold flex items-center justify-between">
                  <span>{t('verifiedProtocolRefHeader')}:</span>
                  <span className="text-amber-900 underline">{structuredGuidance.protocolRef}</span>
                </div>
              )}

              {/* Care Connect Referral Bar for Scope Redirection */}
              {structuredGuidance && (
                <div className="mt-3 p-3.5 bg-white/95 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-amber-700" />
                    <span className="font-bold text-amber-950">{t('careConnectTitle')}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="tel:104"
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{t('callMedicalOfficer')} (104)</span>
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(structuredGuidance.referralWaText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t('shareWhatsappBtn')}</span>
                    </a>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-amber-200 text-[11px] text-amber-800 flex items-center justify-between font-mono">
                <span>Scope Enforcement Layer</span>
                <span>Latency: {response.latency_ms} ms</span>
              </div>
            </div>
          )}

          {/* CASE 3: GROUNDED PROTOCOL ANSWER */}
          {!response.is_emergency && !response.is_out_of_scope && (
            <div className="bg-white border-2 border-teal-600 rounded-3xl p-5 sm:p-6 text-slate-900 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-teal-600 text-white shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      {t('groundedAnswerTitle')}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {viewLanguage === 'hi' && response.source_title_hi ? response.source_title_hi : viewLanguage === 'te' && response.source_title_te ? response.source_title_te : (response.source_title || "Official Guideline")}
                    </h3>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="bg-teal-700 text-white text-xs font-mono font-bold px-3 py-1 rounded-xl shadow-xs">
                    {response.citations[0]}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-teal-50/80 p-2.5 rounded-2xl text-xs border border-teal-100">
                <div className="flex items-center gap-1.5 font-medium text-teal-900">
                  <Languages className="w-4 h-4 text-teal-700" />
                  <span>Language: <strong>{viewLanguage === 'te' ? 'తెలుగు' : viewLanguage === 'hi' ? 'हिन्दी' : 'English'}</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Primary Read Aloud */}
                  <button
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(displayedAnswer, viewLanguage)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSpeaking ? 'bg-teal-600 text-white animate-pulse' : 'bg-white text-teal-900 hover:bg-teal-100 border border-teal-200'
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? t('stopAudioBtn') : t('readAloudBtn')}</span>
                  </button>

                  {/* Fallback English Audio if Native TTS is unavailable */}
                  {((viewLanguage === 'te' && !hasTeluguVoice) || (viewLanguage === 'hi' && !hasHindiVoice)) && (
                    <button
                      onClick={() => speakText(response.answer_en, 'en')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-semibold cursor-pointer"
                      title="Listen in English Audio"
                    >
                      <Volume2 className="w-3 h-3 text-teal-700" />
                      <span>{t('listenEnglishBtn')}</span>
                    </button>
                  )}

                  <button
                    onClick={handleCopyAnswer}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-semibold cursor-pointer"
                    title={t('copyAnswerBtn')}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <div className="inline-flex bg-teal-100 p-0.5 rounded-xl border border-teal-200">
                    <button
                      onClick={() => handleSwitchLanguage('en')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'en' ? 'bg-teal-700 text-white shadow-2xs' : 'text-teal-900 hover:text-teal-950'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => handleSwitchLanguage('te')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'te' ? 'bg-teal-700 text-white shadow-2xs' : 'text-teal-900 hover:text-teal-950'
                      }`}
                    >
                      తె
                    </button>
                    <button
                      onClick={() => handleSwitchLanguage('hi')}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        viewLanguage === 'hi' ? 'bg-teal-700 text-white shadow-2xs' : 'text-teal-900 hover:text-teal-950'
                      }`}
                    >
                      हि
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. Understanding the Symptom & Clinical Presentation */}
              {structuredGuidance && (
                <div className="bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200/90 space-y-2">
                  <div className="text-[11px] font-extrabold text-[#047857] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('understandingSymptomHeader')}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {structuredGuidance.understanding}
                  </p>
                </div>
              )}

              {/* 2. Immediate Safe Relief & Permissible First-Line Care */}
              {structuredGuidance && structuredGuidance.firstLineCare.length > 0 && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                  <div className="text-[11px] font-extrabold text-[#047857] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('safeReliefCareHeader')}</span>
                  </div>
                  <ul className="space-y-2 pl-1">
                    {structuredGuidance.firstLineCare.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#047857] mt-2 shrink-0" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 3. Red-Flag Danger Signs & Hospital Escalation Checklist */}
              {structuredGuidance && structuredGuidance.redFlags.length > 0 && (
                <div className="bg-[#FEF2F2] p-4 sm:p-5 rounded-2xl border border-red-200 space-y-2">
                  <div className="text-[11px] font-extrabold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>{t('redFlagWarningHeader')}</span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {structuredGuidance.redFlags.map((rf, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-red-950 font-bold">
                        <span className="text-red-600 shrink-0">⚠️</span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Verified Protocol Reference */}
              {structuredGuidance && (
                <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-mono font-bold flex items-center justify-between">
                  <span>{t('verifiedProtocolRefHeader')}:</span>
                  <span className="text-[#047857] underline">{structuredGuidance.protocolRef}</span>
                </div>
              )}

              {/* Care Connect Referral Bar */}
              {structuredGuidance && (
                <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[#047857]" />
                    <span className="font-bold text-slate-900">{t('careConnectTitle')}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="tel:104"
                      className="px-3 py-1.5 bg-[#047857] hover:bg-[#03543d] text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{t('callMedicalOfficer')} (104)</span>
                    </a>
                    <a
                      href={`sms:?body=${encodeURIComponent(structuredGuidance.referralSmsText)}`}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t('smsReferralBtn')}</span>
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(structuredGuidance.referralWaText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer min-h-[36px]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{t('shareWhatsappBtn')}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Deep Clinical Breakdown Card */}
              {matchedSection && (
                <div className="border border-teal-200/90 rounded-2xl overflow-hidden bg-teal-50/20 text-xs shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                    className="w-full px-4 py-3 bg-teal-50/80 hover:bg-teal-100/70 flex items-center justify-between text-teal-950 font-bold transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-700" />
                      <span>{t('detailedBreakdownTitle')} ({matchedSection.section_id}: {matchedSection.title})</span>
                    </div>
                    {showDetailedBreakdown ? <ChevronUp className="w-4 h-4 text-teal-700" /> : <ChevronDown className="w-4 h-4 text-teal-700" />}
                  </button>

                  {showDetailedBreakdown && (
                    <div className="p-4 space-y-3.5 bg-white border-t border-teal-100">
                      {matchedSection.target_timeline && (
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 mb-1">
                            ⏱️ {t('targetTimelineHeader')}
                          </div>
                          <div className="text-xs text-slate-800 bg-teal-50/60 p-2.5 rounded-xl border border-teal-100 leading-relaxed font-medium">
                            {matchedSection.target_timeline}
                          </div>
                        </div>
                      )}

                      {matchedSection.clinical_actions && matchedSection.clinical_actions.length > 0 && (
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 mb-1">
                            📋 {t('stepByStepActionHeader')}
                          </div>
                          <div className="space-y-1.5 pl-1">
                            {matchedSection.clinical_actions.map((act: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 leading-relaxed">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                                <span className="font-medium">{act}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {matchedSection.mandatory_tests && matchedSection.mandatory_tests.length > 0 && (
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 mb-1">
                            🔬 {t('mandatoryTestsHeader')}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {matchedSection.mandatory_tests.map((test: string, idx: number) => (
                              <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-semibold">
                                {test}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {matchedSection.prescribed_meds && matchedSection.prescribed_meds.length > 0 && (
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 mb-1">
                            💊 {t('medicationsSupplementsHeader')}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {matchedSection.prescribed_meds.map((med: string, idx: number) => (
                              <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-[11px] font-semibold">
                                {med}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {matchedSection.danger_signs_alert && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-950">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-red-800 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            <span>{t('dangerSignDetected')}</span>
                          </div>
                          <div className="text-xs font-semibold leading-relaxed">
                            {matchedSection.danger_signs_alert}
                          </div>
                        </div>
                      )}

                      {matchedSection.official_source && (
                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                          🏛️ {t('protocolRuleRef')}: {matchedSection.official_source}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Source Document Details & Expandable Excerpt */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <button
                  onClick={() => setShowExcerpt(!showExcerpt)}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t('sourceExcerptHeader')} ({response.citations[0]} in {response.source_file})</span>
                  </div>
                  {showExcerpt ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showExcerpt && response.source_excerpt && (
                  <div className="p-4 bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-64 whitespace-pre-wrap leading-relaxed">
                    {response.source_excerpt}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Protocol Grounding Engine</span>
                <span>Latency: {response.latency_ms} ms</span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Middle Section: Query Search Bar with Voice */}
      {/* Query Input Box with Live Voice Recording Controls */}
      <div className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all shadow-sm space-y-3.5 ${
        isListening ? 'border-red-500 ring-2 ring-red-200 bg-red-50/20' : 'border-slate-200 hover:border-slate-300'
      }`}>
        {/* Active Recording Wave Banner */}
        {isListening && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-2xl text-xs text-red-950 animate-pulse shadow-2xs">
            <div className="flex items-center gap-2.5 font-semibold">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              <span>
                {t('voiceListening')} ({micLanguage === 'te' ? 'తెలుగు లిపి' : 'English'})
              </span>
            </div>
            <button
              type="button"
              onClick={toggleListening}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              {t('voiceStopBtn')}
            </button>
          </div>
        )}

        {/* Modern Search Bar Container */}
        <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 border border-slate-200 focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100 transition-all">
          <div className="p-1.5 rounded-xl bg-teal-50 text-teal-700 shrink-0 mt-0.5 border border-teal-200/50">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
          </div>

          <div className="flex-1 min-w-0">
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={t('inputPlaceholder')}
              rows={2}
              disabled={loading}
              className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed disabled:opacity-60"
            />
          </div>

          {inputQuery && !loading && (
            <button
              type="button"
              onClick={() => setInputQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
              title="Clear input"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input Bar Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          {/* Helper hint and Mic Language Selector */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium text-[11px]">{t('micLanguage')}:</span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMicLanguage('en')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    micLanguage === 'en' 
                      ? 'bg-teal-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setMicLanguage('te')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    micLanguage === 'te' 
                      ? 'bg-teal-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  తెలుగు
                </button>
                <button
                  type="button"
                  onClick={() => setMicLanguage('hi')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    micLanguage === 'hi' 
                      ? 'bg-teal-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 hidden lg:inline">
              • {t('pressEnterNotice')}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            {/* Quick Ask Button if recognized text is present */}
            {recognizedInterim && !loading && (
              <button
                type="button"
                onClick={() => handleSubmit(recognizedInterim)}
                className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors cursor-pointer hidden md:inline-flex items-center gap-1"
              >
                <span>{t('submitSpokenBtn')}</span>
                <span>&rarr;</span>
              </button>
            )}

            {/* Microphone Button (Large 44px Accessible Touch Target) */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={!speechSupported || loading}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer min-w-[44px] min-h-[44px] ${
                !speechSupported
                  ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  : isListening 
                  ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-300 animate-pulse' 
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#047857] border-slate-300 hover:border-emerald-300 shadow-2xs'
              }`}
              title={!speechSupported ? t('voiceNotSupported') : (isListening ? t('voiceStopBtn') : t('voiceStartBtn'))}
              aria-label="Voice input"
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">{t('voiceStopBtn')}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-[#047857]" />
                  <span className="hidden sm:inline">{t('voiceStartBtn')}</span>
                </>
              )}
            </button>

            {/* Submit / Search Button (Large 44px Touch Target) */}
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !inputQuery.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#047857] hover:bg-[#03543d] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-sm shadow-emerald-900/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('searchingBtn')}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('searchProtocolBtn')}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Bottom Section: OFFLINE CLINICAL VOICE SHORTCUTS (1-TAP) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#047857]">
              <Sparkles className="w-4 h-4 text-[#047857]" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                {t('offlineQuickPrompts')}
              </span>
              <span className="text-[11px] text-slate-500">
                1-tap clinical voice and protocol queries for instant offline guidance
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowOfflinePrompts(!showOfflinePrompts)}
            className="text-xs text-[#047857] hover:text-emerald-900 font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer min-h-[36px]"
          >
            {showOfflinePrompts ? 'Hide Shortcuts' : 'Show All Shortcuts'}
          </button>
        </div>
        {showOfflinePrompts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 animate-in fade-in">
            {OFFLINE_CLINICAL_PROMPTS.map((item, idx) => {
              const queryText = language === 'hi' ? (item as any).hi : (language === 'te' ? item.te : item.en);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSubmit(queryText)}
                  disabled={loading}
                  className="text-left p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/80 hover:border-emerald-300 text-xs text-slate-700 hover:text-[#047857] transition-all shadow-2xs group flex items-start gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
                >
                  <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 block group-hover:text-[#047857]">{item.category}</span>
                    <span className="font-medium line-clamp-2 leading-tight text-slate-800">{queryText}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
