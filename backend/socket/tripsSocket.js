import { PERMISSIONS } from '../constants/roles.js';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/socketEvents.js';
import { socketHasPermission } from './authMiddleware.js';

export const registerTripsSocketHandlers = (socket) => {
  const joinTrips = () => {
    if (socketHasPermission(socket, PERMISSIONS.VIEW_TRIPS)) {
      socket.join(SOCKET_ROOMS.TRIPS);
    }
  };

  joinTrips();

  socket.on(SOCKET_EVENTS.TRIPS_SUBSCRIBE, joinTrips);

  socket.on(SOCKET_EVENTS.TRIPS_UNSUBSCRIBE, () => {
    socket.leave(SOCKET_ROOMS.TRIPS);
  });
};

export default registerTripsSocketHandlers;
