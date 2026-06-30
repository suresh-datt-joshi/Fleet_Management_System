import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { AnimatePresence, motion } from 'framer-motion';
import { useThemeMode } from '../contexts/ThemeContext';
import AuthHeroPanel from '../components/auth/AuthHeroPanel';
import { AuthPageMetaProvider } from '../hooks/useAuthPageMeta';
import { AUTH_ROUTE_META } from '../constants/authRouteMeta';

const AuthLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLight = theme.palette.mode === 'light';
  const { mode, toggleTheme } = useThemeMode();
  const [pageMeta, setPageMeta] = useState({});

  useEffect(() => {
    setPageMeta({});
  }, [location.pathname]);

  const routeMeta = AUTH_ROUTE_META[location.pathname] ?? {};
  const title = pageMeta.title ?? routeMeta.authTitle ?? 'FleetOps';
  const subtitle = pageMeta.subtitle ?? routeMeta.authSubtitle ?? '';

  return (
    <AuthPageMetaProvider value={setPageMeta}>
      <Box sx={{ minHeight: '100vh', display: 'flex' }}>
        {isDesktop && <AuthHeroPanel />}

        <Box
          sx={{
            flex: { md: '1 1 38%', lg: '1 1 35%' },
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, sm: 4 },
            position: 'relative',
            bgcolor: 'background.default',
            background: isLight
              ? 'linear-gradient(160deg, #F8FAFC 0%, #FFFFFF 55%, #EEF4FB 100%)'
              : 'linear-gradient(160deg, #0B0F14 0%, #111820 55%, #0D1B2A 100%)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -80,
              right: -80,
              width: 240,
              height: 240,
              borderRadius: '50%',
              bgcolor: isLight ? 'rgba(21, 101, 192, 0.06)' : 'rgba(21, 101, 192, 0.12)',
              filter: 'blur(8px)',
            }}
          />

          <IconButton
            onClick={toggleTheme}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(22, 28, 36, 0.8)',
              border: '1px solid',
              borderColor: isLight ? 'rgba(21, 101, 192, 0.12)' : 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
              '&:hover': {
                bgcolor: isLight ? '#fff' : 'rgba(22, 28, 36, 0.95)',
              },
            }}
            aria-label="Toggle theme"
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>

          <Box sx={{ width: '100%', maxWidth: 440 }}>
            {!isDesktop && (
              <Stack alignItems="center" spacing={1.5} mb={3}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: '0 8px 24px rgba(21, 101, 192, 0.35)',
                  }}
                >
                  <LocalShippingIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  FleetOps
                </Typography>
              </Stack>
            )}

            <AnimatePresence mode="wait">
              <Box
                key={location.pathname}
                component={motion.div}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <Stack alignItems={isDesktop ? 'flex-start' : 'center'} spacing={0.75} mb={3}>
                  <Typography
                    variant="h4"
                    fontWeight={800}
                    letterSpacing="-0.02em"
                    textAlign={isDesktop ? 'left' : 'center'}
                  >
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign={isDesktop ? 'left' : 'center'}
                      sx={{ lineHeight: 1.6 }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Stack>

                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: isLight ? 'rgba(21, 101, 192, 0.1)' : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isLight
                      ? '0 20px 50px rgba(21, 101, 192, 0.08)'
                      : '0 20px 50px rgba(0, 0, 0, 0.35)',
                    overflow: 'visible',
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Outlet />
                  </CardContent>

                  <Divider sx={{ opacity: 0.6 }} />

                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="center"
                    spacing={1}
                    sx={{ py: 1.75, px: 2 }}
                  >
                    <LockOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">
                      Secure encrypted connection
                    </Typography>
                  </Stack>
                </Card>
              </Box>
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
    </AuthPageMetaProvider>
  );
};

export default AuthLayout;
