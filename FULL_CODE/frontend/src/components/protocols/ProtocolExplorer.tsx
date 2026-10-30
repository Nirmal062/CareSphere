import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Search, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Pill, 
  Activity
} from 'lucide-react';
import { ProtocolDocument } from '../../types';
import { fetchProtocols } from '../../services/api';
import localProtocolsData from '../../data/protocols.json';
import { useLanguage } from '../../context/LanguageContext';

const rawProtocols = (localProtocolsData as any)?.default || localProtocolsData;
const initialDocs: ProtocolDocument[] = Array.isArray(rawProtocols) ? rawProtocols : [];

export const ProtocolExplorer: React.FC = () => {
  const { language, t } = useLanguage();
  const [protocols, setProtocols] = useState<ProtocolDocument[]>(initialDocs);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ProtocolDocument | null>(() => initialDocs[0] || null);
  const [selectedSection, setSelectedSection] = useState<string | null>(() => initialDocs[0]?.sections?.[0]?.section_id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchProtocols();
        if (data && Array.isArray(data.documents) && data.documents.length > 0) {
          setProtocols(data.documents);
          if (!selectedDoc) {
            setSelectedDoc(data.documents[0]);
            if (data.documents[0].sections?.length > 0) {
              setSelectedSection(data.documents[0].sections[0].section_id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching protocols:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredDocs = protocols.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.sections.some(s => s.section_id.toLowerCase().includes(searchQuery.toLowerCase()) || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeSectionObj = selectedDoc?.sections.find(s => s.section_id === selectedSection);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/60">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {language === 'te' ? 'అధికారిక క్లినికల్ మార్గదర్శకాలు' : language === 'hi' ? 'आधिकारिक स्वास्थ्य प्रोटोकॉल दिशानिर्देश' : 'Official Protocol Guidelines'}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          {language === 'te' 
            ? 'ఈ సహాయకురాలు భారత ప్రభుత్వం జారీ చేసిన 9 అధికారిక మార్గదర్శకాలలోని 107 లీఫ్ సెక్షన్లపై ఆధారపడి ఉంది. ఫ్రంట్‌లైన్ కార్యకర్తలు మార్గదర్శకాలు, పట్టిక విలువలు, పరిమితులు మరియు రిఫరల్ అవసరాలను ఇక్కడ పరిశీలించవచ్చు.'
            : language === 'hi'
            ? 'केयरस्फेयर भारत सरकार द्वारा जारी 9 आधिकारिक स्वास्थ्य दिशानिर्देशों के 107 लीफ सेक्शंस पर सख्ती से आधारित है। फ्रंटलाइन कार्यकर्ता यहां पूर्ण दिशानिर्देश, तालिका मान, कट-ऑफ और रेफरल मानदंड देख सकते हैं।'
            : 'CareSphere is grounded strictly in 9 official Government of India guidelines comprising 107 leaf sections. Frontline workers can inspect full source guidance, table values, cut-offs, and referral requirements.'
          }
        </p>
      </div>

      {/* Main 2-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Guidelines list & section tree */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'te' ? 'సెక్షన్లు లేదా కీలకపదాలతో వెతకండి...' : language === 'hi' ? 'प्रोटोकॉल सेक्शन या कीवर्ड खोजें...' : 'Search protocol sections or keywords...'}
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 max-h-[650px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading protocol files...</div>
            ) : filteredDocs.map((doc) => {
              const isDocSelected = selectedDoc?.filename === doc.filename;
              return (
                <div key={doc.filename} className="p-3">
                  <button
                    onClick={() => {
                      setSelectedDoc(doc);
                      if (doc.sections.length > 0) setSelectedSection(doc.sections[0].section_id);
                    }}
                    className={`w-full text-left flex items-start justify-between gap-2 p-2.5 rounded-xl transition-colors cursor-pointer ${
                      isDocSelected ? 'bg-teal-50 text-teal-950 font-semibold border border-teal-200/80 shadow-2xs' : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isDocSelected ? 'text-teal-700' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-bold leading-tight">{doc.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{doc.filename}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium shrink-0">
                      {doc.sections_count} sec
                    </span>
                  </button>

                  {/* Section sub-pills if doc is active */}
                  {isDocSelected && (
                    <div className="mt-2 pl-6 pr-1 space-y-1">
                      {doc.sections.map((sec) => {
                        const isSecSelected = selectedSection === sec.section_id;
                        return (
                          <button
                            key={sec.section_id}
                            onClick={() => setSelectedSection(sec.section_id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                              isSecSelected 
                                ? 'bg-teal-600 text-white font-semibold shadow-2xs' 
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span className="font-mono font-bold shrink-0">{sec.section_id}</span>
                            <span className="truncate max-w-[170px] text-[10px] opacity-90 text-right">{sec.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active section viewer */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          {activeSectionObj ? (
            <>
              {/* Header with Switcher between Structured Protocol View and Raw Document */}
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-teal-100 text-teal-800 font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg border border-teal-200 shadow-2xs">
                      {activeSectionObj.section_id}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-medium">
                      {activeSectionObj.doc_title || selectedDoc?.title}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 leading-snug">
                    {activeSectionObj.full_title || activeSectionObj.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {/* View Mode Toggle */}
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
                    <button
                      onClick={() => setViewMode('structured')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        viewMode === 'structured'
                          ? 'bg-white text-teal-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'te' ? 'క్లినికల్ కార్డ్' : language === 'hi' ? 'नैदानिक कार्ड' : 'Clinical Card'}
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        viewMode === 'raw'
                          ? 'bg-white text-teal-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {language === 'te' ? 'మూల పత్రం' : language === 'hi' ? 'मूल दस्तावेज' : 'Raw Document'}
                    </button>
                  </div>

                  <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-bold flex items-center gap-1 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>GoI Protocol</span>
                  </div>
                </div>
              </div>

              {/* VIEW 1: STRUCTURED DEEP CLINICAL CARD */}
              {viewMode === 'structured' ? (
                <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1 text-xs sm:text-sm">
                  {/* 1. Target Timeline & Eligibility Criteria */}
                  <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-200/80 space-y-1.5">
                    <div className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      <span>{t('targetTimelineHeader')}</span>
                    </div>
                    <p className="text-slate-800 font-semibold leading-relaxed">
                      {activeSectionObj.target_timeline || "Standard National Health Mission frontline schedule"}
                    </p>
                  </div>

                  {/* 2. Step-by-Step Frontline Clinical Protocol */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t('stepByStepActionHeader')}</span>
                    </div>
                    <div className="space-y-2 pt-0.5">
                      {activeSectionObj.clinical_actions && activeSectionObj.clinical_actions.length > 0 ? (
                        activeSectionObj.clinical_actions.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-slate-700 leading-normal">
                            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="font-medium">{step}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-600">{activeSectionObj.content}</p>
                      )}
                    </div>
                  </div>

                  {/* 3. Mandatory Tests & Prescribed Medications Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Mandatory Tests */}
                    <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200/70 space-y-1.5">
                      <div className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-700" />
                        <span>{t('mandatoryTestsHeader')}</span>
                      </div>
                      <ul className="space-y-1 text-slate-700 text-xs">
                        {activeSectionObj.mandatory_tests?.map((test, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{test}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prescribed Medications */}
                    <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200/70 space-y-1.5">
                      <div className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{t('medicationsSupplementsHeader')}</span>
                      </div>
                      <ul className="space-y-1 text-slate-700 text-xs">
                        {activeSectionObj.prescribed_meds?.map((med, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{med}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 4. Danger Signs & Immediate Referral Thresholds */}
                  <div className="bg-red-50/90 p-4 rounded-2xl border border-red-200 space-y-1 text-xs">
                    <div className="text-[11px] font-extrabold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>{t('dangerSignsHeader')}</span>
                    </div>
                    <p className="text-red-950 font-semibold leading-relaxed">
                      {activeSectionObj.danger_signs_alert}
                    </p>
                  </div>

                  {/* 5. Official Source Reference */}
                  <div className="p-3 bg-slate-100/70 rounded-2xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{t('officialSourcesHeader')}: </span>
                      <span>{activeSectionObj.official_source}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* VIEW 2: RAW OFFICIAL MARKDOWN */
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[620px] overflow-y-auto pr-1">
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[11px] whitespace-pre-wrap leading-relaxed shadow-inner">
                    {activeSectionObj.content}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs">
              Select a protocol guideline from the left panel to inspect its content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
