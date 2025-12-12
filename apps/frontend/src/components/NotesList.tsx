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
    <div className="flex w-80 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <Button variant="primary" size="md" onClick={onCreateNote} className="w-full">
          + New Note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No notes yet</p>
            <p className="mt-1 text-sm">Create your first note!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${
                  selectedNoteId === note.id ? "bg-blue-50" : ""
                }`}
              >
                <h3 className="font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{note.content}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
