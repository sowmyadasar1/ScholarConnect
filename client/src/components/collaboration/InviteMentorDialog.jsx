import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, Grid, Avatar,
  Stack, CircularProgress, MenuItem, Alert
} from '@mui/material';
import { UserCheck, Star, Clock, BookOpen } from 'lucide-react';
import axios from 'axios';

const InviteMentorDialog = ({ open, onClose, projectId, onInviteSent }) => {
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    mentorRole: 'Advisor',
    message: '',
    timeline: 'Monthly check-ins',
    frequency: 'Weekly'
  });
  const [sending, setSending] = useState(false);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/network/mentors');
      setMentors(res.data.mentors || []);
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMentors();
    }
  }, [open, fetchMentors]);

  const handleSendInvite = async () => {
    if (!selectedMentor) return;
    setSending(true);
    try {
      await axios.post('/api/network/invite-mentor', {
        projectId,
        mentorId: selectedMentor.mentor_id,
        ...inviteForm
      });
      onInviteSent && onInviteSent();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send mentor invite');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6 } }}>
      <DialogTitle sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={900}>Invite Project Mentor</Typography>
        <Typography variant="body2" color="text.secondary">Invite a previously matched mentor to guide this project.</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4, pt: 0 }}>
        {!selectedMentor ? (
          <Box>
            {loading ? (
              <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
            ) : mentors.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                No mentors found in your network. Match with a mentor first!
              </Alert>
            ) : (
              <Stack spacing={2}>
                {mentors.map(mentor => (
                  <Box 
                    key={mentor.id}
                    onClick={() => setSelectedMentor(mentor)}
                    sx={{ 
                      p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)',
                      cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 2,
                      '&:hover': { bgcolor: 'rgba(245, 166, 35, 0.05)', borderColor: '#f5a623' }
                    }}
                  >
                    <Avatar src={mentor.avatar_url} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography fontWeight={800}>{mentor.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Accepted Mentor</Typography>
                    </Box>
                    <Star size={18} color="#f5a623" />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        ) : (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'rgba(245, 166, 35, 0.05)', borderRadius: 3 }}>
              <Avatar src={selectedMentor.avatar_url} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={800}>{selectedMentor.name}</Typography>
                <Typography variant="caption" color="text.secondary">Project Mentor Candidate</Typography>
              </Box>
              <Button size="small" onClick={() => setSelectedMentor(null)}>Change</Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  select fullWidth label="Mentor Role" variant="filled"
                  value={inviteForm.mentorRole} onChange={e => setInviteForm({...inviteForm, mentorRole: e.target.value})}
                >
                  {['Advisor', 'Technical Guide', 'Research Mentor', 'Reviewer'].map(r => (
                    <MenuItem key={r} value={r}>{r}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  fullWidth label="Check-in Frequency" variant="filled"
                  value={inviteForm.frequency} onChange={e => setInviteForm({...inviteForm, frequency: e.target.value})}
                />
              </Grid>
            </Grid>

            <TextField 
              fullWidth multiline rows={3} label="What guidance is needed?" variant="filled"
              value={inviteForm.message} onChange={e => setInviteForm({...inviteForm, message: e.target.value})}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 0 }}>
        <Button onClick={onClose}>Cancel</Button>
        {selectedMentor && (
          <Button 
            variant="contained" 
            onClick={handleSendInvite} 
            disabled={sending}
            sx={{ borderRadius: 2, fontWeight: 800, background: '#f5a623', '&:hover': { background: '#e6951a' } }}
          >
            Invite as Mentor
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InviteMentorDialog;
