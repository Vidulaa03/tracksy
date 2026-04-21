import axios from 'axios';
import { JobApplication, Resume, JobStatus } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

export const applicationsAPI = {
  getAll: () => apiClient.get<{ data: JobApplication[] }>('/applications'),
  getById: (id: string) => apiClient.get<{ data: JobApplication }>(`/applications/${id}`),
  create: (data: Partial<JobApplication>) => apiClient.post<{ data: JobApplication }>('/applications', data),
  update: (id: string, data: Partial<JobApplication>) =>
    apiClient.put<{ data: JobApplication }>(`/applications/${id}`, data),
  delete: (id: string) => apiClient.delete(`/applications/${id}`),
  updateStatus: (id: string, status: JobStatus) =>
    apiClient.patch<{ data: JobApplication }>(`/applications/${id}/status`, { status }),
};

export const resumesAPI = {
  getAll: () => apiClient.get<{ data: Resume[] }>('/resumes'),
  getById: (id: string) => apiClient.get<{ data: Resume }>(`/resumes/${id}`),
  create: (data: Partial<Resume>) => apiClient.post<{ data: Resume }>('/resumes', data),
  update: (id: string, data: Partial<Resume>) => apiClient.put<{ data: Resume }>(`/resumes/${id}`, data),
  delete: (id: string) => apiClient.delete(`/resumes/${id}`),
};

export const aiAPI = {
  parseJobDescription: (jobDescription: string) =>
    apiClient.post('/ai/parse-job', { jobDescription }),
  getResumeSuggestions: (resumeContent: string, jobDescription: string) =>
    apiClient.post('/ai/resume-suggestions', { resumeContent, jobDescription }),
};

export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    apiClient.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  verify: () =>
    apiClient.get('/auth/verify'),
};
