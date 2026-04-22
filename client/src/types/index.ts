export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type JobStatus = 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  _id: string;
  userId: string;
  companyName: string;
  position: string;
  description: string;
  jobDescriptionLink?: string;
  status: JobStatus;
  appliedDate: string;
  lastUpdated: string;
  notes: string;
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
  content?: string;       // legacy text-based resumes
  filename?: string;
  originalName?: string;
  filepath?: string;      // e.g. uploads/resumes/xxx.pdf
  size?: number;          // bytes
  mimeType?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const JOB_STATUSES: { value: JobStatus; label: string; color: string; hex: string }[] = [
  { value: 'applied',      label: 'Applied',      color: 'sky',     hex: '#38bdf8' },
  { value: 'phone_screen', label: 'Phone Screen', color: 'violet',  hex: '#a78bfa' },
  { value: 'interview',    label: 'Interview',    color: 'amber',   hex: '#fbbf24' },
  { value: 'offer',        label: 'Offer',        color: 'emerald', hex: '#34d399' },
  { value: 'rejected',     label: 'Rejected',     color: 'rose',    hex: '#f87171' },
];

export function getStatusConfig(status: JobStatus) {
  return JOB_STATUSES.find((s) => s.value === status) ?? JOB_STATUSES[0];
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
