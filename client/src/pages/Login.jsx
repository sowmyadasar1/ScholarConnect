import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import { GitBranch, Eye, EyeOff, BookOpen, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { loginWithGitHub, loginWithEmail, register } = useAuth();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState(0); // 0 for Login, 1 for Register
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailMode, setEmailMode] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError === 'github_failed') setError('GitHub authentication failed. Please try again.');
    if (urlError === 'google_failed') setError('Google authentication failed. Please try again.');
    if (urlError === 'session_expired') setError('Your session has expired. Please log in again.');
    if (urlError === 'no_token') setError('Authentication failed: No token received.');
  }, []);

  const handleEmailAction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (tab === 0) {
        await loginWithEmail(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Action failed.';
      if (msg.includes('already registered')) {
        setError('This email is already registered. If you used GitHub or Google, please sign in with those instead.');
      } else if (msg.includes('Invalid email or password')) {
        setError('Invalid email or password. Note: If you registered with GitHub/Google, email login is disabled unless you set a password in settings.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    setError(null);
    loginWithGitHub();
  };

  const handleGoogleLogin = () => {
    setError(null);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';
    window.location.href = `${apiBase}/auth/google`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #1a1c20 0%, #0e0f11 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Abstract Background Element */}
      <Box
        sx={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(94, 106, 210, 0.08) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
          zIndex: 0
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          elevation={0}
          sx={{
            background: 'rgba(22, 24, 29, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 4,
            p: 1
          }}
        >
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.5,
                  boxShadow: '0 8px 16px rgba(94, 106, 210, 0.3)'
                }}
              >
                <BookOpen size={24} color="white" />
              </Box>
              <Typography variant="h4" fontWeight={700} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
                ScholarConnect
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The academic platform for skill-based collaboration
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2, textAlign: 'left' }}>
                {error}
              </Alert>
            )}

            <Stack spacing={1.5}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<GitBranch size={20} />}
                onClick={handleGitHubLogin}
                sx={{
                  py: 1.2,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  background: 'white',
                  color: 'black',
                  '&:hover': { background: '#f0f0f0' },
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Continue with GitHub
              </Button>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="G" />}
                onClick={handleGoogleLogin}
                sx={{
                  py: 1.2,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  '&:hover': { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)' },
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Continue with Google
              </Button>

              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ px: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                  OR
                </Typography>
              </Divider>

              {!emailMode ? (
                <Button
                  variant="text"
                  fullWidth
                  onClick={() => setEmailMode(true)}
                  sx={{ color: 'text.secondary', fontWeight: 500 }}
                >
                  Sign in with email
                </Button>
              ) : (
                <Box>
                  <Tabs 
                    value={tab} 
                    onChange={(_, v) => setTab(v)} 
                    variant="fullWidth" 
                    sx={{ 
                      mb: 2.5,
                      '& .MuiTab-root': { color: 'text.secondary', fontWeight: 600, minHeight: 48 },
                      '& .Mui-selected': { color: '#5e6ad2' },
                      '& .MuiTabs-indicator': { backgroundColor: '#5e6ad2' }
                    }}
                  >
                    <Tab label="Login" icon={<LogIn size={18} />} iconPosition="start" />
                    <Tab label="Register" icon={<UserPlus size={18} />} iconPosition="start" />
                  </Tabs>

                  <form onSubmit={handleEmailAction}>
                    <Stack spacing={2}>
                      {tab === 1 && (
                        <TextField
                          fullWidth
                          label="Full Name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          variant="outlined"
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: 2, background: 'rgba(0,0,0,0.2)' }
                          }}
                        />
                      )}
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        variant="outlined"
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: 2, background: 'rgba(0,0,0,0.2)' }
                        }}
                      />
                      <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        variant="outlined"
                        size="small"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': { borderRadius: 2, background: 'rgba(0,0,0,0.2)' }
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{
                          py: 1.2,
                          borderRadius: 2,
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
                          boxShadow: '0 4px 12px rgba(94, 106, 210, 0.2)',
                          mt: 1
                        }}
                      >
                        {loading ? <CircularProgress size={24} color="inherit" /> : (tab === 0 ? 'Sign In' : 'Create Account')}
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => setEmailMode(false)}
                        sx={{ color: 'text.secondary', fontSize: '0.8rem' }}
                      >
                        Back to GitHub login
                      </Button>
                    </Stack>
                  </form>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Login;
