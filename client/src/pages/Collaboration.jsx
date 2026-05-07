import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Chip, Button, Stack,
  Avatar, CircularProgress, Tabs, Tab, Dialog, DialogTitle, 
  DialogContent, DialogActions, List, ListItem, ListItemAvatar,
  ListItemText, IconButton, Snackbar, Alert, Switch, FormControlLabel,
  Checkbox, TextField, MenuItem, Divider
} from '@mui/material';
import { 
  GitBranch, Plus, Users, ExternalLink, Check, X, 
  Search, FolderGit2, Globe, ArrowRight, MessageSquare,
  Clock, Shield, LayoutGrid, List as ListIcon, Settings2,
  Sparkles, Code2, Cpu, Database
} from 'lucide-react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { collabService } from '../services/collabService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/common/VerifiedBadge';

const Collaboration = () => {
  const { user } = useAuth();
  const { searchQuery } = useOutletContext();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  
  // Modals
  const [importOpen, setImportOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [smartInviteProject, setSmartInviteProject] = useState(null);
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOpenForCollab, setIsOpenForCollab] = useState(true);
  
  // Form State
  const [joinForm, setJoinForm] = useState({ role: 'Backend Engineer', message: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const location = useLocation();

  useEffect(() => {
    fetchData();
    if (location.state?.autoOpenImport) {
      handleOpenImport();
      setSnackbar({ open: true, message: `Invite flow started. Import a repository to invite ${location.state.prefillUser}.`, severity: 'info' });
    }
  }, [tab, searchQuery, location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 0) {
        const data = await collabService.listOpenProjects({ search: searchQuery });
        setProjects(data.projects || []);
      } else {
        const data = await collabService.getMyProjects();
        setMyProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch collaboration data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenImport = async () => {
    setImportOpen(true);
    setReposLoading(true);
    try {
      const data = await authService.getGithubRepos();
      setGithubRepos(data || []);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to fetch GitHub repositories', severity: 'error' });
    } finally {
      setReposLoading(false);
    }
  };

  const handleImportSelected = async () => {
    setImporting(true);
    try {
      for (const fullName of selectedRepos) {
        const repo = githubRepos.find(r => r.full_name === fullName);
        await collabService.importRepo({
          repo_url: repo.html_url,
          description: repo.description || '',
          topics: repo.topics || [],
          is_open_for_collab: isOpenForCollab
        });
      }
      setSnackbar({ open: true, message: `${selectedRepos.length} projects imported!`, severity: 'success' });
      setImportOpen(false);
      setSelectedRepos([]);
      fetchData();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Import failed.', severity: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleRequestJoin = (project) => {
    setSelectedProject(project);
    setJoinOpen(true);
  };

  const handleJoinRequest = async () => {
    if (!selectedProject) return;
    setActionLoading(true);
    try {
      await collabService.requestToJoin(selectedProject.id, joinForm.message, joinForm.role);
      setSnackbar({ open: true, message: 'Collaboration request sent successfully!', severity: 'success' });
      setJoinOpen(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Request failed.', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCollab = async (projectId) => {
    try {
      await collabService.toggleCollab(projectId);
      setMyProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, is_open_for_collab: !p.is_open_for_collab } : p
      ));
      setSnackbar({ open: true, message: 'Visibility updated', severity: 'info' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const handleOpenSmartInvites = (project) => {
    setSmartInviteProject(project);
  };

  const ROLES = [
    'Frontend Developer', 'Backend Engineer', 'Fullstack Developer', 
    'ML Researcher', 'Data Scientist', 'UI/UX Designer', 'DevOps Engineer'
  ];

  return (
    <Box sx={{ pb: 8, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={handleOpenImport}
          sx={{
            background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
            borderRadius: 2.5,
            px: 4,
            py: 1.8,
            fontWeight: 700,
            boxShadow: '0 8px 25px rgba(94, 106, 210, 0.3)',
            '&:hover': { boxShadow: '0 12px 30px rgba(94, 106, 210, 0.4)' }
          }}
        >
          Add Project
        </Button>
      </Box>

      <Tabs 
        value={tab} 
        onChange={(_, v) => setTab(v)} 
        sx={{ 
          mb: 6,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          '& .MuiTab-root': { 
            fontWeight: 800, 
            fontSize: '1rem', 
            color: 'text.secondary',
            minHeight: 72,
            textTransform: 'none',
            px: 5
          },
          '& .Mui-selected': { color: '#5e6ad2 !important' },
          '& .MuiTabs-indicator': { backgroundColor: '#5e6ad2', height: 4, borderRadius: '4px 4px 0 0' }
        }}
      >
        <Tab label="Open for Collaboration" icon={<Globe size={20} />} iconPosition="start" />
        <Tab label="My Repositories" icon={<FolderGit2 size={20} />} iconPosition="start" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 20 }}>
          <CircularProgress thickness={5} size={60} sx={{ color: '#5e6ad2' }} />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {tab === 0 && projects.map(item => (
            <Grid item xs={12} md={6} lg={4} key={item.id}>
              <Card sx={{ 
                background: '#16181D', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: 5,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { borderColor: '#5e6ad2', transform: 'translateY(-6px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }
              }}>
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <Avatar 
                        src={item.owner_avatar} 
                        sx={{ 
                          width: 44, height: 44, 
                          border: '2px solid rgba(255,255,255,0.05)',
                          background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)'
                        }}
                      >
                        {item.owner_name?.[0]}
                      </Avatar>
                      <Box>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight={800}>{item.owner_name}</Typography>
                          <VerifiedBadge size="sm" label="Project Owner" />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{item.owner_academic_level || 'Researcher'}</Typography>
                      </Box>
                    </Stack>
                    <Chip 
                      label="Seeking Help" 
                      size="small" 
                      sx={{ background: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', fontWeight: 800, fontSize: '0.65rem' }} 
                    />
                  </Box>
                  
                  <Typography variant="h6" fontWeight={800} gutterBottom sx={{ mb: 1.5, letterSpacing: '-0.01em' }}>
                    {item.repo_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 48, lineHeight: 1.6 }}>
                    {item.description || "Building something innovative in the academic space."}
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {item.topics && item.topics.slice(0, 3).map(topic => (
                        <Chip key={topic} label={topic} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'text.secondary', fontWeight: 600 }} />
                      ))}
                    </Stack>
                  </Box>

                  {item.owner_id === user.id ? (
                    <Button 
                      fullWidth variant="contained"
                      onClick={() => window.location.href = `/workspace/${item.team_id}`}
                      sx={{ 
                        borderRadius: 3, py: 1.5, fontWeight: 800,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      Manage Workspace (Owner)
                    </Button>
                  ) : item.is_member ? (
                    <Button 
                      fullWidth variant="contained"
                      onClick={() => window.location.href = `/workspace/${item.team_id}`}
                      sx={{ 
                        borderRadius: 3, py: 1.5, fontWeight: 800,
                        background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)'
                      }}
                    >
                      Open Workspace
                    </Button>
                  ) : (
                    <Button 
                      fullWidth variant="outlined"
                      onClick={() => handleRequestJoin(item)}
                      sx={{ 
                        borderRadius: 3, 
                        py: 1.5, 
                        background: 'rgba(255,255,255,0.03)', 
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontWeight: 700,
                        '&:hover': { background: 'rgba(94, 106, 210, 0.1)', borderColor: '#5e6ad2' } 
                      }}
                    >
                      Request to Join
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}

          {tab === 1 && myProjects.map(item => (
            <Grid item xs={12} key={item.id}>
              <Card sx={{ 
                background: '#16181D', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: 4,
                overflow: 'visible'
              }}>
                <CardContent sx={{ 
                  p: { xs: 3, md: 4 }, 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between', 
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: 3
                }}>
                  <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                    <Avatar variant="rounded" sx={{ background: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', width: { xs: 48, md: 64 }, height: { xs: 48, md: 64 }, borderRadius: 3 }}>
                      <FolderGit2 size={32} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5, fontSize: { xs: '1rem', md: '1.25rem' } }}>{item.repo_name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: { xs: 'none', sm: 'block' } }}>{item.description || "Personal repository in the hub."}</Typography>
                      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {item.is_open_for_collab ? (
                          <Chip label="Live Collaboration" size="small" icon={<Globe size={14} />} sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', fontWeight: 700 }} />
                        ) : (
                          <Chip label="Private" size="small" icon={<Shield size={14} />} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'text.secondary', fontWeight: 700 }} />
                        )}
                        <Chip label={`ID: ${item.id}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.02)', color: 'text.secondary', fontSize: '0.65rem' }} />
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', width: { xs: '100%', md: 'auto' }, justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
                    {item.team_id && (
                    <Button 
                      variant="contained"
                      size="small"
                      startIcon={<LayoutGrid size={18} />}
                      onClick={() => window.location.href = `/workspace/${item.team_id}`}
                      sx={{ 
                        borderRadius: 2, 
                        fontWeight: 800, 
                        px: 2.5,
                        background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
                        boxShadow: '0 4px 12px rgba(94, 106, 210, 0.2)'
                      }}
                    >
                      Join Collaboration
                    </Button>
                    )}

                    {item.owner_id === user.id && (
                      <>
                        <Box sx={{ mr: 2 }}>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={!!item.is_open_for_collab} 
                                onChange={() => handleToggleCollab(item.id)}
                                color="primary"
                                size="small"
                              />
                            }
                            label={<Typography variant="caption" fontWeight={700}>Open</Typography>}
                          />
                        </Box>
                        <Button 
                          variant="outlined"
                          size="small"
                          startIcon={<Sparkles size={16} />}
                          onClick={() => handleOpenSmartInvites(item)}
                          sx={{ 
                            borderRadius: 2, 
                            fontWeight: 700, 
                            borderColor: 'rgba(94, 106, 210, 0.4)',
                            color: '#5e6ad2',
                            '&:hover': { background: 'rgba(94, 106, 210, 0.05)', borderColor: '#5e6ad2' }
                          }}
                        >
                          Invites
                        </Button>
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setSelectedProject(item);
                            setSettingsOpen(true);
                          }}
                          sx={{ color: 'text.secondary' }}
                        >
                          <Settings2 size={18} />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {(!loading && ((tab === 0 && projects.length === 0) || (tab === 1 && myProjects.length === 0))) && (
            <Box sx={{ textAlign: 'center', width: '100%', py: 20 }}>
              <Box sx={{ mb: 3, opacity: 0.2 }}>
                <FolderGit2 size={80} style={{ margin: '0 auto' }} />
              </Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>No projects found</Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>Start by importing your first repository from GitHub.</Typography>
              <Button variant="contained" onClick={handleOpenImport} sx={{ borderRadius: 3, px: 5, py: 1.5 }}>Import Now</Button>
            </Box>
          )}
        </Grid>
      )}

      {/* Join Request Modal */}
      <Dialog 
        open={joinOpen} 
        onClose={() => setJoinOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        disableRestoreFocus
        slotProps={{ paper: { sx: { background: '#16181D', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)' } } }}
      >
        <DialogTitle sx={{ p: 4, pb: 2 }}>
          <Typography variant="h5" component="div" fontWeight={800}>Apply for Collaboration</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Project: <strong style={{ color: '#fff' }}>{selectedProject?.repo_name}</strong>
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={4}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Select Your Role</Typography>
              <TextField
                select
                fullWidth
                value={joinForm.role}
                onChange={(e) => setJoinForm({ ...joinForm, role: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              >
                {ROLES.map(role => <MenuItem key={role} value={role}>{role}</MenuItem>)}
              </TextField>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Introduction Message</Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Briefly explain why you're a good fit for this project..."
                value={joinForm.message}
                onChange={(e) => setJoinForm({ ...joinForm, message: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button onClick={() => setJoinOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleJoinRequest} 
            disabled={actionLoading}
            sx={{ borderRadius: 3, px: 5, py: 1.5, fontWeight: 700 }}
          >
            {actionLoading ? 'Sending...' : 'Send Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Collaboration Settings Modal */}
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { background: '#16181D', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)' } } }}
      >
        <DialogTitle sx={{ p: 4, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={800}>Project Settings</Typography>
            <IconButton onClick={() => setSettingsOpen(false)}><X size={24} /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={7}>
              <Typography variant="h6" fontWeight={800} gutterBottom>Smart Recruitment</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Use ScholarConnect AI to find and invite the best matching scholars for specific roles.
              </Typography>
              
              <Stack spacing={2}>
                {ROLES.slice(0, 5).map(role => (
                  <Box 
                    key={role} 
                    sx={{ 
                      p: 2.5, borderRadius: 3, 
                      bgcolor: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2' }}>
                        {role.includes('Frontend') ? <LayoutGrid size={18} /> : 
                         role.includes('ML') ? <Cpu size={18} /> : 
                         role.includes('Data') ? <Database size={18} /> : <Code2 size={18} />}
                      </Box>
                      <Typography fontWeight={700}>{role}</Typography>
                    </Box>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={async () => {
                        try {
                          await collabService.autoInviteRole(selectedProject.id, role);
                          setSnackbar({ open: true, message: `Invites sent to matching scholars for ${role}!`, severity: 'success' });
                        } catch (err) {
                          setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to send invites', severity: 'error' });
                        }
                      }}
                      sx={{ borderRadius: 2, px: 3, fontSize: '0.75rem' }}
                    >
                      Find Matches
                    </Button>
                  </Box>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ p: 3, borderRadius: 4, background: 'rgba(94, 106, 210, 0.05)', border: '1px solid rgba(94, 106, 210, 0.1)' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Sparkles size={16} /> AI Insight
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  This project's tech stack matches well with scholars specializing in <strong>Cloud Infrastructure</strong> and <strong>Distributed Systems</strong>. We recommend inviting at least 2 Backend Engineers.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight={800} gutterBottom color="error.main">Danger Zone</Typography>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="error" 
                  onClick={async () => {
                    if (window.confirm('Are you sure? This will delete the workspace, tasks, and chat history permanently.')) {
                      try {
                        await collabService.deleteProject(selectedProject.id);
                        setSettingsOpen(false);
                        fetchData();
                        setSnackbar({ open: true, message: 'Project and workspace deleted.', severity: 'success' });
                      } catch (err) {
                        setSnackbar({ open: true, message: 'Failed to delete project.', severity: 'error' });
                      }
                    }
                  }}
                  sx={{ borderRadius: 2.5, py: 1.5, mt: 1, borderColor: 'rgba(244, 67, 54, 0.3)' }}
                >
                  Remove Project from Hub
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>

      {/* GitHub Import Dialog */}
      <Dialog 
        open={importOpen} 
        onClose={() => !importing && setImportOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        disableRestoreFocus
        slotProps={{ paper: { sx: { background: '#16181D', borderRadius: 5, backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.08)' } } }}
      >
        <DialogTitle sx={{ p: 4, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={800}>Import Research Projects</Typography>
            <IconButton onClick={() => setImportOpen(false)} disabled={importing}><X size={24} /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4, pt: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Select repositories from your GitHub account to showcase in the collaboration hub.
          </Typography>
          {reposLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <Box sx={{ mb: 3, p: 2, borderRadius: 3, bgcolor: 'rgba(94, 106, 210, 0.05)', border: '1px solid rgba(94, 106, 210, 0.1)' }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={isOpenForCollab} 
                      onChange={(e) => setIsOpenForCollab(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight={800}>Open for Collaboration</Typography>
                      <Typography variant="caption" color="text.secondary">Make imported projects public and allow join requests.</Typography>
                    </Box>
                  }
                />
              </Box>
              <List sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                {githubRepos.map(repo => (
                  <ListItem
                    key={repo.full_name}
                    onClick={() => {
                      const exists = myProjects.some(p => p.github_repo_url === repo.html_url);
                      if (exists) {
                        setSnackbar({ open: true, message: 'This project is already in your hub.', severity: 'warning' });
                        return;
                      }
                      setSelectedRepos(prev => prev.includes(repo.full_name) ? prev.filter(r => r !== repo.full_name) : [...prev, repo.full_name]);
                    }}
                    sx={{ 
                      mb: 1.5, borderRadius: 3, cursor: 'pointer',
                      bgcolor: selectedRepos.includes(repo.full_name) ? 'rgba(94, 106, 210, 0.08)' : 'rgba(255,255,255,0.02)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                      opacity: myProjects.some(p => p.github_repo_url === repo.html_url) ? 0.5 : 1
                    }}
                  >
                    <Checkbox checked={selectedRepos.includes(repo.full_name)} disabled={myProjects.some(p => p.github_repo_url === repo.html_url)} />
                    <ListItemAvatar>
                      <Avatar variant="rounded" sx={{ background: 'rgba(255,255,255,0.05)', color: 'text.secondary' }}>
                        <FolderGit2 size={20} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight={700}>{repo.name}</Typography>}
                      secondary={myProjects.some(p => p.github_repo_url === repo.html_url) ? 'Already in Hub' : repo.description}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button onClick={() => setImportOpen(false)} disabled={importing} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleImportSelected} 
            disabled={importing || selectedRepos.length === 0}
            sx={{ borderRadius: 3, px: 5, py: 1.8, fontWeight: 800 }}
          >
            {importing ? 'Importing...' : `Import ${selectedRepos.length} Projects`}
          </Button>
        </DialogActions>
      </Dialog>

      <SmartInviteModal 
        open={!!smartInviteProject}
        project={smartInviteProject}
        onClose={() => setSmartInviteProject(null)}
        onInvited={fetchData}
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const SmartInviteModal = ({ open, project, onClose, onInvited }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [role, setRole] = useState('Contributor');

  useEffect(() => {
    if (open && project) {
      loadSuggestions();
    }
  }, [open, project]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await collabService.getSmartSuggestions(project.id);
      setSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvites = async () => {
    setSending(true);
    try {
      await collabService.autoInviteRole(project.id, selected, role);
      onInvited();
      onClose();
    } catch (err) {
      console.error('Failed to send invites:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      slotProps={{
        paper: { sx: { background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6, backgroundImage: 'none' } }
      }}
    >
      <DialogTitle sx={{ p: 4 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2' }}>
            <Sparkles size={24} />
          </Box>
          <Box>
            <Typography variant="h5" component="div" fontWeight={800}>Smart Teammate Suggestions</Typography>
            <Typography variant="body2" color="text.secondary">AI-ranked candidates for {project?.repo_name}</Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 4, pt: 0 }}>
        <Box sx={{ mb: 4, p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="subtitle2" fontWeight={800} gutterBottom>Invite as Role</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            slotProps={{ select: { style: { fontWeight: 700 } } }}
          >
            {['Contributor', 'Frontend Dev', 'Backend Dev', 'ML Expert', 'Reviewer'].map(r => (
              <MenuItem key={r} value={r} sx={{ fontWeight: 600 }}>{r}</MenuItem>
            ))}
          </TextField>
        </Box>

        {loading ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress size={40} sx={{ color: '#5e6ad2' }} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {suggestions.map(candidate => (
              <Box 
                key={candidate.id}
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  background: selected.includes(candidate.id) ? 'rgba(94, 106, 210, 0.05)' : 'rgba(255,255,255,0.01)',
                  border: '1px solid',
                  borderColor: selected.includes(candidate.id) ? '#5e6ad2' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => {
                  setSelected(prev => 
                    prev.includes(candidate.id) ? prev.filter(id => id !== candidate.id) : [...prev, candidate.id]
                  );
                }}
              >
                <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                  <Avatar src={candidate.avatar_url} sx={{ width: 56, height: 56, border: '2px solid #5e6ad2' }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="h6" fontWeight={800}>{candidate.name}</Typography>
                      <Chip 
                        label={`${Math.round(candidate.compatibility_score || 0)}% Match`} 
                        size="small" 
                        sx={{ bgcolor: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', fontWeight: 800, fontSize: '0.7rem' }} 
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>{candidate.bio || candidate.explanation}</Typography>
                  </Box>
                  <Checkbox checked={selected.includes(candidate.id)} color="primary" />
                </Stack>
              </Box>
            ))}
            {suggestions.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No fresh matches found right now. Try updating your project topics.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 4, pt: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>Close</Button>
        <Button 
          variant="contained" 
          disabled={selected.length === 0 || sending}
          onClick={handleSendInvites}
          sx={{ borderRadius: 2.5, fontWeight: 800, px: 4, background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)' }}
        >
          {sending ? 'Sending...' : `Send ${selected.length} Invites`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Collaboration;

