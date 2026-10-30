import AsyncStorage from '@react-native-async-storage/async-storage';
import * as initialVisitListData from '../data/visitList.json';
import { VisitItem, NewPatientFormData } from '../types';

const VISITS_STORAGE_KEY = 'caresphere_offline_visits';
const COMPLETED_VISITS_KEY = 'caresphere_completed_records';
const CUSTOM_PATIENTS_KEY = 'caresphere_custom_patients';

const rawVisits = initialVisitListData as any;
const INITIAL_VISITS: VisitItem[] = Array.isArray(rawVisits) ? rawVisits : (rawVisits.default || []);

/**
 * Initialize local offline visits repository.
 * Seeds with 346 pre-indexed visits from household_register.csv evaluated for target date 2026-10-26.
 */
export async function initializeDatabase(): Promise<VisitItem[]> {
  try {
    const stored = await AsyncStorage.getItem(VISITS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Seed initial dataset
    await AsyncStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(INITIAL_VISITS));
    return INITIAL_VISITS;
  } catch (err) {
    console.warn('Failed to read AsyncStorage, returning memory seed:', err);
    return INITIAL_VISITS;
  }
}

/**
 * Get all active visits with filtering by priority, village, and search
 */
export async function getVisitsOffline(filters?: {
  priority?: number;
  village?: string;
  category?: string;
  search?: string;
}): Promise<VisitItem[]> {
  const allVisits = await initializeDatabase();
  const completedStored = await AsyncStorage.getItem(COMPLETED_VISITS_KEY);
  const completedKeys: string[] = completedStored ? JSON.parse(completedStored) : [];

  let result = allVisits.filter(
    (v) => !completedKeys.includes(`${v.member_id}-${v.due_item}`) && !v.completed
  );

  if (filters?.priority !== undefined) {
    result = result.filter((v) => v.priority === filters.priority);
  }

  if (filters?.village && filters.village !== 'All') {
    result = result.filter((v) => v.village === filters.village);
  }

  if (filters?.category && filters.category !== 'All') {
    result = result.filter((v) => v.service_category === filters.category);
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.member_id.toLowerCase().includes(q) ||
        v.village.toLowerCase().includes(q) ||
        v.due_item.toLowerCase().includes(q)
    );
  }

  return result;
}

/**
 * Mark a visit as done with optional clinical observation notes, dispensed medicines, and follow-up date
 */
export async function completeVisitOffline(
  memberId: string,
  dueItem: string,
  details?: {
    notes?: string;
    dispensed_items?: { item: string; quantity: number }[];
    follow_up_date?: string;
  }
): Promise<void> {
  const key = `${memberId}-${dueItem}`;
  const stored = await AsyncStorage.getItem(COMPLETED_VISITS_KEY);
  const completedKeys: string[] = stored ? JSON.parse(stored) : [];
  if (!completedKeys.includes(key)) {
    completedKeys.push(key);
    await AsyncStorage.setItem(COMPLETED_VISITS_KEY, JSON.stringify(completedKeys));
  }

  // Update in stored visits
  const storedVisitsStr = await AsyncStorage.getItem(VISITS_STORAGE_KEY);
  if (storedVisitsStr) {
    const visits: VisitItem[] = JSON.parse(storedVisitsStr);
    const updated = visits.map((v) => {
      if (v.member_id === memberId && v.due_item === dueItem) {
        return {
          ...v,
          completed: true,
          completed_at: new Date().toISOString(),
          notes: details?.notes,
          dispensed_items: details?.dispensed_items,
          follow_up_date: details?.follow_up_date
        };
      }
      return v;
    });
    await AsyncStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(updated));
  }
}

/**
 * Register a new patient on the fly in the field and auto-assign triage priority:
 * P1 if BP >= 140/90, Hb < 7.0 g/dL, MUAC < 11.5 cm, birth weight < 2.0 kg, or danger signs checked.
 */
export async function registerNewPatientOffline(formData: NewPatientFormData): Promise<VisitItem> {
  let priority = 2;
  let dueItem = 'General Health Checkup';
  let category = 'Routine';

  const bpHigh =
    (typeof formData.bpSystolic === 'number' && formData.bpSystolic >= 140) ||
    (typeof formData.bpDiastolic === 'number' && formData.bpDiastolic >= 90);
  const hbSevere = typeof formData.hbLevel === 'number' && formData.hbLevel < 7.0;
  const muacSevere = typeof formData.muacCm === 'number' && formData.muacCm < 11.5;
  const lbwSevere = typeof formData.birthWeightKg === 'number' && formData.birthWeightKg < 2.0;

  if (formData.hasDangerSigns || bpHigh || hbSevere || muacSevere || lbwSevere) {
    priority = 1;
  }

  switch (formData.clinicalTrack) {
    case 'anc':
      dueItem = 'Antenatal Check-up (ANC-1.2)';
      category = 'Antenatal Care';
      break;
    case 'infant':
      dueItem = formData.immunizationDue || 'HBNC Newborn Care (HBNC-1.1)';
      category = 'Child Immunization';
      break;
    case 'malnutrition':
      dueItem = muacSevere ? 'SAM Severe Acute Malnutrition (NUT-1.2)' : 'Child Growth Monitoring (NUT-1.1)';
      category = 'Malnutrition (MUAC)';
      break;
    case 'ncd':
      dueItem = bpHigh ? 'High BP Screening ≥ 140/90 (NCD-1.1)' : 'Adult NCD Screening (NCD-1.2)';
      category = 'Non-Communicable Diseases (NCD)';
      break;
  }

  const newMemberId = `MEM-CUSTOM-${Date.now().toString().slice(-4)}`;
  const newVisit: VisitItem = {
    member_id: newMemberId,
    name: formData.name,
    age: formData.age ? String(formData.age) : '24',
    gender: formData.gender,
    village: formData.village,
    household_id: formData.houseNo,
    due_item: dueItem,
    priority,
    service_category: category,
    asha_id: 'ASHA-CHANDRAPURI',
    phone: '9800000000',
    notes: formData.symptoms
  };

  const storedVisitsStr = await AsyncStorage.getItem(VISITS_STORAGE_KEY);
  const currentVisits: VisitItem[] = storedVisitsStr ? JSON.parse(storedVisitsStr) : INITIAL_VISITS;
  const updatedVisits = [newVisit, ...currentVisits];
  await AsyncStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(updatedVisits));

  // Also log to custom patient register
  const customStr = await AsyncStorage.getItem(CUSTOM_PATIENTS_KEY);
  const customPatients: VisitItem[] = customStr ? JSON.parse(customStr) : [];
  customPatients.unshift(newVisit);
  await AsyncStorage.setItem(CUSTOM_PATIENTS_KEY, JSON.stringify(customPatients));

  return newVisit;
}

export async function getCompletedCount(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(COMPLETED_VISITS_KEY);
    return stored ? JSON.parse(stored).length : 0;
  } catch {
    return 0;
  }
}
