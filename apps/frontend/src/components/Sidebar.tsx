"use client";

import { Button } from "@notes/ui-lib";
import { useTheme } from "@/context/ThemeContext";

interface SidebarProps {
  user: { name: string; email: string };
  onLogout: () => void;
  onRefresh: () => void;
}

export function Sidebar({ user, onLogout, onRefresh }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="flex w-64 flex-col border-r border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">📝 Notes</h1>
      </div>

      <div className="flex-1 p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{user.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{user.email}</p>
        </div>

        <div className="space-y-2">
          <Button variant="secondary" size="sm" onClick={toggleTheme} className="w-full">
            {theme === "dark" ? "☀️" : "🌙"} {theme === "dark" ? "Light" : "Dark"} Mode
          </Button>
          <Button variant="secondary" size="sm" onClick={onRefresh} className="w-full">
            🔄 Sync Notes
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <Button variant="secondary" size="sm" onClick={onLogout} className="w-full">
          Logout
        </Button>
      </div>
    </div>
  );
}
