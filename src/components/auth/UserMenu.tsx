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
      <h1 className="text-xl font-semibold text-foreground">
        <a href="/recipes" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img src="/chiefStack.svg" alt="" className="h-8 w-8 shrink-0" />
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
