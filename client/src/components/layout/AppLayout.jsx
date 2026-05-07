import React from 'react';
import { Box, TextField, InputAdornment, IconButton, Badge, Tooltip, Avatar, Stack } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';
import { Search, Bell, Sparkles, X, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [aiSearchTrigger, setAiSearchTrigger] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Priority 6 fix: Clear search state on route change — no cross-page leakage
  React.useEffect(() => {
    setSearchQuery('');
    setAiSearchTrigger(null);
  }, [location.pathname]);

  const getContextualPlaceholder = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Describe a project idea or search projects...';
    if (path === '/mentors') return 'Search mentors by name, skill, or domain...';
    if (path === '/teammates') return 'Find teammates by skill or research area...';
    if (path === '/collaboration') return 'Search collaboration projects...';
    if (path === '/requests') return 'Filter requests...';
    return 'Search ScholarConnect...';
  };

  const showAiButton = location.pathname === '/dashboard';

  const handleAiSearch = () => {
    if (!searchQuery.trim()) return;
    setAiSearchTrigger({ query: searchQuery, timestamp: Date.now() });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#0e0f11' }}>
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Topbar — clean, centered search */}
        <Box 
          sx={{ 
            height: 72, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            px: { xs: 2, md: 4 },
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            bgcolor: '#0e0f11',
            zIndex: 10,
            position: 'relative'
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <Search size={20} />
          </IconButton>
          {/* Search Bar — visible on all but smallest screens */}
          <Box sx={{ 
            width: '100%', 
            maxWidth: 640, 
            position: 'relative',
            display: { xs: 'none', sm: 'block' } 
          }}>
            <TextField
              id="global-search-input"
              size="small"
              placeholder={getContextualPlaceholder()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (showAiButton) handleAiSearch();
                }
              }}
              fullWidth
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  height: 40,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  fontSize: '0.85rem',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.06)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                  '&.Mui-focused fieldset': { borderColor: '#5e6ad2' }
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={16} color="rgba(255,255,255,0.3)" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {searchQuery && (
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                          {showAiButton && (
                            <Tooltip title="AI Discovery">
                              <IconButton size="small" onClick={handleAiSearch} sx={{ color: '#5e6ad2', p: 0.5 }}>
                                <Sparkles size={15} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <IconButton size="small" onClick={() => setSearchQuery('')} sx={{ color: 'text.secondary', p: 0.5 }}>
                            <X size={14} />
                          </IconButton>
                        </Stack>
                      )}
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>

          {/* Right-side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Profile & Settings">
              <IconButton 
                size="small" 
                onClick={() => navigate('/settings')}
                sx={{ p: 0, border: '2px solid rgba(255,255,255,0.1)', '&:hover': { borderColor: '#5e6ad2' } }}
              >
                <Avatar 
                  src={user?.avatar_url} 
                  sx={{ width: 36, height: 36 }}
                >
                  {user?.name?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, md: 4, lg: 5 }, 
            overflowY: 'auto',
            bgcolor: '#0e0f11'
          }}
        >
          <ErrorBoundary>
            <Outlet context={{ searchQuery, setSearchQuery, aiSearchTrigger }} />
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
