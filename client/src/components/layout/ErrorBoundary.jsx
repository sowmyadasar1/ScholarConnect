import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          minHeight: '400px',
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.default'
        }}>
          <AlertCircle size={64} color="#ff5757" style={{ marginBottom: 24 }} />
          <Typography variant="h5" fontWeight={800} gutterBottom sx={{ color: '#fff' }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
            We've encountered an unexpected error displaying this section. Our team has been notified.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<RefreshCw size={18} />}
            onClick={() => window.location.reload()}
            sx={{ 
              background: 'linear-gradient(135deg, #5e6ad2 0%, #4b55c4 100%)',
              borderRadius: 2,
              px: 4
            }}
          >
            Reload Application
          </Button>
          
          {import.meta.env.DEV && this.state.error && (
            <Box sx={{ mt: 6, p: 3, bgcolor: 'rgba(255, 87, 87, 0.1)', borderRadius: 2, textAlign: 'left', width: '100%', maxWidth: 800, overflowX: 'auto' }}>
              <Typography variant="subtitle2" color="#ff5757" sx={{ fontFamily: 'monospace' }}>
                {this.state.error.toString()}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mt: 1, display: 'block' }}>
                {this.state.errorInfo?.componentStack}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
