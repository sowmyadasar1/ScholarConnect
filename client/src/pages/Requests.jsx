import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, Tabs, Tab,
  Avatar, Stack, CircularProgress, Alert, Snackbar, IconButton,
  Divider, Tooltip, Badge
} from '@mui/material';
import { 
  Check, X, Clock, AlertCircle, ArrowUpRight, ArrowDownLeft, 
  MessageSquare, UserCircle, Briefcase, Users, Layout, Star
} from 'lucide-react';
import { requestService } from '../services/requestService';

const STATUS_CONFIG = {
  pending:   { color: '#f5a623', bgColor: 'rgba(245,166,35,0.1)', borderColor: 'rgba(245,166,35,0.2)', label: 'Pending' },
  accepted:  { color: '#4caf50', bgColor: 'rgba(76,175,80,0.1)', borderColor: 'rgba(76,175,80,0.2)', label: 'Accepted' },
  rejected:  { color: '#f44336', bgColor: 'rgba(244,67,54,0.1)', borderColor: 'rgba(244,67,54,0.2)', label: 'Denied' },
  declined:  { color: '#f44336', bgColor: 'rgba(244,67,54,0.1)', borderColor: 'rgba(244,67,54,0.2)', label: 'Declined' },
  requested: { color: '#f5a623', bgColor: 'rgba(245,166,35,0.1)', borderColor: 'rgba(245,166,35,0.2)', label: 'Requested' },
};

const TYPE_ICONS = {
  'Project': <Layout size={14} />,
  'Mentor': <UserCircle size={14} />,
  'team_invite': <Users size={14} />,
  'mentor_invite': <Star size={14} />,
  'collab_request': <Briefcase size={14} />,
  'mentor_request': <UserCircle size={14} />,
};

