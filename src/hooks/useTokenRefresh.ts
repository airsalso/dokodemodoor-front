"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

/**
 * Auto Token Refresh Hook
 *
 * Automatically refreshes the access token using the refresh token
 * when the user is active. Implements:
 * - 25-minute refresh interval
 * - Activity-based session extension (24h idle timeout)
 * - Graceful handling of refresh failure (don't force logout if session still valid)
 */
export function useTokenRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);
  const { authenticated } = useAuth();

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (!res.ok) {
        // Refresh failed (e.g. no refresh token or expired)
        // We don't redirect here because the user might still have a valid session cookie
        // The natural session expiration will handle logout when it actually happens
        console.warn("Token refresh skipped or failed (Status: " + res.status + ")");
        return false;
      }

      console.log("Token refreshed successfully");
      lastActivityRef.current = Date.now();
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }, []);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Reset activity timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Set new activity timeout (Default to 24 hours for internal tool usability)
    const inactivityHours = parseInt(process.env.NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_HOURS || "24");
    activityTimeoutRef.current = setTimeout(() => {
      console.log("Session expired due to inactivity");
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      router.push("/login");
    }, inactivityHours * 60 * 60 * 1000);
  }, [router]);

  useEffect(() => {
    // Skip on login/register pages or if not authenticated
    if (pathname === "/login" || pathname === "/register" || !authenticated) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    // Initial activity setup
    handleActivity();

    // Set up periodic token refresh
    const refreshIntervalMinutes = parseInt(process.env.NEXT_PUBLIC_TOKEN_REFRESH_INTERVAL_MINUTES || "25");
    refreshIntervalRef.current = setInterval(() => {
      refreshToken();
    }, refreshIntervalMinutes * 60 * 1000);

    // Listen for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [pathname, handleActivity, refreshToken]);
}
