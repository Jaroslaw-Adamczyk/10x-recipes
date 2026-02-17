import { useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "../ui/button";

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirect to login page after successful logout
        window.location.href = "/auth/login";
      } else {
        setIsLoggingOut(false);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Logout error:", error);
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
