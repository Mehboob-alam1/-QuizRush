import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

import { registerQuizSockets } from './quiz.socket';
import { env } from '../config/env';

export function setupSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.SOCKET_CORS_ORIGIN,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  registerQuizSockets(io);

  return io;
}

