import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Chip, Button,
  Avatar, Snackbar, Alert, Stack, CircularProgress, Divider, Tooltip
} from '@mui/material';
import { Briefcase, Star, AlertCircle } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { mentorService } from '../services/mentorService';
import VerifiedBadge from '../components/common/VerifiedBadge';

const Mentors = () => {
  const { searchQuery } = useOutletContext();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requested, setRequested] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadMentors();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const loadMentors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      if (searchQuery) {
        data = await mentorService.listMentors({ search: searchQuery });
        data = data.map(m => ({
          ...m,
          mentor_id: m.id,
          mentor_name: m.name,
          mentor_avatar: m.avatar_url,
          compatibility_score: 0,
          explanation: 'Search result'
        }));
      } else {
        data = await mentorService.getMatches();
      }
      data.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
      setMentors(data);
    } catch (err) {
      console.error('Failed to load mentors:', err);
      setError('Unable to load mentors. Please try a different search or check your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (mentorId, mentorName) => {
    try {
      await mentorService.requestMentor(mentorId);
      setRequested(prev => ({ ...prev, [mentorId]: true }));
      setSnack({ open: true, msg: `Request sent to ${mentorName}! They'll be notified.`, severity: 'success' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to send invite.';
      setSnack({
        open: true,
        msg: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg),
        severity: 'error'
      });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#4caf50';
    if (score >= 70) return '#5e6ad2';
    if (score >= 50) return '#ff9800';
    return '#9e9e9e';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 15, gap: 2 }}>
        <CircularProgress thickness={4} size={40} sx={{ color: '#5e6ad2' }} />
        <Typography variant="body2" color="text.secondary">Finding your best mentor matches...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<AlertCircle size={18} />}>
          {error}
        </Alert>
      )}

      {!error && mentors.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <AlertCircle size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
            <Typography variant="h5" sx={{ mb: 1 }}>No mentor matches yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              Add skills to your profile and sync your GitHub to get personalized mentor matches.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {mentors.map(mentor => {
          const mentorId = mentor.mentor_id || mentor.id;
          const score = mentor.compatibility_score || mentor.matchScore || 0;
          const name = mentor.mentor_name || mentor.name;
          const avatar = mentor.mentor_avatar || mentor.avatar_url;
          const skills = mentor.skills || [];

          return (
            <Grid item xs={12} key={mentorId}>
              <Card sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                alignItems: 'stretch',
                background: '#16181D',
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s',
                '&:hover': { borderColor: 'rgba(94, 106, 210, 0.4)', transform: 'translateY(-2px)' }
              }}>
                {/* Left: Avatar & ID */}
                <Box sx={{ 
                  p: 4, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  minWidth: 220, 
                  background: 'rgba(255,255,255,0.01)',
                  borderRight: { md: '1px solid rgba(255,255,255,0.05)' } 
                }}>
                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <Avatar
                      src={avatar}
                      sx={{ 
                        width: 100, height: 100, 
                        border: '3px solid #5e6ad2',
                        boxShadow: '0 8px 24px rgba(94, 106, 210, 0.2)' 
                      }}
                    >
                      {name?.[0] || 'M'}
                    </Avatar>
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: -2, 
                      right: -2, 
                    }}>
                      <VerifiedBadge size="md" label="Verified Mentor" />
                    </Box>
                  </Box>
                  <Typography variant="h5" fontWeight={800} sx={{ textAlign: 'center', mb: 0.5 }}>{name}</Typography>
                  <Typography variant="caption" sx={{ color: '#5e6ad2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {mentor.domain || 'Field Expert'}
                  </Typography>
                </Box>

                {/* Middle: Professional Details */}
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  <Stack direction="row" spacing={3} sx={{ mb: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom fontWeight={700} sx={{ textTransform: 'uppercase' }}>EXPERIENCE</Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Briefcase size={16} color="#5e6ad2" />
                        <Typography variant="body1" fontWeight={700}>{mentor.experience_years || 0} Years</Typography>
                      </Stack>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom fontWeight={700} sx={{ textTransform: 'uppercase' }}>WHY THIS MATCH</Typography>
                      <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.6 }}>
                        {mentor.explanation || 'Qualified mentor with relevant domain experience.'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom fontWeight={700} sx={{ textTransform: 'uppercase', mb: 2 }}>TOP EXPERTISE</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {skills.length > 0 ? skills.map((s, idx) => {
                        const prof = s.proficiency || 3;
                        const color = prof >= 4 ? '#f44336' : prof >= 3 ? '#ff9800' : '#4caf50';
                        return (
                          <Chip 
                            key={`${mentorId}-${idx}`} 
                            label={s.name || s} 
                            size="small" 
                            sx={{ 
                              background: 'rgba(255,255,255,0.03)', 
                              borderLeft: `3px solid ${color}`,
                              borderRadius: 1.5,
                              fontWeight: 600,
                              height: 28
                            }} 
                          />
                        );
                      }) : <Typography variant="caption" color="text.secondary">Expert Consultation</Typography>}
                    </Box>
                  </Box>
                </CardContent>

                {/* Right: Compatibility Score & CTA */}
                <Box sx={{ 
                  p: 4, 
                  minWidth: 180, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: 'rgba(94, 106, 210, 0.02)',
                  borderLeft: { md: '1px solid rgba(255,255,255,0.05)' } 
                }}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.1em' }}>MATCH</Typography>
                    <Typography variant="h2" fontWeight={900} sx={{ color: getScoreColor(Math.round(score)), lineHeight: 1 }}>{Math.round(score)}%</Typography>
                    
                    {(mentor.skill_match_score || mentor.domain_match_score) && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: 'center' }}>
                        {mentor.skill_match_score && (
                          <Tooltip title="Skill Overlap Score">
                            <Chip size="small" label={`S: ${Math.round(mentor.skill_match_score)}%`} sx={{ fontSize: '0.65rem', height: 20 }} />
                          </Tooltip>
                        )}
                        {mentor.domain_match_score && (
                          <Tooltip title="Domain Alignment Score">
                            <Chip size="small" label={`D: ${Math.round(mentor.domain_match_score)}%`} sx={{ fontSize: '0.65rem', height: 20 }} />
                          </Tooltip>
                        )}
                      </Stack>
                    )}
                  </Box>
                  
                  {(() => {
                    const isRequested = requested[mentorId] || mentor.status === 'requested';
                    const isAccepted = mentor.status === 'accepted';
                    const isRejected = mentor.status === 'rejected' || mentor.status === 'declined';
                    const isLocked = isRequested || isAccepted || isRejected;
                    
                    let label = 'CONNECT';
                    let bgStyle = 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)';
                    let borderColor = 'transparent';
                    
                    if (isAccepted) { label = '✓ MATCHED'; bgStyle = 'transparent'; borderColor = '#4caf50'; }
                    else if (isRequested) { label = 'REQUESTED'; bgStyle = 'transparent'; borderColor = '#f5a623'; }
                    else if (isRejected) { label = 'UNAVAILABLE'; bgStyle = 'transparent'; borderColor = 'rgba(255,255,255,0.1)'; }

                    return (
                      <Button
                        fullWidth
                        variant={isLocked ? 'outlined' : 'contained'}
                        disabled={isLocked}
                        onClick={() => handleRequest(mentorId, name)}
                        sx={{ 
                          borderRadius: 3, 
                          py: 1.5,
                          fontWeight: 800,
                          background: bgStyle,
                          borderColor,
                          boxShadow: isLocked ? 'none' : '0 8px 20px rgba(94, 106, 210, 0.2)',
                          color: isAccepted ? '#4caf50' : isRejected ? 'text.disabled' : undefined,
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })()}
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ open: false, msg: '', severity: 'success' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack({ open: false, msg: '', severity: 'success' })}>
          {typeof snack.msg === 'object' ? JSON.stringify(snack.msg) : String(snack.msg)}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Mentors;
