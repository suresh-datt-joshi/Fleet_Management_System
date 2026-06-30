import * as gpsService from '../services/gpsService.js';

let simulatorInterval = null;

export const startGpsSimulator = () => {
  if (simulatorInterval) return;

  const intervalMs = parseInt(process.env.GPS_SIMULATOR_INTERVAL_MS, 10) || 10000;

  simulatorInterval = setInterval(async () => {
    try {
      await gpsService.simulateFleetGpsUpdates();
    } catch (error) {
      console.error('GPS simulator error:', error.message);
    }
  }, intervalMs);

  if (process.env.NODE_ENV !== 'test') {
    console.log(`GPS simulator running every ${intervalMs / 1000}s (mock provider)`);
  }
};

export const stopGpsSimulator = () => {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
};

export default { startGpsSimulator, stopGpsSimulator };
