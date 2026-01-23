"use client";

import { useEffect, useMemo, useRef } from "react";
import { Terminal as XTerm, type ITerminalOptions } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { useLanguage } from "@/context/LanguageContext";
import { TERMINAL_THEMES } from "@/constants/terminalThemes";

interface TerminalProps {
  logs: string[];
}

export function Terminal({ logs }: TerminalProps) {
  const { terminalTheme, terminalFont } = useLanguage();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const lastLogIndex = useRef(0);

  // Determine current theme with a rock-solid fallback
  const currentTheme = useMemo(
    () => TERMINAL_THEMES[terminalTheme] || TERMINAL_THEMES.bright,
    [terminalTheme]
  );
  const logsRef = useRef<string[]>(logs);

  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Clean start: remove any existing terminal DOM elements
    terminalRef.current.innerHTML = "";

    const theme = TERMINAL_THEMES[terminalTheme] || TERMINAL_THEMES.bright;
    const termOptions: ITerminalOptions = {
      cursorBlink: true,
      fontSize: 14,
      fontWeight: "400", // Force normal weight
      fontWeightBold: "400", // Force bold codes to render as normal to prevent distortion
      fontFamily: `${terminalFont ? `${terminalFont}, ` : ""}'JetBrains Mono', 'Fira Code', 'DejaVu Sans Mono', 'Courier New', monospace`,
      theme,
      convertEol: true,
      allowTransparency: false,
      lineHeight: 1.0,
      letterSpacing: 0,
      allowProposedApi: true, // Enable advanced features like customGlyphs
      customGlyphs: true,
      scrollback: parseInt(process.env.NEXT_PUBLIC_TERMINAL_SCROLLBACK_LINES || "10000"),
    };
    const term = new XTerm(termOptions);

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Write all existing logs immediately
    term.clear();
    for (const log of logsRef.current) {
      term.write(log);
    }
    lastLogIndex.current = logsRef.current.length;
    xtermRef.current = term;

    // Force fit after a short delay, and another one once fonts are definitely loaded
    const timeout = setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.error("Fit error:", e);
      }
    }, 200);

    const fontTimeout = setTimeout(() => {
      try {
        fitAddon.fit();
      } catch {}
    }, 1000);

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {}
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
      clearTimeout(fontTimeout);
      term.dispose();
      xtermRef.current = null;
    };
  }, [terminalTheme, terminalFont]); // Remount on theme or font change

  // Stream incoming logs
  useEffect(() => {
    if (xtermRef.current && logs.length > lastLogIndex.current) {
      for (let i = lastLogIndex.current; i < logs.length; i++) {
        xtermRef.current.write(logs[i]);
      }
      lastLogIndex.current = logs.length;
    }
    else if (xtermRef.current && logs.length < lastLogIndex.current) {
      xtermRef.current.clear();
      for (const log of logs) {
        xtermRef.current.write(log);
      }
      lastLogIndex.current = logs.length;
    }
  }, [logs]);

  return (
    <div
      className="w-full h-full min-h-[500px] flex flex-col"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.foreground
      }}
    >
      <div
        ref={terminalRef}
        className="w-full h-full flex-1 p-4"
        style={{ backgroundColor: currentTheme.background }}
      />
    </div>
  );
}
