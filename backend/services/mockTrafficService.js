import { TRAFFIC_LEVELS } from '../constants/enums.js';

const TRAFFIC_PROFILES = {
  [TRAFFIC_LEVELS.LOW]: { multiplier: 1.0, delayMinutes: 0 },
  [TRAFFIC_LEVELS.MEDIUM]: { multiplier: 1.15, delayMinutes: 8 },
  [TRAFFIC_LEVELS.HIGH]: { multiplier: 1.35, delayMinutes: 18 },
  [TRAFFIC_LEVELS.SEVERE]: { multiplier: 1.6, delayMinutes: 35 },
};

export const PROVIDER_NAME = 'mock';

export const getTrafficConditions = (options = {}) => {
  const hour = options.hour ?? new Date().getHours();
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  const isWeekend = options.isWeekend ?? [0, 6].includes(new Date().getDay());

  let level = TRAFFIC_LEVELS.LOW;
  if (!isWeekend && isRushHour) {
    level = Math.random() > 0.4 ? TRAFFIC_LEVELS.HIGH : TRAFFIC_LEVELS.MEDIUM;
  } else if (!isWeekend && hour >= 10 && hour <= 15) {
    level = Math.random() > 0.6 ? TRAFFIC_LEVELS.MEDIUM : TRAFFIC_LEVELS.LOW;
  } else if (isWeekend) {
    level = TRAFFIC_LEVELS.LOW;
  }

  const profile = TRAFFIC_PROFILES[level];

  return {
    provider: PROVIDER_NAME,
    level,
    multiplier: profile.multiplier,
    delayMinutes: profile.delayMinutes,
    description: getTrafficDescription(level),
    checkedAt: new Date().toISOString(),
  };
};

const getTrafficDescription = (level) => {
  const descriptions = {
    [TRAFFIC_LEVELS.LOW]: 'Light traffic — normal travel times expected',
    [TRAFFIC_LEVELS.MEDIUM]: 'Moderate traffic — minor delays possible',
    [TRAFFIC_LEVELS.HIGH]: 'Heavy traffic — expect significant delays',
    [TRAFFIC_LEVELS.SEVERE]: 'Severe congestion — major delays expected',
  };
  return descriptions[level] || descriptions[TRAFFIC_LEVELS.LOW];
};

export const applyTrafficToDuration = (baseDurationMinutes, traffic) => {
  const delay = traffic?.delayMinutes || 0;
  const multiplier = traffic?.multiplier || 1;
  return Math.round(baseDurationMinutes * multiplier + delay);
};

export default { getTrafficConditions, applyTrafficToDuration, PROVIDER_NAME };
