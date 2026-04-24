export const APP_NAME = 'Job Application Tracker';
export const APP_DESCRIPTION = 'AI-assisted job application tracking and resume management';

export const JOB_STATUSES = [
  {
    value: 'applied',
    label: 'Applied',
    color: 'sky',
    bg: 'bg-sky-100',
    border: 'border-sky-300',
    dot: 'bg-sky-500',
  },
  {
    value: 'phone_screen',
    label: 'Screening',
    color: 'violet',
    bg: 'bg-violet-100',
    border: 'border-violet-300',
    dot: 'bg-violet-500',
  },
  {
    value: 'interview',
    label: 'Interview',
    color: 'amber',
    bg: 'bg-amber-100',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
  },
  {
    value: 'offer',
    label: 'Accepted',
    color: 'emerald',
    bg: 'bg-emerald-100',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500',
  },
  {
    value: 'rejected',
    label: 'Archived',
    color: 'rose',
    bg: 'bg-rose-100',
    border: 'border-rose-300',
    dot: 'bg-rose-500',
  },
] as const;

export const JOB_APPLICATION_STATUSES = JOB_STATUSES;

export const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-800 border-blue-300',
  phone_screen: 'bg-violet-100 text-violet-800 border-violet-300',
  interview: 'bg-amber-100 text-amber-800 border-amber-300',
  offer: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
} as const;

export function getStatusConfig(status: typeof JOB_STATUSES[number]['value']) {
  return JOB_STATUSES.find((item) => item.value === status) ?? JOB_STATUSES[0];
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  DASHBOARD: '/dashboard',
  APPLICATIONS: '/dashboard/applications',
  RESUME: '/dashboard/resume',
} as const;
