import { useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useDispatch } from 'react-redux';
import { baseApi } from '../redux/api/baseApi';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { connectSocket, disconnectSocket, onSocketEvent } from '../services/socketManager';
import { useAuth } from './useAuth';

export const useRealtimeSync = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return undefined;
    }

    connectSocket();

    const invalidate = (...tags) => {
      dispatch(baseApi.util.invalidateTags(tags));
    };

    const unsubscribers = [
      onSocketEvent(SOCKET_EVENTS.ALERT_CREATED, (alert) => {
        invalidate(['Alert', 'Notification', 'Dashboard']);
        enqueueSnackbar(alert.title, { variant: alert.severity === 'high' ? 'error' : 'warning' });
      }),
      onSocketEvent(SOCKET_EVENTS.ALERT_UPDATED, () => {
        invalidate(['Alert', 'Notification', 'Dashboard']);
      }),
      onSocketEvent(SOCKET_EVENTS.ALERT_DELETED, () => {
        invalidate(['Alert', 'Notification', 'Dashboard']);
      }),
      onSocketEvent(SOCKET_EVENTS.ALERTS_ALL_READ, () => {
        invalidate(['Alert', 'Notification', 'Dashboard']);
      }),
      onSocketEvent(SOCKET_EVENTS.NOTIFICATION_NEW, (notification) => {
        invalidate(['Notification', 'Dashboard']);
        enqueueSnackbar(notification.title, { variant: 'info' });
      }),
      onSocketEvent(SOCKET_EVENTS.NOTIFICATION_READ, () => {
        invalidate(['Notification', 'Dashboard']);
      }),
      onSocketEvent(SOCKET_EVENTS.NOTIFICATIONS_ALL_READ, () => {
        invalidate(['Notification', 'Dashboard']);
      }),
      onSocketEvent(SOCKET_EVENTS.TRIP_STARTED, () => {
        invalidate(['Trip', 'Dashboard', 'Driver', 'Vehicle', 'Tracking']);
      }),
      onSocketEvent(SOCKET_EVENTS.TRIP_COMPLETED, () => {
        invalidate(['Trip', 'Dashboard', 'Driver', 'Vehicle', 'Tracking']);
      }),
      onSocketEvent(SOCKET_EVENTS.TRIP_CANCELLED, () => {
        invalidate(['Trip', 'Dashboard', 'Driver', 'Vehicle', 'Tracking']);
      }),
      onSocketEvent(SOCKET_EVENTS.TRIP_UPDATED, () => {
        invalidate([
          'Trip',
          'Dashboard',
          'Tracking',
          { type: 'Trip', id: 'MY_SCHEDULED' },
          { type: 'Trip', id: 'MY_ACTIVE' },
        ]);
      }),
      onSocketEvent(SOCKET_EVENTS.DASHBOARD_ACTIVITY, () => {
        invalidate(['Dashboard']);
      }),
      onSocketEvent(SOCKET_EVENTS.GPS_VEHICLE_UPDATE, () => {
        invalidate(['Tracking']);
      }),
      onSocketEvent(SOCKET_EVENTS.GPS_ALERT, (alert) => {
        invalidate(['Alert', 'Notification', 'Dashboard', 'Tracking']);
        enqueueSnackbar(`${alert.title}: ${alert.message}`, {
          variant: alert.severity === 'high' ? 'error' : 'warning',
        });
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      disconnectSocket();
    };
  }, [dispatch, enqueueSnackbar, isAuthenticated]);
};

export default useRealtimeSync;
