import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { VisitItem } from '../types';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { saveRegisteredMemberToDB, getAllRegisteredMembersFromDB, saveCompletedVisitLogToDB } from '../services/db';

export interface DispensedMedicineItem {
  item: string;
  quantity: number;
}

export interface CompletedVisitRecord {
  id: string; // `${member_id}::${due_item}`
  member_id: string;
  name: string;
  relation: string;
  sex: string;
  dob?: string;
  village: string;
  house_no: string;
  household_id: string;
  asha_id?: string;
  head_name?: string;
  due_item: string;
  service_category: string;
  priority: number;
  priority_label?: string;
  completed_at: string;
  completed_display_time: string;
  notes?: string;
  dispensed_items?: DispensedMedicineItem[];
  follow_up_date?: string;
  raw_visit?: VisitItem;
}

interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'undo' | 'info';
}

export interface NewPatientFormData {
  name: string;
  gender: string;
  age?: number;
  dob?: string;
  village: string;
  house_no: string;
  household_id?: string;
  category: string;
  lmp_date?: string;
  edd?: string;
  birth_weight_kg?: string;
  last_muac_cm?: string;
  systolic_bp?: string;
  diastolic_bp?: string;
  blood_sugar_mg_dl?: string;
  symptoms?: string;
  priority: number;
  due_item: string;
}

interface VisitContextType {
  completedRecords: CompletedVisitRecord[];
  customRegisteredVisits: VisitItem[];
  completeVisit: (
    visit: VisitItem,
    details?: string | {
      notes?: string;
      dispensed_items?: DispensedMedicineItem[];
      follow_up_date?: string;
    }
  ) => void;
  registerNewPatient: (formData: NewPatientFormData) => Promise<VisitItem>;
  reopenVisit: (idOrMemberId: string, dueItem?: string) => void;
  isCompleted: (memberId: string, dueItem?: string) => boolean;
  clearAllCompleted: () => void;
  // Derived counts
  completedCount: number;
  completedP1Count: number;
  completedP2Count: number;
  completedP3Count: number;
  activePendingTotal: number;
  activeP1Pending: number;
  activeP2Pending: number;
  activeP3Pending: number;
  progressPercent: number;
}

const VisitContext = createContext<VisitContextType | undefined>(undefined);

const STORAGE_KEY_RECORDS = 'caresphere_completed_records_v2';
const STORAGE_KEY_CUSTOM_VISITS = 'caresphere_custom_registered_visits';

// Total baseline counts from Chandrapuri household register
const BASELINE_TOTAL = 346;
const BASELINE_P1 = 28;
const BASELINE_P2 = 237;
const BASELINE_P3 = 81;

