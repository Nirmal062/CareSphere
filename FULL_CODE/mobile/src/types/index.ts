export type Language = 'en' | 'te' | 'hi';

export interface EscalationResult {
  escalate: boolean;
  section_id?: string;
  reason?: string;
}

export interface AskResponse {
  question: string;
  is_emergency: boolean;
  is_out_of_scope: boolean;
  escalate?: boolean;
  refused?: boolean;
  triage_priority?: number;
  status: 'EMERGENCY' | 'OUT_OF_SCOPE' | 'GROUNDED_ANSWER';
  answer: string;
  answer_en: string;
  answer_te?: string;
  answer_hi?: string;
  answer_language: Language;
  recommended_action: string;
  recommended_action_te?: string;
  recommended_action_hi?: string;
  urgency_level: 'CRITICAL' | 'CAUTION' | 'ROUTINE';
  condition?: string;
  condition_te?: string;
  condition_hi?: string;
  citations: string[];
  source_title?: string;
  source_title_te?: string;
  source_title_hi?: string;
  source_file?: string;
  source_excerpt?: string;
  latency_ms: number;
}

export interface VisitItem {
  member_id: string;
  due_item: string;
  priority: number;
  name: string;
  age: string;
  gender: string;
  household_id: string;
  village: string;
  asha_id: string;
  service_category: string;
  phone?: string;
  completed?: boolean;
  completed_at?: string;
  notes?: string;
  dispensed_items?: { item: string; quantity: number }[];
  follow_up_date?: string;
}

export interface ProtocolSection {
  section_id: string;
  title: string;
  full_title?: string;
  doc_filename?: string;
  doc_title?: string;
  target_timeline?: string;
  clinical_actions?: string[];
  mandatory_tests?: string[];
  prescribed_meds?: string[];
  danger_signs_alert?: string;
  official_source?: string;
  content: string;
}

export interface ProtocolDocument {
  filename: string;
  title: string;
  sections_count: number;
  sections: ProtocolSection[];
}

export interface NewPatientFormData {
  name: string;
  gender: string;
  age?: number | '';
  dob?: string;
  village: string;
  houseNo: string;
  clinicalTrack: 'anc' | 'infant' | 'malnutrition' | 'ncd';
  lmpDate?: string;
  eddDate?: string;
  bpSystolic?: number | '';
  bpDiastolic?: number | '';
  hbLevel?: number | '';
  birthWeightKg?: number | '';
  ageMonths?: number | '';
  immunizationDue?: string;
  muacCm?: number | '';
  randomBloodSugar?: number | '';
  symptoms?: string;
  hasDangerSigns?: boolean;
}
