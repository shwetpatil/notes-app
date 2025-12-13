"use client";

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/context/WebSocketContext';
import { Note } from '@notes/types';
import { apiLogger } from '@/lib/logger';

interface UseNoteCollaborationOptions {
  noteId: string;
  enabled?: boolean;
  onUserJoined?: (data: { userId: string; socketId: string }) => void;
  onUserLeft?: (data: { userId: string }) => void;
  onNoteUpdated?: (note: Note) => void;
  onPresenceUpdate?: (data: { userId: string; cursor?: any }) => void;
}

/**
 * Hook for real-time note collaboration
 * Manages WebSocket events for a specific note
 */
export function useNoteCollaboration({
  noteId,
  enabled = true,
  onUserJoined,
  onUserLeft,
  onNoteUpdated,
  onPresenceUpdate,
}: UseNoteCollaborationOptions) {
  const { socket, isConnected, joinNote, leaveNote, sendNoteUpdate, sendPresence } = useWebSocket();
  const queryClient = useQueryClient();

  // Join note room when component mounts
  useEffect(() => {
    if (!enabled || !isConnected || !noteId) return;

    apiLogger.info('🤝 Enabling collaboration for note', { noteId });
    joinNote(noteId);

    return () => {
      apiLogger.info('🤝 Disabling collaboration for note', { noteId });
      leaveNote(noteId);
    };
  }, [enabled, isConnected, noteId, joinNote, leaveNote]);

  // Setup event listeners
  useEffect(() => {
    if (!socket || !enabled) return;

    // User joined the note
    const handleUserJoined = (data: { userId: string; socketId: string }) => {
      apiLogger.info('👤 User joined note', data);
      onUserJoined?.(data);
    };

    // User left the note
    const handleUserLeft = (data: { userId: string }) => {
      apiLogger.info('👤 User left note', data);
      onUserLeft?.(data);
    };

    // Note was updated by another user
    const handleNoteUpdated = (data: { noteId: string; note: Note; userId: string }) => {
      apiLogger.info('📝 Note updated remotely', { noteId: data.noteId, by: data.userId });
      
      // Update React Query cache
      queryClient.setQueryData(['notes', data.noteId], data.note);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      
      onNoteUpdated?.(data.note);
    };

    // User presence update (cursor position, etc.)
    const handlePresenceUpdate = (data: { userId: string; cursor?: any }) => {
      onPresenceUpdate?.(data);
    };

    // Register event listeners
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('note:updated', handleNoteUpdated);
    socket.on('user:presence', handlePresenceUpdate);

    // Cleanup
    return () => {
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('note:updated', handleNoteUpdated);
      socket.off('user:presence', handlePresenceUpdate);
    };
  }, [socket, enabled, queryClient, onUserJoined, onUserLeft, onNoteUpdated, onPresenceUpdate]);

  // Broadcast note update
  const broadcastUpdate = useCallback((data: Partial<Note>) => {
    if (!enabled || !isConnected) return;
    sendNoteUpdate(noteId, data);
  }, [enabled, isConnected, noteId, sendNoteUpdate]);

  // Broadcast cursor position
  const broadcastPresence = useCallback((cursor?: { line: number; column: number }) => {
    if (!enabled || !isConnected) return;
    sendPresence(noteId, cursor);
  }, [enabled, isConnected, noteId, sendPresence]);

  return {
    isConnected,
    broadcastUpdate,
    broadcastPresence,
  };
}
