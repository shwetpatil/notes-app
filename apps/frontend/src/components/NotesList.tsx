"use client";

import { Button } from "@notes/ui-lib";
import type { Note } from "@notes/types";

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
}

export function NotesList({ notes, selectedNoteId, onSelectNote, onCreateNote }: NotesListProps) {
  return (
    <div className="flex w-80 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <Button variant="primary" size="md" onClick={onCreateNote} className="w-full">
          + New Note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p>No notes yet</p>
            <p className="mt-1 text-sm">Create your first note!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notes.map((note) => {
              const noteColor = note.color || 'none';
              const colorClasses: Record<string, string> = {
                none: '',
                red: 'bg-red-50 dark:bg-red-900/20 border-l-4 border-l-red-400',
                orange: 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-400',
                yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-400',
                green: 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-400',
                blue: 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-400',
                purple: 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-l-purple-400',
                pink: 'bg-pink-50 dark:bg-pink-900/20 border-l-4 border-l-pink-400',
              };
              
              return (
                <button
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={`w-full p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedNoteId === note.id ? "!bg-blue-100 dark:!bg-blue-900/40" : ""
                  } ${colorClasses[noteColor]}`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 flex items-center gap-2">
                      {note.isFavorite && <span title="Favorite">⭐</span>}
                      {note.isPinned && <span title="Pinned">📌</span>}
                      {note.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{note.content}</p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs text-blue-800 dark:text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">+{note.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
