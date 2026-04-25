import axios from 'axios';
import { JobApplication, JobStatus, Resume } from '@/types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const applicationsAPI = {
  getAll: () => apiClient.get<JobApplication[]>('/applications'),
  getById: (id: string) => apiClient.get<JobApplication>(`/applications/${id}`),
  create: (data: Partial<JobApplication>) => apiClient.post<JobApplication>('/applications', data),
  update: (id: string, data: Partial<JobApplication>) => apiClient.put<JobApplication>(`/applications/${id}`, data),
  delete: (id: string) => apiClient.delete(`/applications/${id}`),
  updateStatus: (id: string, status: JobStatus) => apiClient.patch<JobApplication>(`/applications/${id}/status`, { status }),
};

export const resumesAPI = {
  getAll: () => apiClient.get<Resume[]>('/resumes'),
  getById: (id: string) => apiClient.get<Resume>(`/resumes/${id}`),
  upload: (file: File, title: string, metadata?: Partial<Resume>) => {
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    if (metadata) {
      form.append('metadata', JSON.stringify({
        targetRole: metadata.targetRole,
        skills: metadata.skills ?? [],
        experienceLevel: metadata.experienceLevel,
        tags: metadata.tags ?? [],
      }));
    }
    return apiClient.post<Resume>('/resumes/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  create: (data: Partial<Resume>) => apiClient.post<Resume>('/resumes', data),
  rename: (id: string, title: string) => apiClient.patch<Resume>(`/resumes/${id}`, { title }),
  update: (id: string, data: Partial<Resume>) => apiClient.put<Resume>(`/resumes/${id}`, data),
  setDefault: (id: string) => apiClient.patch<Resume>(`/resumes/${id}/default`),
  delete: (id: string) => apiClient.delete(`/resumes/${id}`),
  duplicate: (id: string) => apiClient.post<Resume>(`/resumes/${id}/duplicate`),
  replace: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post<Resume>(`/resumes/${id}/replace`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  fileUrl: (filepath: string) => `${API_BASE}/${filepath}`,
};

export const aiAPI = {
  parseJobDescription: (jobDescription: string) =>
    apiClient.post('/ai/parse-job', { jobDescription }),
  getResumeSuggestions: (jobDescription: string, resumeContent?: string) =>
    apiClient.post('/ai/resume-suggestions', { resumeContent, jobDescription }),
};

export default apiClient;
