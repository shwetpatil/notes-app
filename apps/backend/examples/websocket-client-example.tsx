import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

interface NoteUpdatePayload {
  noteId: string;
  action: 'create' | 'update' | 'delete' | 'share';
  userId: string;
  data?: Note;
}

interface CollaborationState {
  [userId: string]: {
    cursor?: { line: number; column: number };
    isTyping: boolean;
  };
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [collaboration, setCollaboration] = useState<CollaborationState>({});

  useEffect(() => {
    // Initialize Socket.io connection
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinNote = (noteId: string) => {
    socket?.emit('join:note', noteId);
  };

  const leaveNote = (noteId: string) => {
    socket?.emit('leave:note', noteId);
  };

  const updateCursor = (noteId: string, cursor: { line: number; column: number }) => {
    socket?.emit('cursor:update', { noteId, cursor });
  };

  const sendContentChange = (noteId: string, content: string, delta?: any) => {
    socket?.emit('content:change', { noteId, content, delta });
  };

  const startTyping = (noteId: string) => {
    socket?.emit('typing:start', noteId);
  };

  const stopTyping = (noteId: string) => {
    socket?.emit('typing:stop', noteId);
  };

  const onNoteUpdate = (callback: (payload: NoteUpdatePayload) => void) => {
    socket?.on('note:update', callback);
    return () => {
      socket?.off('note:update', callback);
    };
  };

  const onUserJoined = (callback: (data: { userId: string; noteId: string }) => void) => {
    socket?.on('user:joined', callback);
    return () => {
      socket?.off('user:joined', callback);
    };
  };

  const onUserLeft = (callback: (data: { userId: string; noteId: string }) => void) => {
    socket?.on('user:left', callback);
    return () => {
      socket?.off('user:left', callback);
    };
  };

  const onCursorUpdate = (
    callback: (data: { userId: string; noteId: string; cursor: { line: number; column: number } }) => void
  ) => {
    socket?.on('cursor:update', callback);
    return () => {
      socket?.off('cursor:update', callback);
    };
  };

  const onContentChange = (
    callback: (data: { userId: string; noteId: string; content: string; delta?: any }) => void
  ) => {
    socket?.on('content:change', callback);
    return () => {
      socket?.off('content:change', callback);
    };
  };

  const onTypingStart = (callback: (data: { userId: string; noteId: string }) => void) => {
    socket?.on('typing:start', (data) => {
      setCollaboration((prev) => ({
        ...prev,
        [data.userId]: { ...prev[data.userId], isTyping: true },
      }));
      callback(data);
    });
    return () => {
      socket?.off('typing:start', callback);
    };
  };

  const onTypingStop = (callback: (data: { userId: string; noteId: string }) => void) => {
    socket?.on('typing:stop', (data) => {
      setCollaboration((prev) => ({
        ...prev,
        [data.userId]: { ...prev[data.userId], isTyping: false },
      }));
      callback(data);
    });
    return () => {
      socket?.off('typing:stop', callback);
    };
  };

  const onNotification = (callback: (notification: any) => void) => {
    socket?.on('notification', callback);
    return () => {
      socket?.off('notification', callback);
    };
  };

  return {
    socket,
    isConnected,
    collaboration,
    joinNote,
    leaveNote,
    updateCursor,
    sendContentChange,
    startTyping,
    stopTyping,
    onNoteUpdate,
    onUserJoined,
    onUserLeft,
    onCursorUpdate,
    onContentChange,
    onTypingStart,
    onTypingStop,
    onNotification,
  };
}

// Example usage in a component
export function NoteEditor({ noteId }: { noteId: string }) {
  const {
    isConnected,
    collaboration,
    joinNote,
    leaveNote,
    updateCursor,
    sendContentChange,
    startTyping,
    stopTyping,
    onNoteUpdate,
    onCursorUpdate,
    onContentChange,
    onTypingStart,
    onTypingStop,
  } = useWebSocket();

  const [content, setContent] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (isConnected && noteId) {
      joinNote(noteId);

      // Listen for updates
      const cleanupNoteUpdate = onNoteUpdate((payload) => {
        if (payload.noteId === noteId && payload.action === 'update' && payload.data) {
          setContent(payload.data.content);
        }
      });

      const cleanupContentChange = onContentChange((data) => {
        if (data.noteId === noteId) {
          setContent(data.content);
        }
      });

      const cleanupTypingStart = onTypingStart((data) => {
        if (data.noteId === noteId) {
          setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
        }
      });

      const cleanupTypingStop = onTypingStop((data) => {
        if (data.noteId === noteId) {
          setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        }
      });

      return () => {
        leaveNote(noteId);
        cleanupNoteUpdate();
        cleanupContentChange();
        cleanupTypingStart();
        cleanupTypingStop();
      };
    }
  }, [isConnected, noteId]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    sendContentChange(noteId, newContent);
  };

  const handleTyping = () => {
    startTyping(noteId);
    // Stop typing after 3 seconds of inactivity
    setTimeout(() => stopTyping(noteId), 3000);
  };

  return (
    <div>
      <div className="connection-status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        onKeyDown={handleTyping}
        placeholder="Start typing..."
      />

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.length === 1
            ? 'Someone is typing...'
            : `${typingUsers.length} people are typing...`}
        </div>
      )}

      {Object.keys(collaboration).length > 0 && (
        <div className="active-users">
          Active users: {Object.keys(collaboration).length}
        </div>
      )}
    </div>
  );
}
