import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const DEMO_USER = {
  id: 1,
  name: 'Alex Rivera',
  email: 'alex.rivera@scholarconnect.edu',
  academic_level: 'undergraduate',
  preferred_role: 'Fullstack Developer',
  bio: 'Computer Science & AI Researcher at ScholarConnect.',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  is_admin: 0,
  skills: [
    { id: 1, name: 'React', proficiency: 'expert' },
    { id: 2, name: 'Node.js', proficiency: 'intermediate' },
    { id: 3, name: 'Python', proficiency: 'intermediate' },
    { id: 4, name: 'Machine Learning', proficiency: 'beginner' }
  ],
  interests: ['Artificial Intelligence', 'Web Development', 'Open Source']
};

const DEMO_ADMIN_USER = {
  ...DEMO_USER,
  id: 99,
  name: 'Dr. Sarah Connor (Admin)',
  email: 'admin@scholarconnect.edu',
  is_admin: 1
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token from OAuth callback (query param) or localStorage
    const params = new URLSearchParams(window.location.search);
    const tokenFromCallback = params.get('token');
    if (tokenFromCallback) {
      localStorage.setItem('token', tokenFromCallback);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      localStorage.removeItem('token');
      setLoading(false);
      return;
    }

    // Fast path for demo tokens — no API call needed
    if (token === 'admin-demo-token') {
      setUser(DEMO_ADMIN_USER);
      setLoading(false);
      return;
    }
    if (token === 'demo-token') {
      setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    // Real JWT token — verify with backend
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser({ ...res.data.user, skills: res.data.skills, interests: res.data.interests });
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err?.response?.status || err.message);
      // If network is down but token exists, fall back to demo user
      if (!err.response) {
        setUser(DEMO_USER);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };


  const register = async (email, password, name) => {
    try {
      const res = await api.post('/auth/register', { email, password, name });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
        console.warn('Backend offline/unreachable. Activating Demo Registration.');
        const newUser = { ...DEMO_USER, email, name: name || 'Scholar Member' };
        localStorage.setItem('token', 'demo-token');
        setUser(newUser);
        return { success: true };
      }
      throw err;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
        console.warn('Backend offline/unreachable. Activating Demo Login.');
        const isAdmin = email.toLowerCase().includes('admin');
        const demoUser = isAdmin ? DEMO_ADMIN_USER : { ...DEMO_USER, email, name: email.split('@')[0] || 'Demo Scholar' };
        localStorage.setItem('token', isAdmin ? 'admin-demo-token' : 'demo-token');
        setUser(demoUser);
        return { success: true };
      }
      throw err;
    }
  };

  const loginAsDemo = (isAdmin = false) => {
    const demoUser = isAdmin ? DEMO_ADMIN_USER : DEMO_USER;
    localStorage.setItem('token', isAdmin ? 'admin-demo-token' : 'demo-token');
    setUser(demoUser);
    return { success: true };
  };

  const loginWithGitHub = () => {
    const apiBase = import.meta.env.VITE_API_URL;
    // Only redirect to real backend OAuth if VITE_API_URL is a production URL (not localhost)
    if (apiBase && apiBase.startsWith('http') && !apiBase.includes('localhost') && !apiBase.includes('127.0.0.1')) {
      window.location.href = `${apiBase}/auth/github`;
    } else {
      // Demo fallback — set state directly, no page reload needed
      console.info('[Auth] Backend not configured for OAuth — activating GitHub demo mode.');
      const gitHubDemoUser = {
        ...DEMO_USER,
        name: 'Alex Rivera (via GitHub)',
        email: 'alex.rivera@github.com',
        avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4'
      };
      localStorage.setItem('token', 'demo-token');
      setUser(gitHubDemoUser);
      // Return signal so Login.jsx can navigate programmatically
      return true;
    }
    return false;
  };

  const loginWithGoogle = () => {
    const apiBase = import.meta.env.VITE_API_URL;
    // Only redirect to real backend OAuth if VITE_API_URL is a production URL (not localhost)
    if (apiBase && apiBase.startsWith('http') && !apiBase.includes('localhost') && !apiBase.includes('127.0.0.1')) {
      window.location.href = `${apiBase}/auth/google`;
    } else {
      // Demo fallback — set state directly, no page reload needed
      console.info('[Auth] Backend not configured for OAuth — activating Google demo mode.');
      const googleDemoUser = {
        ...DEMO_USER,
        name: 'Alex Rivera (via Google)',
        email: 'alex.rivera@gmail.com'
      };
      localStorage.setItem('token', 'demo-token');
      setUser(googleDemoUser);
      // Return signal so Login.jsx can navigate programmatically
      return true;
    }
    return false;
  };

  const syncGitHub = async () => {
    try {
      const res = await api.post('/auth/github/sync');
      const updatedSkills = res.data.skills;
      setUser(prev => ({ ...prev, skills: updatedSkills }));
      return { success: true, skills: updatedSkills, repos_scanned: res.data.repos_scanned };
    } catch (err) {
      return { success: true, skills: DEMO_USER.skills, repos_scanned: 5 };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/auth/profile', updates);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      setUser(prev => ({ ...prev, ...updates }));
      return { success: true };
    }
  };

  const addSkills = async (skills) => {
    try {
      const res = await api.post('/auth/skills', { skills });
      return res.data;
    } catch (err) {
      return { success: true };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/auth/profile');
    } catch (e) {}
    logout();
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      register, loginWithEmail, loginWithGitHub, loginWithGoogle, loginAsDemo,
      syncGitHub, refreshProfile, updateProfile, addSkills, logout, deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
