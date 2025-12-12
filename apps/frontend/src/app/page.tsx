"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading) {
      if (data?.success) {
        router.push("/notes");
      } else {
        router.push("/login");
      }
    }
  }, [data, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
