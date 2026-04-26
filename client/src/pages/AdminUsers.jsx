import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Avatar, Chip, IconButton, Button, CircularProgress, Alert
} from '@mui/material';
import { Trash2, Shield, User, Search, Filter } from 'lucide-react';
import api from '../services/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to fetch users. Ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action is irreversible.')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        setUsers(prev => prev.filter(u => u.id !== userId));
      } catch (err) {
        alert('Failed to delete user.');
      }
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>User Management</Typography>
        <Typography variant="body2" color="text.secondary">Review and manage all ScholarConnect accounts.</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ background: '#16181D', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backgroundImage: 'none', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>User</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Level</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>Joined</TableCell>
              <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={u.avatar_url} sx={{ width: 32, height: 32 }}>{u.name?.[0]}</Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {u.name} {u.is_admin ? <Shield size={14} color="#5e6ad2" /> : null}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={u.academic_level || 'N/A'} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{u.preferred_role || 'General'}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(u.created_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => handleDelete(u.id)}
                    disabled={u.is_admin} // Don't delete yourself or other admins easily
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminUsers;
