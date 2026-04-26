import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Chip, Button, Stack,
  Avatar, CircularProgress, Tabs, Tab, Dialog, DialogTitle, 
  DialogContent, DialogActions, List, ListItem, ListItemAvatar,
  ListItemText, IconButton, Snackbar, Alert, Switch, FormControlLabel,
  Checkbox
} from '@mui/material';
import { 
  GitBranch, Plus, Users, ExternalLink, Check, X, 
  Search, FolderGit2, Globe, ArrowRight, MessageSquare,
  Clock, Shield, LayoutGrid, List as ListIcon
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { collabService } from '../services/collabService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const Collaboration = () => {
  const { user, syncGitHub } = useAuth();
  const { searchQuery } = useOutletContext();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [invites, setInvites] = useState({ received: [], sent: [] });
  
  // Import Logic
  const [importOpen, setImportOpen] = useState(false);
  const [githubRepos, setGithubRepos] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [tab, searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 0) {
        const data = await collabService.listOpenProjects({ search: searchQuery });
        setProjects(data.projects || []);
      } else if (tab === 1) {
        const data = await collabService.getMyProjects();
        setMyProjects(data.projects || []);
      } else {
        const data = await collabService.getMyInvites();
        setInvites(data || { received: [], sent: [] });
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

  const toggleRepoSelection = (fullName) => {
    setSelectedRepos(prev => 
      prev.includes(fullName) ? prev.filter(r => r !== fullName) : [...prev, fullName]
    );
  };

  const handleImportSelected = async () => {
    setImporting(true);
    try {
      for (const fullName of selectedRepos) {
        const repo = githubRepos.find(r => r.full_name === fullName);
        await collabService.importRepo({
          repo_url: repo.html_url,
          description: repo.description || '',
          topics: repo.topics || []
        });
      }
      setSnackbar({ open: true, message: `${selectedRepos.length} projects imported!`, severity: 'success' });
      setImportOpen(false);
      setSelectedRepos([]);
      fetchData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Import failed for some projects.', severity: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleToggleCollab = async (projectId, currentStatus) => {
    try {
      await collabService.toggleCollab(projectId);
      setMyProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, is_open_for_collab: !currentStatus } : p
      ));
      setSnackbar({ open: true, message: `Project is now ${!currentStatus ? 'open' : 'private'}`, severity: 'info' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const handleJoinRequest = async (projectId) => {
    try {
      await collabService.requestToJoin(projectId, 'I am interested in contributing to this research project.');
      setSnackbar({ open: true, message: 'Collaboration request sent!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Request failed', severity: 'error' });
    }
  };

  const handleRespondToInvite = async (inviteId, status) => {
    try {
      await collabService.respondToRequest(inviteId, status);
      setSnackbar({ open: true, message: `Invite ${status}`, severity: 'success' });
      fetchData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to respond', severity: 'error' });
    }
  };

  return (
    <Box sx={{ pb: 8 }}>
      <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 1 }}>Collaboration Hub</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
            Connect with researchers and developers. Build the next generation of academic projects together.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={handleOpenImport}
          sx={{
            background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
            borderRadius: 3,
            px: 4,
            py: 1.5,
            boxShadow: '0 8px 20px rgba(94, 106, 210, 0.3)',
            '&:hover': { boxShadow: '0 12px 25px rgba(94, 106, 210, 0.4)' }
          }}
        >
          Import Project
        </Button>
      </Box>

      <Tabs 
        value={tab} 
        onChange={(_, v) => setTab(v)} 
        sx={{ 
          mb: 5,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          '& .MuiTab-root': { 
            fontWeight: 700, 
            fontSize: '0.95rem', 
            color: 'text.secondary',
            minHeight: 64,
            textTransform: 'none',
            px: 4
          },
          '& .Mui-selected': { color: '#5e6ad2 !important' },
          '& .MuiTabs-indicator': { backgroundColor: '#5e6ad2', height: 3, borderRadius: '3px 3px 0 0' }
        }}
      >
        <Tab label="Explore Projects" icon={<Globe size={20} />} iconPosition="start" />
        <Tab label="My Repositories" icon={<FolderGit2 size={20} />} iconPosition="start" />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 15 }}>
          <CircularProgress thickness={5} size={50} sx={{ color: '#5e6ad2' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {tab === 0 && projects.map(item => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card sx={{ 
                background: '#16181D', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: 4,
                transition: 'transform 0.2s, border-color 0.2s',
                '&:hover': { borderColor: 'rgba(94, 106, 210, 0.4)', transform: 'translateY(-4px)' }
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <Avatar src={item.owner_avatar} sx={{ width: 40, height: 40 }}>{item.owner_name?.[0]}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{item.owner_name}</Typography>
                        <Typography variant="caption" color="text.secondary">Project Owner</Typography>
                      </Box>
                    </Stack>
                    <Chip label="Open" size="small" sx={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', fontWeight: 700 }} />
                  </Box>
                  
                  <Typography variant="h6" fontWeight={800} gutterBottom sx={{ mb: 1 }}>{item.repo_name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description || "No description provided for this research collaboration."}
                  </Typography>

                  <Box sx={{ mb: 4 }}>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {item.languages && Object.keys(item.languages).slice(0, 4).map(lang => (
                        <Chip key={lang} label={lang} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: 'text.secondary', fontWeight: 600 }} />
                      ))}
                    </Stack>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<MessageSquare size={18} />}
                    onClick={() => handleJoinRequest(item.id)}
                    sx={{ borderRadius: 3, py: 1.5, borderColor: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(94, 106, 210, 0.05)' } }}
                  >
                    Request to Join
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {tab === 1 && myProjects.map(item => (
            <Grid item xs={12} key={item.id}>
              <Card sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
                <CardContent sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                    <Avatar variant="rounded" sx={{ background: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', width: 56, height: 56 }}>
                      <FolderGit2 size={28} />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>{item.repo_name}</Typography>
                      <Typography variant="body2" color="text.secondary">{item.description || "Project imported from GitHub."}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        {item.is_open_for_collab ? (
                          <Chip label="Publicly Visible" size="small" icon={<Globe size={14} />} sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4caf50' }} />
                        ) : (
                          <Chip label="Private Draft" size="small" icon={<Shield size={14} />} sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'text.secondary' }} />
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={!!item.is_open_for_collab} 
                          onChange={() => handleToggleCollab(item.id, item.is_open_for_collab)}
                        />
                      }
                      label="Collaboration"
                    />
                    <Button variant="outlined" endIcon={<ExternalLink size={18} />} onClick={() => window.open(item.github_repo_url, '_blank')} sx={{ borderRadius: 2 }}>
                      GitHub
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {(!loading && ((tab === 0 && projects.length === 0) || (tab === 1 && myProjects.length === 0))) && (
            <Box sx={{ textAlign: 'center', width: '100%', py: 15 }}>
              <Typography color="text.secondary" sx={{ mb: 3 }}>No projects found here.</Typography>
              <Button variant="outlined" onClick={handleOpenImport} sx={{ borderRadius: 2 }}>Import from GitHub</Button>
            </Box>
          )}
        </Grid>
      )}

      {/* GitHub Import Dialog (Unified with Settings) */}
      <Dialog 
        open={importOpen} 
        onClose={() => !importing && setImportOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { background: '#16181D', borderRadius: 5, backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.08)' } }}
      >
        <DialogTitle sx={{ p: 4, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={800}>Import Project</Typography>
            <IconButton onClick={() => setImportOpen(false)} disabled={importing}><X size={24} /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4, pt: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Select repositories to turn into collaboration projects. We'll automatically extract metadata and skills.
          </Typography>
          {reposLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
              {githubRepos.map(repo => (
                <ListItem
                  key={repo.full_name}
                  onClick={() => toggleRepoSelection(repo.full_name)}
                  sx={{ 
                    mb: 1.5, borderRadius: 3, cursor: 'pointer',
                    bgcolor: selectedRepos.includes(repo.full_name) ? 'rgba(94, 106, 210, 0.08)' : 'rgba(255,255,255,0.02)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                  }}
                >
                  <Checkbox checked={selectedRepos.includes(repo.full_name)} />
                  <ListItemAvatar>
                    <Avatar variant="rounded" sx={{ background: 'rgba(255,255,255,0.05)', color: 'text.secondary' }}>
                      <FolderGit2 size={20} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography fontWeight={700}>{repo.name}</Typography>}
                    secondary={repo.description}
                    secondaryTypographyProps={{ sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button onClick={() => setImportOpen(false)} disabled={importing}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleImportSelected} 
            disabled={importing || selectedRepos.length === 0}
            sx={{ borderRadius: 3, px: 4, py: 1.5 }}
          >
            {importing ? 'Importing...' : `Import ${selectedRepos.length} Projects`}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 3, minWidth: 300 }}>
          {typeof snackbar.message === 'object' ? JSON.stringify(snackbar.message) : String(snackbar.message)}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Collaboration;
