'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useNotificationStore } from '../store/notificationStore';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const receiveMessage = useChatStore((state) => state.receiveMessage);
  const setTypingStatus = useChatStore((state) => state.setTypingStatus);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    
    // Connect to Socket.IO Server
    const socketInstance = io(socketUrl, {
      auth: { token: accessToken },
      transports: ['websocket'], // Prefer websockets
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket.IO Connected to Server');
    });

    // Listen for online users lists updates
    socketInstance.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => [...prev.filter((id) => id !== userId), userId]);
    });

    socketInstance.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // Listen for real-time messages
    socketInstance.on('message:received', (message) => {
      receiveMessage(message);
    });

    // Listen for typing states
    socketInstance.on('chat:typing', ({ conversationId, userId, displayName, isTyping }) => {
      setTypingStatus(conversationId, userId, displayName, isTyping);
    });

    // Listen for real-time notifications
    socketInstance.on('notification:received', (notification) => {
      addNotification(notification);
      // Optional: Play a subtle notification sound or show a desktop notification
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
