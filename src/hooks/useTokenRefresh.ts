"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Auto Token Refresh Hook
 *
 * Automatically refreshes the access token using the refresh token
 * when the user is active. Implements:
 * - 25-minute refresh interval (before 30min token expiration)
 * - Activity-based session extension (30min idle timeout)
 * - Automatic logout on refresh failure
 */
export function useTokenRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(0);

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
      });

      if (!res.ok) {
        // Refresh failed - redirect to login
        console.log("Token refresh failed, redirecting to login");
        clearInterval(refreshIntervalRef.current!);
        router.push("/login");
        return false;
      }

      console.log("Token refreshed successfully");
      lastActivityRef.current = Date.now();
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      clearInterval(refreshIntervalRef.current!);
      router.push("/login");
      return false;
    }
  }, [router]);

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Reset activity timeout
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    // Set new activity timeout
    const inactivityHours = parseInt(process.env.NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_HOURS || "4");
    activityTimeoutRef.current = setTimeout(() => {
      console.log("Session expired due to inactivity");
      clearInterval(refreshIntervalRef.current!);
      router.push("/login");
    }, inactivityHours * 60 * 60 * 1000);
  }, [router]);

  useEffect(() => {
    // Skip on login/register pages
    if (pathname === "/login" || pathname === "/register") {
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
