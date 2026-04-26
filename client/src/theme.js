import { createTheme } from '@mui/material/styles';

const linearTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0e0f11', // Deep grey/black for overall background
      paper: '#16181D',   // Slightly lighter for cards/surfaces
    },
    primary: {
      main: '#5e6ad2',    // Vibrant electric blue/purple mix
      light: '#808bf4',
      dark: '#3f4ab0',
    },
    secondary: {
      main: '#8a2be2',    // True purple
    },
    text: {
      primary: '#f2f3f5',
      secondary: '#8a8f98', // Muted grey text
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none', // Linear doesn't use all-caps buttons
      fontWeight: 500,
    },
    h1: { fontWeight: 600, fontSize: '2rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em' },
    h3: { fontWeight: 500, fontSize: '1.25rem' },
    h4: { fontWeight: 500, fontSize: '1.125rem' },
    h5: { fontWeight: 500, fontSize: '1rem' },
    h6: { fontWeight: 500, fontSize: '0.875rem' },
    body1: { fontSize: '0.875rem', letterSpacing: '0.01em' }, // Linear is quite compact
    body2: { fontSize: '0.8125rem' },
  },
  shape: {
    borderRadius: 12, // Standard radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          padding: '6px 16px',
          fontWeight: 600,
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(180deg, #5e6ad2 0%, #4b55c4 100%)',
          border: '1px solid #3f4ab0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          '&:hover': {
            background: 'linear-gradient(180deg, #6c78e0 0%, #5e6ad2 100%)',
          }
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#16181D',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          borderRadius: 20, // 20px radius for cards
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0e0f11',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(14, 15, 17, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 28,
          fontSize: '0.8125rem',
          fontWeight: 600,
          borderRadius: 6,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

export default linearTheme;
