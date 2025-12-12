"use client";

import { useState } from "react";
import { Input, Button } from "@notes/ui-lib";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onToggleArchived: () => void;
  onToggleTrashed: () => void;
  onToggleFavorites: () => void;
  onSortChange: (sortBy: string, order: string) => void;
  showArchived: boolean;
  showTrashed: boolean;
  showFavorites: boolean;
  sortBy: string;
  sortOrder: string;
}

export function SearchBar({ 
  onSearch, 
  onToggleArchived, 
  onToggleTrashed,
  onToggleFavorites,
  onSortChange,
  showArchived, 
  showTrashed,
  showFavorites,
  sortBy,
  sortOrder,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <Input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full"
          />
        </div>
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [newSort, newOrder] = e.target.value.split("-");
            onSortChange(newSort, newOrder);
          }}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm dark:text-gray-200"
        >
          <option value="updatedAt-desc">Recent</option>
          <option value="createdAt-desc">Newest</option>
          <option value="createdAt-asc">Oldest</option>
          <option value="title-asc">A-Z</option>
          <option value="title-desc">Z-A</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          variant={showFavorites ? "primary" : "secondary"}
          onClick={onToggleFavorites}
          size="sm"
        >
          ⭐ Favorites
        </Button>
        <Button
          variant={showArchived ? "primary" : "secondary"}
          onClick={onToggleArchived}
          size="sm"
        >
          📦 {showArchived ? "Active" : "Archive"}
        </Button>
        <Button
          variant={showTrashed ? "primary" : "secondary"}
          onClick={onToggleTrashed}
          size="sm"
        >
          🗑️ Trash
        </Button>
      </div>
    </div>
  );
}
