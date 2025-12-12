"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { notesApi } from "@/lib/api";
import { db, markNoteAsDirty } from "@/lib/db";
import { Button, Input } from "@notes/ui-lib";
import type { Note } from "@notes/types";

interface NoteEditorProps {
  note: Note | null;
  onSave: () => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setHasChanges(false);
    } else {
      setTitle("");
      setContent("");
      setHasChanges(false);
    }
  }, [note]);

  const createMutation = useMutation({
    mutationFn: notesApi.create,
    onSuccess: async (response) => {
      if (response.data) {
        await db.notes.put({ ...response.data, isDirty: false });
      }
      onSave();
      setTitle("");
      setContent("");
      setHasChanges(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => notesApi.update(id, data),
    onSuccess: async (response) => {
      if (response.data) {
        await db.notes.put({ ...response.data, isDirty: false });
      }
      onSave();
      setHasChanges(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notesApi.delete,
    onSuccess: async () => {
      if (note) {
        await db.notes.delete(note.id);
      }
      onSave();
      onClose();
    },
  });

  const handleSave = () => {
    if (!title.trim()) return;

    if (note) {
      updateMutation.mutate({
        id: note.id,
        data: { title, content },
      });
    } else {
      createMutation.mutate({ title, content });
    }
  };

  const handleDelete = () => {
    if (note && confirm("Are you sure you want to delete this note?")) {
      deleteMutation.mutate(note.id);
    }
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  if (!note && title === "" && content === "") {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a note or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              handleChange();
            }}
            placeholder="Note title"
            className="text-xl font-semibold"
          />
          <div className="ml-4 flex gap-2">
            {note && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!hasChanges && !!note}
            >
              {note ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleChange();
          }}
          placeholder="Start typing..."
          className="h-full w-full resize-none border-none p-0 focus:outline-none focus:ring-0"
        />
      </div>

      {note && (
        <div className="border-t border-gray-200 p-4 text-sm text-gray-500">
          <p>Created: {new Date(note.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(note.updatedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
