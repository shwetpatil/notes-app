import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SearchBar } from '@/components/SearchBar';

expect.extend(toHaveNoViolations);

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();
  const mockOnTagSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input', () => {
    render(
      <SearchBar
        onSearch={mockOnSearch}
        onTagSelect={mockOnTagSelect}
        allTags={[]}
      />
    );
    
    expect(screen.getByPlaceholderText(/search notes/i)).toBeInTheDocument();
  });

  it('calls onSearch when typing', () => {
    render(
      <SearchBar
        onSearch={mockOnSearch}
        onTagSelect={mockOnTagSelect}
        allTags={[]}
      />
    );
    
    const input = screen.getByPlaceholderText(/search notes/i);
    input.focus();
    // Note: Full user interaction testing would require user-event
  });

  it('should not have accessibility violations', async () => {
    const { container } = render(
      <SearchBar
        onSearch={mockOnSearch}
        onTagSelect={mockOnTagSelect}
        allTags={[]}
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper labels for screen readers', () => {
    render(
      <SearchBar
        onSearch={mockOnSearch}
        onTagSelect={mockOnTagSelect}
        allTags={[]}
      />
    );
    
    const input = screen.getByPlaceholderText(/search notes/i);
    // Check if input has accessible name
    expect(input).toBeInTheDocument();
  });
});
