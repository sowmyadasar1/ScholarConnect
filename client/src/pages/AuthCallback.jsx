import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

/**
 * AuthCallback Component
 * 
 * Handles the OAuth redirect back from GitHub/Google.
 * The backend redirects here with ?token=<jwt>.
 * We save the token and trigger a profile refresh, then redirect to dashboard.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, refreshProfile } = useAuth();
  const hasTriggeredRefresh = useRef(false);

  useEffect(() => {
    if (hasTriggeredRefresh.current) return;
    
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      console.log('[AuthCallback] Token received from OAuth, saving and fetching profile...');
      localStorage.setItem('token', token);
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Trigger a profile fetch with the new token
      hasTriggeredRefresh.current = true;
      refreshProfile();
    } else if (!localStorage.getItem('token')) {
      console.error('[AuthCallback] No token found');
      navigate('/login?error=no_token', { replace: true });
    }
  }, [location, navigate, refreshProfile]);

  // Once loading finishes and user is populated, redirect to dashboard
  useEffect(() => {
    if (!loading && hasTriggeredRefresh.current) {
      if (user) {
        console.log('[AuthCallback] User authenticated! Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      } else {
        console.error('[AuthCallback] Authentication failed - no user after fetch');
        navigate('/login?error=auth_failed', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <CircularProgress size={60} thickness={4} sx={{ mb: 4 }} />
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Authenticating...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please wait while we sync your ScholarConnect profile.
      </Typography>
    </Box>
  );
};

export default AuthCallback;