const Requests = () => {
  const [tab, setTab] = useState(0); // 0 = Incoming, 1 = Sent, 2 = Mentorship
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sent, received] = await Promise.all([
        requestService.getSentRequests(),
        requestService.getReceivedRequests(),
      ]);
      setSentRequests(sent);
      setReceivedRequests(received);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Unable to load requests. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, requestType, status) => {
    try {
      await requestService.respondToRequest(requestId, requestType, status);
      setSnack({ open: true, msg: `Request ${status} successfully.`, severity: 'success' });
      loadRequests();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.error || 'Action failed.', severity: 'error' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCancel = async (requestId, requestType) => {
    try {
      await requestService.cancelRequest(requestId, requestType);
      setSnack({ open: true, msg: 'Request cancelled successfully.', severity: 'success' });
      loadRequests();
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.error || 'Cancellation failed.', severity: 'error' });
    }
  };

  const renderStatusChip = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <Chip
        label={config.label}
        size="small"
        sx={{ 
          bgcolor: config.bgColor, 
          color: config.color, 
          border: `1px solid ${config.borderColor}`, 
          fontWeight: 700,
          fontSize: '0.7rem',
          height: 24
        }}
      />
    );
  };

  const incomingInvites = receivedRequests.filter(r => r.request_type === 'team_invite' || r.request_type === 'collab_request');
  const sentOutreach = sentRequests.filter(r => r.request_type !== 'mentor_request' && r.request_type !== 'mentor_invite');
  const mentorshipRequests = [
    ...receivedRequests.filter(r => r.request_type === 'mentor_request' || r.request_type === 'mentor_invite'),
    ...sentRequests.filter(r => r.request_type === 'mentor_request' || r.request_type === 'mentor_invite')
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const getActiveList = () => {
    if (tab === 0) return incomingInvites;
    if (tab === 1) return sentOutreach;
    return mentorshipRequests;
  };

  const activeList = getActiveList();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 20, gap: 2 }}>
        <CircularProgress thickness={5} size={40} sx={{ color: '#5e6ad2' }} />
        <Typography variant="body2" color="text.secondary">Fetching your interactions...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 1 }}>Requests Hub</Typography>
        <Typography variant="body1" color="text.secondary">
          Track your invitations, applications, and mentorship requests.
        </Typography>
      </Box>

      {error && <Alert severity="error" variant="outlined" sx={{ mb: 4, borderRadius: 3, bgcolor: 'rgba(244,67,54,0.05)' }}>{error}</Alert>}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ 
          mb: 5, 
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          '& .MuiTab-root': { 
            textTransform: 'none', 
            fontWeight: 700,
            fontSize: '0.95rem',
            minHeight: 64,
            px: 4,
            color: 'text.secondary'
          },
          '& .Mui-selected': { color: '#5e6ad2 !important' },
          '& .MuiTabs-indicator': { backgroundColor: '#5e6ad2', height: 3, borderRadius: '3px 3px 0 0' }
        }}
      >
        <Tab label={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <ArrowDownLeft size={18} />
            <span>Incoming Invites</span>
            {incomingInvites.length > 0 && <Badge badgeContent={incomingInvites.length} color="primary" />}
          </Stack>
        } />
        <Tab label={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <ArrowUpRight size={18} />
            <span>Sent Applications</span>
          </Stack>
        } />
        <Tab label={
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <UserCircle size={18} />
            <span>Mentorship</span>
            {mentorshipRequests.length > 0 && <Badge badgeContent={mentorshipRequests.length} color="secondary" />}
          </Stack>
        } />
      </Tabs>

      {activeList.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 12, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 5 }}>
          <CardContent>
            <AlertCircle size={40} color="rgba(255,255,255,0.1)" />
            <Typography variant="h6" sx={{ mt: 2 }}>Nothing here yet</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {activeList.map((req) => (
            <Card key={`${req.request_type}-${req.id}`} sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={2.5}>
                    <Avatar sx={{ width: 52, height: 52, background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)', fontWeight: 800 }}>
                      {(req.target_name || req.from_name || '?')[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {tab === 1 ? req.target_name : (req.from_name || req.target_name)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {req.request_type.replace('_', ' ').toUpperCase()} • {formatDate(req.created_at)}
                      </Typography>
                      
                      {req.role && (
                        <Chip label={req.role} size="small" sx={{ mb: 1, bgcolor: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', fontWeight: 700 }} />
                      )}

                      {req.message && (
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          position: 'relative',
                          mt: 1
                        }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.6 }}>
                            "{req.message}"
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Stack>

                  <Stack spacing={2} sx={{ alignItems: 'flex-end' }}>
                    {renderStatusChip(req.status)}
                    
                    {req.status === 'accepted' && req.team_id && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Layout size={16} />}
                        onClick={() => {
                          window.location.href = `/workspace/${req.team_id}`;
                        }}
                        sx={{ 
                          borderRadius: 2, 
                          fontWeight: 800, 
                          px: 2, 
                          background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
                          boxShadow: '0 4px 12px rgba(94, 106, 210, 0.2)'
                        }}
                      >
                        Join Collaboration
                      </Button>
                    )}

                    {tab === 1 && (req.status === 'pending' || req.status === 'requested') && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleCancel(req.id, req.request_type)}
                        sx={{ borderRadius: 2, fontWeight: 800, px: 2 }}
                      >
                        Cancel Request
                      </Button>
                    )}
                    
                    {(tab === 0 || tab === 2) && (req.status === 'pending' || req.status === 'requested') && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          disableElevation
                          onClick={() => handleRespond(req.id, req.request_type, 'accepted')}
                          sx={{ borderRadius: 2, fontWeight: 800, px: 2 }}
                        >
                          {req.request_type === 'team_invite' || req.request_type === 'mentor_invite' ? 'Join & Accept' : 'Accept'}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRespond(req.id, req.request_type, 'rejected')}
                          sx={{ borderRadius: 2, fontWeight: 800, px: 2 }}
                        >
                          Decline
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Snackbar 
        open={snack.open} 
        autoHideDuration={4000} 
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>
          {typeof snack.msg === 'object' ? JSON.stringify(snack.msg) : String(snack.msg)}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Requests;
