import { createTheme } from '@mui/material/styles';

const palette = {
  primary: {
    main: '#1565C0',
    light: '#5E92F3',
    dark: '#003C8F',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#00897B',
    light: '#4EBAAA',
    dark: '#005B4F',
    contrastText: '#FFFFFF',
  },
  success: { main: '#2E7D32' },
  warning: { main: '#ED6C02' },
  error: { main: '#D32F2F' },
  info: { main: '#0288D1' },
};

export const createAppTheme = (mode = 'light') =>
  createTheme({
    palette: {
      mode,
      ...palette,
      ...(mode === 'light'
        ? {
            background: { default: '#F4F6F8', paper: '#FFFFFF' },
            text: { primary: '#1A2027', secondary: '#637381' },
          }
        : {
            background: { default: '#0B0F14', paper: '#161C24' },
            text: { primary: '#FFFFFF', secondary: '#919EAB' },
          }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 10, padding: '10px 20px' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              mode === 'light'
                ? '0px 4px 20px rgba(145, 158, 171, 0.12)'
                : '0px 4px 20px rgba(0, 0, 0, 0.4)',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'medium' },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 16 },
        },
      },
    },
  });

export default createAppTheme;
