"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { themeDetails } from "@/lib/constants";
import { hexToRgb } from "@/lib/utils";
import { useAuth } from "./AuthContext";

interface AppearanceContextType {
  themeColor: string;
  setThemeColor: (color: string) => void;
  accentColor: string;
  terminalTheme: string;
  setTerminalTheme: (theme: string) => void;
  terminalFont: string;
  setTerminalFont: (font: string) => void;
  themeFont: string;
  setThemeFont: (font: string) => void;
  isLoadingAppearance: boolean;
  refreshSettings: () => Promise<void>;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<string>("#8b5cf6");
  const [accentColor, setAccentColorState] = useState<string>("#3b82f6");
  const [terminalTheme, setTerminalThemeState] = useState<string>("bright");
  const [terminalFont, setTerminalFontState] = useState<string>("jetbrains");
  const [themeFont, setThemeFontState] = useState<string>("outfit");
  const [isLoadingAppearance, setIsLoadingAppearance] = useState(true);
  const { authenticated } = useAuth();

  const applyTheme = useCallback((color: string) => {
    if (!color) return;
    const normalizedColor = color.toLowerCase();
    const theme = themeDetails[normalizedColor] || {
      primary: color,
      accent: "#3b82f6",
      bg: "#05070a",
      card: "rgba(15, 17, 26, 0.7)"
    };

    setThemeColorState(theme.primary);
    setAccentColorState(theme.accent);

    const style = document.documentElement.style;
    if (style.getPropertyValue("--primary") === theme.primary) return;

    style.setProperty("--primary", theme.primary);
    style.setProperty("--primary-rgb", hexToRgb(theme.primary));
    style.setProperty("--accent", theme.accent);
    style.setProperty("--accent-rgb", hexToRgb(theme.accent));
    style.setProperty("--background", theme.bg);
    style.setProperty("--card", theme.card);
  }, []);

  const setThemeColor = useCallback((color: string) => {
    applyTheme(color);
    localStorage.setItem("themeColor", color);
  }, [applyTheme]);

  const setTerminalTheme = useCallback((theme: string) => {
    setTerminalThemeState(theme);
    localStorage.setItem("terminalTheme", theme);
  }, []);

  const setTerminalFont = useCallback((fontId: string) => {
    setTerminalFontState(fontId);
    localStorage.setItem("terminalFont", fontId);
    document.documentElement.setAttribute("data-terminal-font", fontId);
  }, []);

  const setThemeFont = useCallback((fontId: string) => {
    setThemeFontState(fontId);
    localStorage.setItem("themeFont", fontId);
    document.documentElement.setAttribute("data-theme-font", fontId);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/settings", { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.accentColor) setThemeColor(data.accentColor);
        if (data.terminalTheme) setTerminalTheme(data.terminalTheme);
        if (data.terminalFont) setTerminalFont(data.terminalFont);
        if (data.themeFont) setThemeFont(data.themeFont);
      }
    } catch (err) {
      console.warn("[AppearanceContext] Failed to refresh settings:", err);
    }
  }, [setThemeColor, setTerminalTheme, setTerminalFont, setThemeFont]);

  // Initial load from LocalStorage to avoid flickers
  useEffect(() => {
    const savedTheme = localStorage.getItem("themeColor");
    applyTheme(savedTheme || "#8b5cf6");

    const savedTermTheme = localStorage.getItem("terminalTheme");
    if (savedTermTheme) setTerminalThemeState(savedTermTheme);

    const savedTermFont = localStorage.getItem("terminalFont") || "jetbrains";
    setTerminalFontState(savedTermFont);
    document.documentElement.setAttribute("data-terminal-font", savedTermFont);

    const savedThemeFont = localStorage.getItem("themeFont") || "outfit";
    setThemeFontState(savedThemeFont);
    document.documentElement.setAttribute("data-theme-font", savedThemeFont);

    const syncWithDb = async () => {
      if (!authenticated) {
        setIsLoadingAppearance(false);
        return;
      }

      try {
        setIsLoadingAppearance(true);
        const res = await fetch("/api/auth/settings", { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.accentColor) applyTheme(data.accentColor);
          if (data.terminalTheme) setTerminalThemeState(data.terminalTheme);
          if (data.terminalFont) {
             setTerminalFontState(data.terminalFont);
             document.documentElement.setAttribute("data-terminal-font", data.terminalFont);
          }
          if (data.themeFont) {
             setThemeFontState(data.themeFont);
             document.documentElement.setAttribute("data-theme-font", data.themeFont);
          }
        }
      } catch (err) {
         console.warn("[AppearanceContext] Initial DB sync failed:", err);
      } finally {
        setIsLoadingAppearance(false);
      }
    };

    syncWithDb();
  }, [applyTheme, authenticated]);

  const value = useMemo(() => ({
    themeColor,
    setThemeColor,
    accentColor,
    terminalTheme,
    setTerminalTheme,
    terminalFont,
    setTerminalFont,
    themeFont,
    setThemeFont,
    isLoadingAppearance,
    refreshSettings
  }), [themeColor, setThemeColor, accentColor, terminalTheme, setTerminalTheme, terminalFont, setTerminalFont, themeFont, setThemeFont, isLoadingAppearance, refreshSettings]);

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error("useAppearance must be used within an AppearanceProvider");
  }
  return context;
}
