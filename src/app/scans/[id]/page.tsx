"use client";

import { Navbar } from "@/components/Navbar";
import { Terminal } from "@/components/Terminal";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Share2, StopCircle, RefreshCw, AlertTriangle, CheckCircle2, Clock, Loader2, Activity, X, Eraser, Languages, Layout, Globe, Hash } from "lucide-react";
import { ArchiveViewer } from "@/components/ArchiveViewer";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { TERMINAL_THEMES } from "@/constants/terminalThemes";
import { useAppearance } from "@/context/AppearanceContext";

function ScanDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view");

  const { terminalTheme } = useAppearance();
  const { language, t, formatDuration } = useLanguage();
  const isKo = language === "ko";
  const [data, setData] = useState<{
    status: string;
    logs: string[];
    target: string;
    vulnerabilities: number;
    targetUrl?: string;
    sourcePath?: string;
    config?: string;
    sessionId?: string;
    startTime?: number;
    endTime?: number | null;
    duration?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<string | null>(null);
  const [statusCommand, setStatusCommand] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const needsPolling = data?.status === "running" || data?.status === "translating";

  const fetchStatus = async () => {
    setShowStatus(true);
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/scan/status/${id}`);
      const result = await res.json();
      if (res.ok) {
        setStatusResult(result.status);
        setStatusCommand(result.command);
      } else {
        setStatusResult(result.error || "Failed to fetch status");
        setStatusCommand(null);
      }
    } catch (err) {
      console.error("Fetch status error:", err);
      setStatusResult("Connection error");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleCleanup = async () => {
    const sId = data?.sessionId || "unknown";
    if (!confirm(`Are you sure you want to cleanup this session? (Session ID: ${sId})\nTemporary files and in-memory trace will be removed.`)) return;

    setCleaning(true);
    try {
      const res = await fetch(`/api/scan/cleanup/${id}`, { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        alert("Cleanup successful");
      } else {
        alert(result.error || "Cleanup failed");
      }
    } catch (err) {
      console.error("Cleanup error:", err);
      alert("Connection error");
    } finally {
      setCleaning(false);
    }
  };

  const handleAgentAction = async (agent: string, action: 'rollback' | 'rerun') => {
    if (!confirm(`Are you sure you want to ${action} agent: ${agent}?`)) return;

    setActionLoading(`${agent}-${action}`);
    try {
      const res = await fetch(`/api/scan/agent-action/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, agent }),
      });
      const result = await res.json();
      if (res.ok) {
        if (result.isRunning) {
          setShowStatus(false);
          // Update parent state to show it's running
          if (data) setData({ ...data, status: "running" });
        } else {
          alert(result.message);
          fetchStatus(); // Refresh status after action
        }
      } else {
        alert(result.error || "Action failed");
      }
    } catch (err) {
      console.error("Agent action error:", err);
      alert("Connection error");
    } finally {
      setActionLoading(null);
    }
  };

  /*
  const handleTranslate = async () => {
    if (!confirm("Do you want to translate the final report to Korean? This may take a few minutes using AI.")) return;

    setTranslating(true);
    try {
      const res = await fetch(`/api/scan/translate/${id}`, { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        // Force refresh data to show logs and start polling
        setData(prev => prev ? { ...prev, status: "translating" } : null);
      } else {
        alert(result.error || "Translation failed to start");
        setTranslating(false);
      }
    } catch (err) {
      console.error("Translate error:", err);
      alert("Connection error");
      setTranslating(false);
    }
  };
  */

  const renderStatusLines = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Regex to detect agent lines: ICON + Space + AgentName + space(s) + [STATUS]
      // Support trailing info like [40.3s]
      const agentMatch = line.match(/^\s*([^\w\s]{1,4})\s+([\w\s-]+?)\s+\[([\w\s-]+)\]/);
      if (agentMatch) {
        const name = agentMatch[2].trim();
        const status = agentMatch[3].trim().toUpperCase();

        // Support both ROLLED-BACK and ROLLED BACK
        const canRerun = ["PENDING", "FAILED", "ROLLED-BACK", "ROLLED BACK", "COMPLETED", "SKIPPED"].includes(status);
        const canRollback = status === "COMPLETED";

        // const isReportAgent = name.toLowerCase().includes('report');
        const isAgentActive = !!actionLoading?.startsWith(name);

        return (
          <div key={i} className="group relative flex items-center hover:bg-white/5 px-2 py-0.5 rounded cursor-default transition-colors overflow-hidden">
            <span className="flex-1 whitespace-pre">{line}</span>
            {/* Action buttons - hide when active or translating */}
            {!isAgentActive && (canRerun || canRollback) && (
              <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/5 backdrop-blur-md px-2 py-1.5 rounded-xl border border-white/10 shadow-2xl transition-all scale-95 group-hover:scale-100 z-20">
                {canRerun && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAgentAction(name, 'rerun'); }}
                    disabled={!!actionLoading || translating || data?.status?.toLowerCase() === 'translating' || data?.status?.toLowerCase() === 'running'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black text-blue-400 hover:text-white hover:bg-blue-500/20 transition-all uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Rerun this agent"
                  >
                    <RefreshCw className="w-3 h-3" /> RERUN
                  </button>
                )}
                {canRollback && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAgentAction(name, 'rollback'); }}
                    disabled={!!actionLoading || translating || data?.status?.toLowerCase() === 'translating' || data?.status?.toLowerCase() === 'running'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black text-amber-400 hover:text-white hover:bg-amber-500/20 transition-all uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Rollback to this agent"
                  >
                    <ChevronLeft className="w-3 h-3" /> ROLLBACK
                  </button>
                )}
              </div>
            )}
            {isAgentActive && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 rounded-lg backdrop-blur-md z-10 animate-in fade-in duration-300">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        );
      }
      return <div key={i} className="min-h-[1.25rem]">{line}</div>;
    });
  };

  const currentTheme = TERMINAL_THEMES[terminalTheme] || TERMINAL_THEMES.bright;
  const isBright = ["bright", "beige", "doraemon"].includes(terminalTheme);

  const handleRestart = async () => {
    if (!data?.targetUrl || !data?.config) {
      alert("Missing scan parameters to restart.");
      return;
    }

    if (!confirm("Do you want to run this exact scan again?")) return;

    setRestarting(true);
    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: data.targetUrl,
          sourcePath: data.sourcePath || "",
          config: data.config,
          scanId: id // Pass current ID to reuse it instead of creating a new one
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Failed to restart scan");
        setRestarting(false);
      } else {
        // ID is the same, so router.push doesn't trigger a refresh.
        // Manually update state and clear restarting.
        setData(prev => prev ? { ...prev, status: "running" } : null);
        setRestarting(false);

        // The useEffect will pick up the 'running' status and start polling.
        // We can also trigger a manual fetch here for immediate UI update.
        // Actually, setting the status to 'running' is enough to trigger the effector.
      }
    } catch (err) {
      console.error("Restart error:", err);
      alert("Connection error");
      setRestarting(false);
    }
  };

  const [stopping, setStopping] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `Scan Results: ${id}`,
      text: `Check out the security scan results for ${data?.target || 'target'}`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (err) {
      console.error("Copy ID error:", err);
    }
  };

  const handleCopyUrl = async () => {
    if (!data?.target) return;
    try {
      await navigator.clipboard.writeText(data.target);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Copy URL error:", err);
    }
  };

  const handleCopyCommand = async () => {
    if (!statusCommand) return;
    try {
      await navigator.clipboard.writeText(statusCommand);
      setCopiedCommand(true);
      setTimeout(() => setCopiedCommand(false), 2000);
    } catch (err) {
      console.error("Copy Command error:", err);
    }
  };

  const handleStop = async () => {
    if (!confirm("Are you sure you want to stop this scan?")) return;
    setStopping(true);

    try {
      const res = await fetch("/api/scan/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: id }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to stop scan");
        setStopping(false);
      } else {
        // Optimistic update
        if (data) setData({ ...data, status: "completed" }); // After translating, it should return to completed or stay failed if it was failed. But stop means we stop the process.
        setTranslating(false);
        setStopping(false);
      }
    } catch (err) {
      console.error("Stop scan error:", err);
      alert("Connection error");
      setStopping(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/scan/logs/${id}`);
        if (res.status === 401) {
          router.push(`/login?callback=/scans/${id}`);
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        setData(json);
        setLoading(false);

        if (json.status === "translating") {
          setTranslating(true);
        } else if (json.status !== "running") {
          setTranslating(false);
        }
      } catch (err) {
        console.error("Fetch logs error:", err);
        console.error("Failed to fetch logs", err);
      }
    };

    const init = async () => {
      try {
        if (checkingAuth) {
          const authRes = await fetch("/api/auth/me");
          const authData = await authRes.json();
          if (!authData.authenticated) {
            router.push(`/login?callback=/scans/${id}`);
            return;
          }
          setCheckingAuth(false);
        }

        await fetchLogs();
      } catch (err) {
        console.error("Auth check error:", err);
        router.push("/login");
      }
    };

    init();

    if (needsPolling && !checkingAuth) {
      const pollInterval = parseInt(process.env.NEXT_PUBLIC_SCAN_LOG_POLL_INTERVAL_MS || "2000");
      interval = setInterval(fetchLogs, pollInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, router, checkingAuth, needsPolling]);

  const [showArchive, setShowArchive] = useState(initialView === "archive");

  if (checkingAuth || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      <Navbar />

      <main className="flex-1 flex flex-col max-w-[1800px] mx-auto px-10 py-12 w-full gap-10 relative z-10">
        {/* Page Header Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          {/* Left: Branding & Status */}
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-6">
              <Link
                href="/scans"
                className="mt-2 group p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 transition-all active:scale-95 shadow-lg shadow-rose-500/5 hover:shadow-rose-500/10"
                title={t('back to history') || 'Back to History'}
              >
                <ChevronLeft className="w-7 h-7 transition-transform group-hover:-translate-x-1" />
              </Link>

              <div className="space-y-2">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-[24px] border shadow-2xl ${
                    data?.status?.toLowerCase() === 'running' ? 'bg-primary/10 border-primary/20 text-primary' :
                    data?.status?.toLowerCase() === 'translating' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                    data?.status?.toLowerCase() === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {data?.status?.toLowerCase() === 'running' ? <Clock className="w-8 h-8 animate-pulse" /> :
                     data?.status?.toLowerCase() === 'translating' ? <Languages className="w-8 h-8 animate-pulse" /> :
                     data?.status?.toLowerCase() === 'completed' ? <CheckCircle2 className="w-8 h-8" /> :
                     <AlertTriangle className="w-8 h-8" />}
                  </div>
                  <div>
                    <h1 className="text-5xl font-black tracking-tighter text-foreground leading-tight mb-1">
                      {(() => {
                        if (data?.sourcePath) {
                          const parts = data.sourcePath.replace(/\\/g, '/').split('/');
                          const reposIdx = parts.lastIndexOf('repos');
                          return (reposIdx !== -1 && parts.length > reposIdx + 1)
                            ? parts[reposIdx + 1]
                            : parts[parts.length - 1];
                        }
                        return id;
                      })()}
                    </h1>
                    <div className="relative flex items-center group/url w-fit">
                      <button
                        onClick={handleCopyUrl}
                        className="text-gray-500 font-mono text-sm tracking-tight hover:text-primary transition-all active:scale-[0.98] text-left cursor-pointer flex items-center gap-2"
                        title="Click to copy Target URL"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {data?.target}
                      </button>
                      <AnimatePresence>
                        {copiedUrl && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8, x: 0 }}
                            animate={{ opacity: 1, scale: 1, x: 12 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-block ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-[8px] font-black rounded-md shadow-xl shadow-primary/20 whitespace-nowrap"
                          >
                            COPIED!
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Metrics & Actions */}
          <div className="flex flex-col items-end gap-6">
            <div className="flex items-center gap-3">
              {data && (
                <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500/5 border border-orange-500/20 text-xs font-black uppercase tracking-widest text-orange-600 shadow-inner">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="flex items-center gap-2">
                    {t("duration")}:
                    <span className="font-mono">
                      {(() => {
                        const isRunning = data.status?.toLowerCase() === 'running' || data.status?.toLowerCase() === 'translating';
                        if (isRunning && data.startTime) {
                          return formatDuration(Math.round((Date.now() - data.startTime) / 1000));
                        }
                        if (data.duration && data.duration !== "...") {
                          return formatDuration(data.duration);
                        }
                        if (data.startTime && data.endTime) {
                          const diff = Math.round((data.endTime - data.startTime) / 1000);
                          if (diff > 0) return formatDuration(diff);
                        }
                        return "...";
                      })()}
                    </span>
                  </span>
                </div>
              )}

              <button
                onClick={handleCopyId}
                className="group relative px-5 py-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs font-black font-mono text-slate-300 shadow-inner hover:bg-slate-700 hover:text-white transition-all active:scale-95 flex items-center gap-2"
                title="Click to copy ID"
              >
                <Hash className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                {id}
                <AnimatePresence>
                  {copiedId && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: -45 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-lg shadow-xl shadow-emerald-500/20 whitespace-nowrap"
                    >
                      COPIED!
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {data?.status?.toLowerCase() !== 'running' && data?.status?.toLowerCase() !== 'translating' && (
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className={`px-6 py-4 rounded-2xl border transition-all flex items-center gap-3 font-black text-sm tracking-tight ${
                    showArchive
                      ? "bg-violet-500 text-white border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                      : "bg-violet-500/5 border-violet-500/10 text-violet-400 hover:bg-violet-500/10 hover:border-violet-500/30"
                  }`}
                >
                  <Layout className={`w-5 h-5 ${showArchive ? 'text-white' : 'text-violet-400'}`} />
                  {showArchive ? (isKo ? "로그 보기" : "VIEW LOGS") : (isKo ? "결과 보관함" : "VIEW ARCHIVE")}
                </button>
              )}

              <button
                onClick={fetchStatus}
                className="px-6 py-4 rounded-2xl bg-sky-500/5 border border-sky-500/10 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all flex items-center gap-3 font-black text-sm tracking-tight text-sky-400"
              >
                <Activity className="w-5 h-5 text-sky-400" />
                STATUS
              </button>

              <button
                onClick={handleCleanup}
                disabled={cleaning || data?.status?.toLowerCase() !== 'failed'}
                className={`px-6 py-4 rounded-2xl border transition-all flex items-center gap-3 font-black text-sm tracking-tight ${
                  (cleaning || data?.status?.toLowerCase() !== 'failed')
                    ? "bg-white/5 border-white/10 text-gray-500 opacity-20 cursor-not-allowed"
                    : "bg-orange-500/5 border-orange-500/10 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/30"
                }`}
                title={data?.status?.toLowerCase() !== 'failed' ? "Only failed scans can be cleaned up" : "Cleanup session files"}
              >
                {cleaning ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-orange-400" />
                ) : (
                  <Eraser className={`w-5 h-5 ${data?.status?.toLowerCase() === 'failed' ? 'text-orange-400' : 'text-gray-500'}`} />
                )}
                CLEANUP
              </button>

              {data?.status?.toLowerCase() === "running" ? (
                <button
                  disabled={stopping}
                  onClick={handleStop}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-black text-sm tracking-tight ${
                    stopping ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {stopping ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <StopCircle className="w-5 h-5" />
                  )}
                  {stopping ? "STOPPING..." : "Stop Scan"}
                </button>
              ) : (
                <button
                  disabled={restarting || translating || data?.status?.toLowerCase() === 'translating'}
                  onClick={handleRestart}
                  className={`flex items-center gap-3 px-8 py-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-black text-sm tracking-tight ${
                    (restarting || translating || data?.status?.toLowerCase() === 'translating') ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {restarting || translating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  {restarting || translating ? "PREPARING..." : "Restart Scan"}
                </button>
              )}

              <button
                onClick={handleShare}
                className="p-4 rounded-2xl bg-pink-500/5 border border-pink-500/10 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all text-pink-400 hover:text-pink-300 active:scale-95 group relative"
              >
                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <AnimatePresence>
                  {copied && (
                    <motion.span
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-lg shadow-2xl"
                    >
                      COPIED
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Terminal Container */}
        <div
          className={`flex-1 flex flex-col rounded-[32px] overflow-hidden shadow-2xl border transition-all duration-500 min-h-0 ${
            isBright ? 'border-gray-200 bg-white shadow-gray-200/50' : 'border-white/5 bg-background'
          }`}
        >
          {/* Terminal Header Bar */}
          <div
            className={`flex items-center justify-between px-8 py-5 border-b transition-all duration-500 ${
              terminalTheme === 'beige'
                ? 'bg-[#eee8d5] border-[#d5ceba]'
                : isBright
                  ? 'bg-slate-100 border-gray-200'
                  : 'bg-black/40 border-white/10 backdrop-blur-2xl'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] shadow-inner" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] shadow-inner" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f] shadow-inner" />
              </div>
              <div className={`h-5 w-[1px] mx-2 ${
                terminalTheme === 'beige' ? 'bg-[#d5ceba]' : isBright ? 'bg-gray-300' : 'bg-white/10'
              }`} />
              <span className={`text-[11px] font-black uppercase tracking-[0.25em] ${
                terminalTheme === 'beige' ? 'text-[#839496]' : isBright ? 'text-slate-600' : 'text-gray-400'
              }`}>
                LIVE TERMINAL STREAM
              </span>
            </div>
            <div className={`text-[11px] font-black px-5 py-2 rounded-full border shadow-sm ${
              terminalTheme === 'beige'
                ? 'bg-[#fdf6e3] border-[#d5ceba] text-[#586e75]'
                : isBright
                  ? 'bg-white border-gray-200 text-slate-800'
                  : 'bg-white/5 border-white/10 text-gray-300'
            }`}>
              <span className="text-primary mr-2">{data?.logs.length || 0}</span> {isKo ? "로그 라인" : "LINES"}
            </div>
          </div>

          {/* Actual Terminal / Archive Viewer */}
          <div
            className="flex-1 transition-all duration-500 min-h-0"
            style={{ backgroundColor: currentTheme.background }}
          >
            {showArchive ? (
              <ArchiveViewer
                scanId={id as string}
                initialLogs={data?.logs.join("")}
              />
            ) : (
              <Terminal logs={data?.logs || []} />
            )}
          </div>
        </div>
      </main>

      {/* Status Modal */}
      <AnimatePresence>
        {showStatus && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatus(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl modal-container bg-card-muted border border-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.4)] flex flex-col h-full max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">{isKo ? "펜테스트 상태 조회" : "PENTEST STATUS"}</h2>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">{t("live_engine_trace") || "Live Engine Trace"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatus(false)}
                  className="p-3 rounded-2xl hover:bg-secondary text-muted-foreground hover:text-white transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 pt-4 flex-1 overflow-hidden flex flex-col">
                {statusLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-sm font-black text-gray-500 animate-pulse tracking-widest uppercase">
                      {t("fetching_engine_status") || "FETCHING ENGINE STATUS..."}
                    </p>
                  </div>
                ) : (
                  <div
                    className="font-mono text-sm text-foreground bg-white/5 border border-white/10 p-8 rounded-[1.5rem] leading-relaxed overflow-x-auto archive-scrollbar max-h-[60vh] shadow-inner"
                  >
                    {renderStatusLines(statusResult || "")}
                  </div>
                )}

                  {statusCommand && !statusLoading && (
                    <div className="mt-8 space-y-3">
                      <div className="flex items-center justify-between ml-1">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t("executed_command") || "Executed Command (Debug)"}</p>
                        <AnimatePresence>
                          {copiedCommand && (
                            <motion.span
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-[10px] font-black text-primary uppercase"
                            >
                              {isKo ? "클립보드에 복사됨!" : "Copied to clipboard!"}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                      <button
                        onClick={handleCopyCommand}
                        className="w-full text-left bg-white/5 border border-white/10 p-5 rounded-2xl font-mono text-[11px] text-foreground break-all hover:bg-white/10 hover:border-primary/30 transition-all active:scale-[0.99] group relative overflow-hidden"
                        title="Click to copy command"
                      >
                        <div className="relative z-10">{statusCommand}</div>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </div>
                  )}
                </div>

              <div className="px-10 py-8 border-t border-white/5 bg-white/[0.01] flex justify-end">
                <button
                  onClick={() => setShowStatus(false)}
                  className="px-12 py-4 btn-secondary rounded-2xl text-sm font-black transition-all"
                >
                  {t("close") || "CLOSE"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ScanDetail() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    }>
      <ScanDetailContent />
    </Suspense>
  );
}
