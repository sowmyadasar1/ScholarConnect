import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, Tabs, Tab,
  Avatar, Stack, CircularProgress, Alert, Snackbar, IconButton,
  Divider, Tooltip, Badge
} from '@mui/material';
import { 
  Check, X, Clock, AlertCircle, ArrowUpRight, ArrowDownLeft, 
  MessageSquare, UserCircle, Briefcase, Users, Layout
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
  'Team Invite': <Users size={14} />,
  'Join Request': <Briefcase size={14} />,
  'Mentor Request': <UserCircle size={14} />,
};

const Requests = () => {
  const [tab, setTab] = useState(0); // 0 = Sent, 1 = Received
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
    const now = new Date();
    const diffMs = now - d;
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 20, gap: 2 }}>
        <CircularProgress thickness={5} size={40} sx={{ color: '#5e6ad2' }} />
        <Typography variant="body2" color="text.secondary">Fetching your interactions...</Typography>
      </Box>
    );
  }

  const activeList = tab === 0 ? sentRequests : receivedRequests;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 1 }}>Requests & Invites</Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your sent applications and incoming collaboration requests in one place.
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
        <Tab
          label={
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <ArrowUpRight size={18} />
              <span>Sent Invitations</span>
              {sentRequests.length > 0 && <Badge badgeContent={sentRequests.length} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }} />}
            </Stack>
          }
        />
        <Tab
          label={
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <ArrowDownLeft size={18} />
              <span>Received Requests</span>
              {receivedRequests.length > 0 && <Badge badgeContent={receivedRequests.length} color="secondary" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }} />}
            </Stack>
          }
        />
      </Tabs>

      {activeList.length === 0 ? (
        <Card sx={{ 
          textAlign: 'center', 
          py: 12, 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: 5
        }}>
          <CardContent>
            <Box sx={{ p: 2, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', width: 'fit-content', mx: 'auto', mb: 3 }}>
              <AlertCircle size={40} color="rgba(255,255,255,0.2)" />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
              {tab === 0 ? 'No Sent Requests' : 'No Received Requests'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              {tab === 0
                ? "You haven't sent any project applications or mentor requests yet. Start exploring to connect with others."
                : "You don't have any pending requests. Your collaboration invitations and join requests will appear here."
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {activeList.map((req) => (
            <Card 
              key={`${req.request_type}-${req.id}`}
              sx={{ 
                background: '#16181D', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: 4,
                transition: 'transform 0.2s, border-color 0.2s',
                '&:hover': { borderColor: 'rgba(255,255,255,0.1)', transform: 'translateY(-2px)' }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3 }}>
                  <Stack direction="row" spacing={2.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Avatar 
                      sx={{ 
                        width: 52, height: 52, 
                        background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        boxShadow: '0 4px 12px rgba(94, 106, 210, 0.2)'
                      }}
                    >
                      {(req.target_name || req.from_name || '?')[0]}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="h6" fontWeight={800} noWrap sx={{ letterSpacing: '-0.01em' }}>
                          {tab === 0
                            ? req.target_name || 'Unknown'
                            : req.from_name || 'Someone'
                          }
                        </Typography>
                        {TYPE_ICONS[req.type_label] && (
                          <Tooltip title={req.type_label}>
                            <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                              {TYPE_ICONS[req.type_label]}
                            </Box>
                          </Tooltip>
                        )}
                      </Stack>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        {tab === 1 && <span style={{ color: '#5e6ad2', fontWeight: 600 }}>for {req.project_name || 'Mentorship'}</span>}
                        {tab === 1 && <span>•</span>}
                        <Clock size={14} /> {formatDate(req.created_at)}
                      </Typography>

                      {req.message && (
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          position: 'relative'
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
                    
                    {tab === 1 && (req.status === 'pending' || req.status === 'requested') && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disableElevation
                          onClick={() => handleRespond(req.id, req.request_type, 'accepted')}
                          sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
                        >
                          Accept
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRespond(req.id, req.request_type, 'rejected')}
                          sx={{ borderRadius: 2, fontWeight: 700, px: 2 }}
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
