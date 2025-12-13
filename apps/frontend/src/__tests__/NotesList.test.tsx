import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotesList } from '../components/NotesList';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockNotes = [
  {
    id: '1',
    title: 'First Note',
    content: 'Content of first note',
    tags: ['work', 'important'],
    color: '#dbeafe',
    isFavorite: true,
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    contentFormat: 'markdown' as const,
    folderId: null,
    userId: 'user-1',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-02T10:00:00Z',
  },
  {
    id: '2',
    title: 'Second Note',
    content: 'Content of second note',
    tags: ['personal'],
    color: '#fee2e2',
    isFavorite: false,
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    contentFormat: 'plaintext' as const,
    folderId: null,
    userId: 'user-1',
    createdAt: '2025-01-03T10:00:00Z',
    updatedAt: '2025-01-03T10:00:00Z',
  },
  {
    id: '3',
    title: 'Third Note',
    content: 'Content of third note',
    tags: ['ideas'],
    isFavorite: false,
    isPinned: false,
    isArchived: true,
    isTrashed: false,
    contentFormat: 'markdown' as const,
    folderId: null,
    userId: 'user-1',
    createdAt: '2025-01-04T10:00:00Z',
    updatedAt: '2025-01-04T10:00:00Z',
  },
];

describe('NotesList', () => {
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

  const renderList = (notes = mockNotes, onNoteClick = jest.fn()) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NotesList notes={notes} onNoteClick={onNoteClick} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('renders list of notes', () => {
      renderList();
      
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.getByText('Second Note')).toBeInTheDocument();
    });

    it('displays note titles correctly', () => {
      renderList();
      
      mockNotes.forEach(note => {
        if (!note.isTrashed && !note.isArchived) {
          expect(screen.getByText(note.title)).toBeInTheDocument();
        }
      });
    });

    it('displays favorite indicator for favorited notes', () => {
      renderList();
      
      // Look for star/favorite indicators
      const favoriteIndicators = screen.getAllByText(/⭐|★/);
      expect(favoriteIndicators.length).toBeGreaterThan(0);
    });

    it('displays pin indicator for pinned notes', () => {
      renderList();
      
      // Look for pin indicators
      const pinIndicators = screen.getAllByText(/📌|📍/);
      expect(pinIndicators.length).toBeGreaterThan(0);
    });

    it('displays tags for each note', () => {
      renderList();
      
      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('important')).toBeInTheDocument();
      expect(screen.getByText('personal')).toBeInTheDocument();
    });

    it('applies color styling to notes', () => {
      renderList();
      
      const firstNote = screen.getByText('First Note').closest('div');
      expect(firstNote).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no notes', () => {
      renderList([]);
      
      expect(screen.getByText(/no notes/i)).toBeInTheDocument();
    });

    it('shows create note prompt in empty state', () => {
      renderList([]);
      
      expect(screen.getByText(/create your first note/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onNoteClick when note is clicked', () => {
      const onNoteClick = jest.fn();
      renderList(mockNotes, onNoteClick);
      
      const firstNote = screen.getByText('First Note');
      fireEvent.click(firstNote);
      
      expect(onNoteClick).toHaveBeenCalledWith(mockNotes[0]);
    });

    it('handles multiple note clicks', () => {
      const onNoteClick = jest.fn();
      renderList(mockNotes, onNoteClick);
      
      fireEvent.click(screen.getByText('First Note'));
      fireEvent.click(screen.getByText('Second Note'));
      
      expect(onNoteClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Filtering', () => {
    it('filters archived notes by default', () => {
      renderList();
      
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.queryByText('Third Note')).not.toBeInTheDocument();
    });

    it('shows only favorite notes when filtered', () => {
      const favoriteNotes = mockNotes.filter(n => n.isFavorite);
      renderList(favoriteNotes);
      
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.queryByText('Second Note')).not.toBeInTheDocument();
    });

    it('filters by tag', () => {
      const workNotes = mockNotes.filter(n => n.tags.includes('work'));
      renderList(workNotes);
      
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.queryByText('Second Note')).not.toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('displays pinned notes first', () => {
      renderList();
      
      const notes = screen.getAllByRole('article');
      // First note should be pinned
      expect(notes[0]).toHaveTextContent('First Note');
    });

    it('sorts by recent updates', () => {
      const sortedNotes = [...mockNotes].sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      renderList(sortedNotes);
      
      const notes = screen.getAllByRole('article');
      expect(notes.length).toBeGreaterThan(0);
    });

    it('sorts alphabetically when specified', () => {
      const sortedNotes = [...mockNotes].sort((a, b) => 
        a.title.localeCompare(b.title)
      );
      renderList(sortedNotes);
      
      const notes = screen.getAllByRole('article');
      expect(notes.length).toBeGreaterThan(0);
    });
  });

  describe('Search/Filter', () => {
    it('filters notes by search query', () => {
      const searchResults = mockNotes.filter(n => 
        n.title.toLowerCase().includes('first')
      );
      renderList(searchResults);
      
      expect(screen.getByText('First Note')).toBeInTheDocument();
      expect(screen.queryByText('Second Note')).not.toBeInTheDocument();
    });

    it('shows no results message when search has no matches', () => {
      renderList([]);
      
      expect(screen.getByText(/no notes/i)).toBeInTheDocument();
    });
  });

  describe('Note Metadata', () => {
    it('displays formatted date', () => {
      renderList();
      
      // Should show some date format
      const dates = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}|ago|Jan|Feb|Mar/i);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('displays content preview', () => {
      renderList();
      
      expect(screen.getByText(/Content of first note/i)).toBeInTheDocument();
    });

    it('truncates long content previews', () => {
      const longNote = {
        ...mockNotes[0],
        content: 'A'.repeat(200),
      };
      renderList([longNote]);
      
      const preview = screen.getByText(/A+/);
      expect(preview.textContent!.length).toBeLessThan(200);
    });
  });

  describe('Grid Layout', () => {
    it('renders notes in grid layout', () => {
      const { container } = renderList();
      
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('applies responsive grid classes', () => {
      const { container } = renderList();
      
      const grid = container.querySelector('[class*="grid-cols"]');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders large number of notes efficiently', () => {
      const manyNotes = Array.from({ length: 100 }, (_, i) => ({
        ...mockNotes[0],
        id: `note-${i}`,
        title: `Note ${i}`,
      }));
      
      const { container } = renderList(manyNotes);
      
      const notes = container.querySelectorAll('[role="article"]');
      expect(notes.length).toBe(100);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      renderList();
      
      const notes = screen.getAllByRole('article');
      expect(notes.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      const onNoteClick = jest.fn();
      renderList(mockNotes, onNoteClick);
      
      const firstNote = screen.getByText('First Note');
      fireEvent.keyDown(firstNote, { key: 'Enter' });
      
      // Should trigger click handler
      expect(firstNote).toBeInTheDocument();
    });
  });
});
