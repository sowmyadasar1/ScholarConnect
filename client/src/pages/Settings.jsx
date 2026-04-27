import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField,
  Avatar, Divider, Chip, Stack, Alert, CircularProgress, Snackbar,
  MenuItem, Grid, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemAvatar, Checkbox, IconButton
} from '@mui/material';
import { 
  GitBranch, RefreshCw, Edit2, Save, X, CheckCircle, 
  User, Briefcase, Calendar, FolderGit2, Trash2, 
  ChevronDown, PlusCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { Autocomplete } from '@mui/material';

const PROFICIENCY_LEVELS = [
  { value: 'Beginner', color: '#4caf50', label: 'Beginner' },
  { value: 'Intermediate', color: '#ff9800', label: 'Intermediate' },
  { value: 'Advanced', color: '#f44336', label: 'Advanced' },
  { value: 'Expert', color: '#d32f2f', label: 'Expert' }
];

const Settings = () => {
  const { user, syncGitHub, updateProfile, logout, deleteAccount } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [repos, setRepos] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    bio: '',
    academic_level: '', 
    preferred_role: '',
    availability: ''
  });
  
  // Skills Management
  const [allMasterSkills, setAllMasterSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('Intermediate');
  const [addingSkill, setAddingSkill] = useState(false);

  React.useEffect(() => {
    if (user) {
      setForm({ 
        name: user.name || '', 
        bio: user.bio || '',
        academic_level: user.academic_level || 'Undergraduate', 
        preferred_role: user.preferred_role || '',
        availability: user.availability || 'Full-time'
      });
    }
    fetchMasterSkills();
  }, [user]);

  const fetchMasterSkills = async () => {
    try {
      const data = await authService.getMasterSkills();
      setAllMasterSkills(data.skills || []);
    } catch (err) {
      console.error('Failed to fetch master skills');
    }
  };

  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const handleSyncGithub = async () => {
    setLoadingRepos(true);
    setRepoDialogOpen(true);
    try {
      const data = await authService.getGithubRepos();
      setRepos(data || []);
    } catch (err) {
      showSnack('Failed to fetch GitHub repositories.', 'error');
      setRepoDialogOpen(false);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleImportSelected = async () => {
    setImporting(true);
    try {
      await authService.importGithubRepos(selectedRepos);
      showSnack('Skills successfully imported from selected repositories!');
      setRepoDialogOpen(false);
      syncGitHub(); 
    } catch (err) {
      showSnack('Import failed.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const toggleRepo = (fullName) => {
    setSelectedRepos(prev => 
      prev.includes(fullName) ? prev.filter(r => r !== fullName) : [...prev, fullName]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setEditMode(false);
      showSnack('Profile updated successfully!');
    } catch (err) {
      showSnack('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    
    // Duplicate prevention
    if (user.skills?.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
      showSnack('Skill already exists in your profile.', 'warning');
      return;
    }

    setAddingSkill(true);
    try {
      await authService.addSkills([{ 
        name: trimmed, 
        proficiency: selectedProficiency, 
        category: 'tech' 
      }]);
      showSnack(`${trimmed} added successfully!`);
      setSkillInput('');
      syncGitHub();
    } catch (err) {
      showSnack('Failed to add skill.', 'error');
    } finally {
      setAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId) => {
    try {
      await authService.deleteSkill(skillId);
      showSnack('Skill removed.');
      syncGitHub();
    } catch (err) {
      showSnack('Failed to remove skill.', 'error');
    }
  };

  const handleEditSkill = (skill) => {
    setSkillInput(skill.name);
    setSelectedProficiency(skill.proficiency);
    handleDeleteSkill(skill.id);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      showSnack('Account deleted successfully. Redirecting...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      showSnack('Failed to delete account.', 'error');
    }
  };

  if (!user) return null;

  const academicOptions = [
    { value: 'Undergraduate', label: 'Undergraduate' },
    { value: 'Postgraduate', label: 'Postgraduate' },
    { value: 'PhD', label: 'PhD' },
    { value: 'Alumni', label: 'Alumni' },
    { value: 'Faculty', label: 'Faculty' }
  ];

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 10 }}>
      <Typography variant="h3" fontWeight={800} sx={{ mb: 1, letterSpacing: '-0.02em' }}>Settings</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
        Manage your profile, academic expertise, and integrations.
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          {/* Profile Card */}
          <Card sx={{ mb: 4, background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h5" fontWeight={700}>Public Profile</Typography>
                {!editMode ? (
                  <Button variant="outlined" startIcon={<Edit2 size={16} />} onClick={() => setEditMode(true)} sx={{ borderRadius: 2 }}>
                    Edit Profile
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" startIcon={<Save size={16} />} onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
                  </Stack>
                )}
              </Box>

              <Box sx={{ display: 'flex', gap: 3, mb: 4, alignItems: 'center' }}>
                <Avatar 
                  src={user.avatar_url} 
                  sx={{ width: 90, height: 90, border: '3px solid #5e6ad2', boxShadow: '0 0 20px rgba(94, 106, 210, 0.2)' }}
                >
                  {user.name?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                  <Button size="small" variant="text" sx={{ mt: 1, textTransform: 'none', color: '#5e6ad2', p: 0 }}>
                    Update Profile Image
                  </Button>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary">Bio</Typography>
                  {editMode ? (
                    <TextField 
                      fullWidth 
                      multiline 
                      rows={4} 
                      value={form.bio} 
                      onChange={e => setForm({...form, bio: e.target.value})} 
                      placeholder="Share your academic interests, research focuses, and goals..."
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{user.bio || 'Professional bio not yet provided.'}</Typography>
                  )}
                </Grid>
                
                <Grid xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary">Academic Level</Typography>
                  {editMode ? (
                    <TextField 
                      select 
                      fullWidth 
                      size="small" 
                      value={form.academic_level} 
                      onChange={e => setForm({...form, academic_level: e.target.value})}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      {academicOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Chip 
                      label={user.academic_level || 'Not set'} 
                      variant="filled" 
                      sx={{ background: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', fontWeight: 600 }} 
                    />
                  )}
                </Grid>

                <Grid xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary">Preferred Role</Typography>
                  {editMode ? (
                    <TextField 
                      fullWidth 
                      size="small" 
                      value={form.preferred_role} 
                      onChange={e => setForm({...form, preferred_role: e.target.value})}
                      placeholder="e.g. Full-stack Developer, Researcher"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={500}>{user.preferred_role || 'No preferred role set'}</Typography>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* GitHub Integration */}
          <Card sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <GitBranch size={22} color="#5e6ad2" /> GitHub Sync
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Import skills and repositories to enrich your profile.
                  </Typography>
                </Box>
                <Button 
                  variant="contained" 
                  onClick={handleSyncGithub} 
                  disabled={syncing}
                  startIcon={<RefreshCw size={18} />}
                  sx={{ borderRadius: 2.5, px: 3 }}
                >
                  Sync Repositories
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          {/* Expertise & Skills */}
          <Card sx={{ mb: 4, background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>Expertise</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add skills manually with proficiency levels for better matching.
              </Typography>

              <Box sx={{ mb: 4, p: 2, background: 'rgba(255,255,255,0.02)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Stack spacing={2}>
                  <Autocomplete
                    freeSolo
                    options={allMasterSkills.map(s => s.name)}
                    value={skillInput}
                    onChange={(_, newVal) => setSkillInput(newVal || '')}
                    onInputChange={(_, newVal) => setSkillInput(newVal)}
                    renderInput={(params) => (
                      <TextField {...params} label="Skill Name" size="small" placeholder="e.g. React, Python" />
                    )}
                  />
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>PROFICIENCY</Typography>
                    <Stack direction="row" spacing={1}>
                      {PROFICIENCY_LEVELS.map(level => (
                        <Chip
                          key={level.value}
                          label={level.label}
                          onClick={() => setSelectedProficiency(level.value)}
                          sx={{
                            flex: 1,
                            borderRadius: 1.5,
                            background: selectedProficiency === level.value ? level.color : 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            fontWeight: 700,
                            opacity: selectedProficiency === level.value ? 1 : 0.4,
                            '&:hover': { opacity: 0.8 }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>

                  <Button 
                    fullWidth 
                    variant="contained" 
                    startIcon={<PlusCircle size={18} />}
                    onClick={handleAddSkill}
                    disabled={addingSkill || !skillInput.trim()}
                    sx={{ borderRadius: 2, py: 1 }}
                  >
                    {addingSkill ? <CircularProgress size={20} color="inherit" /> : 'Add Skill'}
                  </Button>
                </Stack>
              </Box>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Skill Set
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {user.skills?.length > 0 ? user.skills.map(skill => {
                  const level = PROFICIENCY_LEVELS.find(l => l.value === skill.proficiency) || PROFICIENCY_LEVELS[1];
                  return (
                    <Chip
                      key={skill.id}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={700}>{skill.name}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>({skill.proficiency})</Typography>
                        </Box>
                      }
                      onClick={() => handleEditSkill(skill)}
                      onDelete={() => handleDeleteSkill(skill.id)}
                      deleteIcon={<X size={14} />}
                      sx={{
                        height: 36,
                        px: 1,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.03)',
                        borderLeft: `4px solid ${level.color}`,
                        cursor: 'pointer',
                        '&:hover': { background: 'rgba(255,255,255,0.06)' }
                      }}
                    />
                  );
                }) : (
                  <Box sx={{ textAlign: 'center', width: '100%', py: 4, opacity: 0.5 }}>
                    <Typography variant="body2">No skills added yet.</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.05)' }} />

              <Box sx={{ p: 2, borderRadius: 3, background: 'rgba(94, 106, 210, 0.05)', border: '1px solid rgba(94, 106, 210, 0.1)' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#5e6ad2', mb: 1 }}>Smart Role Suggestion</Typography>
                <Typography variant="body2" color="text.secondary">
                  Based on your skills, you might be a great fit for: 
                  <Box component="span" sx={{ color: '#fff', fontWeight: 600, ml: 1 }}>
                    {(() => {
                      const names = user.skills?.map(s => s.name.toLowerCase()) || [];
                      if (names.includes('python') && (names.includes('pytorch') || names.includes('tensorflow'))) return 'ML Research Engineer';
                      if (names.includes('react') && names.includes('solidity')) return 'Web3 Frontend Lead';
                      if (names.includes('node.js') && names.includes('docker')) return 'Backend Infrastructure Engineer';
                      return user.skills?.length > 5 ? 'Senior Full-stack Architect' : 'Full-stack Developer';
                    })()}
                  </Box>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Repo Selection Dialog */}
      <Dialog 
        open={repoDialogOpen} 
        onClose={() => !importing && setRepoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { background: '#16181D', borderRadius: 4, backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.08)' } }}
      >
        <DialogTitle component="div">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="h2" fontWeight={700}>Import from GitHub</Typography>
            <IconButton onClick={() => setRepoDialogOpen(false)} disabled={importing} size="small">
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.05)', minHeight: 300 }}>
          {loadingRepos ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {repos.map((repo) => (
                <ListItem 
                  key={repo.full_name}
                  onClick={() => toggleRepo(repo.full_name)}
                  sx={{ 
                    cursor: 'pointer', borderRadius: 2, mb: 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    bgcolor: selectedRepos.includes(repo.full_name) ? 'rgba(94, 106, 210, 0.08)' : 'transparent'
                  }}
                >
                  <Checkbox checked={selectedRepos.includes(repo.full_name)} />
                  <ListItemAvatar>
                    <Avatar variant="rounded" sx={{ background: 'rgba(255,255,255,0.05)', color: 'text.secondary' }}>
                      <FolderGit2 size={20} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={<Typography fontWeight={600}>{repo.name}</Typography>}
                    secondary={repo.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setRepoDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleImportSelected} disabled={importing || selectedRepos.length === 0}>
            {importing ? 'Importing...' : `Import ${selectedRepos.length} Repos`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Danger Zone */}
      <Card sx={{ mt: 4, background: '#16181D', border: '1px solid rgba(244, 67, 54, 0.2)', borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} color="error" gutterBottom>Danger Zone</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Permanently delete your account and all associated research data. This action is irreversible.
          </Typography>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<Trash2 size={18} />}
            onClick={() => {
              if (window.confirm('Are you absolutely sure? This will delete all your projects, skills, and mentor profile data.')) {
                handleDeleteAccount();
              }
            }}
            sx={{ borderRadius: 2.5, px: 3, borderColor: 'rgba(244, 67, 54, 0.3)' }}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Snackbar 
        open={snack.open} 
        autoHideDuration={4000} 
        onClose={() => setSnack({...snack, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: 2, minWidth: 300 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
