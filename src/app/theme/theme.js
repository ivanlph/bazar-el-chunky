import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0' },
    secondary: { main: '#00a1d6' },
    background: { default: '#f6f8fc', paper: '#ffffff' }
  },
  shape: { borderRadius: 8 },
  typography: { fontFamily: 'Roboto, Arial, sans-serif', h5: { fontWeight: 800 }, h6: { fontWeight: 800 } },
  components: {
    MuiCard: { styleOverrides: { root: { borderRadius: 8, boxShadow: '0 8px 24px rgba(21,101,192,.08)' } } },
    MuiButton: {
      defaultProps: { variant: 'contained' },
      styleOverrides: { root: { borderRadius: 8 } }
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 8 } } },
    MuiTextField: { styleOverrides: { root: { borderRadius: 8 } } }
  }
});

