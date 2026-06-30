import { useEffect, useState } from 'react';
import { Box, LinearProgress, Typography, useTheme } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { motion, AnimatePresence } from 'framer-motion';

const BOOT_MESSAGES = [
  'Initializing workspace',
  'Loading fleet modules',
  'Connecting services',
  'Preparing your dashboard',
];

const SplashScreen = ({ variant = 'boot', message = 'Loading...' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [progress, setProgress] = useState(8);
  const [messageIndex, setMessageIndex] = useState(0);

  const statusText =
    variant === 'boot' ? BOOT_MESSAGES[messageIndex] : message.replace(/\.\.\.$/, '');

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (variant !== 'boot') {
      setProgress((current) => (current < 72 ? 72 : current));
      return undefined;
    }

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        const step = current < 40 ? 6 : current < 70 ? 4 : 2;
        return Math.min(current + step, 92);
      });
    }, 280);

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % BOOT_MESSAGES.length);
    }, 1400);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(messageTimer);
    };
  }, [variant]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        minHeight: '100vh',
        height: '100dvh',
        zIndex: theme.zIndex.modal + 2,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: isDark ? '#0B0F14' : '#F4F6F8',
        background: isDark
          ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(21, 101, 192, 0.22) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(0, 137, 123, 0.14) 0%, transparent 55%), linear-gradient(180deg, #0B0F14 0%, #111820 45%, #0D1B2A 100%)'
          : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(21, 101, 192, 0.14) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(0, 137, 123, 0.1) 0%, transparent 55%), linear-gradient(180deg, #E3F2FD 0%, #F4F6F8 50%, #E8F5F3 100%)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: isDark ? 0.07 : 0.05,
          backgroundImage: `
            linear-gradient(${isDark ? '#fff' : '#1565C0'} 1px, transparent 1px),
            linear-gradient(90deg, ${isDark ? '#fff' : '#1565C0'} 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: '12%',
          left: '-8%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          bgcolor: isDark ? 'rgba(21, 101, 192, 0.08)' : 'rgba(21, 101, 192, 0.06)',
          filter: 'blur(40px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '18%',
          right: '-6%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          bgcolor: isDark ? 'rgba(0, 137, 123, 0.1)' : 'rgba(0, 137, 123, 0.08)',
          filter: 'blur(48px)',
        }}
      />

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          component={motion.div}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            width: { xs: 88, sm: 104 },
            height: { xs: 88, sm: 104 },
            mb: 3,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            boxShadow: isDark
              ? '0 20px 60px rgba(21, 101, 192, 0.45)'
              : '0 20px 60px rgba(21, 101, 192, 0.35)',
          }}
        >
          <LocalShippingIcon sx={{ fontSize: { xs: 48, sm: 56 } }} />
        </Box>

        <Typography
          variant="h3"
          fontWeight={800}
          letterSpacing="-0.03em"
          sx={{ fontSize: { xs: '2rem', sm: '2.75rem' } }}
        >
          FleetOps
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight={400}
          sx={{ mt: 1, mb: 1, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}
        >
          Fleet Management System
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 360 }}>
          Enterprise fleet tracking, routing, and operations
        </Typography>
      </Box>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          px: { xs: 3, sm: 5, md: 8 },
          pb: { xs: 4, sm: 5 },
          pt: 3,
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(21, 101, 192, 0.1)',
          bgcolor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box
          sx={{
            maxWidth: 720,
            mx: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 1.5,
          }}
        >
          <Box sx={{ minHeight: 20, flex: 1, textAlign: 'left' }}>
            <AnimatePresence mode="wait">
              <Typography
                key={statusText}
                component={motion.span}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.25 }}
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                {statusText}
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    width: 16,
                    overflow: 'hidden',
                    verticalAlign: 'bottom',
                    animation: 'splashDots 1.4s steps(4, end) infinite',
                    '@keyframes splashDots': {
                      '0%': { width: 0 },
                      '100%': { width: 16 },
                    },
                    '&::after': { content: '"..."' },
                  }}
                />
              </Typography>
            </AnimatePresence>
          </Box>
          <Typography variant="body2" color="text.disabled" fontWeight={600} sx={{ minWidth: 40 }}>
            {Math.round(progress)}%
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            maxWidth: 720,
            mx: 'auto',
            height: 4,
            borderRadius: 999,
            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(21, 101, 192, 0.12)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              background: 'linear-gradient(90deg, #1565C0 0%, #00897B 100%)',
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default SplashScreen;
