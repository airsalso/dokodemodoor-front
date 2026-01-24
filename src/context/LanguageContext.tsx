"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";
import { translations, Language } from "@/lib/translations";
import { useAuth } from "./AuthContext";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  terminalTheme: string;
  setTerminalTheme: (theme: string) => void;
  terminalFont: string;
  setTerminalFont: (font: string) => void;
  isLoadingSettings: boolean;
  t: (key: string) => string;
  formatDuration: (val: string | number | undefined) => string;
  refreshSettings: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [terminalTheme, setTerminalThemeState] = useState<string>("monokai");
  const [terminalFont, setTerminalFontState] = useState<string>("jetbrains");
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
  const { authenticated } = useAuth();

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("lang", lang);
  }, []);

  const setTerminalTheme = useCallback((theme: string) => {
    setTerminalThemeState(theme);
    localStorage.setItem("terminalTheme", theme);
  }, []);

  const setTerminalFont = useCallback((font: string) => {
    setTerminalFontState(font);
    localStorage.setItem("terminalFont", font);
    document.documentElement.setAttribute("data-terminal-font", font);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.language) setLanguage(data.language);
        if (data.terminalTheme) setTerminalTheme(data.terminalTheme);
        if (data.terminalFont) setTerminalFont(data.terminalFont);
      }
    } catch (err) {
      console.warn("[LanguageContext] Failed to refresh settings:", err);
    }
  }, [setLanguage, setTerminalTheme, setTerminalFont]);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "ko")) {
      setLanguageState(savedLang);
    }

    const savedTheme = localStorage.getItem("terminalTheme");
    if (savedTheme) {
      setTerminalThemeState(savedTheme);
    }

    const savedFont = localStorage.getItem("terminalFont");
    if (savedFont) {
      setTerminalFontState(savedFont);
      document.documentElement.setAttribute("data-terminal-font", savedFont);
    }

    const syncSettings = async () => {
      if (!authenticated) {
        setIsLoadingSettings(false);
        return;
      }
      try {
        setIsLoadingSettings(true);
        const res = await fetch("/api/auth/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.language) setLanguage(data.language);
          if (data.terminalTheme) setTerminalTheme(data.terminalTheme);
          if (data.terminalFont) {
            setTerminalFontState(data.terminalFont);
            document.documentElement.setAttribute("data-terminal-font", data.terminalFont);
          }
        }
      } catch (err) {
        console.warn("[LanguageContext] Failed to sync with DB:", err);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    syncSettings();
  }, [authenticated, setLanguage, setTerminalTheme]);

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  const formatDuration = useCallback((val: string | number | undefined | null) => {
    if (val === null || val === undefined || val === "" || val === "...") return "...";

    let totalSeconds = 0;
    if (typeof val === "string") {
      // Handle "123s" or just "123"
      totalSeconds = parseInt(val.replace(/[^\d.]/g, ""));
    } else {
      totalSeconds = Math.round(val);
    }

    if (isNaN(totalSeconds)) return val.toString();

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (language === "ko") {
      const parts = [];
      if (h > 0) parts.push(`${h}시간`);
      if (m > 0 || h > 0) parts.push(`${m}분`);
      parts.push(`${s}초`);
      return parts.join(" ");
    } else {
      const parts = [];
      if (h > 0) parts.push(`${h}h`);
      if (m > 0 || h > 0) parts.push(`${m}m`);
      parts.push(`${s}s`);
      return parts.join(" ");
    }
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    terminalTheme,
    setTerminalTheme,
    terminalFont,
    setTerminalFont,
    isLoadingSettings,
    t,
    formatDuration,
    refreshSettings
  }), [language, setLanguage, terminalTheme, setTerminalTheme, terminalFont, setTerminalFont, isLoadingSettings, t, formatDuration, refreshSettings]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
