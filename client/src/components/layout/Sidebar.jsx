import React, { useEffect, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Share2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';

const drawerWidth = 260;
const collapsedWidth = 80;

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [reqCount, setReqCount] = useState(0);

  useEffect(() => {
    fetchReqCount();
  }, [location.pathname]);

  const fetchReqCount = async () => {
    try {
      const received = await requestService.getReceivedRequests();
      const pending = received.filter(r => r.status === 'pending' || r.status === 'requested').length;
      setReqCount(pending);
    } catch (e) { /* silent */ }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { text: 'Mentor Matching', icon: <UserCheck size={20} />, path: '/mentors' },
    { text: 'Teammates', icon: <Users size={20} />, path: '/teammates' },
    { text: 'Collaboration', icon: <Share2 size={20} />, path: '/collaboration' },
    { text: 'My Network', icon: <Users size={20} />, path: '/network' },
    { text: 'My Requests', icon: <MessageSquare size={20} />, path: '/requests' },
  ];

  const bottomItems = [
    { text: 'Feedback', icon: <Star size={20} />, path: '/feedback' },
    { text: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0e0f11' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: (collapsed && !mobileOpen) ? 'center' : 'space-between' }}>
        {(!collapsed || mobileOpen) && (
          <Typography variant="h6" component="div" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>
            ScholarConnect
          </Typography>
        )}
        <IconButton onClick={() => setCollapsed(!collapsed)} sx={{ color: 'text.secondary', display: { xs: 'none', md: 'inline-flex' } }}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </IconButton>
        <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'text.secondary', display: { xs: 'inline-flex', md: 'none' } }}>
          <ChevronLeft size={18} />
        </IconButton>
      </Box>

      <List sx={{ px: 2, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={(collapsed && !mobileOpen) ? item.text : ''} placement="right">
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) setMobileOpen(false);
                }}
                selected={location.pathname === item.path}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  justifyContent: (collapsed && !mobileOpen) ? 'center' : 'initial',
                  px: 2.5,
                  '&.Mui-selected': {
                    background: 'linear-gradient(90deg, rgba(94, 106, 210, 0.15) 0%, rgba(94, 106, 210, 0.02) 100%)',
                    color: '#5e6ad2',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      height: '60%',
                      width: 3,
                      backgroundColor: '#5e6ad2',
                      borderRadius: '0 4px 4px 0'
                    },
                    '& .MuiListItemIcon-root': { color: '#5e6ad2' }
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.04)',
                    '& .MuiListItemIcon-root': { color: '#fff' }
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: (collapsed && !mobileOpen) ? 0 : 2.5,
                    justifyContent: 'center',
                    color: location.pathname === item.path ? '#5e6ad2' : 'text.secondary'
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(!collapsed || mobileOpen) && (
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.text}</Typography>
                      </Box>
                    }
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}

        {!!user?.is_admin && (
          <>
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={(collapsed && !mobileOpen) ? 'Admin Stats' : ''} placement="right">
                <ListItemButton
                  onClick={() => {
                    navigate('/admin');
                    if (mobileOpen) setMobileOpen(false);
                  }}
                  selected={location.pathname === '/admin'}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    justifyContent: (collapsed && !mobileOpen) ? 'center' : 'initial',
                    px: 2.5,
                    '&.Mui-selected': { background: 'rgba(255, 87, 87, 0.1)', color: '#ff5757', '& .MuiListItemIcon-root': { color: '#ff5757' } }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: (collapsed && !mobileOpen) ? 0 : 2.5, justifyContent: 'center', color: location.pathname === '/admin' ? '#ff5757' : 'text.secondary' }}>
                    <ShieldCheck size={20} />
                  </ListItemIcon>
                  {(!collapsed || mobileOpen) && <ListItemText primary={<Typography fontWeight={600} fontSize="0.9rem">Admin Panel</Typography>} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
            <ListItem disablePadding>
              <Tooltip title={(collapsed && !mobileOpen) ? 'Manage Users' : ''} placement="right">
                <ListItemButton
                  onClick={() => {
                    navigate('/admin/users');
                    if (mobileOpen) setMobileOpen(false);
                  }}
                  selected={location.pathname === '/admin/users'}
                  sx={{
                    borderRadius: 2,
                    minHeight: 48,
                    justifyContent: (collapsed && !mobileOpen) ? 'center' : 'initial',
                    px: 2.5,
                    '&.Mui-selected': { background: 'rgba(255, 87, 87, 0.1)', color: '#ff5757', '& .MuiListItemIcon-root': { color: '#ff5757' } }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: (collapsed && !mobileOpen) ? 0 : 2.5, justifyContent: 'center', color: location.pathname === '/admin/users' ? '#ff5757' : 'text.secondary' }}>
                    <Users size={20} />
                  </ListItemIcon>
                  {(!collapsed || mobileOpen) && <ListItemText primary={<Typography fontWeight={600} fontSize="0.9rem">Manage Users</Typography>} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </>
        )}
      </List>

      <Box sx={{ p: 2 }}>
        <List disablePadding>
          {bottomItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={(collapsed && !mobileOpen) ? item.text : ''} placement="right">
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (mobileOpen) setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    justifyContent: (collapsed && !mobileOpen) ? 'center' : 'initial',
                    px: 2.5,
                    color: 'text.secondary'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 0, mr: (collapsed && !mobileOpen) ? 0 : 2.5, justifyContent: 'center', color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  {(!collapsed || mobileOpen) && <ListItemText primary={<Typography fontWeight={500} fontSize="0.85rem">{item.text}</Typography>} />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
          <ListItem disablePadding>
            <Tooltip title={(collapsed && !mobileOpen) ? 'Logout' : ''} placement="right">
              <ListItemButton
                onClick={handleLogout}
                sx={{
                  borderRadius: 2,
                  justifyContent: (collapsed && !mobileOpen) ? 'center' : 'initial',
                  px: 2.5,
                  color: '#ff5757'
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: (collapsed && !mobileOpen) ? 0 : 2.5, justifyContent: 'center', color: 'inherit' }}>
                  <LogOut size={20} />
                </ListItemIcon>
                {(!collapsed || mobileOpen) && <ListItemText primary={<Typography fontWeight={500} fontSize="0.85rem">Logout</Typography>} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>

        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ display: 'flex', alignItems: 'center', px: 1, gap: 2 }}>
          <Avatar 
            src={user?.avatar_url} 
            sx={{ width: 36, height: 36, border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {user?.name?.[0]}
          </Avatar>
          {(!collapsed || mobileOpen) && (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap fontWeight={700}>
                {user?.name || 'User'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {user?.email}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#0e0f11', borderRight: '1px solid rgba(255,255,255,0.05)' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: collapsed ? collapsedWidth : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? collapsedWidth : drawerWidth,
            boxSizing: 'border-box',
            background: '#0e0f11',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            transition: 'width 0.2s ease',
            overflowX: 'hidden'
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;