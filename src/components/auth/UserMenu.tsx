import { useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "../ui/button";
import { apiClient } from "@/lib/apiClient";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await apiClient.post("/api/auth/logout");
      window.location.href = "/auth/login";
    } catch {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut]);

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <h1 className="text-xl font-semibold text-gray-900">
        <a href="/" className="flex items-center gap-2 hover:text-gray-700 transition-colors">
          <img src="/chiefStack.svg" alt="ChiefStack Logo" className="h-8 w-8" />
          ChiefStack
        </a>
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user.email}</span>
        <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline" size="sm">
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}
