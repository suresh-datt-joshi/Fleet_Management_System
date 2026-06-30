import { PERMISSIONS } from '../constants/roles.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/socketEvents.js';
import { socketHasPermission } from './authMiddleware.js';

export const registerGpsSocketHandlers = (socket) => {
  const joinGps = () => {
    if (socketHasPermission(socket, PERMISSIONS.VIEW_TRACKING)) {
      socket.join(SOCKET_ROOMS.GPS_TRACKING);
    }
  };

  joinGps();

  socket.on(SOCKET_EVENTS.GPS_SUBSCRIBE, joinGps);

  socket.on(SOCKET_EVENTS.GPS_UNSUBSCRIBE, () => {
    socket.leave(SOCKET_ROOMS.GPS_TRACKING);
  });
};

export default registerGpsSocketHandlers;
