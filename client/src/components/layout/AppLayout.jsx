import React from 'react';
import { Box, TextField, InputAdornment, Typography, IconButton, Badge, Tooltip, Avatar } from '@mui/material';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ErrorBoundary from './ErrorBoundary';
import { Search, Bell, Sparkles, Command } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [aiSearchTrigger, setAiSearchTrigger] = React.useState(null);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Project Discovery';
    if (path === '/mentors') return 'Mentor Matching';
    if (path === '/teammates') return 'Teammate Suggestions';
    if (path === '/collaboration') return 'Collaboration Hub';
    if (path === '/requests') return 'My Requests';
    if (path === '/settings') return 'Profile Settings';
    if (path === '/admin') return 'Admin Dashboard';
    return 'ScholarConnect';
  };

  const handleAiSearch = () => {
    if (!searchQuery.trim()) return;
    setAiSearchTrigger({ query: searchQuery, timestamp: Date.now() });
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#0e0f11' }}>
      <Sidebar />
      
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Topbar */}
        <Box 
          sx={{ 
            height: 72, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            px: 4,
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            bgcolor: '#0e0f11',
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ minWidth: 200 }}>
              {getPageTitle()}
            </Typography>
            
            <TextField
              id="global-search-input"
              size="small"
              placeholder="Search projects, skills, or people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              sx={{ 
                maxWidth: 500,
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.05)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&.Mui-focused fieldset': { borderColor: '#5e6ad2' }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="rgba(255,255,255,0.3)" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="AI Search (Press Enter)">
                      <IconButton size="small" onClick={handleAiSearch} sx={{ color: '#5e6ad2' }}>
                        <Sparkles size={16} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        </Box>

        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 4, 
            overflowY: 'auto',
            bgcolor: 'background.default'
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
