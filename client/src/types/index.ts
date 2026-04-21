export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ── Exactly 5 statuses as required ──────────────────────────────────────────
export type JobStatus =
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface JobApplication {
  _id: string;
  userId: string;
  companyName: string;
  position: string;
  description?: string;
  jobDescriptionLink?: string;
  status: JobStatus;
  appliedDate: string;
  lastUpdated: string;
  notes?: string;
  salaryRange?: string;
  resumeBullets?: string[];
  parsedData?: {
    companyName?: string;
    role?: string;
    requiredSkills?: string[];
    niceToHaveSkills?: string[];
    seniority?: string;
    location?: string;
    salaryRange?: string;
  };
}

export interface Resume {
  _id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Status config — single source of truth for labels & colours ─────────────
export const JOB_STATUSES: {
  value: JobStatus;
  label: string;
  hex: string;
}[] = [
  { value: 'applied',      label: 'Applied',      hex: '#38bdf8' },
  { value: 'phone_screen', label: 'Phone Screen', hex: '#a78bfa' },
  { value: 'interview',    label: 'Interview',    hex: '#fbbf24' },
  { value: 'offer',        label: 'Offer',        hex: '#34d399' },
  { value: 'rejected',     label: 'Rejected',     hex: '#f87171' },
];

export function getStatusConfig(status: JobStatus) {
  return JOB_STATUSES.find((s) => s.value === status) ?? JOB_STATUSES[0];
}
