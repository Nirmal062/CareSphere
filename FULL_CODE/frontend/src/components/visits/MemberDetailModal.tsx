import React, { useState, useEffect } from 'react';
import { X, User, Activity, ShieldCheck, Save, CheckCircle2, Clock } from 'lucide-react';
import { VisitItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface MemberDetailModalProps {
  visit: VisitItem | null;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ visit, onClose }) => {
  const { t, language } = useLanguage();
  const [fieldNote, setFieldNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  useEffect(() => {
    if (visit) {
      try {
        const notes = JSON.parse(localStorage.getItem('caresphere_visit_notes') || '{}');
        setFieldNote(notes[visit.member_id] || '');
        setNoteSaved(false);
      } catch {
        setFieldNote('');
      }
    }
  }, [visit]);

  if (!visit) return null;

  const handleSaveNote = () => {
    if (!visit) return;
    try {
      // 1. Save note to local storage map
      const notes = JSON.parse(localStorage.getItem('caresphere_visit_notes') || '{}');
      notes[visit.member_id] = fieldNote;
      localStorage.setItem('caresphere_visit_notes', JSON.stringify(notes));

      // 2. Add to pending sync queue
      const queue = JSON.parse(localStorage.getItem('caresphere_sync_queue') || '[]');
      const existingIdx = queue.findIndex((q: any) => q.member_id === visit.member_id);
      const queueItem = {
        member_id: visit.member_id,
        name: visit.name,
        due_item: visit.due_item,
        note: fieldNote,
        saved_at: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        queue[existingIdx] = queueItem;
      } else {
        queue.push(queueItem);
      }
      localStorage.setItem('caresphere_sync_queue', JSON.stringify(queue));

      setNoteSaved(true);
      setSyncStatus(`Saved locally to device (Sync Queue: ${queue.length} records)`);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch (e) {
      console.error('Error saving field note:', e);
    }
  };

  const getPriorityExplanation = () => {
    if (visit.priority === 1) {
      return {
        rule: "VIS-1 (High-Risk Case Escalation)",
        trigger: language === 'te' 
          ? "తీవ్ర రక్తహీనత (<7g/dL), అధిక రక్తపోటు (>=140/90), 42 రోజుల లోపు నవజాత శిశువు, లేదా తీవ్ర పోషకాహార లోపం (SAM)"
          : "Severe anaemia (Hb < 7 g/dL), elevated blood pressure (BP >= 140/90), newborn <= 42 days, or SAM (MUAC < 11.5 cm)",
        action: language === 'te'
          ? "ఈరోజు తక్షణ గృహ సందర్శన చేయండి; ప్రమాద సంకేతాలను తనిఖీ చేయండి; అవసరమైతే 108 అంబులెన్స్ ద్వారా ఆసుపత్రికి పంపండి."
          : "Execute immediate priority home visit today. Screen for danger signs and initiate 108 ambulance referral if unstable."
      };
    } else if (visit.priority === 2) {
      return {
        rule: "VIS-2 (Routine Due Services)",
        trigger: language === 'te'
          ? "2026-10-26 నాటికి గడువు దాటిన టీకాలు (UIP), సాధారణ ANC చెకప్ (36+ వారాలు), లేదా నెలవారీ ఫాలోఅప్"
          : "Routine due items overdue on 2026-10-26 (UIP immunization, scheduled 4th ANC at 36+ weeks, monthly follow-up)",
        action: language === 'te'
          ? "నిర్ణీత టీకా మోతాదును వేయించండి లేదా ప్రామాణిక ఆరోగ్య తనిఖీ నిర్వహించండి."
          : "Administer scheduled vaccine dose or perform standard protocol checkup during today's visit."
      };
    } else {
      return {
        rule: "VIS-3 (Upcoming Scheduled Visits)",
        trigger: language === 'te'
          ? "వచ్చే 6 రోజులలో (27 అక్టోబర్ - 01 నవంబర్ 2026) గడువు సమీపించే సేవలు"
          : "Immunization or visit window maturing in the next 6 days (27 Oct - 01 Nov 2026)",
        action: language === 'te'
          ? "కుటుంబ సభ్యులకు రాబోయే సెషన్ గురించి ముందస్తు సమాచారం ఇవ్వండి."
          : "Advance notification to beneficiary for the upcoming immunization session / home visit."
      };
    }
  };

  const explanation = getPriorityExplanation();

  const getPriorityBadgeText = (p: number) => {
    if (language === 'te') {
      return p === 1 ? 'ప్రాధాన్యత 1: తీవ్ర ప్రమాదం' : p === 2 ? 'ప్రాధాన్యత 2: సాధారణ గడువు' : 'ప్రాధాన్యత 3: రాబోయేవి';
    }
    return visit.priority_label;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl text-white shadow-xs ${
              visit.priority === 1 ? 'bg-red-600' : visit.priority === 2 ? 'bg-teal-600' : 'bg-slate-600'
            }`}>
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {visit.name} <span className="text-slate-400 font-normal font-mono text-xs">({visit.member_id})</span>
              </h3>
              <p className="text-xs text-slate-500">
                {visit.village} • {language === 'te' ? 'ఇంటి నంబర్' : 'Household'} #{visit.house_no || visit.household_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs sm:text-sm flex-1">
          {/* Priority & Due Service Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xs ${
            visit.priority === 1 
              ? 'bg-red-50/90 border-red-200 text-red-950' 
              : visit.priority === 2
              ? 'bg-teal-50/90 border-teal-200 text-teal-950'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                {language === 'te' ? 'చేయాల్సిన సేవ (Service Due)' : 'Service Due'}
              </div>
              <div className="font-extrabold text-base mt-0.5">{visit.due_item}</div>
              <div className="text-xs opacity-90">{visit.service_category}</div>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${
                visit.priority === 1 ? 'bg-red-600 text-white' : visit.priority === 2 ? 'bg-teal-700 text-white' : 'bg-slate-700 text-white'
              }`}>
                {getPriorityBadgeText(visit.priority)}
              </span>
            </div>
          </div>

          {/* Explainable Clinical Priority Justification (Phase 10) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>{t('explainablePriorityTitle')}</span>
            </div>
            
            <div className="text-xs space-y-1.5">
              <div>
                <span className="text-slate-500 font-medium">{t('protocolRuleRef')} </span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{explanation.rule}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">{t('ruleTriggerLabel')} </span>
                <span className="text-slate-800">{explanation.trigger}</span>
              </div>
              <div className="pt-1 text-slate-700 font-medium bg-white p-2.5 rounded-xl border border-slate-200/80">
                <strong>{t('recommendedActionHeader')}:</strong> {explanation.action}
              </div>
            </div>
          </div>

          {/* Demographic Information Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <span className="text-slate-400 text-[11px] block">{t('relationLabel')}</span>
              <span className="font-semibold text-slate-800">{visit.relation || "Self"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">{t('headLabel')}</span>
              <span className="font-semibold text-slate-800">{visit.head_name || "N/A"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">{t('genderLabel')}</span>
              <span className="font-semibold text-slate-800">{visit.sex}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">{t('dobLabel')}</span>
              <span className="font-semibold text-slate-800 font-mono text-xs">{visit.dob || "Unknown"}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">{t('assignedAsha')}</span>
              <span className="font-semibold text-slate-800 font-mono text-xs">{visit.asha_id}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">{t('householdIdLabel')}</span>
              <span className="font-semibold text-slate-800 font-mono text-xs">{visit.household_id}</span>
            </div>
          </div>

          {/* Clinical Indicators from Actual Dataset */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('clinicalHistoryHeader')}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {visit.pregnant && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-rose-600 text-[10px] block font-semibold uppercase">
                    {language === 'te' ? 'గర్భధారణ స్థితి' : 'Pregnancy Status'}
                  </span>
                  <span className="font-bold text-rose-950">Active Pregnant</span>
                  {visit.edd && <div className="text-[10px] text-rose-700 mt-0.5">EDD: {visit.edd}</div>}
                </div>
              )}

              {visit.last_hb_gdl && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                    {language === 'te' ? 'హిమోగ్లోబిన్ (Hb)' : 'Haemoglobin (Hb)'}
                  </span>
                  <span className={`font-bold ${parseFloat(visit.last_hb_gdl) < 7 ? 'text-red-600 font-extrabold' : 'text-slate-900'}`}>
                    {visit.last_hb_gdl} g/dL
                  </span>
                  {parseFloat(visit.last_hb_gdl) < 7 && (
                    <div className="text-[10px] text-red-600 font-semibold">{language === 'te' ? 'తీవ్ర రక్తహీనత (P1)' : 'Severe Anaemia (P1)'}</div>
                  )}
                </div>
              )}

              {visit.last_bp_reading && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                    {language === 'te' ? 'రక్తపోటు (BP)' : 'Blood Pressure'}
                  </span>
                  <span className="font-bold text-slate-900">{visit.last_bp_reading}</span>
                </div>
              )}

              {visit.last_rbs_mg_dl && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                    {language === 'te' ? 'బ్లడ్ షుగర్ (RBS)' : 'Blood Sugar (RBS)'}
                  </span>
                  <span className="font-bold text-slate-900">{visit.last_rbs_mg_dl} mg/dL</span>
                </div>
              )}

              {visit.birth_weight_kg && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                    {language === 'te' ? 'పుట్టిన బరువు' : 'Birth Weight'}
                  </span>
                  <span className={`font-bold ${parseFloat(visit.birth_weight_kg) < 1.8 ? 'text-red-600' : 'text-slate-900'}`}>
                    {visit.birth_weight_kg} kg
                  </span>
                </div>
              )}

              {visit.last_muac_cm && (
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-500 text-[10px] block font-semibold uppercase">
                    {language === 'te' ? 'MUAC కొలత' : 'MUAC Reading'}
                  </span>
                  <span className="font-bold text-slate-900">{visit.last_muac_cm} cm</span>
                </div>
              )}
            </div>
          </div>

          {/* Frontline Field Notes & Offline Sync Queue (Phase 9) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Field Visit Notes & Observations:</span>
              </label>
              {noteSaved && (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved locally</span>
                </span>
              )}
            </div>

            <textarea
              value={fieldNote}
              onChange={(e) => setFieldNote(e.target.value)}
              placeholder="Record health observations, BP/Hb checks, or referral actions during home visit..."
              rows={2}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                {syncStatus || "Persisted locally to device queue"}
              </span>
              <button
                type="button"
                onClick={handleSaveNote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Chandrapuri Sub-Centre • Register 2026-10-26
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
