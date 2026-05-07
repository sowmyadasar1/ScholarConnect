import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  Avatar, Stack, Alert, CircularProgress, Snackbar,
  useTheme, alpha
} from '@mui/material';
import { Layers, AlertCircle, UserPlus, Mail, Users, CheckCircle2 } from 'lucide-react';
import VerifiedBadge from '../components/common/VerifiedBadge';
import { useOutletContext } from 'react-router-dom';
import { teamService } from '../services/teamService';

const Teammates = () => {
  const { searchQuery } = useOutletContext();
  const theme = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invited, setInvited] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadSuggestions();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (searchQuery) {
        const { authService } = await import('../services/authService');
        const searchResult = await authService.searchUsers(searchQuery, 'teammate');
        data = (searchResult.users || []).map(u => ({
          ...u,
          suggested_user_id: u.id,
          compatibility_score: 0,
          explanation: 'Search result'
        }));
      } else {
        data = await teamService.getSuggestions();
      }
      setSuggestions(data || []);
    } catch (err) {
      console.error('Failed to load teammate suggestions:', err);
      setSuggestions([]);
      setError('Unable to load teammates. Please try a different search or complete your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId, userName) => {
    try {
      await teamService.sendInvite({ receiver_id: userId, message: `Hi ${userName}, I saw your profile on ScholarConnect and would love to collaborate on a project!` });
      setInvited(prev => ({ ...prev, [userId]: true }));
      setSnack({ open: true, msg: `Invite sent to ${userName}!`, severity: 'success' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to send invite.';
      setSnack({
        open: true,
        msg: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg),
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 15 }}>
        <CircularProgress thickness={4} size={40} sx={{ mb: 2, color: theme.palette.primary.main }} />
        <Typography variant="body2" color="text.secondary">Finding compatible teammates...</Typography>
      </Box>
    );
  }

  return (
    <Box>

      {error && (
        <Alert 
          severity="info" 
          sx={{ mb: 4, borderRadius: 3, background: alpha(theme.palette.info.main, 0.05), border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }} 
          icon={<AlertCircle size={20} />}
        >
          {typeof error === 'object' ? JSON.stringify(error) : String(error)}
        </Alert>
      )}

      {suggestions.length === 0 && !loading && (
        <Card sx={{ textAlign: 'center', py: 10, background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
          <CardContent>
            <Box sx={{ p: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', width: 'fit-content', mx: 'auto', mb: 3 }}>
              <Users size={48} color="rgba(255,255,255,0.1)" />
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>No recommendations yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 4 }}>
              Our AI engine needs more data to find your perfect match. Add your skills and research interests in settings to get started.
            </Typography>
            <Button variant="contained" onClick={() => window.location.href='/settings'} sx={{ borderRadius: 2, px: 4 }}>
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {suggestions.map((teammate) => {
          const id = teammate.suggested_user_id || teammate.id;
          const score = teammate.compatibility_score || 0;
          const name = teammate.name || 'Scholar';
          
          let skills = [];
          if (Array.isArray(teammate.skills)) {
            skills = teammate.skills;
          } else if (typeof teammate.skills === 'string') {
            try {
              skills = JSON.parse(teammate.skills);
            } catch (e) {
              skills = teammate.skills.split(',').map(s => s.trim());
            }
          }

          return (
            <Grid xs={12} lg={6} key={id}>
              <Card sx={{ 
                height: '100%', 
                background: '#16181D', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: 4,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', borderColor: 'rgba(94, 106, 210, 0.3)' }
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                      <Avatar 
                        src={teammate.avatar_url} 
                        sx={{ width: 56, height: 56, border: '2px solid #5e6ad2' }}
                      >
                        {name[0]}
                      </Avatar>
                      <Box>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <Typography variant="h5" fontWeight={700}>{name}</Typography>
                          <VerifiedBadge size="sm" label="Verified Scholar" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {teammate.preferred_role || 'Researcher'} • {teammate.academic_level || 'Postgraduate'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>MATCH</Typography>
                      <Typography variant="h4" fontWeight={800} color="#5e6ad2">{Math.round(score)}%</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 700, textTransform: 'uppercase' }}>
                      Complementary Skills
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {(teammate.complementary_skills || []).length > 0 ? teammate.complementary_skills.map((skill, sIdx) => (
                        <Chip 
                          key={`${id}-comp-${sIdx}`} 
                          label={skill} 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            borderRadius: 1.5, 
                            borderColor: 'rgba(94, 106, 210, 0.3)', 
                            background: 'rgba(94, 106, 210, 0.05)',
                            fontSize: '0.75rem',
                            color: '#5e6ad2'
                          }} 
                        />
                      )) : teammate.expertise ? (
                        teammate.expertise.split(',').map((skill, sIdx) => (
                          <Chip 
                            key={`${id}-exp-${sIdx}`} 
                            label={skill.trim()} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderRadius: 1.5, 
                              borderColor: 'rgba(255,255,255,0.1)', 
                              background: 'rgba(255,255,255,0.03)',
                              fontSize: '0.75rem'
                            }} 
                          />
                        ))
                      ) : skills.length > 0 ? (
                        skills.map((skill, sIdx) => (
                          <Chip 
                            key={`${id}-${skill.name || skill}-${sIdx}`} 
                            label={skill.name || skill} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderRadius: 1.5, 
                              borderColor: 'rgba(255,255,255,0.1)', 
                              background: 'rgba(255,255,255,0.03)',
                              fontSize: '0.75rem'
                            }} 
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Full-stack Academic
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  <Box sx={{ 
                    bgcolor: 'rgba(94, 106, 210, 0.05)', 
                    p: 2, 
                    borderRadius: 2, 
                    mb: 4, 
                    border: '1px solid rgba(94, 106, 210, 0.1)' 
                  }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                      <Layers size={18} color="#5e6ad2" style={{ marginTop: 2 }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {teammate.explanation || "This scholar's multidisciplinary background and expertise in adjacent domains perfectly balances your technical role."}
                      </Typography>
                    </Stack>
                  </Box>

                  <Button 
                    fullWidth 
                    variant="contained" 
                    disabled={invited[id]}
                    startIcon={invited[id] ? <CheckCircle2 size={18} /> : <Mail size={18} />}
                    onClick={() => handleInvite(id, name)}
                    sx={{ 
                      borderRadius: 3, 
                      py: 1.5,
                      background: invited[id] ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.05)',
                      color: invited[id] ? '#4caf50' : '#fff',
                      border: invited[id] ? '1px solid #4caf50' : '1px solid rgba(255,255,255,0.1)',
                      '&:hover': { background: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    {invited[id] ? 'Invite Sent' : 'Send Collaboration Invite'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Snackbar 
        open={snack.open} 
        autoHideDuration={4000} 
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Teammates;
