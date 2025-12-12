"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, notesApi } from "@/lib/api";
import { db, syncAllNotes } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Button, Spinner } from "@notes/ui-lib";
import { Sidebar } from "@/components/Sidebar";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";
import { SearchBar } from "@/components/SearchBar";
import type { Note } from "@notes/types";

export default function NotesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Check auth
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  // Fetch notes from server
  const {
    data: notesData,
    isLoading: notesLoading,
    refetch,
  } = useQuery({
    queryKey: ["notes", searchQuery, showArchived],
    queryFn: () => notesApi.getAll({ 
      search: searchQuery || undefined, 
      archived: showArchived 
    }),
    enabled: !!authData?.success,
  });

  // Sync to IndexedDB
  useEffect(() => {
    if (notesData?.data) {
      syncAllNotes(notesData.data);
    }
  }, [notesData]);

  // Load from IndexedDB (offline-first)
  const localNotes = useLiveQuery(() => db.notes.orderBy("updatedAt").reverse().toArray());

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !authData?.success) {
      router.push("/login");
    }
  }, [authData, authLoading, router]);

  if (authLoading || notesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!authData?.success) {
    return null;
  }

  const notes = localNotes || [];
  const selectedNote = selectedNoteId ? notes.find((n) => n.id === selectedNoteId) : null;

  const handleCreateNote = () => {
    setSelectedNoteId(null);
    setIsCreatingNew(true);
  };

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreatingNew(false);
  };

  const handleSave = async () => {
    await refetch();
    setIsCreatingNew(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        user={authData?.data?.user}
        onLogout={() => logoutMutation.mutate()}
        onRefresh={() => refetch()}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <SearchBar
          onSearch={setSearchQuery}
          onToggleArchived={() => setShowArchived(!showArchived)}
          showArchived={showArchived}
        />

        <div className="flex flex-1 overflow-hidden">
          <NotesList
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
          />

          <NoteEditor
            note={selectedNote || null}
            onSave={handleSave}
            onClose={() => {
              setSelectedNoteId(null);
              setIsCreatingNew(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}
