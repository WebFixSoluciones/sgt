export interface FormFieldOption {
  id: string;
  label: string;
  value: string; // e.g., "1", "2", "3", "0", "4"
  isDefault?: boolean;
}

export type FormFieldType = 
  | 'radio' 
  | 'checkbox' 
  | 'select' 
  | 'text' 
  | 'textarea' 
  | 'page_break';

export interface FormField {
  id: string;
  name?: string;
  type: FormFieldType;
  label: string;
  description?: string;
  required: boolean;
  order: number;
  options?: FormFieldOption[];
  showValues?: boolean;
  allowOther?: boolean;
  placeholder?: string;
  sectionTitle?: string; // used when type === 'page_break' or section header
}

export interface FormSchema {
  id: string;
  title: string;
  code: string;
  description?: string;
  company?: string;
  isTemplate: boolean;
  category?: 'psicosocial' | 'estres' | 'lips60' | 'nocturno' | 'general';
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationCampaign {
  id: string;
  code: string; // Used in URL: /evaluar/[code]
  title: string;
  company: string;
  formId: string;
  expectedParticipants: number;
  status: 'active' | 'inactive';
  groupId?: string; // Links chained evaluations
  groupOrder?: number; // 1, 2, 3...
  nextEvaluationCode?: string; // Auto-transition to next survey
  visits: number;
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerSubmission {
  id: string; // e.g. "6592"
  evaluationCode: string;
  workerCode: string; // e.g. "5555"
  status: 'in_progress' | 'completed';
  currentFieldIndex: number;
  currentSectionTitle: string;
  answers: Record<string, string | number>; // fieldId -> stored value
  ip: string;
  userAgent: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface EvaluationGroup {
  id: string;
  name: string;
  company: string;
  evaluationCodes: string[]; // Ordered list of evaluation codes
  createdAt: string;
}
