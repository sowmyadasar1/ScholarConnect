import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Button, Stack, Avatar,
  TextField, IconButton, Chip, CircularProgress, Divider, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Tabs, Tab,
  Tooltip, Badge, List, ListItem, ListItemAvatar, ListItemText, ListItemButton
} from '@mui/material';
import {
  LayoutGrid, MessageSquare, FileText, Activity, Plus, Send,
  MoreVertical, Trash2, Pin, ArrowLeft, Users, Clock, CheckCircle2,
  Circle, Timer, GripVertical, ExternalLink, GitBranch, Target, Calendar,
  Hash, Shield, Code, Zap, Search, Bell, Settings, Filter, Star
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { workspaceService } from '../services/workspaceService';
import InviteFromNetworkDialog from '../components/collaboration/InviteFromNetworkDialog';
import InviteMentorDialog from '../components/collaboration/InviteMentorDialog';

const STATUS_CONFIG = {
  todo: { label: 'To Do', color: '#f5a623', icon: <Circle size={14} /> },
  in_progress: { label: 'In Progress', color: '#5e6ad2', icon: <Timer size={14} /> },
  done: { label: 'Done', color: '#4caf50', icon: <CheckCircle2 size={14} /> }
};

const PRIORITY_COLORS = { low: '#4caf50', medium: '#f5a623', high: '#f44336', urgent: '#d32f2f' };

const CHANNELS = [
  { id: 'general', name: 'general', icon: <Hash size={16} />, color: '#5e6ad2' },
  { id: 'frontend', name: 'frontend', icon: <Code size={16} />, color: '#61dafb' },
  { id: 'backend', name: 'backend', icon: <Shield size={16} />, color: '#4caf50' },
  { id: 'milestones', name: 'milestones', icon: <Target size={16} />, color: '#f5a623' },
  { id: 'mentors', name: 'mentors', icon: <Star size={16} />, color: '#ffab00' }
];

const Workspace = () => {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const chatPollRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [activeChannel, setActiveChannel] = useState('general');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // Task state
  const [taskDialog, setTaskDialog] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '' });

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);

  // Note state
  const [noteDialog, setNoteDialog] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });

  // Invite states
  const [inviteNetworkDialog, setInviteNetworkDialog] = useState(false);
  const [inviteMentorDialog, setInviteMentorDialog] = useState(false);

  // Repo state
  const [editingRepo, setEditingRepo] = useState(false);
  const [repoLink, setRepoLink] = useState('');

  useEffect(() => {
    loadWorkspace();
    // Poll for new messages every 5s
    chatPollRef.current = setInterval(async () => {
      try {
        const data = await workspaceService.getMessages(teamId);
        setWorkspace(prev => prev ? { ...prev, messages: data.messages || [] } : prev);
      } catch (e) { /* silent */ }
    }, 5000);
    return () => clearInterval(chatPollRef.current);
  }, [teamId]);

  useEffect(() => {
    if (chatEndRef.current && activeTab === 2) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [workspace?.messages?.length, activeTab, activeChannel]);

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      const data = await workspaceService.getWorkspace(teamId);
      setWorkspace(data);
      if (data?.team?.github_repo_url) setRepoLink(data.team.github_repo_url);
    } catch (err) {
      setSnack({ open: true, msg: err.response?.data?.error || 'Failed to load workspace', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Task Handlers ──────────────────────────────
  const handleCreateTask = async () => {
    try {
      await workspaceService.createTask(teamId, taskForm);
      setTaskDialog(false);
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '' });
      loadWorkspace();
      setSnack({ open: true, msg: 'Task created!', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to create task', severity: 'error' });
    }
  };

  const handleMoveTask = async (taskId, newStatus) => {
    try {
      await workspaceService.updateTask(teamId, taskId, { status: newStatus });
      setWorkspace(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      }));
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to move task', severity: 'error' });
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await workspaceService.deleteTask(teamId, taskId);
      setWorkspace(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to delete task', severity: 'error' });
    }
  };

  // ─── Chat Handlers ──────────────────────────────
  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setSending(true);
    try {
      const { message } = await workspaceService.sendMessage(teamId, chatInput.trim(), activeChannel);
      setWorkspace(prev => ({
        ...prev,
        messages: [...(prev.messages || []), { ...message, user_name: user.name, avatar_url: user.avatar_url, type: activeChannel }]
      }));
      setChatInput('');
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to send message', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  // ─── Note Handlers ──────────────────────────────
  const handleCreateNote = async () => {
    try {
      await workspaceService.createNote(teamId, noteForm);
      setNoteDialog(false);
      setNoteForm({ title: '', content: '' });
      loadWorkspace();
      setSnack({ open: true, msg: 'Note added!', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to create note', severity: 'error' });
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await workspaceService.deleteNote(teamId, noteId);
      setWorkspace(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== noteId) }));
      setSnack({ open: true, msg: 'Note deleted', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to delete note', severity: 'error' });
    }
  };

  const handleTogglePin = async (noteId, currentPin) => {
    try {
      await workspaceService.updateNote(teamId, noteId, { is_pinned: currentPin ? 0 : 1 });
      setWorkspace(prev => ({
        ...prev,
        notes: prev.notes.map(n => n.id === noteId ? { ...n, is_pinned: currentPin ? 0 : 1 } : n)
      }));
    } catch (err) {
      setSnack({ open: true, msg: 'Failed to update note', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 20 }}>
        <CircularProgress sx={{ color: '#5e6ad2' }} />
      </Box>
    );
  }

  if (!workspace) {
    return (
      <Box sx={{ textAlign: 'center', py: 20 }}>
        <Typography variant="h5" color="text.secondary">Workspace not found or you don't have access.</Typography>
        <Button onClick={() => navigate('/collaboration')} sx={{ mt: 2 }}>Back to Collaboration</Button>
      </Box>
    );
  }

  const { team, members, tasks, messages, notes, activity } = workspace;
  const filteredMessages = (messages || []).filter(m => m.type === activeChannel || (!m.type && activeChannel === 'general'));
  
  const tasksByStatus = {
    todo: (tasks || []).filter(t => t.status === 'todo'),
    in_progress: (tasks || []).filter(t => t.status === 'in_progress'),
    done: (tasks || []).filter(t => t.status === 'done')
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 8, px: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Button 
            startIcon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/collaboration')}
            sx={{ mb: 2, color: 'text.secondary', fontWeight: 600, px: 0, '&:hover': { background: 'none', color: '#5e6ad2' } }}
          >
            Back to Hub
          </Button>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ 
              width: 48, height: 48, borderRadius: 3, 
              background: 'linear-gradient(135deg, #5e6ad2, #4b55c4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 8px 16px rgba(94, 106, 210, 0.2)'
            }}>
              <LayoutGrid size={24} />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-0.04em', lineHeight: 1 }}>
                {team.repo_name || team.name || `Workspace #${teamId}`}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={16} /> Active Collaboration Space • {members?.length || 0} Members
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="View GitHub">
            <IconButton href={team.github_repo_url} target="_blank" sx={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <GitBranch size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton sx={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <Badge color="error" variant="dot"><Bell size={20} /></Badge>
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />}
            onClick={() => setTaskDialog(true)}
            sx={{ borderRadius: 2, fontWeight: 800, background: 'linear-gradient(135deg, #5e6ad2, #4b55c4)', px: 3 }}
          >
            New Task
          </Button>
        </Box>
      </Box>

      {/* Tabs Layout */}
      <Box sx={{ display: 'flex', gap: 4 }}>
        {/* Main Workspace Area */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{
            mb: 4, 
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '1rem', minHeight: 64, mr: 2, color: 'text.secondary' },
            '& .Mui-selected': { color: '#fff !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#5e6ad2', height: 4, borderRadius: '4px 4px 0 0' }
          }}>
            <Tab icon={<Target size={20} />} iconPosition="start" label="Project Hub" />
            <Tab icon={<LayoutGrid size={20} />} iconPosition="start" label="Board" />
            <Tab icon={<MessageSquare size={20} />} iconPosition="start" label="Slack Chat" />
            <Tab icon={<FileText size={20} />} iconPosition="start" label="Shared Notes" />
            <Tab icon={<Settings size={20} />} iconPosition="start" label="Squad Management" />
          </Tabs>

          {/* ──── Tab 0: Project Hub ──── */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 5, mb: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
                    {workspace.repo_name || workspace.name || "Project Workspace"}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mb: 3 }}>
                    {workspace.project_description || workspace.mentorship_goal || "A shared space for the squad to collaborate and grow."}
                  </Typography>
                  
                  {workspace.mentor_match_id && (
                    <Box sx={{ mb: 4, p: 3, borderRadius: 4, background: 'rgba(94, 106, 210, 0.05)', border: '1px solid rgba(94, 106, 210, 0.1)' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight={800} gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                        Mentorship Briefing
                      </Typography>
                      <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">Mentor</Typography>
                          <Typography variant="body1" fontWeight={700}>{workspace.mentor_name}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">Student</Typography>
                          <Typography variant="body1" fontWeight={700}>{workspace.student_name}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}

                    <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Calendar size={20} color="#5e6ad2" /> Roadmap & Milestones
                    </Typography>
                    
                    <Stack spacing={2}>
                      {(tasks || []).length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          No tasks yet. Create tasks from the Board tab to see them here as milestones.
                        </Typography>
                      ) : (tasks || []).sort((a, b) => {
                        const order = { done: 0, in_progress: 1, todo: 2 };
                        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
                      }).slice(0, 6).map((m) => (
                        <Box key={m.id} onClick={() => {
                          const next = m.status === 'todo' ? 'in_progress' : m.status === 'in_progress' ? 'done' : 'todo';
                          handleMoveTask(m.id, next);
                        }} sx={{ 
                          p: 3, borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: m.status === 'done' ? 'rgba(76, 175, 80, 0.05)' : 
                                      m.status === 'in_progress' ? 'rgba(94, 106, 210, 0.08)' : 'rgba(255,255,255,0.01)',
                          transition: 'transform 0.2s', '&:hover': { transform: 'translateX(4px)' }
                        }}>
                          <Stack direction="row" spacing={3} alignItems="center">
                            <Box sx={{ color: m.status === 'done' ? '#4caf50' : m.status === 'in_progress' ? '#5e6ad2' : 'rgba(255,255,255,0.2)' }}>
                              {m.status === 'done' ? <CheckCircle2 size={24} /> : m.status === 'in_progress' ? <Timer size={24} /> : <Circle size={24} />}
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={800}>{m.title}</Typography>
                              <Typography variant="caption" color="text.secondary">Priority: {m.priority || 'medium'}</Typography>
                            </Box>
                          </Stack>
                          {m.status === 'in_progress' && <Chip label="Focus" size="small" sx={{ bgcolor: '#5e6ad2', fontWeight: 800 }} />}
                          {m.status === 'done' && <Chip label="Done" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.15)', color: '#4caf50', fontWeight: 800 }} />}
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                  <Card sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 5 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Users size={20} color="#5e6ad2" /> Active Squad
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {(members || []).map(m => (
                          <ListItem key={m.id} sx={{ px: 0, py: 1.5 }}>
                            <ListItemAvatar>
                              <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" color="success">
                                <Avatar src={m.avatar_url} sx={{ border: '2px solid rgba(94,106,210,0.3)' }} />
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={<Typography fontWeight={800}>{m.name}</Typography>}
                              secondary={<Typography variant="caption" color="#5e6ad2" fontWeight={700}>{m.role || 'Teammate'}</Typography>}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>

                  <Card sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 5 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Resources</Typography>
                      <Stack spacing={1.5}>
                        {editingRepo ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField 
                              size="small" 
                              fullWidth 
                              placeholder="https://github.com/..." 
                              value={repoLink} 
                              onChange={e => setRepoLink(e.target.value)}
                              variant="outlined"
                            />
                            <Button variant="contained" size="small" onClick={async () => {
                              try {
                                await workspaceService.updateRepo(teamId, repoLink);
                                setEditingRepo(false);
                                loadWorkspace();
                                setSnack({ open: true, msg: 'Repo updated!', severity: 'success' });
                              } catch(err) {
                                setSnack({ open: true, msg: 'Update failed', severity: 'error' });
                              }
                            }}>Save</Button>
                          </Box>
                        ) : (
                          <Button 
                            fullWidth variant="outlined" startIcon={<GitBranch size={16} />} 
                            sx={{ justifyContent: 'flex-start', borderRadius: 2, borderColor: 'rgba(255,255,255,0.1)' }}
                            onClick={() => {
                              if (workspace?.team?.github_repo_url) {
                                window.open(workspace.team.github_repo_url, '_blank');
                              } else {
                                setEditingRepo(true);
                              }
                            }}
                          >
                            {workspace?.team?.github_repo_url ? 'Open GitHub Repo' : 'Link GitHub Repo'}
                          </Button>
                        )}
                        <Button fullWidth variant="outlined" startIcon={<Zap size={16} />} sx={{ justifyContent: 'flex-start', borderRadius: 2, borderColor: 'rgba(255,255,255,0.1)' }}>Deployment Link</Button>
                        <Button fullWidth variant="outlined" startIcon={<FileText size={16} />} sx={{ justifyContent: 'flex-start', borderRadius: 2, borderColor: 'rgba(255,255,255,0.1)' }}>Design Docs</Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          )}

          {/* ──── Tab 1: Kanban Board ──── */}
          {activeTab === 1 && (
            <Box>
              <Grid container spacing={3}>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <Grid item xs={12} md={4} key={status}>
                    <Box sx={{ 
                      borderRadius: 6, background: 'rgba(255,255,255,0.01)', 
                      border: '1px solid rgba(255,255,255,0.05)', p: 3, minHeight: 600,
                      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1)'
                    }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
                        <Box sx={{ 
                          width: 32, height: 32, borderRadius: 2, bgcolor: `${config.color}15`, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color 
                        }}>
                          {config.icon}
                        </Box>
                        <Typography variant="subtitle2" fontWeight={900} sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {config.label}
                        </Typography>
                        <Box sx={{ ml: 'auto', px: 1.5, py: 0.25, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 900 }}>
                          {tasksByStatus[status].length}
                        </Box>
                      </Stack>
                      <Stack spacing={2}>
                        {tasksByStatus[status].map(task => (
                          <TaskCard key={task.id} task={task} status={status} members={members}
                            onMove={handleMoveTask} onDelete={handleDeleteTask} />
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* ──── Tab 2: Slack Chat ──── */}
          {activeTab === 2 && (
            <Card sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden', height: 700, display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Slack Sidebar */}
              <Box sx={{ width: { xs: '100%', md: 260 }, borderRight: { md: '1px solid rgba(255,255,255,0.05)' }, borderBottom: { xs: '1px solid rgba(255,255,255,0.05)', md: 'none' }, background: 'rgba(0,0,0,0.1)', p: 3 }}>
                <Typography variant="h6" fontWeight={900} sx={{ mb: { xs: 2, md: 4 }, color: '#5e6ad2' }}>Channels</Typography>
                <Stack spacing={0.5} direction={{ xs: 'row', md: 'column' }} sx={{ overflowX: 'auto', pb: { xs: 1, md: 0 } }}>
                  {CHANNELS.map(ch => (
                    <ListItemButton 
                      key={ch.id}
                      selected={activeChannel === ch.id}
                      onClick={() => setActiveChannel(ch.id)}
                      sx={{ 
                        borderRadius: 2, mb: { md: 0.5 }, mr: { xs: 1, md: 0 },
                        minWidth: { xs: 140, md: 'auto' },
                        '&.Mui-selected': { bgcolor: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2' },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ color: activeChannel === ch.id ? '#5e6ad2' : 'text.secondary' }}>{ch.icon}</Box>
                        <Typography fontWeight={activeChannel === ch.id ? 800 : 500} variant="body2">{ch.name}</Typography>
                      </Stack>
                    </ListItemButton>
                  ))}
                </Stack>

                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Typography variant="h6" fontWeight={900} sx={{ mt: 5, mb: 3, color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase' }}>Direct Messages</Typography>
                  <Stack spacing={1}>
                    {(members || []).map(m => (
                      <Stack key={m.id} direction="row" spacing={1.5} alignItems="center" sx={{ opacity: 0.7, cursor: 'pointer', '&:hover': { opacity: 1 } }}>
                        <Badge variant="dot" color="success" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                          <Avatar src={m.avatar_url} sx={{ width: 24, height: 24 }} />
                        </Badge>
                        <Typography variant="body2" fontWeight={600}>{m.name.split(' ')[0]}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Box>

              {/* Chat Window */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: { xs: 500, md: 'auto' } }}>
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="h6" fontWeight={900}>#{activeChannel}</Typography>
                    <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Typography variant="body2" color="text.secondary">{members?.length || 0} Members</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small"><Search size={18} /></IconButton>
                    <IconButton size="small"><Settings size={18} /></IconButton>
                  </Stack>
                </Box>

                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4 }}>
                  {filteredMessages.map((msg, i) => {
                    const isMe = msg.user_id === user?.id;
                    return (
                      <Box key={msg.id || i} sx={{ display: 'flex', gap: 2.5, mb: 4, transition: 'all 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.01)' }, p: 1, borderRadius: 2 }}>
                        <Avatar src={msg.avatar_url} sx={{ width: 44, height: 44, borderRadius: 3 }}>{msg.user_name?.[0]}</Avatar>
                        <Box>
                          <Stack direction="row" spacing={1.5} alignItems="center" mb={0.5}>
                            <Typography variant="subtitle2" fontWeight={900} color={isMe ? '#5e6ad2' : 'text.primary'}>{msg.user_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </Typography>
                          </Stack>
                          <Typography variant="body1" sx={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.85)' }}>{msg.content}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={chatEndRef} />
                </Box>

                <Box sx={{ p: 4, pt: 0 }}>
                  <Box sx={{ 
                    p: 2, borderRadius: 4, background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 2, alignItems: 'center' 
                  }}>
                    <IconButton size="small"><Plus size={20} /></IconButton>
                    <TextField 
                      fullWidth variant="standard" placeholder={`Message #${activeChannel}`}
                      value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      slotProps={{ input: { disableUnderline: true, style: { fontWeight: 500 } } }}
                    />
                    <IconButton onClick={handleSendMessage} disabled={!chatInput.trim() || sending} color="primary">
                      <Send size={20} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Card>
          )}

          {/* ──── Tab 3: Shared Notes ──── */}
          {activeTab === 3 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={900}>Shared Notes</Typography>
                <Button 
                  variant="contained" startIcon={<Plus size={18} />}
                  onClick={() => setNoteDialog(true)}
                  sx={{ borderRadius: 2, fontWeight: 800, background: 'linear-gradient(135deg, #5e6ad2, #4b55c4)' }}
                >
                  New Note
                </Button>
              </Stack>
              <Grid container spacing={3}>
                {(notes || []).map(note => (
                  <Grid item xs={12} md={6} key={note.id}>
                    <Card sx={{ 
                      background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 5, 
                      height: '100%', transition: 'all 0.3s', '&:hover': { borderColor: '#5e6ad2', transform: 'translateY(-4px)' }
                    }}>
                      <CardContent sx={{ p: 4 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2' }}>
                              <FileText size={20} />
                            </Box>
                            <Typography variant="h6" fontWeight={800}>{note.title}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title={note.is_pinned ? "Unpin Note" : "Pin Note"}>
                              <IconButton size="small" onClick={() => handleTogglePin(note.id, note.is_pinned)} sx={{ color: note.is_pinned ? '#f5a623' : 'text.secondary' }}>
                                <Pin size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Note">
                              <IconButton size="small" onClick={() => handleDeleteNote(note.id)} sx={{ color: 'text.secondary', '&:hover': { color: '#f44336' } }}>
                                <Trash2 size={18} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                          {note.content}
                        </Typography>
                        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.05)' }} />
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>{note.author_name?.[0]}</Avatar>
                          <Typography variant="caption" fontWeight={700}>{note.author_name}</Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* ──── Tab 4: Team Management ──── */}
          {activeTab === 4 && (
            <Box>
              <Card sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 5, mb: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                      <Typography variant="h5" fontWeight={900}>Manage Project Squad</Typography>
                      <Typography variant="body2" color="text.secondary">Configure roles and expand your team from your network.</Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      startIcon={<Plus size={18} />}
                      onClick={() => setInviteNetworkDialog(true)}
                      sx={{ borderRadius: 2, fontWeight: 800, background: 'linear-gradient(135deg, #5e6ad2, #4b55c4)' }}
                    >
                      Invite from Network
                    </Button>
                  </Stack>

                  <List sx={{ p: 0 }}>
                    {members.map(m => (
                      <ListItem 
                        key={m.id} 
                        sx={{ 
                          mb: 2, p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.03)',
                          bgcolor: 'rgba(255,255,255,0.01)',
                          display: 'flex', alignItems: 'center', gap: 2
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={m.avatar_url}>{m.name[0]}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={<Typography fontWeight={800}>{m.name} {m.id === user.id && '(You)'}</Typography>}
                          secondary={m.preferred_role || 'Contributor'}
                        />
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Chip 
                            label={m.role || 'Member'} 
                            size="small" 
                            sx={{ bgcolor: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }} 
                          />
                          {team.owner_id === user.id && m.id !== user.id && (
                            <IconButton size="small" color="error" sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                              <Trash2 size={18} />
                            </IconButton>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

              {/* Mentors Section */}
              <Card sx={{ background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 5 }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                      <Typography variant="h6" fontWeight={900}>Project Mentors</Typography>
                      <Typography variant="body2" color="text.secondary">Expert advisors assisting this specific project.</Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      startIcon={<Star size={18} />}
                      onClick={() => setInviteMentorDialog(true)}
                      sx={{ borderRadius: 2, fontWeight: 800, borderColor: 'rgba(255,255,255,0.1)' }}
                    >
                      Invite Mentor
                    </Button>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No mentors invited to this project yet.
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}


        </Box>
      </Box>

      {/* Dialogs */}
      <Dialog open={taskDialog} onClose={() => setTaskDialog(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { background: '#16181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 6 } } }}>
        <DialogTitle sx={{ p: 4 }}><Typography variant="h5" fontWeight={900}>Create Mission Task</Typography></DialogTitle>
        <DialogContent sx={{ p: 4, pt: 0 }}>
          <Stack spacing={3}>
            <TextField fullWidth label="Task Title" variant="filled" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} />
            <TextField fullWidth multiline rows={3} label="Details" variant="filled" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select fullWidth label="Priority" variant="filled" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Assignee" variant="filled" value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({ ...f, assigned_to: e.target.value }))}>
                  <MenuItem value="">Unassigned</MenuItem>
                  {members.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button onClick={() => setTaskDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTask} sx={{ borderRadius: 2, fontWeight: 800, px: 4 }}>Deploy Task</Button>
        </DialogActions>
      </Dialog>

      <InviteFromNetworkDialog 
        open={inviteNetworkDialog} 
        onClose={() => setInviteNetworkDialog(false)} 
        projectId={team.collab_project_id}
        onInviteSent={() => setSnack({ open: true, msg: 'Invitation dispatched to your network!', severity: 'success' })}
      />

      <InviteMentorDialog 
        open={inviteMentorDialog} 
        onClose={() => setInviteMentorDialog(false)} 
        projectId={team.collab_project_id}
        onInviteSent={() => setSnack({ open: true, msg: 'Mentor invitation sent!', severity: 'success' })}
      />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

const TaskCard = ({ task, status, onMove, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const nextStatuses = Object.keys(STATUS_CONFIG).filter(s => s !== status);

  return (
    <Card sx={{
      background: '#1a1c22', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4,
      transition: 'all 0.2s', '&:hover': { borderColor: '#5e6ad2', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }
    }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ flex: 1, lineHeight: 1.3 }}>{task.title}</Typography>
          <IconButton size="small" onClick={e => setAnchorEl(e.currentTarget)} sx={{ color: 'text.secondary' }}>
            <MoreVertical size={16} />
          </IconButton>
        </Stack>
        
        {task.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {task.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip 
            label={task.priority} size="small"
            sx={{ 
              height: 20, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
              bgcolor: `${PRIORITY_COLORS[task.priority] || '#666'}15`, color: PRIORITY_COLORS[task.priority] || '#666' 
            }} 
          />
          <Box sx={{ flexGrow: 1 }} />
          {task.assignee_name && (
            <Tooltip title={`Assigned to ${task.assignee_name}`}>
              <Avatar src={task.assignee_avatar} sx={{ width: 24, height: 24, border: '2px solid rgba(94,106,210,0.3)' }} />
            </Tooltip>
          )}
        </Stack>

        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}
          slotProps={{ paper: { sx: { bgcolor: '#1a1c22', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, mt: 1 } } }}>
          {nextStatuses.map(s => (
            <MenuItem key={s} onClick={() => { onMove(task.id, s); setAnchorEl(null); }} sx={{ fontSize: '0.85rem', fontWeight: 700, py: 1.5 }}>
              Move to {STATUS_CONFIG[s].label}
            </MenuItem>
          ))}
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
          <MenuItem onClick={() => { onDelete(task.id); setAnchorEl(null); }} sx={{ fontSize: '0.85rem', fontWeight: 700, py: 1.5, color: '#f44336' }}>
            <Trash2 size={16} style={{ marginRight: 12 }} /> Delete Task
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default Workspace;
