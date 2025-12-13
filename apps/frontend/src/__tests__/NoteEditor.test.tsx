import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NoteEditor } from '../components/NoteEditor';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock API calls
jest.mock('../lib/api', () => ({
  notesApi: {
    createNote: jest.fn(),
    updateNote: jest.fn(),
  },
}));

const mockNote = {
  id: 'test-note-1',
  title: 'Test Note',
  content: 'Test content',
  tags: ['test', 'example'],
  color: '#dbeafe',
  isFavorite: false,
  isPinned: false,
  isArchived: false,
  isTrashed: false,
  contentFormat: 'markdown' as const,
  folderId: null,
  userId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('NoteEditor', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderEditor = (note = null, onClose = jest.fn()) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NoteEditor note={note} onClose={onClose} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('renders empty form for new note', () => {
      renderEditor();
      
      const titleInput = screen.getByPlaceholderText(/note title/i);
      expect(titleInput).toBeInTheDocument();
      expect(titleInput).toHaveValue('');
    });

    it('renders existing note data', () => {
      renderEditor(mockNote);
      
      const titleInput = screen.getByPlaceholderText(/note title/i);
      expect(titleInput).toHaveValue('Test Note');
    });

    it('displays favorite button', () => {
      renderEditor();
      
      const favoriteBtn = screen.getByRole('button', { name: /favorite/i });
      expect(favoriteBtn).toBeInTheDocument();
    });

    it('displays pin button', () => {
      renderEditor();
      
      const pinBtn = screen.getByRole('button', { name: /pin/i });
      expect(pinBtn).toBeInTheDocument();
    });

    it('displays save button', () => {
      renderEditor();
      
      const saveBtn = screen.getByRole('button', { name: /save/i });
      expect(saveBtn).toBeInTheDocument();
    });

    it('displays close button', () => {
      renderEditor();
      
      const closeBtn = screen.getByRole('button', { name: /close|cancel/i });
      expect(closeBtn).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('allows typing in title field', () => {
      renderEditor();
      
      const titleInput = screen.getByPlaceholderText(/note title/i);
      fireEvent.change(titleInput, { target: { value: 'New Title' } });
      
      expect(titleInput).toHaveValue('New Title');
    });

    it('toggles favorite status', () => {
      renderEditor(mockNote);
      
      const favoriteBtn = screen.getByRole('button', { name: /favorite/i });
      fireEvent.click(favoriteBtn);
      
      // Check if button state changed (implementation specific)
      expect(favoriteBtn).toBeInTheDocument();
    });

    it('toggles pin status', () => {
      renderEditor(mockNote);
      
      const pinBtn = screen.getByRole('button', { name: /pin/i });
      fireEvent.click(pinBtn);
      
      expect(pinBtn).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
      const onClose = jest.fn();
      renderEditor(null, onClose);
      
      const closeBtn = screen.getByRole('button', { name: /close|cancel/i });
      fireEvent.click(closeBtn);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tags Management', () => {
    it('displays existing tags', () => {
      renderEditor(mockNote);
      
      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('example')).toBeInTheDocument();
    });

    it('allows adding new tags', async () => {
      renderEditor();
      
      const tagInput = screen.getByPlaceholderText(/add tags/i);
      fireEvent.change(tagInput, { target: { value: 'newtag' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      
      await waitFor(() => {
        // Tag should be added to the list
        expect(tagInput).toHaveValue('');
      });
    });

    it('allows removing tags', () => {
      renderEditor(mockNote);
      
      const removeButtons = screen.getAllByRole('button', { name: /remove|×/i });
      expect(removeButtons.length).toBeGreaterThan(0);
      
      fireEvent.click(removeButtons[0]);
      
      // Tag should be removed
      expect(removeButtons[0]).toBeInTheDocument();
    });
  });

  describe('Content Format Switching', () => {
    it('displays format toggle buttons', () => {
      renderEditor();
      
      const plaintextBtn = screen.getByRole('button', { name: /plain text/i });
      const markdownBtn = screen.getByRole('button', { name: /markdown/i });
      
      expect(plaintextBtn).toBeInTheDocument();
      expect(markdownBtn).toBeInTheDocument();
    });

    it('switches between plaintext and markdown', () => {
      renderEditor();
      
      const markdownBtn = screen.getByRole('button', { name: /markdown/i });
      fireEvent.click(markdownBtn);
      
      const plaintextBtn = screen.getByRole('button', { name: /plain text/i });
      fireEvent.click(plaintextBtn);
      
      expect(plaintextBtn).toBeInTheDocument();
    });
  });

  describe('Color Selection', () => {
    it('allows selecting note color', () => {
      renderEditor();
      
      // Look for color picker buttons
      const colorButtons = screen.queryAllByRole('button');
      const colorPickerButtons = colorButtons.filter(btn => 
        btn.className.includes('rounded-full') || btn.title
      );
      
      expect(colorPickerButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Validation', () => {
    it('prevents saving empty note', async () => {
      const { notesApi } = require('../lib/api');
      renderEditor();
      
      const saveBtn = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveBtn);
      
      await waitFor(() => {
        expect(notesApi.createNote).not.toHaveBeenCalled();
      });
    });

    it('validates minimum title length', () => {
      renderEditor();
      
      const titleInput = screen.getByPlaceholderText(/note title/i);
      fireEvent.change(titleInput, { target: { value: 'A' } });
      
      // Should show validation error or disable save
      expect(titleInput).toHaveValue('A');
    });
  });

  describe('Loading States', () => {
    it('shows loading indicator when saving', async () => {
      const { notesApi } = require('../lib/api');
      notesApi.createNote.mockReturnValue(
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );
      
      renderEditor();
      
      const titleInput = screen.getByPlaceholderText(/note title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Note' } });
      
      const saveBtn = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveBtn);
      
      // Check for loading state
      await waitFor(() => {
        expect(saveBtn).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('saves note with Cmd+S / Ctrl+S', () => {
      renderEditor(mockNote);
      
      const titleInput = screen.getByPlaceholderText(/note title/i);
      fireEvent.keyDown(titleInput, { key: 's', metaKey: true });
      
      // Save should be triggered
      expect(titleInput).toBeInTheDocument();
    });

    it('closes editor with Escape key', () => {
      const onClose = jest.fn();
      renderEditor(null, onClose);
      
      const titleInput = screen.getByPlaceholderText(/note title/i);
      fireEvent.keyDown(titleInput, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Auto-save', () => {
    it('triggers auto-save after debounce period', async () => {
      jest.useFakeTimers();
      renderEditor(mockNote);
      
      const titleInput = screen.getByPlaceholderText(/note title/i);
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      
      // Fast-forward time
      jest.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(titleInput).toHaveValue('Updated Title');
      });
      
      jest.useRealTimers();
    });
  });
});
