"use client";

import { useState } from "react";
import { Input, Button } from "@notes/ui-lib";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onToggleArchived: () => void;
  showArchived: boolean;
}

export function SearchBar({ onSearch, onToggleArchived, showArchived }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="border-b border-gray-200 bg-white p-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full"
          />
        </div>
        <Button
          variant={showArchived ? "primary" : "secondary"}
          onClick={onToggleArchived}
          size="sm"
        >
          {showArchived ? "Active" : "Archive"}
        </Button>
      </div>
    </div>
  );
}
