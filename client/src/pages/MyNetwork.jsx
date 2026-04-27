import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Stack,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  Users, 
  UserCheck, 
  MessageSquare, 
  PlusCircle, 
  History, 
  Star,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const MyNetwork = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [network, setNetwork] = useState({ collaborators: [], mentors: [], history: [] });
  const navigate = useNavigate();

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const [collabs, mentors] = await Promise.all([
        api.get('/network/collaborators'),
        api.get('/network/mentors')
      ]);
      setNetwork({
        collaborators: collabs.data.collaborators,
        mentors: mentors.data.mentors,
        history: [] // Future: Add history fetch
      });
    } catch (err) {
      console.error('Failed to fetch network:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderCollaborators = () => (
    <Grid container spacing={3}>
      {network.collaborators.map((collab) => (
        <Grid item xs={12} md={6} lg={4} key={collab.id}>
          <Card 
            sx={{ 
              background: '#16181D', 
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 4,
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#5e6ad2', transform: 'translateY(-4px)' }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Avatar 
                  src={collab.avatar_url} 
                  sx={{ width: 56, height: 56, borderRadius: 2, border: '2px solid #5e6ad2' }}
                >
                  {collab.name?.[0] || 'U'}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight={800}>{collab.name || 'Scholar'}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Zap size={12} color="#f5a623" /> {Math.round((collab.reputation_score || 0) * 100)}% Reputation
                  </Typography>
                  <Typography variant="body2" color="#5e6ad2" fontWeight={600} sx={{ mt: 0.5 }}>
                    {collab.preferred_role || 'Researcher'}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <Chip 
                  label={`${collab.collaboration_count || 1} Projects Together`} 
                  size="small" 
                  sx={{ background: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', fontWeight: 700 }}
                />
              </Stack>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  size="small"
                  onClick={() => navigate('/collaboration')}
                  sx={{ background: '#5e6ad2', borderRadius: 2, py: 1 }}
                >
                  Invite to New Project
                </Button>
                <Tooltip title="Direct Message">
                  <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                    <MessageSquare size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {network.collaborators.length === 0 && !loading && (
        <Box sx={{ p: 10, textAlign: 'center', width: '100%' }}>
          <Typography color="text.secondary">No collaborators in your pool yet. Start matching!</Typography>
        </Box>
      )}
    </Grid>
  );

  const renderMentors = () => (
    <Grid container spacing={3}>
      {network.mentors.map((mentor) => (
        <Grid item xs={12} md={6} lg={4} key={mentor.id}>
          <Card 
            sx={{ 
              background: '#16181D', 
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 4,
              transition: 'all 0.2s',
              '&:hover': { borderColor: '#f5a623', transform: 'translateY(-4px)' }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Avatar 
                  src={mentor.avatar_url} 
                  sx={{ width: 56, height: 56, borderRadius: 2, border: '2px solid #f5a623' }}
                >
                  {mentor.name?.[0] || 'M'}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" fontWeight={800}>{mentor.name || 'Verified Mentor'}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Award size={12} color="#f5a623" /> Verified Mentor
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You are currently connected for mentorship guidance.
              </Typography>

              <Button 
                fullWidth 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/collaboration')}
                sx={{ borderColor: '#f5a623', color: '#f5a623', borderRadius: 2, py: 1, '&:hover': { bgcolor: 'rgba(245, 166, 35, 0.05)' } }}
              >
                Invite to Project as Advisor
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
      {network.mentors.length === 0 && !loading && (
        <Box sx={{ p: 10, textAlign: 'center', width: '100%' }}>
          <Typography color="text.secondary">No mentors in your network yet.</Typography>
        </Box>
      )}
    </Grid>
  );

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.04em', mb: 1 }}>
          My Network
        </Typography>
        <Typography color="text.secondary">
          Manage your persistent connections with researchers, developers, and mentors.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.05)', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{ 
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minWidth: 120 },
            '& .MuiTabs-indicator': { backgroundColor: '#5e6ad2' }
          }}
        >
          <Tab icon={<Users size={18} />} iconPosition="start" label="Collaborators" />
          <Tab icon={<UserCheck size={18} />} iconPosition="start" label="Mentors" />
          <Tab icon={<History size={18} />} iconPosition="start" label="Collaboration History" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <>
          {activeTab === 0 && renderCollaborators()}
          {activeTab === 1 && renderMentors()}
          {activeTab === 2 && (
            <Box sx={{ p: 10, textAlign: 'center' }}>
              <History size={48} color="rgba(255,255,255,0.1)" />
              <Typography color="text.secondary" sx={{ mt: 2 }}>Collaboration history will appear here after project completion.</Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default MyNetwork;
