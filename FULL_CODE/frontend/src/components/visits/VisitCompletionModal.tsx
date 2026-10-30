import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  Pill, 
  FileText, 
  Plus, 
  Minus,
  PackageCheck
} from 'lucide-react';
import { VisitItem } from '../../types';
import { DispensedMedicineItem } from '../../context/VisitContext';
import { useLanguage } from '../../context/LanguageContext';

interface VisitCompletionModalProps {
  visit: VisitItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmComplete: (details: {
    notes?: string;
    dispensed_items?: DispensedMedicineItem[];
    follow_up_date?: string;
  }) => void;
  onSkipComplete: () => void;
}

const COMMON_DRUGS = [
  { 
    id: 'ifa', 
    name: 'IFA Red Tablets (60mg Fe + 500mcg FA)', 
    unit: 'tablets',
    quickPresets: [30, 60],
    defaultQty: 30, 
    icon: '💊' 
  },
  { 
    id: 'calcium', 
    name: 'Calcium 500mg Tablets (Take with meals)', 
    unit: 'tablets',
    quickPresets: [30, 60],
    defaultQty: 30, 
    icon: '🦴' 
  },
  { 
    id: 'ors', 
    name: 'ORS Packets (1 Liter sachet)', 
    unit: 'packets',
    quickPresets: [2, 4],
    defaultQty: 2, 
    icon: '💧' 
  },
  { 
    id: 'zinc', 
    name: 'Dispersible Zinc 20mg Tablets (14-day course)', 
    unit: 'tablets',
    quickPresets: [14],
    defaultQty: 14, 
    icon: '⚡' 
  },
  { 
    id: 'pcm', 
    name: 'Paracetamol 500mg Tablets', 
    unit: 'tablets',
    quickPresets: [10],
    defaultQty: 10, 
    icon: '🌡️' 
  },
];

export const VisitCompletionModal: React.FC<VisitCompletionModalProps> = ({
  visit,
  isOpen,
  onClose,
  onConfirmComplete,
  onSkipComplete
}) => {
  const { language } = useLanguage();
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Track selected medicines and quantities
  const [selectedMeds, setSelectedMeds] = useState<{ [id: string]: number }>({});

  if (!isOpen) return null;

  const toggleMed = (id: string, defaultQty: number) => {
    setSelectedMeds((prev) => {
      const next = { ...prev };
      if (next[id] !== undefined) {
        delete next[id];
      } else {
        next[id] = defaultQty;
      }
      return next;
    });
  };

  const updateQty = (id: string, delta: number) => {
    setSelectedMeds((prev) => {
      if (prev[id] === undefined) return prev;
      const newQty = Math.max(1, prev[id] + delta);
      return { ...prev, [id]: newQty };
    });
  };

  const setPresetQty = (id: string, qty: number) => {
    setSelectedMeds((prev) => ({
      ...prev,
      [id]: qty
    }));
  };

  const handleSaveAndComplete = () => {
    const dispensedList: DispensedMedicineItem[] = Object.entries(selectedMeds).map(([id, qty]) => {
      const def = COMMON_DRUGS.find((d) => d.id === id);
      return {
        item: `${def?.name || id} (${qty} ${def?.unit || 'units'})`,
        quantity: qty
      };
    });

    onConfirmComplete({
      notes: notes.trim() || undefined,
      dispensed_items: dispensedList.length > 0 ? dispensedList : undefined,
      follow_up_date: followUpDate || undefined
    });
    onClose();
  };

  const handleSkip = () => {
    onSkipComplete();
    onClose();
  };

  const isP1 = visit.priority === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border-[1.5px] border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b-[1.5px] border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#065f46] flex items-center justify-center border-[1.5px] border-emerald-300 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Complete Field Visit & Clinical Summary
              </h3>
              <p className="text-xs text-slate-500">
                Record observations, dispensed bag inventory, and schedule follow-up
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient & Visit Context Header Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border-[1.5px] border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div>
            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>{visit.name}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold ${
                isP1 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-900'
              }`}>
                {isP1 ? 'P1 High-Risk' : `Priority P${visit.priority}`}
              </span>
            </div>
            <div className="text-slate-500 mt-1">
              Member ID: <strong className="text-slate-700 font-mono">{visit.member_id}</strong> • {visit.village}, House #{visit.house_no || visit.household_id}
            </div>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Due Service Item</span>
            <span className="font-bold text-[#065f46] text-xs">{visit.due_item}</span>
          </div>
        </div>

        {/* 1. Field Clinical Observations (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#065f46]" />
            <span>Field Clinical Observations (Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Mother advised on nutrition and rest; infant gaining weight; no danger signs detected..."
            rows={3}
            className="w-full text-xs sm:text-sm p-3 rounded-2xl border-[1.5px] border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#065f46] text-slate-900 placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* 2. Medicines & Supplies Dispensed (Optional) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-[#065f46]" />
              <span>Medicines & Supplies Dispensed (ASHA Field Bag)</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">Quick-select presets</span>
          </div>

          <div className="space-y-2">
            {COMMON_DRUGS.map((drug) => {
              const isSelected = selectedMeds[drug.id] !== undefined;
              const qty = selectedMeds[drug.id] || drug.defaultQty;

              return (
                <div
                  key={drug.id}
                  className={`p-3 rounded-2xl border-[1.5px] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleMed(drug.id, drug.defaultQty)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <span className="text-base shrink-0">{drug.icon}</span>
                    <span className="truncate text-xs font-bold">{drug.name}</span>
                  </button>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1">
                      {drug.quickPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPresetQty(drug.id, preset)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                            isSelected && qty === preset
                              ? 'bg-[#065f46] text-white border-[#065f46]'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                          }`}
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>

                    {/* Stepper Counter */}
                    {isSelected && (
                      <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-xl border border-emerald-300 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQty(drug.id, -1)}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-extrabold text-[#065f46] min-w-5 text-center">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(drug.id, 1)}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Next Follow-up Date (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#065f46]" />
            <span>Next Scheduled Follow-up Date (Optional)</span>
          </label>
          <input
            type="date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border-[1.5px] border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#065f46] text-slate-900 bg-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t-[1.5px] border-slate-100">
          <button
            type="button"
            onClick={handleSkip}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl border-[1.5px] border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'te' ? 'నోట్స్ లేకుండా పూర్తయినట్లు గుర్తించండి (Skip)' : language === 'hi' ? 'बिना नोट्स के पूर्ण करें (Skip)' : 'Skip & Mark as Done'}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-transparent text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
            >
              {language === 'te' ? 'రద్దు చేయండి' : language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSaveAndComplete}
              className="px-5 py-2.5 rounded-2xl bg-[#065f46] hover:bg-[#044a37] text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{language === 'te' ? 'సేవ్ చేసి పూర్తయినట్లు గుర్తించండి' : language === 'hi' ? 'सुरक्षित करें व पूर्ण करें' : 'Save Summary & Complete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
