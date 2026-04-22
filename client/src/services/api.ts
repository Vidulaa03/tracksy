import axios from 'axios';
import { JobApplication, Resume, JobStatus } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

// ── Applications ─────────────────────────────────────────────────────────────
export const applicationsAPI = {
  getAll:       ()                                      => apiClient.get<JobApplication[]>('/applications'),
  getById:      (id: string)                            => apiClient.get<JobApplication>(`/applications/${id}`),
  create:       (data: Partial<JobApplication>)         => apiClient.post<JobApplication>('/applications', data),
  update:       (id: string, d: Partial<JobApplication>)=> apiClient.put<JobApplication>(`/applications/${id}`, d),
  delete:       (id: string)                            => apiClient.delete(`/applications/${id}`),
  updateStatus: (id: string, status: JobStatus)         => apiClient.patch<JobApplication>(`/applications/${id}/status`, { status }),
};

// ── Resumes ──────────────────────────────────────────────────────────────────
export const resumesAPI = {
  getAll:     ()                                 => apiClient.get<Resume[]>('/resumes'),
  getById:    (id: string)                       => apiClient.get<Resume>(`/resumes/${id}`),
  // PDF upload — uses FormData
  upload:     (file: File, title: string)        => {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    return apiClient.post<Resume>('/resumes/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // legacy text create
  create:     (data: Partial<Resume>)            => apiClient.post<Resume>('/resumes', data),
  // rename
  rename:     (id: string, title: string)        => apiClient.patch<Resume>(`/resumes/${id}`, { title }),
  // legacy full update
  update:     (id: string, d: Partial<Resume>)   => apiClient.put<Resume>(`/resumes/${id}`, d),
  setDefault: (id: string)                       => apiClient.patch<Resume>(`/resumes/${id}/default`),
  delete:     (id: string)                       => apiClient.delete(`/resumes/${id}`),
  // get file URL for preview / download
  fileUrl:    (filepath: string)                 => `${API_BASE}/${filepath}`,
};

// ── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  parseJobDescription:  (jobDescription: string)                           =>
    apiClient.post('/ai/parse-job', { jobDescription }),
  getResumeSuggestions: (resumeContent: string, jobDescription: string)    =>
    apiClient.post('/ai/resume-suggestions', { resumeContent, jobDescription }),
};
