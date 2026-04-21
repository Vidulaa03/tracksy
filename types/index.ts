export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  resume?: string;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = 'applied' | 'phone_screen' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  userId: string;
  jobTitle: string;
  companyName: string;
  status: JobStatus;
  description: string;
  jobDescriptionLink?: string;
  applicationDate: string;
  notes?: string;
  salaryRange?: string;
  parsedData?: {
    companyName?: string;
    role?: string;
    requiredSkills?: string[];
    niceToHaveSkills?: string[];
    seniority?: string;
    location?: string;
    salaryRange?: string;
  };
  resumeBullets?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Resume {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface ParsedJobData {
  companyName: string;
  role: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  seniority: string;
  location: string;
  salaryRange?: string;
}

export interface ParseJobResponse {
  success: boolean;
  parsedData?: ParsedJobData;
  message: string;
}

export interface ResumeSuggestionResponse {
  success: boolean;
  bullets?: string[];
  message: string;
}