export const VisitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Initialize completed records from localStorage
  const [completedRecords, setCompletedRecords] = useState<CompletedVisitRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load completed visits from localStorage:', e);
      return [];
    }
  });

  // Custom registered visits on-the-fly
  const [customRegisteredVisits, setCustomRegisteredVisits] = useState<VisitItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_VISITS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load from IndexedDB on startup
  useEffect(() => {
    getAllRegisteredMembersFromDB().then((members) => {
      if (members && members.length > 0) {
        setCustomRegisteredVisits((prev) => {
          const map = new Map<string, VisitItem>();
          prev.forEach((v) => map.set(v.member_id, v));
          members.forEach((m) => {
            if (!map.has(m.member_id)) {
              map.set(m.member_id, m);
            }
          });
          return Array.from(map.values());
        });
      }
    });
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(completedRecords));
    } catch (e) {
      console.error('Failed to save completed visits to localStorage:', e);
    }
  }, [completedRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_VISITS, JSON.stringify(customRegisteredVisits));
    } catch (e) {
      console.error('Failed to save custom visits to localStorage:', e);
    }
  }, [customRegisteredVisits]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'undo' | 'info' = 'success') => {
    setToast({
      id: Date.now(),
      message,
      type
    });
  };

  const isCompleted = (memberId: string, dueItem?: string): boolean => {
    if (dueItem) {
      const targetId = `${memberId}::${dueItem}`;
      return completedRecords.some((r) => r.id === targetId || (r.member_id === memberId && r.due_item === dueItem));
    }
    return completedRecords.some((r) => r.member_id === memberId);
  };

  const completeVisit = (
    visit: VisitItem,
    details?: string | {
      notes?: string;
      dispensed_items?: DispensedMedicineItem[];
      follow_up_date?: string;
    }
  ) => {
    const recordId = `${visit.member_id}::${visit.due_item}`;
    
    // Prevent double completion
    if (isCompleted(visit.member_id, visit.due_item)) {
      return;
    }

    const now = new Date();
    const displayTime = now.toLocaleDateString(language === 'te' ? 'te-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let notesText: string | undefined = undefined;
    let dispensed: DispensedMedicineItem[] | undefined = undefined;
    let followUp: string | undefined = undefined;

    if (typeof details === 'string') {
      notesText = details;
    } else if (details && typeof details === 'object') {
      notesText = details.notes;
      dispensed = details.dispensed_items;
      followUp = details.follow_up_date;
    }

    const newRecord: CompletedVisitRecord = {
      id: recordId,
      member_id: visit.member_id,
      name: visit.name,
      relation: visit.relation,
      sex: visit.sex,
      dob: visit.dob,
      village: visit.village,
      house_no: String(visit.house_no || visit.household_id || ''),
      household_id: String(visit.household_id || ''),
      asha_id: visit.asha_id,
      head_name: visit.head_name,
      due_item: visit.due_item,
      service_category: visit.service_category,
      priority: visit.priority,
      priority_label: visit.priority_label,
      completed_at: now.toISOString(),
      completed_display_time: displayTime,
      notes: notesText,
      dispensed_items: dispensed,
      follow_up_date: followUp,
      raw_visit: visit
    };

    setCompletedRecords((prev) => [newRecord, ...prev]);
    saveCompletedVisitLogToDB(newRecord);

    const successMsg = language === 'te'
      ? `${visit.name} (${visit.due_item}) కోసం సందర్శన పూర్తయింది`
      : language === 'hi'
      ? `${visit.name} (${visit.due_item}) के लिए गृह भ्रमण पूर्ण चिह्नित किया गया`
      : `Visit for ${visit.name} (${visit.due_item}) marked as completed`;
    showToast(successMsg, 'success');
  };

  const registerNewPatient = async (formData: NewPatientFormData): Promise<VisitItem> => {
    const timestamp = Date.now().toString().slice(-5);
    const newMemberId = `MEM-REG-${timestamp}`;
    const newHouseId = formData.household_id || `HH-REG-${timestamp}`;

    const priorityLabel = formData.priority === 1 ? 'P1' : formData.priority === 2 ? 'P2' : 'P3';

    const newVisit: VisitItem = {
      member_id: newMemberId,
      due_item: formData.due_item || "Initial Clinical Evaluation & Health Card Registration",
      priority: formData.priority,
      priority_label: priorityLabel,
      service_category: formData.category,
      name: formData.name,
      relation: "Self / Newly Registered",
      sex: formData.gender,
      dob: formData.dob || (formData.age ? `${2026 - formData.age}-01-01` : '1995-01-01'),
      village: formData.village,
      asha_id: "ASHA-096P",
      household_id: newHouseId,
      house_no: formData.house_no,
      head_name: formData.name,
      lmp_date: formData.lmp_date,
      edd: formData.edd,
      birth_weight_kg: formData.birth_weight_kg,
      last_muac_cm: formData.last_muac_cm,
      last_bp_reading: formData.systolic_bp && formData.diastolic_bp ? `${formData.systolic_bp}/${formData.diastolic_bp}` : undefined,
      last_rbs_mg_dl: formData.blood_sugar_mg_dl
    };

    setCustomRegisteredVisits((prev) => [newVisit, ...prev]);
    await saveRegisteredMemberToDB(newVisit);

    const toastMsg = language === 'te'
      ? `కొత్త రోగి ${formData.name} విజయవంతంగా నమోదు చేయబడింది (ప్రాధాన్యత ${formData.priority})`
      : language === 'hi'
      ? `नया रोगी ${formData.name} सफलतापूर्वक पंजीकृत हुआ (प्राथमिकता P${formData.priority})`
      : `New patient ${formData.name} registered successfully (Priority P${formData.priority})`;
    showToast(toastMsg, 'success');

    return newVisit;
  };

  const reopenVisit = (idOrMemberId: string, dueItem?: string) => {
    let targetName = '';
    setCompletedRecords((prev) => {
      const match = prev.find((r) => 
        dueItem 
          ? (r.id === `${idOrMemberId}::${dueItem}` || (r.member_id === idOrMemberId && r.due_item === dueItem))
          : (r.id === idOrMemberId || r.member_id === idOrMemberId)
      );
      if (match) {
        targetName = match.name;
      }
      return prev.filter((r) => 
        dueItem 
          ? (r.id !== `${idOrMemberId}::${dueItem}` && !(r.member_id === idOrMemberId && r.due_item === dueItem))
          : (r.id !== idOrMemberId && r.member_id !== idOrMemberId)
      );
    });

    const msg = language === 'te'
      ? `${targetName || idOrMemberId} కోసం సందర్శన తిరిగి ప్రారంభించబడింది`
      : language === 'hi'
      ? `${targetName || idOrMemberId} के लिए गृह भ्रमण पुनः खोला गया`
      : `Visit for ${targetName || idOrMemberId} reopened`;
    showToast(msg, 'undo');
  };

  const clearAllCompleted = () => {
    setCompletedRecords([]);
    try {
      localStorage.removeItem(STORAGE_KEY_RECORDS);
    } catch {}
    const msg = language === 'te'
      ? 'పూర్తయిన సందర్శనలన్నీ క్లియర్ చేయబడ్డాయి'
      : language === 'hi'
      ? 'पूर्ण किए गए सभी भ्रमण हटा दिए गए'
      : 'All completed visits cleared';
    showToast(msg, 'info');
  };

  // Synchronized Dynamic Metrics
  const {
    completedP1Count,
    completedP2Count,
    completedP3Count,
    activePendingTotal,
    activeP1Pending,
    activeP2Pending,
    activeP3Pending,
    progressPercent
  } = useMemo(() => {
    const totalDone = completedRecords.length;
    const p1Done = completedRecords.filter((r) => r.priority === 1).length;
    const p2Done = completedRecords.filter((r) => r.priority === 2).length;
    const p3Done = completedRecords.filter((r) => r.priority === 3).length;

    const customP1 = customRegisteredVisits.filter((v) => v.priority === 1).length;
    const customP2 = customRegisteredVisits.filter((v) => v.priority === 2).length;
    const customP3 = customRegisteredVisits.filter((v) => v.priority === 3).length;
    const customTotal = customRegisteredVisits.length;

    const basePlusCustomTotal = BASELINE_TOTAL + customTotal;
    const basePlusCustomP1 = BASELINE_P1 + customP1;
    const basePlusCustomP2 = BASELINE_P2 + customP2;
    const basePlusCustomP3 = BASELINE_P3 + customP3;

    const pendingTotal = Math.max(0, basePlusCustomTotal - totalDone);
    const p1Pending = Math.max(0, basePlusCustomP1 - p1Done);
    const p2Pending = Math.max(0, basePlusCustomP2 - p2Done);
    const p3Pending = Math.max(0, basePlusCustomP3 - p3Done);

    const progress = Math.min(100, Math.round((totalDone / Math.max(1, basePlusCustomTotal)) * 100));

    return {
      completedCount: totalDone,
      completedP1Count: p1Done,
      completedP2Count: p2Done,
      completedP3Count: p3Done,
      activePendingTotal: pendingTotal,
      activeP1Pending: p1Pending,
      activeP2Pending: p2Pending,
      activeP3Pending: p3Pending,
      progressPercent: progress
    };
  }, [completedRecords, customRegisteredVisits]);

  return (
    <VisitContext.Provider
      value={{
        completedRecords,
        customRegisteredVisits,
        completeVisit,
        registerNewPatient,
        reopenVisit,
        isCompleted,
        clearAllCompleted,
        completedCount: completedRecords.length,
        completedP1Count,
        completedP2Count,
        completedP3Count,
        activePendingTotal,
        activeP1Pending,
        activeP2Pending,
        activeP3Pending,
        progressPercent
      }}
    >
      {children}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <RotateCcw className="w-5 h-5 text-teal-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium leading-snug">
              {toast.message}
            </span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </VisitContext.Provider>
  );
};

export const useVisits = (): VisitContextType => {
  const context = useContext(VisitContext);
  if (!context) {
    throw new Error('useVisits must be used within a VisitProvider');
  }
  return context;
};
