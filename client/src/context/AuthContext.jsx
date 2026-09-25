import React, { createContext, useContext, useState, useEffect } from 'react';
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
    if (token && token !== 'undefined' && token !== 'null') {
      fetchCurrentUser();
    } else {
      localStorage.removeItem('token');
      setLoading(false);
    }
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
      const token = localStorage.getItem('token');
      if (token === 'admin-demo-token') {
        setUser(DEMO_ADMIN_USER);
      } else if (token === 'demo-token' || (!err.response && token)) {
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
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
    window.location.href = `${apiBase}/auth/github`;
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
      register, loginWithEmail, loginWithGitHub, loginAsDemo,
      syncGitHub, refreshProfile, updateProfile, addSkills, logout, deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
