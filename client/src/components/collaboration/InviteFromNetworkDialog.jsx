import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, Grid, Avatar,
  Chip, Stack, CircularProgress, IconButton, Alert,
  MenuItem, Tooltip, Divider, Card, CardContent
} from '@mui/material';
import { 
  Search, 
  Zap, 
  Star, 
  UserPlus, 
  Info,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import axios from 'axios';

const InviteFromNetworkDialog = ({ open, onClose, projectId, onInviteSent }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteForm, setInviteForm] = useState({
    role: 'Fullstack',
    message: '',
    expectedContribution: '',
    timeline: 'Remainder of project'
  });
  const [sending, setSending] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/network/suggestions/${projectId}`);
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open && projectId) {
      fetchSuggestions();
    }
  }, [open, projectId, fetchSuggestions]);

  const handleSendInvite = async () => {
    if (!selectedUser) return;
    setSending(true);
    try {
      await axios.post('/api/network/invite-collaborator', {
        projectId,
        collaboratorId: selectedUser.collaborator_id,
        ...inviteForm
      });
      onInviteSent && onInviteSent();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6 } }}>
      <DialogTitle sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={900}>Invite from Your Network</Typography>
        <Typography variant="body2" color="text.secondary">Select from your past collaborators or smart suggestions.</Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4, pt: 0 }}>
        {!selectedUser ? (
          <Box>
            <Box sx={{ mb: 4, p: 2, borderRadius: 3, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Search size={20} color="rgba(255,255,255,0.2)" />
              <TextField 
                fullWidth variant="standard" placeholder="Search your network..."
                value={search} onChange={e => setSearch(e.target.value)}
                InputProps={{ disableUnderline: true }}
              />
            </Box>

            <Typography variant="subtitle2" fontWeight={800} color="#5e6ad2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Zap size={16} fill="#5e6ad2" /> Best Candidates for this Project
            </Typography>

            {loading ? (
              <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
            ) : (
              <Grid container spacing={2}>
                {suggestions.map(user => (
                  <Grid item xs={12} key={user.id}>
                    <Card 
                      onClick={() => setSelectedUser(user)}
                      sx={{ 
                        background: 'rgba(94, 106, 210, 0.03)', 
                        border: '1px solid rgba(94, 106, 210, 0.1)',
                        borderRadius: 3, cursor: 'pointer', transition: 'all 0.2s',
                        '&:hover': { background: 'rgba(94, 106, 210, 0.08)', transform: 'translateX(4px)' }
                      }}
                    >
                      <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={user.avatar_url} sx={{ width: 44, height: 44 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography fontWeight={800}>{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{user.explanation}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h6" fontWeight={900} color="#5e6ad2">
                            {Math.round(user.match_score * 100)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Fit Score</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, p: 2, bgcolor: 'rgba(94, 106, 210, 0.05)', borderRadius: 3 }}>
              <Avatar src={selectedUser.avatar_url} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={800}>Inviting {selectedUser.name}</Typography>
                <Typography variant="caption" color="text.secondary">Top Match • {Math.round(selectedUser.match_score * 100)}% Compatibility</Typography>
              </Box>
              <Button size="small" onClick={() => setSelectedUser(null)}>Change</Button>
            </Box>

            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField 
                    select fullWidth label="Role Requested" variant="filled"
                    value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                  >
                    {['Frontend', 'Backend', 'ML/AI', 'UI/UX', 'Research', 'Documentation'].map(r => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField 
                    fullWidth label="Expected Timeline" variant="filled"
                    value={inviteForm.timeline} onChange={e => setInviteForm({...inviteForm, timeline: e.target.value})}
                  />
                </Grid>
              </Grid>

              <TextField 
                fullWidth label="Requested Contribution" variant="filled" placeholder="e.g. Design the database schema and implement Auth"
                value={inviteForm.expectedContribution} onChange={e => setInviteForm({...inviteForm, expectedContribution: e.target.value})}
              />

              <TextField 
                fullWidth multiline rows={3} label="Personal Message" variant="filled"
                value={inviteForm.message} onChange={e => setInviteForm({...inviteForm, message: e.target.value})}
              />
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 4, pt: 0 }}>
        <Button onClick={onClose}>Cancel</Button>
        {selectedUser && (
          <Button 
            variant="contained" 
            onClick={handleSendInvite} 
            disabled={sending}
            startIcon={sending ? <CircularProgress size={16} /> : <UserPlus size={18} />}
            sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}
          >
            Send Invitation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InviteFromNetworkDialog;
