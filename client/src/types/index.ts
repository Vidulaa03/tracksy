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
  linkedResumeId?: string | null;
  linkedResume?: LinkedResumeSummary | null;
  resumeHistory?: ResumeHistoryEntry[];
  events?: ApplicationEvent[];
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

export interface ApplicationEvent {
  stage: 'Phone Screen' | 'Interview' | 'Offer' | 'Custom';
  title: string;
  scheduledAt: string;
  notes?: string;
}

export interface LinkedResumeSummary {
  _id: string;
  title: string;
  originalName?: string;
  filepath?: string;
  atsScore?: number;
  updatedAt?: string;
  tags?: string[];
  targetRole?: string;
}

export interface ResumeHistoryEntry {
  _id: string;
  changedAt: string;
  oldResume: { _id: string; title: string } | null;
  newResume: { _id: string; title: string } | null;
}

export type ExperienceLevel = 'student' | 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';

export interface Resume {
  _id: string;
  userId: string;
  title: string;
  targetRole?: string;
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  tags?: string[];
  content?: string;       // legacy text-based resumes
  filename?: string;
  originalName?: string;
  filepath?: string;      // e.g. uploads/resumes/xxx.pdf
  size?: number;          // bytes
  mimeType?: string;
  atsScore?: number;
  isDefault: boolean;
  lastUsedAt?: string | null;
  linkedApplicationsCount?: number;
  applicationsUsedIn?: number;
  interviewCount?: number;
  offerCount?: number;
  successRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const JOB_STATUSES: { value: JobStatus; label: string; color: string; hex: string }[] = [
  { value: 'applied',      label: 'Applied',      color: 'sky',     hex: '#38bdf8' },
  { value: 'phone_screen', label: 'Screening',    color: 'violet',  hex: '#a78bfa' },
  { value: 'interview',    label: 'Interview',    color: 'amber',   hex: '#fbbf24' },
  { value: 'offer',        label: 'Accepted',     color: 'emerald', hex: '#34d399' },
  { value: 'rejected',     label: 'Archived',     color: 'rose',    hex: '#f87171' },
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
