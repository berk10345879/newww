import { Server as SocketIOServer, Socket } from 'socket.io';
import { DataStore } from '../store/datastore.js';

export function registerSignaling(io: SocketIOServer, _store: DataStore) {
  const nsp = io.of('/ws');

  nsp.on('connection', (socket: Socket) => {
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      socket.to(roomId).emit('peer-joined', socket.id);
    });

    socket.on('signal', (payload: { roomId: string; description?: any; candidate?: any }) => {
      const { roomId, description, candidate } = payload;
      socket.to(roomId).emit('signal', { from: socket.id, description, candidate });
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(roomId);
      socket.to(roomId).emit('peer-left', socket.id);
    });

    socket.on('disconnect', () => {
      // no-op
    });
  });
}