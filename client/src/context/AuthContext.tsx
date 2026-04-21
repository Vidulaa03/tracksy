import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user:            User | null;
  isLoading:       boolean;
  isAuthenticated: boolean;
  login:   (email: string, password: string) => Promise<void>;
  signup:  (email: string, name: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { setIsLoading(false); return; }
    api.get('/auth/verify')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem('authToken'))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const r = await api.post('/auth/login', { email, password });
    localStorage.setItem('authToken', r.data.token);
    setUser(r.data.user);
  }

  async function signup(email: string, name: string, password: string) {
    const r = await api.post('/auth/signup', { email, name, password });
    localStorage.setItem('authToken', r.data.token);
    setUser(r.data.user);
  }

  async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('authToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
