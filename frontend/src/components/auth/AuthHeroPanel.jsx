import { memo, useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import RouteIcon from '@mui/icons-material/Route';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import SpeedIcon from '@mui/icons-material/Speed';
import ShieldIcon from '@mui/icons-material/Shield';
import { AnimatePresence, motion } from 'framer-motion';

const AUTH_HERO_IMAGE = '/images/auth-fleet-hero.png';

const ROTATING_MESSAGES = [
  {
    eyebrow: 'Live fleet visibility',
    title: 'Track every vehicle',
    highlight: 'in real time',
    description: 'Monitor locations, speed, and trip progress from a single live dashboard.',
  },
  {
    eyebrow: 'Intelligent routing',
    title: 'Optimize every route',
    highlight: 'with precision',
    description: 'Plan smarter deliveries, reduce idle time, and keep operations moving efficiently.',
  },
  {
    eyebrow: 'Operational control',
    title: 'Manage your fleet',
    highlight: 'with confidence',
    description: 'Coordinate drivers, vehicles, maintenance, and alerts in one unified platform.',
  },
  {
    eyebrow: 'Data-driven decisions',
    title: 'Turn insights into',
    highlight: 'better outcomes',
    description: 'Use reports and analytics to improve performance across your entire operation.',
  },
];

const HERO_FEATURES = [
  { icon: GpsFixedIcon, label: 'Live GPS tracking' },
  { icon: RouteIcon, label: 'Smart route planning' },
  { icon: SpeedIcon, label: 'Real-time fleet insights' },
];

const HERO_STATS = [
  { value: '500+', label: 'Vehicles managed' },
  { value: '99.9%', label: 'Platform uptime' },
  { value: '24/7', label: 'Operations support' },
];

const textVariants = {
  enter: { opacity: 0, y: 28, filter: 'blur(6px)' },
  center: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -24, filter: 'blur(4px)' },
};

const AuthHeroPanel = memo(() => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMessage = ROTATING_MESSAGES[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % ROTATING_MESSAGES.length);
    }, 4800);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        flex: { md: '1 1 62%', lg: '1 1 65%' },
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          component={motion.img}
          src={AUTH_HERO_IMAGE}
          alt=""
          aria-hidden
          animate={{ scale: [1, 1.08] }}
          transition={{ duration: 22, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(115deg, rgba(11, 15, 20, 0.82) 0%, rgba(11, 15, 20, 0.45) 42%, rgba(13, 27, 42, 0.25) 100%),
            linear-gradient(180deg, rgba(11, 15, 20, 0.15) 0%, rgba(13, 27, 42, 0.92) 100%)
          `,
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.35,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        sx={{ position: 'relative', zIndex: 1, p: { md: 5, lg: 6 }, pb: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: { md: 56, lg: 64 },
              height: { md: 56, lg: 64 },
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              boxShadow: '0 8px 24px rgba(21, 101, 192, 0.45)',
            }}
          >
            <LocalShippingIcon sx={{ color: '#fff', fontSize: { md: 32, lg: 36 } }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              fontWeight={800}
              letterSpacing="-0.02em"
              sx={{ color: '#fff', fontSize: { md: '1.35rem', lg: '1.5rem' } }}
            >
              FleetOps
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.78)', fontSize: { md: '0.85rem', lg: '0.95rem' } }}
            >
              Enterprise Fleet Management
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          px: { md: 5, lg: 6 },
          py: 3,
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box sx={{ maxWidth: { md: 560, lg: 620 } }}>
          <AnimatePresence mode="wait">
            <Box
              key={activeIndex}
              component={motion.div}
              variants={textVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: '#90CAF9',
                  letterSpacing: '0.14em',
                  fontWeight: 700,
                  display: 'block',
                  mb: 2,
                  fontSize: { md: '0.8rem', lg: '0.875rem' },
                }}
              >
                {activeMessage.eyebrow}
              </Typography>

              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  color: '#fff',
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  fontSize: { md: '2.75rem', lg: '3.25rem', xl: '3.5rem' },
                  mb: 0.75,
                }}
              >
                {activeMessage.title}
              </Typography>

              <Typography
                variant="h2"
                fontWeight={800}
                sx={{
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  fontSize: { md: '2.75rem', lg: '3.25rem', xl: '3.5rem' },
                  mb: 2.5,
                  background: 'linear-gradient(90deg, #64B5F6 0%, #4DB6AC 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {activeMessage.highlight}
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.86)',
                  maxWidth: 520,
                  lineHeight: 1.75,
                  mb: 3.5,
                  fontSize: { md: '1rem', lg: '1.125rem' },
                }}
              >
                {activeMessage.description}
              </Typography>
            </Box>
          </AnimatePresence>

          <Stack direction="row" spacing={1.25} sx={{ mb: 3.5 }}>
            {ROTATING_MESSAGES.map((_, index) => (
              <Box
                key={index}
                component={motion.div}
                animate={{
                  width: index === activeIndex ? 36 : 10,
                  opacity: index === activeIndex ? 1 : 0.45,
                }}
                transition={{ duration: 0.35 }}
                sx={{
                  height: 5,
                  borderRadius: 999,
                  bgcolor: index === activeIndex ? '#64B5F6' : 'rgba(255,255,255,0.35)',
                }}
              />
            ))}
          </Stack>

          <Stack spacing={1.75}>
            {HERO_FEATURES.map(({ icon: Icon, label }, index) => (
              <Stack
                key={label}
                component={motion.div}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.08, duration: 0.4 }}
                direction="row"
                alignItems="center"
                spacing={2}
              >
                <Box
                  sx={{
                    width: { md: 44, lg: 48 },
                    height: { md: 44, lg: 48 },
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Icon sx={{ fontSize: { md: 22, lg: 24 }, color: '#fff' }} />
                </Box>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  sx={{ color: 'rgba(255,255,255,0.92)', fontSize: { md: '0.95rem', lg: '1.05rem' } }}
                >
                  {label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        sx={{ position: 'relative', zIndex: 1, p: { md: 5, lg: 6 }, pt: 2 }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ mb: 3, flexWrap: 'wrap' }}
        >
          {HERO_STATS.map(({ value, label }, index) => (
            <Box
              key={label}
              component={motion.div}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.08 }}
              sx={{
                px: 2.5,
                py: 1.75,
                borderRadius: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                minWidth: { md: 140, lg: 155 },
              }}
            >
              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ color: '#fff', lineHeight: 1.1, fontSize: { md: '1.25rem', lg: '1.4rem' } }}
              >
                {value}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'rgba(255,255,255,0.72)', fontSize: { md: '0.8rem', lg: '0.875rem' } }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.25}>
          <ShieldIcon sx={{ fontSize: { md: 20, lg: 22 }, color: '#81C784' }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.72)' }}>
            Enterprise-grade security with role-based access control
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
});

AuthHeroPanel.displayName = 'AuthHeroPanel';

export default AuthHeroPanel;
