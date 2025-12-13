"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { Spinner } from "@notes/ui-lib";
import { Sidebar } from "@/components/Sidebar";
import { TemplateManager } from "@/components/TemplateManager";

export default function TemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Check auth
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!authData?.success) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-800">
      <Sidebar
        user={authData?.data?.user}
        onLogout={() => logoutMutation.mutate()}
        onRefresh={() => {}}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Templates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create and manage reusable note templates
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <TemplateManager />
        </div>
      </div>
    </div>
  );
}
