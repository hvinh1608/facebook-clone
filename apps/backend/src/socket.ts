import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from 'database';
import { JWT_ACCESS_SECRET } from './config/jwt';

let io: Server;
const onlineUsers = new Map<string, string>(); // userId -> socketId

interface CustomSocket extends Socket {
  userId?: string;
}

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware for Sockets
  io.use((socket: CustomSocket, next: any) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as any;
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: CustomSocket) => {
    const userId = socket.userId!;
    onlineUsers.set(userId, socket.id);
    console.log(`🔌 Socket Connected: User ${userId} (${socket.id})`);

    // Join personal room for private alerts/calls/notifications
    socket.join(`user_${userId}`);

    // Broadcast online status to all users
    io.emit('user:online', { userId });

    // Handle joining chat conversations
    socket.on('chat:join', async ({ conversationId }: { conversationId: string }) => {
      try {
        const member = await prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
        });
        if (!member || member.leftAt) {
          socket.emit('chat:error', { message: 'Not a member of this conversation' });
          return;
        }
        socket.join(`conversation_${conversationId}`);
        console.log(`💬 Socket user ${userId} joined conversation ${conversationId}`);
      } catch (err) {
        socket.emit('chat:error', { message: 'Failed to join conversation' });
      }
    });

    // Handle typing status
    socket.on('chat:typing', ({ conversationId, displayName }: any) => {
      socket.to(`conversation_${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
        displayName,
        isTyping: true,
      });
    });

    socket.on('chat:stop-typing', ({ conversationId }: any) => {
      socket.to(`conversation_${conversationId}`).emit('chat:typing', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // WebRTC call signaling (demo)
    socket.on('call:offer', ({ toUserId, offer, callType, callerName }: any) => {
      io.to(`user_${toUserId}`).emit('call:offer', {
        fromUserId: userId,
        offer,
        callType,
        callerName,
      });
    });

    socket.on('call:answer', ({ toUserId, answer }: any) => {
      io.to(`user_${toUserId}`).emit('call:answer', { fromUserId: userId, answer });
    });

    socket.on('call:ice-candidate', ({ toUserId, candidate }: any) => {
      io.to(`user_${toUserId}`).emit('call:ice-candidate', { fromUserId: userId, candidate });
    });

    socket.on('call:end', ({ toUserId }: any) => {
      io.to(`user_${toUserId}`).emit('call:end', { fromUserId: userId });
    });

    // Live stream signaling
    socket.on('live:join', async ({ sessionId }: { sessionId: string }) => {
      try {
        const session = await prisma.liveSession.findUnique({ where: { id: sessionId } });
        if (!session || session.status !== 'LIVE') {
          socket.emit('live:error', { message: 'Live session not found or not active' });
          return;
        }
        socket.join(`live_${sessionId}`);
        socket.to(`live_${sessionId}`).emit('live:viewer-joined', { userId, sessionId });
      } catch (err) {
        socket.emit('live:error', { message: 'Failed to join live session' });
      }
    });

    socket.on('live:leave', ({ sessionId }: { sessionId: string }) => {
      socket.leave(`live_${sessionId}`);
      socket.to(`live_${sessionId}`).emit('live:viewer-left', { userId, sessionId });
    });

    socket.on('live:offer', ({ sessionId, toUserId, offer }: any) => {
      io.to(`user_${toUserId}`).emit('live:offer', { fromUserId: userId, sessionId, offer });
    });

    socket.on('live:answer', ({ sessionId, toUserId, answer }: any) => {
      io.to(`user_${toUserId}`).emit('live:answer', { fromUserId: userId, sessionId, answer });
    });

    socket.on('live:ice-candidate', ({ sessionId, toUserId, candidate }: any) => {
      io.to(`user_${toUserId}`).emit('live:ice-candidate', { fromUserId: userId, sessionId, candidate });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      console.log(`🔌 Socket Disconnected: User ${userId}`);
      
      // Broadcast offline status
      io.emit('user:offline', { userId });
    });
  });

  return io;
};

// Helper: Emit to room
export const emitToConversation = (conversationId: string, event: string, data: any) => {
  if (io) {
    io.to(`conversation_${conversationId}`).emit(event, data);
  }
};

// Helper: Send notification or message to a specific user
export const sendRealtimeNotification = (receiverId: string, notification: any) => {
  if (io) {
    io.to(`user_${receiverId}`).emit('notification:received', notification);
  }
};

// Helper: Check if user is online
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};

// Helper: Get active socket connection for debugging
export const getIOInstance = () => io;
