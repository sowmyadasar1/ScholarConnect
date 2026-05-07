import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  LinearProgress,
  Avatar,
  Divider,
  Stack,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Search, 
  Sparkles, 
  Filter, 
  ChevronRight, 
  Users, 
  Clock, 
  Code,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { collabService } from '../services/collabService';
import { useAuth } from '../context/AuthContext';
import VerifiedBadge from '../components/common/VerifiedBadge';
import { Layout, UserCheck, Star } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, aiSearchTrigger } = useOutletContext();
  const theme = useTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    tech: 'All',
    difficulty: 'All'
  });
  
  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [isAiSearchActive, setIsAiSearchActive] = useState(false);

  // Project Detail Modal
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [projectDetails, setProjectDetails] = useState(null);



  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      // Fetch my squads independently
      collabService.getMyProjects()
        .then(data => setMyTeams(data.projects || []))
        .catch(err => {
          console.error('Squad fetch failed:', err);
          setMyTeams([]);
        });
      
      // Initial recommendations
      if (!searchQuery && !aiSearchTrigger) {
        await fetchRecommendations();
      }
    } catch (err) {
      console.error('Initial data fetch failed:', err);
      setError('Dashboard experienced a partial load failure.');
    } finally {
      setLoading(false);
    }
  };

  // Priority fix: Handle search hitting actual backend projects, not just local filtering
  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setIsAiSearchActive(false);
      if (recommendations.length === 0) fetchRecommendations();
      return;
    }

    if (isAiSearchActive) return; // Prevent overwriting AI search results with standard search

    const delayDebounceFn = setTimeout(() => {
      handleRealSearch(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isAiSearchActive]);

  // Handle external AI search triggers from AppLayout
  useEffect(() => {
    if (aiSearchTrigger && aiSearchTrigger.query) {
      handleAiSearch(aiSearchTrigger.query);
    }
  }, [aiSearchTrigger]);

  const fetchRecommendations = async () => {
    if (searchQuery) return; // Don't overwrite if searching
    setLoading(true);
    try {
      const recData = await projectService.getRecommendations();
      setRecommendations(recData.recommendations || []);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Could not load personalized data. Showing trending projects.');
      try {
        const coldData = await projectService.getColdStart();
        setRecommendations(coldData.projects || []);
      } catch (innerErr) {
        setError('Service connectivity issue. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRealSearch = async (query) => {
    if (!query) return;
    setSearchLoading(true);
    setIsAiSearchActive(false);
    try {
      const data = await projectService.getAllProjects({ search: query });
      setSearchResults(data.projects || []);
    } catch (err) {
      console.error('Catalog search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGenerateAiProject = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setIsAiSearchActive(true);
    try {
      const data = await projectService.generateAiProjects(aiPrompt);
      if (data && data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setAiPrompt('');
      }
    } catch (err) {
      console.error('AI Generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAiSearch = async (query) => {
    setLoading(true);
    setIsAiSearchActive(true);
    setSearchQuery(query);
    try {
      const data = await projectService.generateAiProjects(query);
      if (data && data.recommendations) {
        setRecommendations(data.recommendations);
        const hasGenerated = data.recommendations.some(r => r.is_generated);
        if (hasGenerated) {
          setSnackbar({ open: true, message: 'AI synthesized new project concepts based on your query!', severity: 'success' });
        }
      }
    } catch (err) {
      console.error('AI Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleAddToCollab = async (proj) => {
    try {
      const { collabService } = await import('../services/collabService');
      await collabService.createManual({
        title: proj.title,
        description: proj.description,
        domain: proj.domain,
        topics: proj.tech_stack || []
      });
      setSnackbar({ open: true, message: 'Project successfully added to Collaboration!', severity: 'success' });
    } catch (err) {
      console.error('Failed to add to collaboration:', err);
      setSnackbar({ open: true, message: 'Failed to add project to collaboration.', severity: 'error' });
    }
  };

  const handleJoinTeam = async (projectId) => {
    try {
      const { collabService } = await import('../services/collabService');
      await collabService.requestToJoin(projectId, "I would like to contribute to this project.");
      setSnackbar({ open: true, message: 'Application sent successfully!', severity: 'success' });
    } catch (err) {
      console.error('Failed to join team:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to send application.', severity: 'error' });
    }
  };



  const handleOpenProject = async (project) => {
    setSelectedProject(project);
    if (project.is_generated) {
      setProjectDetails({ 
        gaps: Array.isArray(project.gap_info?.missing_skills) ? project.gap_info.missing_skills : [], 
        roadmap: project.roadmap || [
          { phase: 'Phase 1', task: 'Review AI-generated requirements' },
          { phase: 'Phase 2', task: 'Finalize architecture' }
        ] 
      });
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    try {
      const gaps = await projectService.getSkillGaps(project.id);
      const roadmap = await projectService.getRoadmap(project.id);
      setProjectDetails({ gaps, roadmap });
    } catch (err) {
      console.error('Failed to fetch project details:', err);
      setProjectDetails({ gaps: { missing_skills: [] }, roadmap: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const list = (searchQuery && !isAiSearchActive) ? searchResults : recommendations;
    if (!Array.isArray(list)) return [];
    
    return list.filter(p => {
      if (!p || !p.title) return false;
      
      const matchesTech = activeFilters.tech === 'All' || (p.tech_stack && p.tech_stack.includes(activeFilters.tech));
      const matchesDifficulty = activeFilters.difficulty === 'All' || 
                               (activeFilters.difficulty === 'Beginner' && p.difficulty_level <= 2) ||
                               (activeFilters.difficulty === 'Intermediate' && p.difficulty_level > 2 && p.difficulty_level <= 4) ||
                               (activeFilters.difficulty === 'Advanced' && p.difficulty_level > 4);
      
      return matchesTech && matchesDifficulty;
    });
  }, [recommendations, searchResults, searchQuery, activeFilters, isAiSearchActive]);

  const techOptions = ['All', 'React', 'Node.js', 'Python', 'TypeScript', 'PostgreSQL', 'Docker'];
  const diffOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <Box>
      {/* AI Project Generator Hero Section */}
      {!searchQuery && (
        <Card 
          sx={{ 
            mb: 5, 
            background: 'linear-gradient(90deg, rgba(94, 106, 210, 0.15) 0%, rgba(75, 85, 196, 0.05) 100%)',
            border: '1px solid rgba(94, 106, 210, 0.2)',
            borderRadius: 5,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <CardContent sx={{ p: 5, position: 'relative', zIndex: 1 }}>
            <Grid container spacing={4} sx={{ alignItems: 'center' }}>
              <Grid xs={12} md={8}>
                <Box 
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    background: 'rgba(94, 106, 210, 0.2)',
                    color: '#5e6ad2',
                    width: 'fit-content',
                    mb: 2
                  }}
                >
                  <Sparkles size={28} />
                </Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff', mb: 1.5, letterSpacing: '-0.02em' }}>
                  Generate Your Dream Project
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
                  Can't find what you're looking for? Describe your idea in the search bar above and press <strong>Enter</strong> or click the <strong>Sparkles</strong> icon.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained" onClick={() => document.getElementById('global-search-input')?.focus()} sx={{ borderRadius: 3, px: 4, py: 1.5, background: '#5e6ad2' }}>
                    Start Describing
                  </Button>
                  <Button variant="outlined" onClick={() => handleAiSearch('Advanced LLM Research')} sx={{ borderRadius: 3, px: 4, py: 1.5, borderColor: 'rgba(255,255,255,0.1)' }}>
                    Try: LLM Research
                  </Button>
                </Box>
              </Grid>
              <Grid xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
                <Box sx={{ opacity: 0.5 }}>
                  <Code size={200} color="#5e6ad2" strokeWidth={0.5} />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
          <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(94,106,210,0.2) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </Card>
      )}


      {/* Filters Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2, color: 'text.secondary' }}>
          <Filter size={16} style={{ marginRight: 8 }} />
          <Typography variant="body2" fontWeight={600}>Filter:</Typography>
        </Box>
        {diffOptions.map(opt => (
          <Chip
            key={opt}
            label={opt}
            onClick={() => setActiveFilters({ ...activeFilters, difficulty: opt })}
            sx={{
              background: activeFilters.difficulty === opt ? 'rgba(94, 106, 210, 0.2)' : 'rgba(255,255,255,0.03)',
              color: activeFilters.difficulty === opt ? '#5e6ad2' : 'text.secondary',
              border: '1px solid',
              borderColor: activeFilters.difficulty === opt ? '#5e6ad2' : 'transparent',
              '&:hover': { background: 'rgba(255,255,255,0.05)' }
            }}
          />
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
        {techOptions.map(opt => (
          <Chip
            key={opt}
            label={opt}
            onClick={() => setActiveFilters({ ...activeFilters, tech: opt })}
            sx={{
              background: activeFilters.tech === opt ? 'rgba(94, 106, 210, 0.2)' : 'rgba(255,255,255,0.03)',
              color: activeFilters.tech === opt ? '#5e6ad2' : 'text.secondary',
              border: '1px solid',
              borderColor: activeFilters.tech === opt ? '#5e6ad2' : 'transparent',
              '&:hover': { background: 'rgba(255,255,255,0.05)' }
            }}
          />
        ))}
      </Box>

      {/* Active Workspaces / Squads Section */}
      {!searchQuery && (
        <Box sx={{ mb: 6 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
            <Users size={20} color="#5e6ad2" />
            <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>Your Active Squads</Typography>
          </Stack>
          
          {myTeams.length === 0 ? (
            <Card sx={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 4, py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">You haven't joined any project squads or mentorships yet.</Typography>
              <Button size="small" onClick={() => navigate('/collaboration')} sx={{ mt: 1, color: '#5e6ad2', fontWeight: 700 }}>Explore Collaboration</Button>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {myTeams.map(team => (
                <Grid xs={12} sm={6} md={4} key={team.id}>
                  <Card 
                    sx={{ 
                      background: 'rgba(94, 106, 210, 0.05)', 
                      border: '1px solid rgba(94, 106, 210, 0.1)',
                      borderRadius: 4,
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': { background: 'rgba(94, 106, 210, 0.1)', transform: 'translateY(-2px)' }
                    }}
                    onClick={() => navigate(`/workspace/${team.team_id || team.id}`)}
                  >
                    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        variant="rounded" 
                        sx={{ 
                          background: team.mentor_match_id ? 'linear-gradient(135deg, #f5a623 0%, #ff9800 100%)' : 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
                          width: 48, height: 48, borderRadius: 2
                        }}
                      >
                        {team.mentor_match_id ? <UserCheck size={24} /> : <Layout size={24} />}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ mb: 0.2 }}>{team.name || team.repo_name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {team.mentor_match_id ? 'Mentorship Workspace' : 'Project Squad'} • Active now
                        </Typography>
                      </Box>
                      <ChevronRight size={18} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Grid of Projects */}
      {(loading || searchLoading) ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error && filteredProjects.length === 0 ? (
        <Alert severity="error" variant="filled" sx={{ borderRadius: 3, minWidth: 300 }}>
          {typeof error === 'object' ? JSON.stringify(error) : String(error)}
        </Alert>
      ) : (
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 3, letterSpacing: '-0.02em' }}>
            {isAiSearchActive ? `AI Generated Concepts for "${searchQuery}"` : searchQuery ? `Search Results for "${searchQuery}"` : 'Recommended for You'}
          </Typography>
          <Grid container spacing={3}>
            {filteredProjects.map((project) => {
            // Cap match score at 100%
            const baseScore = project.match_score ? Math.min(0.98, project.match_score) : (0.75 + ((project.id * 7) % 20) / 100);
            const matchScore = Math.round(baseScore * 100);
            
            return (
              <Grid xs={12} md={6} lg={4} key={project.id}>
                <Card 
                  className="project-card"
                  sx={{ 
                    height: '100%',
                    background: '#16181D',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '20px', // Matches theme
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: 'rgba(94, 106, 210, 0.4)',
                      transform: 'translateY(-6px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    },
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => handleOpenProject(project)}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip 
                          label={
                            project.difficulty_level <= 2 ? 'Beginner' : 
                            project.difficulty_level <= 4 ? 'Intermediate' : 'Advanced'
                          } 
                          size="small" 
                          sx={{ 
                            background: project.difficulty_level <= 2 ? 'rgba(76, 175, 80, 0.1)' : 
                                        project.difficulty_level <= 4 ? 'rgba(255, 152, 0, 0.1)' : 'rgba(244, 67, 54, 0.1)', 
                            color: project.difficulty_level <= 2 ? '#4caf50' : 
                                   project.difficulty_level <= 4 ? '#ff9800' : '#f44336',
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }} 
                        />
                        {project.is_generated && (
                          <Chip 
                            icon={<Sparkles size={12} />}
                            label="AI Generated" 
                            size="small" 
                            sx={{ 
                              background: 'rgba(94, 106, 210, 0.15)', 
                              color: '#7e8be0',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              '& .MuiChip-icon': { color: '#7e8be0' }
                            }} 
                          />
                        )}
                      </Box>
                      {project.is_verified && (
                        <VerifiedBadge size="sm" label="University Verified" />
                      )}
                    </Box>

                    <Typography variant="h6" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                      {project.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.description}
                    </Typography>

                    {/* Roles Needed (If AI Generated or provided) */}
                    {project.suggested_roles && project.suggested_roles.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.6rem' }}>
                          Roles Needed
                        </Typography>
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          {project.suggested_roles.slice(0, 2).map((role, idx) => (
                            <Chip key={idx} label={role} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                          ))}
                          {project.suggested_roles.length > 2 && (
                            <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary', fontSize: '0.65rem' }}>+{project.suggested_roles.length - 2}</Typography>
                          )}
                        </Stack>
                      </Box>
                    )}

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">Your Skill Match</Typography>
                        <Typography variant="caption" fontWeight={800} color="#5e6ad2">
                          {matchScore}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={matchScore} 
                        sx={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #5e6ad2 0%, #4b55c4 100%)' } }}
                      />
                    </Box>

                    <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, flexWrap: 'wrap' }}>
                      {(() => {
                        let techArray = [];
                        if (Array.isArray(project.tech_stack)) {
                          techArray = project.tech_stack;
                        } else if (typeof project.tech_stack === 'string') {
                          try {
                            techArray = JSON.parse(project.tech_stack);
                            if (!Array.isArray(techArray)) techArray = [techArray];
                          } catch (e) {
                            techArray = project.tech_stack.split(',').map(s => s.trim());
                          }
                        }
                        
                        if (techArray.length === 0) techArray = ['React', 'Firebase'];
                        
                        return (
                          <>
                            {techArray.slice(0, 3).map(tech => (
                              <Chip key={tech} label={tech} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary', fontSize: '0.7rem', fontWeight: 600, mb: 1 }} />
                            ))}
                            {techArray.length > 3 && (
                              <Typography variant="caption" sx={{ alignSelf: 'center', color: 'text.secondary', fontWeight: 600 }}>+{techArray.length - 3}</Typography>
                            )}
                          </>
                        );
                      })()}
                    </Stack>
                  </CardContent>
                  
                  <Box sx={{ p: 2, pt: 0, mt: 'auto' }}>
                    <Button 
                      fullWidth 
                      endIcon={<ChevronRight size={16} />}
                      sx={{ 
                        justifyContent: 'space-between', 
                        color: 'text.primary',
                        background: 'rgba(255,255,255,0.03)',
                        '&:hover': { background: 'rgba(255,255,255,0.08)' },
                        borderRadius: 2,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      View Project Details
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        </Box>
      )}

      {/* Project Detail Modal */}
      <Dialog 
        open={!!selectedProject} 
        onClose={() => setSelectedProject(null)}
        maxWidth="md"
        fullWidth
        disableEnforceFocus
        disableRestoreFocus
        slotProps={{
        paper: {
          sx: { 
            background: '#16181D', 
            borderRadius: 6, 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backgroundImage: 'none',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            maxHeight: '90vh'
          }
        }
      }}>
        {selectedProject && (
          <>
            <DialogTitle sx={{ p: 3, position: 'relative' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedProject.title}</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label={selectedProject.difficulty_level <= 2 ? 'Beginner' : 
                           selectedProject.difficulty_level <= 4 ? 'Intermediate' : 'Advanced'} 
                    color="primary" 
                    size="small" 
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Box>
              <IconButton onClick={() => setSelectedProject(null)} sx={{ color: 'text.secondary', position: 'absolute', right: 16, top: 16 }}>
                <X size={24} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                <Grid xs={12} md={7}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>Description</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedProject.description}
                  </Typography>
                  <>
                    <Typography variant="h6" fontWeight={600} sx={{ mt: 4, mb: 2 }}>Implementation Roadmap</Typography>
                      {detailLoading ? <CircularProgress size={20} /> : (
                        <Stack spacing={2}>
                          {(Array.isArray(projectDetails?.roadmap) ? projectDetails.roadmap : [
                            { phase: 'Phase 1', task: 'Requirement Gathering' },
                            { phase: 'Phase 2', task: 'UI/UX Design' },
                            { phase: 'Phase 3', task: 'Core Feature Development' }
                          ]).map((step, idx) => (
                            <Box key={idx} sx={{ display: 'flex', gap: 2 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#5e6ad2', mt: 0.8 }} />
                                {idx < 2 && <Box sx={{ width: 2, flexGrow: 1, background: 'rgba(255,255,255,0.1)', my: 0.5 }} />}
                              </Box>
                              <Box>
                                <Typography variant="subtitle2" color="text.secondary">{step.phase}</Typography>
                                <Typography variant="body2">{step.task}</Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      )}
                      </>
                </Grid>
                
                <Grid xs={12} md={5}>
                  <Card sx={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>Skill Analysis</Typography>
                      <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
                      
                      <Typography variant="subtitle2" gutterBottom>Requirements</Typography>
                      <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 3, flexWrap: 'wrap' }}>
                        {(Array.isArray(selectedProject.tech_stack) ? selectedProject.tech_stack : []).map(tech => (
                          <Chip key={tech} label={tech} size="small" sx={{ background: 'rgba(94, 106, 210, 0.1)', color: '#5e6ad2', mb: 1 }} />
                        ))}
                      </Stack>
                      
                      <Typography variant="subtitle2" gutterBottom>Skill Gaps</Typography>
                      {detailLoading ? <CircularProgress size={20} /> : (
                        <Stack spacing={1.5}>
                          {(Array.isArray(projectDetails?.gaps) ? projectDetails.gaps : []).map((gap, idx) => (
                            <Box key={gap.skill_id || gap.skill_name || idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <AlertCircle size={16} color="#ffab00" />
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{gap.skill_name || (typeof gap === 'string' ? gap : 'Missing Skill')}</Typography>
                                <Typography variant="caption" color="text.secondary">{gap.suggested_path || 'Estimated 4-6h focus'}</Typography>
                              </Box>
                            </Box>
                          ))}
                          {(!projectDetails?.gaps || projectDetails.gaps.length === 0) && !detailLoading && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No significant skill gaps detected!
                            </Typography>
                          )}
                        </Stack>
                      )}
                      
                      {projectDetails?.gaps?.requirements && (
                        <>
                          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Project Requirements</Typography>
                          <Stack spacing={1}>
                            {(Array.isArray(projectDetails.gaps.requirements) ? projectDetails.gaps.requirements : [projectDetails.gaps.requirements]).map((req, idx) => (
                              <Box key={idx} sx={{ display: 'flex', gap: 1.5 }}>
                                <CheckCircle2 size={14} color="#5e6ad2" style={{ marginTop: 2 }} />
                                <Typography variant="body2" color="text.secondary">{req}</Typography>
                              </Box>
                            ))}
                          </Stack>
                        </>
                      )}

                      {selectedProject.suggested_roles && selectedProject.suggested_roles.length > 0 && (
                        <>
                          <Typography variant="subtitle2" sx={{ mt: 4, mb: 1.5 }}>Suggested Team Roles</Typography>
                          <Stack spacing={2}>
                            {selectedProject.suggested_roles.map((role, idx) => (
                              <Box key={idx} sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" fontWeight={700} color="primary.main">{role}</Typography>
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        </>
                      )}



                      {projectDetails?.gaps?.skill_analysis && (
                        <>
                          <Typography variant="subtitle2" sx={{ mt: 4, mb: 1 }}>Your Readiness</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {projectDetails.gaps.skill_analysis}
                          </Typography>
                        </>
                      )}

                      {projectDetails?.gaps?.resources && (
                        <>
                          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Learning Resources</Typography>
                          <Stack spacing={1}>
                            {projectDetails.gaps.resources.map((res, idx) => (
                              <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" fontWeight={600}>{res.skill}</Typography>
                                <Button 
                                  size="small" 
                                  variant="text" 
                                  onClick={() => window.open(res.url, '_blank')}
                                  sx={{ fontSize: '0.65rem', py: 0 }}
                                >
                                  Open Guide
                                </Button>
                              </Box>
                            ))}
                          </Stack>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  
                      {selectedProject.is_generated ? (
                        <Stack spacing={2} sx={{ mt: 3 }}>
                          <Button 
                            variant="contained" 
                            fullWidth 
                            size="large"
                            onClick={() => handleAddToCollab(selectedProject)}
                            startIcon={<Sparkles size={20} />}
                            sx={{ 
                              borderRadius: 2, py: 1.5,
                              background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
                              boxShadow: '0 8px 16px rgba(94,106,210,0.25)',
                              fontWeight: 700,
                              textTransform: 'none'
                            }}
                          >
                            Add to Hub (Collaboration)
                          </Button>
                        </Stack>
                      ) : selectedProject.owner_id === user?.id ? (
                        <Button 
                          variant="contained" 
                          fullWidth 
                          size="large"
                          onClick={() => {
                            if (selectedProject.team_id) {
                              navigate(`/workspace/${selectedProject.team_id}`);
                            } else {
                              setSnackbar({ open: true, message: 'Workspace initializing...', severity: 'info' });
                            }
                          }}
                          startIcon={<Layout size={20} />}
                          sx={{ 
                            mt: 3, borderRadius: 2, py: 1.5,
                            background: 'rgba(255,255,255,0.05)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 700
                          }}
                        >
                          Open Workspace (Owner)
                        </Button>
                      ) : selectedProject.is_member ? (
                        <Button 
                          variant="contained" 
                          fullWidth 
                          size="large"
                          onClick={() => navigate(`/workspace/${selectedProject.team_id}`)}
                          startIcon={<Layout size={20} />}
                          sx={{ 
                            mt: 3, borderRadius: 2, py: 1.5,
                            background: '#4caf50',
                            fontWeight: 700
                          }}
                        >
                          Go to Workspace
                        </Button>
                      ) : (
                        <Button 
                          variant="contained" 
                          fullWidth 
                          size="large"
                          onClick={() => handleJoinTeam(selectedProject.id)}
                          startIcon={<Users size={20} />}
                          sx={{ 
                            mt: 3, borderRadius: 2, py: 1.5,
                            background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
                            boxShadow: '0 8px 16px rgba(94,106,210,0.25)',
                            fontWeight: 700
                          }}
                        >
                          Join Collaboration
                        </Button>
                      )}
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {typeof snackbar.message === 'object' ? JSON.stringify(snackbar.message) : String(snackbar.message)}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
