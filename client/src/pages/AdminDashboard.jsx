import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Button, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { Users, BookOpen, AlertCircle, Check, X } from 'lucide-react';
import { adminService } from '../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_users: '...', active_projects: '...', pending_mentors: '...' });
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, m] = await Promise.all([
        adminService.getStats(),
        adminService.getPendingMentors()
      ]);
      setStats(s);
      setPending(m);
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to load admin data.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    try {
      await adminService.approveMentor(id);
      setPending(prev => prev.filter(m => m.user_id !== id));
      setSnack({ open: true, msg: `${name} approved as a mentor!`, severity: 'success' });
      // Update stats count locally
      setStats(prev => ({ ...prev, pending_mentors: prev.pending_mentors - 1 }));
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to approve mentor.', severity: 'error' });
    }
  };

  const handleReject = async (id, name) => {
    try {
      await adminService.rejectMentor(id);
      setPending(prev => prev.filter(m => m.user_id !== id));
      setSnack({ open: true, msg: `${name}'s application rejected.`, severity: 'warning' });
      setStats(prev => ({ ...prev, pending_mentors: prev.pending_mentors - 1 }));
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to reject mentor.', severity: 'error' });
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2">Admin Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Platform statistics and approval management.</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Total Users', value: stats.total_users, icon: <Users size={20} color="#8a2be2" />, trend: 'Live' },
          { title: 'Active Projects', value: stats.active_projects, icon: <BookOpen size={20} color="#5e6ad2" />, trend: 'Live' },
          { title: 'Pending Mentors', value: stats.pending_mentors, icon: <AlertCircle size={20} color="#f5a623" />, trend: stats.pending_mentors > 0 ? 'Action Req' : 'All clear' }
        ].map((stat, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.title}</Typography>
                  <Typography variant="h3">{stat.value}</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  {stat.icon}
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stat.trend}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h4" sx={{ mb: 2 }}>Pending Mentor Approvals</Typography>

      {pending.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Check size={48} color="#4caf50" style={{ marginBottom: 8 }} />
            <Typography variant="h5">All caught up!</Typography>
            <Typography variant="body2" color="text.secondary">No pending approvals.</Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: 'background.paper', backgroundImage: 'none' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
              <TableRow>
                {['Name', 'Domain', 'Experience', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    align={h === 'Actions' ? 'right' : 'left'}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {pending.map(row => (
                <TableRow key={row.user_id}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{row.domain}</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{row.years_experience} years</TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Chip label="Pending" size="small" sx={{ bgcolor: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)' }} />
                  </TableCell>
                  <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Button size="small" variant="contained" sx={{ mr: 1 }} onClick={() => handleApprove(row.user_id, row.name)}>Approve</Button>
                    <Button size="small" variant="outlined" color="error" onClick={() => handleReject(row.user_id, row.name)}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} variant="filled">
          {typeof snack.msg === 'object' ? JSON.stringify(snack.msg) : String(snack.msg)}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard;

