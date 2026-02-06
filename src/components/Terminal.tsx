"use client";

import { useEffect, useMemo, useRef } from "react";
import { Terminal as XTerm, type ITerminalOptions } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { TERMINAL_THEMES } from "@/constants/terminalThemes";
import { useAppearance } from "@/context/AppearanceContext";

interface TerminalProps {
  logs: string[];
}

export function Terminal({ logs }: TerminalProps) {
  const { terminalTheme, terminalFont } = useAppearance();
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
    if (!terminalRef.current) return;

    // Clean start: remove any existing terminal DOM elements
    terminalRef.current.innerHTML = "";

    const theme = TERMINAL_THEMES[terminalTheme] || TERMINAL_THEMES.bright;
    const termOptions: ITerminalOptions = {
      cursorBlink: true,
      fontSize: 14,
      fontWeight: "400",
      fontWeightBold: "400",
      fontFamily: `${terminalFont ? `${terminalFont}, ` : ""}'JetBrains Mono', 'Fira Code', 'DejaVu Sans Mono', 'Courier New', monospace`,
      theme,
      convertEol: true,
      allowTransparency: false,
      lineHeight: 1.15,
      letterSpacing: 0,
      allowProposedApi: true,
      customGlyphs: true,
      scrollback: parseInt(process.env.NEXT_PUBLIC_TERMINAL_SCROLLBACK_LINES || "10000"),
    };
    const term = new XTerm(termOptions);

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    // Store terminal in ref and reset index for the fresh instance
    xtermRef.current = term;
    lastLogIndex.current = 0;

    // Force fit after a short delay
    const timeout = setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.error("Fit error:", e);
      }
    }, 200);

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch {}
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
      term.dispose();
      xtermRef.current = null;
    };
  }, [terminalTheme, terminalFont]); // Remount on theme or font change

  // Unified Log Handler: Handles initial write, appends, and rotations
  useEffect(() => {
    const term = xtermRef.current;
    if (!term) return;

    const currentLogs = logs;
    const prevLogs = logsRef.current;
    const prevLength = lastLogIndex.current;
    const newLength = currentLogs.length;

    // Trigger full refresh if:
    // 1. Terminal just opened (prevLength is 0)
    // 2. Logs were truncated (newLength < prevLength)
    // 3. Logs were rotated (first entry mismatch)
    const needsFullRefresh = prevLength === 0 ||
                             newLength < prevLength ||
                             (newLength > 0 && prevLogs.length > 0 && currentLogs[0] !== prevLogs[0]);

    if (needsFullRefresh) {
      term.clear();
      for (const log of currentLogs) {
        term.write(log);
      }
      lastLogIndex.current = newLength;
      term.scrollToBottom();
    }
    else if (newLength > prevLength) {
      // Append only
      for (let i = prevLength; i < newLength; i++) {
        term.write(currentLogs[i]);
      }
      lastLogIndex.current = newLength;
      term.scrollToBottom();
    }

    logsRef.current = logs;
  }, [logs]);

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: currentTheme.background,
        color: currentTheme.foreground
      }}
    >
      <div className="flex-1 w-full h-full p-4 pb-4 overflow-hidden">
        <div
          ref={terminalRef}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
