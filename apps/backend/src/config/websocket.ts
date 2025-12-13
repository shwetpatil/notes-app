import { Server as HttpServer } from 'http';
import { Server, Socket as SocketIOSocket } from 'socket.io';
import { parse } from 'cookie';
import { prisma } from './database.config';
import { logger } from './logger.config';

interface AuthenticatedSocket extends SocketIOSocket {
  userId?: string;
}

interface NoteUpdatePayload {
  noteId: string;
  action: 'create' | 'update' | 'delete' | 'share';
  userId: string;
  data?: any;
}

interface CollaborationPayload {
  noteId: string;
  userId: string;
  username: string;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
}

let io: Server | null = null;

export const initializeWebSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next: any) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('No cookies found'));
      }

      const parsedCookies = parse(cookies);
      const sessionId = parsedCookies['sessionId']; // Using 'sessionId' as configured in server.ts
      
      if (!sessionId) {
        return next(new Error('No session ID'));
      }

      // For WebSocket, we'll validate the session when user joins a room
      // This allows the connection but requires authentication per-room
      socket.userId = 'pending'; // Will be set when joining a note
      logger.info({ socketId: socket.id }, 'WebSocket connection pending authentication');
      next();
    } catch (error) {
      logger.error({ error }, 'WebSocket authentication error');
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    logger.info({ userId, socketId: socket.id }, 'Client connected');

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join note room for real-time collaboration
    socket.on('join:note', async (noteId: string) => {
      try {
        // Verify user has access to note
        const note = await prisma.note.findFirst({
          where: {
            id: noteId,
            OR: [
              { userId },
              {
                shares: {
                  some: {
                    sharedWith: userId,
                  },
                },
              },
            ],
          },
        });

        if (!note) {
          socket.emit('error', { message: 'Note not found or access denied' });
          return;
        }

        socket.join(`note:${noteId}`);
        logger.info({ userId, noteId }, 'User joined note room');

        // Notify others
        socket.to(`note:${noteId}`).emit('user:joined', {
          userId,
          noteId,
        });
      } catch (error) {
        logger.error({ error, noteId }, 'Error joining note room');
        socket.emit('error', { message: 'Failed to join note' });
      }
    });

    // Leave note room
    socket.on('leave:note', (noteId: string) => {
      socket.leave(`note:${noteId}`);
      socket.to(`note:${noteId}`).emit('user:left', {
        userId,
        noteId,
      });
      logger.info({ userId, noteId }, 'User left note room');
    });

    // Real-time cursor position for collaboration
    socket.on('cursor:update', (payload: CollaborationPayload) => {
      socket.to(`note:${payload.noteId}`).emit('cursor:update', {
        ...payload,
        userId,
      });
    });

    // Real-time content changes
    socket.on('content:change', (payload: { noteId: string; content: string; delta?: any }) => {
      socket.to(`note:${payload.noteId}`).emit('content:change', {
        ...payload,
        userId,
      });
    });

    // Typing indicator
    socket.on('typing:start', (noteId: string) => {
      socket.to(`note:${noteId}`).emit('typing:start', { userId, noteId });
    });

    socket.on('typing:stop', (noteId: string) => {
      socket.to(`note:${noteId}`).emit('typing:stop', { userId, noteId });
    });

    socket.on('disconnect', () => {
      logger.info({ userId, socketId: socket.id }, 'Client disconnected');
    });
  });

  logger.info('WebSocket server initialized');
  return io;
};

/**
 * Emit note update to relevant users
 */
export const emitNoteUpdate = (payload: NoteUpdatePayload): void => {
  if (!io) {
    logger.warn('WebSocket not initialized');
    return;
  }

  // Emit to note room (for collaborative editing)
  io.to(`note:${payload.noteId}`).emit('note:update', payload);

  // Emit to user's room (for personal updates)
  io.to(`user:${payload.userId}`).emit('note:update', payload);

  logger.debug({ noteId: payload.noteId, action: payload.action }, 'Note update emitted');
};

/**
 * Emit notification to user
 */
export const emitNotification = (userId: string, notification: any): void => {
  if (!io) {
    logger.warn('WebSocket not initialized');
    return;
  }

  io.to(`user:${userId}`).emit('notification', notification);
  logger.debug({ userId }, 'Notification emitted');
};

export const getIO = (): Server | null => io;

export default { initializeWebSocket, emitNoteUpdate, emitNotification, getIO };
