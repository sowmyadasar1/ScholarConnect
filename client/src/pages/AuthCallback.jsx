import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

/**
 * AuthCallback Component
 * 
 * Handles processing of OAuth tokens from URL query parameters.
 * Saves the token, initializes the user state, and redirects.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const onboarding = params.get('onboarding') === 'true';

    if (token) {
      console.log('[AuthCallback] Token found, saving...');
      localStorage.setItem('token', token);
      
      // We don't need to do anything else here because AuthContext has its own 
      // useEffect that also checks for the token on mount. 
      // However, to be extra safe and provide a better UX, we'll wait for 
      // the user state to populate.
    } else if (!localStorage.getItem('token')) {
      console.error('[AuthCallback] No token found in URL or localStorage');
      navigate('/login?error=no_token');
    }
  }, [location, navigate]);

  // Once loading is false and user is set, we can redirect
  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log('[AuthCallback] User authenticated, redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      } else {
        // If loading finished but no user, the token was likely invalid
        console.error('[AuthCallback] Loading finished but no user found');
        // navigate('/login?error=auth_failed');
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
