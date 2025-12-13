"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiLogger } from '@/lib/logger';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinNote: (noteId: string) => void;
  leaveNote: (noteId: string) => void;
  sendNoteUpdate: (noteId: string, data: any) => void;
  sendPresence: (noteId: string, cursor?: { line: number; column: number }) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  joinNote: () => {},
  leaveNote: () => {},
  sendNoteUpdate: () => {},
  sendPresence: () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
  enabled?: boolean;
}

export function WebSocketProvider({ children, enabled = true }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    apiLogger.info('🔌 Connecting to WebSocket server...', { url: WS_URL });

    const socketInstance = io(WS_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      apiLogger.success('✅ WebSocket connected', { socketId: socketInstance.id });
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      apiLogger.warn('❌ WebSocket disconnected', { reason });
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      apiLogger.error('❌ WebSocket connection error', { error: error.message });
      setIsConnected(false);
    });

    socketInstance.on('error', (error) => {
      apiLogger.error('❌ WebSocket error', error);
    });

    setSocket(socketInstance);

    return () => {
      apiLogger.info('🔌 Disconnecting WebSocket...');
      socketInstance.disconnect();
    };
  }, [enabled]);

  const joinNote = useCallback((noteId: string) => {
    if (!socket || !isConnected) {
      apiLogger.warn('Cannot join note: Socket not connected', { noteId });
      return;
    }
    
    apiLogger.info('📝 Joining note room', { noteId });
    socket.emit('join:note', noteId);
  }, [socket, isConnected]);

  const leaveNote = useCallback((noteId: string) => {
    if (!socket || !isConnected) return;
    
    apiLogger.info('📝 Leaving note room', { noteId });
    socket.emit('leave:note', noteId);
  }, [socket, isConnected]);

  const sendNoteUpdate = useCallback((noteId: string, data: any) => {
    if (!socket || !isConnected) return;
    
    socket.emit('note:update', {
      noteId,
      data,
      timestamp: Date.now(),
    });
  }, [socket, isConnected]);

  const sendPresence = useCallback((noteId: string, cursor?: { line: number; column: number }) => {
    if (!socket || !isConnected) return;
    
    socket.emit('user:presence', {
      noteId,
      cursor,
      timestamp: Date.now(),
    });
  }, [socket, isConnected]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    joinNote,
    leaveNote,
    sendNoteUpdate,
    sendPresence,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
