import { useEffect, useRef, useCallback } from 'react';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { connectSocket, disconnectSocket, onSocketEvent } from '../services/socketManager';
import { getAccessToken } from '../utils/tokenStorage';

export const useGpsSocket = ({ onVehicleUpdate, onAlert, enabled = true }) => {
  const onVehicleUpdateRef = useRef(onVehicleUpdate);
  const onAlertRef = useRef(onAlert);

  onVehicleUpdateRef.current = onVehicleUpdate;
  onAlertRef.current = onAlert;

  const disconnect = useCallback(() => {
    disconnectSocket();
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const token = getAccessToken();
    if (!token) return undefined;

    connectSocket();

    const unsubVehicle = onSocketEvent(SOCKET_EVENTS.GPS_VEHICLE_UPDATE, (payload) => {
      onVehicleUpdateRef.current?.(payload);
    });

    const unsubAlert = onSocketEvent(SOCKET_EVENTS.GPS_ALERT, (payload) => {
      onAlertRef.current?.(payload);
    });

    return () => {
      unsubVehicle();
      unsubAlert();
    };
  }, [enabled]);

  return { disconnect };
};

export default useGpsSocket;
