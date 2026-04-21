import axios from 'axios';
import { JobApplication, Resume, JobStatus } from '../types';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
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
  getAll:    ()                                => api.get<JobApplication[]>('/applications'),
  getById:   (id: string)                      => api.get<JobApplication>(`/applications/${id}`),
  create:    (data: Partial<JobApplication>)   => api.post<JobApplication>('/applications', data),
  update:    (id: string, data: Partial<JobApplication>) => api.put<JobApplication>(`/applications/${id}`, data),
  delete:    (id: string)                      => api.delete(`/applications/${id}`),
};

export const resumesAPI = {
  getAll:  ()                              => api.get<Resume[]>('/resumes'),
  getById: (id: string)                    => api.get<Resume>(`/resumes/${id}`),
  create:  (data: Partial<Resume>)         => api.post<Resume>('/resumes', data),
  update:  (id: string, data: Partial<Resume>) => api.put<Resume>(`/resumes/${id}`, data),
  delete:  (id: string)                    => api.delete(`/resumes/${id}`),
};

export const aiAPI = {
  parseJobDescription:  (jobDescription: string, resumeContent?: string) =>
    api.post('/ai/parse-job', { jobDescription, resumeContent }),
  getResumeSuggestions: (jobDescription: string, resumeContent?: string) =>
    api.post('/ai/resume-suggestions', { jobDescription, resumeContent: resumeContent ?? '' }),
};

export default api;
