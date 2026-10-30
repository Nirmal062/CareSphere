export interface ValidationMetrics {
  primary_score: number;
  escalation_gate: string;
  escalation_recall: number;
  false_escalation_rate: number;
  refusal_accuracy: number;
  citation_accuracy: number;
  key_fact_coverage: number;
  visit_list_score: number;
}

export interface SystemFootprint {
  model_size_mb: number;
  peak_ram_mb: number;
  median_latency_ms: number;
}

export interface SystemStatus {
  status: string;
  offline_mode: boolean;
  block: string;
  evaluated_date: string;
  protocol_count: number;
  leaf_sections_count: number;
  validation_metrics: ValidationMetrics;
  footprint: SystemFootprint;
}

export interface EscalationResult {
  escalate: boolean;
  section_id?: string;
  reason?: string;
}

export interface EmergencyAction {
  name: string;
  number: string;
  description: string;
}

export interface AskResponse {
  question: string;
  is_emergency: boolean;
  is_out_of_scope: boolean;
  status: "EMERGENCY" | "OUT_OF_SCOPE" | "GROUNDED_ANSWER";
  answer: string;
  answer_en: string;
  answer_te?: string | null;
  answer_hi?: string | null;
  answer_language: string;
  recommended_action: string;
  recommended_action_te?: string | null;
  recommended_action_hi?: string | null;
  urgency_level: "CRITICAL" | "CAUTION" | "ROUTINE";
  urgency_label_te: string;
  urgency_label_hi?: string;
  condition?: string | null;
  condition_te?: string | null;
  condition_hi?: string | null;
  citations: string[];
  source_title?: string | null;
  source_title_te?: string | null;
  source_title_hi?: string | null;
  source_file?: string | null;
  source_excerpt?: string | null;
  emergency_contacts: EmergencyAction[];
  latency_ms: number;
}

export interface VisitItem {
  member_id: string;
  due_item: string;
  priority: number;
  priority_label: string;
  service_category: string;
  name: string;
  relation: string;
  sex: string;
  dob: string;
  village: string;
  asha_id: string;
  household_id: string;
  house_no: string;
  head_name: string;
  pregnant?: string;
  lmp_date?: string;
  edd?: string;
  last_anc_bp?: string;
  last_hb_gdl?: string;
  birth_weight_kg?: string;
  last_muac_cm?: string;
  last_bp_reading?: string;
  last_rbs_mg_dl?: string;
  ncd_condition?: string;
}

export interface VisitsResponse {
  evaluated_date: string;
  total_visits: number;
  total_matched: number;
  page: number;
  limit: number;
  counts: {
    priority_1: number;
    priority_2: number;
    priority_3: number;
    total: number;
  };
  items: VisitItem[];
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

export interface AshaWorker {
  asha_id: string;
  asha_name: string;
  villages: string;
}
