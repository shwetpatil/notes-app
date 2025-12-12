"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notesApi } from "@/lib/api";
import { db, markNoteAsDirty } from "@/lib/db";
import { Button, Input } from "@notes/ui-lib";
import { ColorPicker } from "./ColorPicker";
import type { Note } from "@notes/types";

interface NoteEditorProps {
  note: Note | null;
  onSave: () => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [color, setColor] = useState<string | undefined>(undefined);
  const [isMarkdown, setIsMarkdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setColor(note.color);
      setIsMarkdown(note.isMarkdown || false);
      setHasChanges(false);
    } else {
      setTitle("");
      setContent("");
      setTags([]);
      setColor(undefined);
      setIsMarkdown(false);
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

  const favoriteMutation = useMutation({
    mutationFn: notesApi.toggleFavorite,
    onSuccess: async (response) => {
      if (response.data) {
        await db.notes.put({ ...response.data, isDirty: false });
      }
      onSave();
    },
  });

  const trashMutation = useMutation({
    mutationFn: notesApi.moveToTrash,
    onSuccess: async (response) => {
      if (response.data) {
        await db.notes.put({ ...response.data, isDirty: false });
      }
      onSave();
      onClose();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: notesApi.restoreFromTrash,
    onSuccess: async (response) => {
      if (response.data) {
        await db.notes.put({ ...response.data, isDirty: false });
      }
      onSave();
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: notesApi.permanentDelete,
    onSuccess: async () => {
      if (note) {
        await db.notes.delete(note.id);
      }
      onSave();
      onClose();
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

  const pinMutation = useMutation({
    mutationFn: notesApi.togglePin,
    onSuccess: async (response) => {
      if (response.data) {
        await db.notes.put({ ...response.data, isDirty: false });
      }
      onSave();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: notesApi.toggleArchive,
    onSuccess: async (response) => {
      if (response.data) {
        await db.notes.put({ ...response.data, isDirty: false });
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
        data: { title, content, tags, isMarkdown, color },
      });
    } else {
      createMutation.mutate({ 
        title, 
        content, 
        tags, 
        isMarkdown,
        isPinned: false,
        isFavorite: false,
        isArchived: false,
        isTrashed: false,
        color,
      });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
      setHasChanges(true);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
    setHasChanges(true);
  };

  const handleTogglePin = () => {
    if (note) {
      pinMutation.mutate(note.id);
    }
  };

  const handleToggleArchive = () => {
    if (note) {
      archiveMutation.mutate(note.id);
    }
  };

  const handleToggleFavorite = () => {
    if (note) {
      favoriteMutation.mutate(note.id);
    }
  };

  const handleMoveToTrash = () => {
    if (note) {
      trashMutation.mutate(note.id);
    }
  };

  const handleRestore = () => {
    if (note) {
      restoreMutation.mutate(note.id);
    }
  };

  const handleDelete = () => {
    if (note && note.isTrashed && confirm("Permanently delete this note? This cannot be undone.")) {
      permanentDeleteMutation.mutate(note.id);
    } else if (note && !note.isTrashed) {
      handleMoveToTrash();
    }
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  const isEmptyNewNote = !note && title === "" && content === "";

  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-3 flex items-center justify-between">
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
            {note && note.isTrashed && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRestore}
                  isLoading={restoreMutation.isPending}
                >
                  ↩️ Restore
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={permanentDeleteMutation.isPending}
                >
                  🗑️ Delete Forever
                </Button>
              </>
            )}
            {note && !note.isTrashed && (
              <>
                <Button
                  variant={note.isFavorite ? "primary" : "secondary"}
                  size="sm"
                  onClick={handleToggleFavorite}
                  isLoading={favoriteMutation.isPending}
                  title={note.isFavorite ? "Unfavorite" : "Favorite"}
                >
                  ⭐
                </Button>
                <Button
                  variant={note.isPinned ? "primary" : "secondary"}
                  size="sm"
                  onClick={handleTogglePin}
                  isLoading={pinMutation.isPending}
                  title={note.isPinned ? "Unpin" : "Pin"}
                >
                  📌
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleToggleArchive}
                  isLoading={archiveMutation.isPending}
                  title={note.isArchived ? "Unarchive" : "Archive"}
                >
                  📦
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={trashMutation.isPending}
                  title="Move to Trash"
                >
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!title.trim() || (isEmptyNewNote && !hasChanges)}
            >
              {note ? "Save" : "Create"}
            </Button>
          </div>
        </div>

        {/* Color Picker */}
        <div className="mt-3">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Note Color
          </label>
          <ColorPicker
            value={color}
            onChange={(newColor) => {
              setColor(newColor);
              handleChange();
            }}
          />
        </div>

        {/* Tags Input */}
        <div className="mt-3">
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Add tags..."
              className="flex-1"
            />
            <Button size="sm" onClick={handleAddTag} variant="secondary">
              Add Tag
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Markdown Toggle */}
        <div className="mt-3 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isMarkdown}
              onChange={(e) => {
                setIsMarkdown(e.target.checked);
                handleChange();
              }}
              className="rounded"
            />
            <span className="text-sm text-gray-700">Markdown mode</span>
          </label>
          {isMarkdown && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Edit" : "Preview"}
            </Button>
          )}
        </div>
      </div>

      {/* Content Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        {isMarkdown && showPreview ? (
          <div className="prose max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleChange();
            }}
            placeholder="Start typing..."
            className="h-full w-full resize-none border-none p-0 focus:outline-none focus:ring-0"
          />
        )}
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
