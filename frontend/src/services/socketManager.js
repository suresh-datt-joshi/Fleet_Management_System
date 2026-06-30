import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { getAccessToken } from '../utils/tokenStorage';

const listeners = new Map();
let socket = null;
let connectionState = 'disconnected';
const stateListeners = new Set();

const notifyState = () => {
  stateListeners.forEach((listener) => listener(connectionState));
};

const ensureListenerSet = (event) => {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  return listeners.get(event);
};

const attachSocketHandlers = (instance) => {
  instance.on('connect', () => {
    connectionState = 'connected';
    notifyState();
    instance.emit(SOCKET_EVENTS.GPS_SUBSCRIBE);
    instance.emit(SOCKET_EVENTS.ALERTS_SUBSCRIBE);
    instance.emit(SOCKET_EVENTS.TRIPS_SUBSCRIBE);
    instance.emit(SOCKET_EVENTS.DASHBOARD_SUBSCRIBE);
  });

  instance.on('disconnect', () => {
    connectionState = 'disconnected';
    notifyState();
  });

  instance.on('connect_error', () => {
    connectionState = 'error';
    notifyState();
  });

  instance.on('reconnect_attempt', () => {
    connectionState = 'connecting';
    notifyState();
  });

  for (const [event, handlers] of listeners.entries()) {
    for (const handler of handlers) {
      instance.on(event, handler);
    }
  }
};

export const connectSocket = () => {
  const token = getAccessToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  connectionState = 'connecting';
  notifyState();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    autoConnect: true,
  });

  attachSocketHandlers(socket);
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectionState = 'disconnected';
  notifyState();
};

export const getSocket = () => socket;

export const getConnectionState = () => connectionState;

export const subscribeConnectionState = (listener) => {
  stateListeners.add(listener);
  listener(connectionState);
  return () => stateListeners.delete(listener);
};

export const onSocketEvent = (event, handler) => {
  const set = ensureListenerSet(event);
  set.add(handler);
  if (socket) {
    socket.on(event, handler);
  }
  return () => {
    set.delete(handler);
    if (socket) {
      socket.off(event, handler);
    }
  };
};

export const emitSocketEvent = (event, payload, ack) => {
  if (!socket?.connected) return false;
  if (ack) {
    socket.emit(event, payload, ack);
  } else {
    socket.emit(event, payload);
  }
  return true;
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  getConnectionState,
  subscribeConnectionState,
  onSocketEvent,
  emitSocketEvent,
};
