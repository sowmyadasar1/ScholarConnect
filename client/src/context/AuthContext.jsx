import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
      return;
    }

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
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for token from OAuth callback (query param) or localStorage
    const params = new URLSearchParams(window.location.search);
    const tokenFromCallback = params.get('token');
    if (tokenFromCallback) {
      localStorage.setItem('token', tokenFromCallback);
      // Clean URL without triggering a navigation
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    fetchCurrentUser();
  }, [fetchCurrentUser]);


  const register = async (email, password, name) => {
    const res = await api.post('/auth/register', { email, password, name });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return { success: true };
  };

  const loginWithEmail = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return { success: true };
  };

  const loginWithGitHub = () => {
    const apiBase = import.meta.env.VITE_API_URL;
    const backendRoot = apiBase ? apiBase.replace(/\/api\/?$/, '') : 'https://scholarconnect-fpsg.onrender.com';
    window.location.href = `${backendRoot}/api/auth/github`;
  };

  const loginWithGoogle = () => {
    const apiBase = import.meta.env.VITE_API_URL;
    const backendRoot = apiBase ? apiBase.replace(/\/api\/?$/, '') : 'https://scholarconnect-fpsg.onrender.com';
    window.location.href = `${backendRoot}/api/auth/google`;
  };

  const syncGitHub = async () => {
    try {
      const res = await api.post('/auth/github/sync');
      const updatedSkills = res.data.skills;
      setUser(prev => ({ ...prev, skills: updatedSkills }));
      return { success: true, skills: updatedSkills, repos_scanned: res.data.repos_scanned };
    } catch (err) {
      console.error('syncGitHub failed:', err);
      throw err;
    }
  };

  const updateProfile = async (updates) => {
    try {
      const res = await api.put('/auth/profile', updates);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      console.error('updateProfile failed:', err);
      throw err;
    }
  };

  const addSkills = async (skills) => {
    const res = await api.post('/auth/skills', { skills });
    return res.data;
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

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  return (
    <AuthContext.Provider value={{
      user, loading,
      register, loginWithEmail, loginWithGitHub, loginWithGoogle,
      syncGitHub, refreshProfile, updateProfile, addSkills, logout, deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
