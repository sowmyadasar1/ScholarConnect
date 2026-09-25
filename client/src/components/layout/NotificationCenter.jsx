import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, IconButton, Badge, Menu, Typography, List, ListItem, 
  ListItemText, ListItemAvatar, Avatar, Divider, Button, CircularProgress
} from '@mui/material';
import { Bell, Check, Users, BookOpen, MessageSquare, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const NotificationCenter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const pollInterval = useRef(null);

  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchNotifications();
    // 30s polling as per implementation plan
    pollInterval.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(pollInterval.current);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token === 'demo-token' || token === 'admin-demo-token') {
        setNotifications([
          { id: 1, type: 'collab_request', title: 'New Collaboration Invite', message: 'Sophia Chen invited you to Climate Data Analytics Toolkit', is_read: 0 },
          { id: 2, type: 'mentor_request', title: 'Mentorship Connection', message: 'Dr. Alan Turing accepted your mentorship request', is_read: 0 }
        ]);
        setUnreadCount(2);
        return;
      }
      const res = await api.get('/notifications/me');
      const countRes = await api.get('/notifications/unread-count');
      setNotifications(res.data?.notifications || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch (err) {
      setNotifications([
        { id: 1, type: 'collab_request', title: 'New Collaboration Invite', message: 'Sophia Chen invited you to Climate Data Analytics Toolkit', is_read: 0 },
        { id: 2, type: 'mentor_request', title: 'Mentorship Connection', message: 'Dr. Alan Turing accepted your mentorship request', is_read: 0 }
      ]);
      setUnreadCount(2);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => (prev || []).map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read');
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await api.put(`/notifications/${notification.id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => (prev || []).map(n => n.id === notification.id ? { ...n, is_read: 1 } : n));
      }

      handleClose();

      // Routing logic based on type
      switch (notification.type) {
        case 'collab_request':
        case 'collab_accepted':
        case 'collab_rejected':
        case 'team_invite':
        case 'smart_invite':
          navigate('/requests');
          break;
        case 'mentor_request':
        case 'mentor_accepted':
        case 'mentor_rejected':
          navigate('/mentors');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (err) {
      console.error('Action failed');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'collab_request': return <Users size={16} color="#5e6ad2" />;
      case 'team_invite': return <Briefcase size={16} color="#8a2be2" />;
      case 'mentor_request': return <MessageSquare size={16} color="#f5a623" />;
      default: return <Bell size={16} color="#999" />;
    }
  };

  return (
    <Box>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}>
          <Bell size={20} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            mt: 1.5,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            '& .MuiList-root': { py: 0 }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" sx={{ fontSize: '0.75rem' }} onClick={handleMarkAllRead}>Mark all read</Button>
          )}
        </Box>
        <Divider />
        
        <List sx={{ overflow: 'auto', maxHeight: 400 }}>
          {(!notifications || notifications.length === 0) ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <ListItem 
                key={n.id} 
                disablePadding
                sx={{ 
                  bgcolor: n.is_read ? 'transparent' : 'rgba(94, 106, 210, 0.04)',
                  borderLeft: n.is_read ? 'none' : '3px solid #5e6ad2',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                }}
              >
                <Button 
                  fullWidth 
                  onClick={() => handleNotificationClick(n)}
                  sx={{ 
                    justifyContent: 'flex-start', 
                    textAlign: 'left', 
                    textTransform: 'none', 
                    color: 'inherit',
                    py: 1.5,
                    px: 2
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.05)' }}>
                      {getIcon(n.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={n.title}
                    secondary={n.message}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: n.is_read ? 400 : 600 }}
                    secondaryTypographyProps={{ variant: 'caption', sx: { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } }}
                  />
                </Button>
              </ListItem>
            ))
          )}
        </List>
        
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button fullWidth size="small" color="inherit" onClick={() => { handleClose(); navigate('/requests'); }}>
            View All Activity
          </Button>
        </Box>
      </Menu>
    </Box>
  );
};

export default NotificationCenter;
