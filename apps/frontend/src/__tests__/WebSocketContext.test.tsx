import { render, renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebSocketProvider, useWebSocket } from '../context/WebSocketContext';
import { useNoteCollaboration } from '../hooks/useNoteCollaboration';
import '@testing-library/jest-dom';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: false,
  };
  return {
    io: jest.fn(() => mockSocket),
    __mockSocket: mockSocket,
  };
});

describe('WebSocketContext', () => {
  let queryClient: QueryClient;
  let mockSocket: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    const socketIo = require('socket.io-client');
    mockSocket = socketIo.__mockSocket;
    mockSocket.connected = false;
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider enabled={true}>
        {children}
      </WebSocketProvider>
    </QueryClientProvider>
  );

  describe('WebSocketProvider', () => {
    it('initializes WebSocket connection when enabled', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current).toBeDefined();
      expect(mockSocket.on).toHaveBeenCalled();
    });

    it('does not connect when disabled', () => {
      const disabledWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          <WebSocketProvider enabled={false}>
            {children}
          </WebSocketProvider>
        </QueryClientProvider>
      );
      
      const { result } = renderHook(() => useWebSocket(), { wrapper: disabledWrapper });
      
      expect(result.current.isConnected).toBe(false);
    });

    it('provides isConnected status', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.isConnected).toBeDefined();
      expect(typeof result.current.isConnected).toBe('boolean');
    });

    it('provides socket instance', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      expect(result.current.socket).toBeDefined();
    });

    it('sets up connection event listeners', () => {
      renderHook(() => useWebSocket(), { wrapper });
      
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });

    it('handles connection event', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      // Simulate connection
      act(() => {
        mockSocket.connected = true;
        const connectHandler = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'connect'
        )?.[1];
        connectHandler?.();
      });
      
      expect(mockSocket.connected).toBe(true);
    });

    it('handles disconnect event', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      // Simulate disconnect
      act(() => {
        mockSocket.connected = false;
        const disconnectHandler = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'disconnect'
        )?.[1];
        disconnectHandler?.();
      });
      
      expect(mockSocket.connected).toBe(false);
    });

    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket(), { wrapper });
      
      unmount();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('useNoteCollaboration', () => {
    const mockNoteId = 'test-note-123';
    const mockUserId = 'user-456';

    beforeEach(() => {
      mockSocket.connected = true;
    });

    it('joins note room on mount when enabled', () => {
      const { result } = renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join-note', {
        noteId: mockNoteId,
        userId: expect.any(String),
      });
    });

    it('does not join room when disabled', () => {
      renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: false,
        }),
        { wrapper }
      );
      
      expect(mockSocket.emit).not.toHaveBeenCalledWith('join-note', expect.any(Object));
    });

    it('leaves note room on unmount', () => {
      const { unmount } = renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      unmount();
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-note', {
        noteId: mockNoteId,
        userId: expect.any(String),
      });
    });

    it('sets up event listeners for collaboration events', () => {
      renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      expect(mockSocket.on).toHaveBeenCalledWith('user-joined', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user-left', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('note-updated', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('presence-update', expect.any(Function));
    });

    it('calls onUserJoined callback when user joins', () => {
      const onUserJoined = jest.fn();
      
      renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
          onUserJoined,
        }),
        { wrapper }
      );
      
      const userJoinedHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'user-joined'
      )?.[1];
      
      const userData = { noteId: mockNoteId, userId: 'other-user', userName: 'Other User' };
      act(() => {
        userJoinedHandler?.(userData);
      });
      
      expect(onUserJoined).toHaveBeenCalledWith(userData);
    });

    it('calls onUserLeft callback when user leaves', () => {
      const onUserLeft = jest.fn();
      
      renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
          onUserLeft,
        }),
        { wrapper }
      );
      
      const userLeftHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'user-left'
      )?.[1];
      
      const userData = { noteId: mockNoteId, userId: 'other-user' };
      act(() => {
        userLeftHandler?.(userData);
      });
      
      expect(onUserLeft).toHaveBeenCalledWith(userData);
    });

    it('calls onNoteUpdated callback when note is updated', () => {
      const onNoteUpdated = jest.fn();
      
      renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
          onNoteUpdated,
        }),
        { wrapper }
      );
      
      const noteUpdatedHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'note-updated'
      )?.[1];
      
      const updateData = {
        noteId: mockNoteId,
        userId: 'other-user',
        changes: { title: 'Updated Title' },
        timestamp: Date.now(),
      };
      
      act(() => {
        noteUpdatedHandler?.(updateData);
      });
      
      expect(onNoteUpdated).toHaveBeenCalledWith(updateData);
    });

    it('provides broadcastUpdate function', () => {
      const { result } = renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      expect(result.current.broadcastUpdate).toBeDefined();
      expect(typeof result.current.broadcastUpdate).toBe('function');
    });

    it('broadcasts note updates', () => {
      const { result } = renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      const changes = { title: 'New Title', content: 'New Content' };
      
      act(() => {
        result.current.broadcastUpdate(changes);
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('note-update', {
        noteId: mockNoteId,
        userId: expect.any(String),
        changes,
      });
    });

    it('provides broadcastPresence function', () => {
      const { result } = renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      expect(result.current.broadcastPresence).toBeDefined();
      expect(typeof result.current.broadcastPresence).toBe('function');
    });

    it('broadcasts presence status', () => {
      const { result } = renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      act(() => {
        result.current.broadcastPresence('active');
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('presence', {
        noteId: mockNoteId,
        userId: expect.any(String),
        status: 'active',
      });
    });

    it('returns connection status', () => {
      mockSocket.connected = true;
      
      const { result } = renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      expect(result.current.isConnected).toBeDefined();
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
        }),
        { wrapper }
      );
      
      unmount();
      
      expect(mockSocket.off).toHaveBeenCalled();
    });

    it('re-joins room when noteId changes', () => {
      const { rerender } = renderHook(
        ({ noteId }) => useNoteCollaboration({
          noteId,
          enabled: true,
        }),
        {
          wrapper,
          initialProps: { noteId: 'note-1' },
        }
      );
      
      jest.clearAllMocks();
      
      rerender({ noteId: 'note-2' });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-note', expect.any(Object));
      expect(mockSocket.emit).toHaveBeenCalledWith('join-note', expect.objectContaining({
        noteId: 'note-2',
      }));
    });
  });

  describe('Error Handling', () => {
    it('handles connection errors gracefully', () => {
      const { result } = renderHook(() => useWebSocket(), { wrapper });
      
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )?.[1];
      
      act(() => {
        errorHandler?.(new Error('Connection failed'));
      });
      
      // Should not throw
      expect(result.current).toBeDefined();
    });

    it('handles malformed event data', () => {
      const onNoteUpdated = jest.fn();
      
      renderHook(
        () => useNoteCollaboration({
          noteId: mockNoteId,
          enabled: true,
          onNoteUpdated,
        }),
        { wrapper }
      );
      
      const noteUpdatedHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'note-updated'
      )?.[1];
      
      act(() => {
        noteUpdatedHandler?.(null);
      });
      
      // Should not crash
      expect(onNoteUpdated).toHaveBeenCalled();
    });
  });
});
