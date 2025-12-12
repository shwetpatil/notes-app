import Dexie, { Table } from "dexie";
import { Note } from "@notes/types";

export interface LocalNote extends Note {
  isDirty?: boolean; // Needs sync to server
}

export class NotesDatabase extends Dexie {
  notes!: Table<LocalNote>;

  constructor() {
    super("NotesApp");
    this.version(1).stores({
      notes: "id, userId, updatedAt, isDirty",
    });
    this.version(2).stores({
      notes: "id, userId, updatedAt, isDirty, isPinned, isArchived, *tags",
    });
    this.version(3).stores({
      notes: "id, userId, updatedAt, isDirty, isPinned, isFavorite, isArchived, isTrashed, *tags",
    });
  }
}

export const db = new NotesDatabase();

// Sync helper functions
export const markNoteAsDirty = async (noteId: string) => {
  await db.notes.update(noteId, { isDirty: true });
};

export const markNoteAsClean = async (noteId: string) => {
  await db.notes.update(noteId, { isDirty: false });
};

export const getDirtyNotes = async () => {
  return await db.notes.where("isDirty").equals(1).toArray();
};

export const syncNote = async (note: Note) => {
  await db.notes.put({ ...note, isDirty: false });
};

export const syncAllNotes = async (notes: Note[]) => {
  await db.notes.clear();
  await db.notes.bulkPut(notes.map((n) => ({ ...n, isDirty: false })));
};
