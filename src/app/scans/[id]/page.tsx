"use client";

import { Navbar } from "@/components/Navbar";
import { Terminal } from "@/components/Terminal";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Share2, StopCircle, RefreshCw, AlertTriangle, CheckCircle2, Clock, Loader2, Activity, X, Eraser, Languages, Layout } from "lucide-react";
import { ArchiveViewer } from "@/components/ArchiveViewer";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { TERMINAL_THEMES } from "@/constants/terminalThemes";

function ScanDetailContent() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get("view");
  const { terminalTheme, language, t, formatDuration } = useLanguage();
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
              <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-3 bg-black/80 px-4 py-1.5 rounded-xl backdrop-blur-xl border border-white/20 shadow-2xl transition-all scale-95 group-hover:scale-100">
                {canRerun && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAgentAction(name, 'rerun'); }}
                    disabled={!!actionLoading || translating || data?.status?.toLowerCase() === 'translating' || data?.status?.toLowerCase() === 'running'}
                    className="text-[9px] font-black hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Rerun this agent"
                  >
                    <span>🔄</span> RERUN
                  </button>
                )}
                {canRerun && canRollback && <div className="w-[1px] h-4 bg-white/20" />}
                {canRollback && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAgentAction(name, 'rollback'); }}
                    disabled={!!actionLoading || translating || data?.status?.toLowerCase() === 'translating' || data?.status?.toLowerCase() === 'running'}
                    className="text-[9px] font-black hover:text-amber-400 transition-colors uppercase tracking-widest flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Rollback to this agent"
                  >
                    <span>⏪</span> ROLLBACK
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
  const isBright = terminalTheme === "bright" || terminalTheme === "beige";

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

      <main className="flex-1 flex flex-col max-w-[1600px] mx-auto px-6 py-12 w-full gap-8 relative z-10">
        {/* Page Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-4">
            <Link
              href="/scans"
              className="group inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-95 w-fit"
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              </div>
              {t('back to history') || 'Back to History'}
            </Link>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight">
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
                <div className="flex items-center gap-2">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${
                    data?.status?.toLowerCase() === 'running' ? 'bg-primary/10 text-primary border-primary/20' :
                    data?.status?.toLowerCase() === 'translating' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    data?.status?.toLowerCase() === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {data?.status?.toLowerCase() === 'running' ? <Clock className="w-3 h-3 animate-pulse" /> :
                     data?.status?.toLowerCase() === 'translating' ? <Languages className="w-3 h-3 animate-pulse" /> :
                     data?.status?.toLowerCase() === 'completed' ? <CheckCircle2 className="w-3 h-3" /> :
                     <AlertTriangle className="w-3 h-3" />}
                    {t(data?.status || "")}
                  </div>

                  <button
                    onClick={handleCopyId}
                    className="group relative px-4 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-black font-mono text-gray-300 shadow-inner hover:bg-white/20 transition-all active:scale-95"
                    title="Click to copy ID"
                  >
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

                {data && (
                  <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-gray-300 shadow-sm">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="flex items-center gap-1.5">
                      {t("duration")}:
                      <span className="text-white">
                        {(() => {
                          const isRunning = data.status?.toLowerCase() === 'running' || data.status?.toLowerCase() === 'translating';
                          if (isRunning && data.startTime) {
                            return formatDuration(Math.round((Date.now() - data.startTime) / 1000));
                          }
                          // Fallback: Use startTime/endTime if duration field is missing
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
              </div>
              <div className="relative flex items-center group/url w-fit">
                <button
                  onClick={handleCopyUrl}
                  className="text-gray-300 font-mono text-base tracking-tight mt-1 opacity-80 hover:opacity-100 hover:text-primary transition-all active:scale-[0.98] text-left cursor-pointer"
                  title="Click to copy Target URL"
                >
                  {data?.target}
                </button>
                <AnimatePresence>
                  {copiedUrl && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8, x: 0 }}
                      animate={{ opacity: 1, scale: 1, x: 12 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="inline-block ml-2 px-3 py-1 bg-primary text-white text-[9px] font-black rounded-lg shadow-xl shadow-primary/20 whitespace-nowrap"
                    >
                      COPIED!
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {data?.status?.toLowerCase() !== 'running' && data?.status?.toLowerCase() !== 'translating' && (
              <button
                onClick={() => setShowArchive(!showArchive)}
                className={`px-6 py-4 rounded-2xl border transition-all flex items-center gap-2 font-black ${
                  showArchive
                    ? "bg-primary text-white border-primary glow-primary"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                }`}
              >
                <Layout className="w-5 h-5" />
                {showArchive ? (isKo ? "로그 보기" : "VIEW LOGS") : (isKo ? "결과 보관함" : "VIEW ARCHIVE")}
              </button>
            )}

            <button
              onClick={fetchStatus}
              className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 font-black text-gray-300"
            >
              <Activity className="w-5 h-5 text-primary" />
              STATUS
            </button>

            <button
              onClick={handleCleanup}
              disabled={cleaning || data?.status?.toLowerCase() !== 'failed'}
              className={`px-6 py-4 rounded-2xl border transition-all flex items-center gap-2 font-black ${
                (cleaning || data?.status?.toLowerCase() !== 'failed')
                  ? "bg-white/5 border-white/10 text-gray-500 opacity-30 cursor-not-allowed"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-amber-500/30"
              }`}
              title={data?.status?.toLowerCase() !== 'failed' ? "Only failed scans can be cleaned up" : "Cleanup session files"}
            >
              {cleaning ? (
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
              ) : (
                <Eraser className={`w-5 h-5 ${data?.status?.toLowerCase() === 'failed' ? 'text-amber-500' : 'text-gray-500'}`} />
              )}
              CLEANUP
            </button>

            {data?.status?.toLowerCase() === "running" ? (
              <button
                disabled={stopping}
                onClick={handleStop}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-black ${
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
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-black ${
                  (restarting || translating || data?.status?.toLowerCase() === 'translating') ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {restarting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {restarting ? "RESTARTING..." : "Restart Scan"}
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 group relative"
            >
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <AnimatePresence>
                {copied && (
                  <motion.span
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg shadow-2xl"
                  >
                    COPIED
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Terminal Container */}
        <div
          className={`flex-1 flex flex-col rounded-3xl overflow-hidden shadow-2xl border transition-all duration-500 min-h-0 ${
            isBright ? 'border-gray-200 bg-white shadow-gray-200/50' : 'border-white/5 bg-[#05070a]'
          }`}
        >
          {/* Terminal Header Bar - High Contrast Separation */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b transition-all duration-500 ${
              terminalTheme === 'beige'
                ? 'bg-[#eee8d5] border-[#d5ceba]'
                : isBright
                  ? 'bg-slate-100 border-gray-200'
                  : 'bg-black/40 border-white/10 backdrop-blur-2xl'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm" />
              </div>
              <div className={`h-4 w-[1px] mx-2 ${
                terminalTheme === 'beige' ? 'bg-[#d5ceba]' : isBright ? 'bg-gray-300' : 'bg-white/10'
              }`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                terminalTheme === 'beige' ? 'text-[#839496]' : isBright ? 'text-slate-600' : 'text-gray-400'
              }`}>
                LIVE TERMINAL STREAM
              </span>
            </div>
            <div className={`text-[10px] font-black px-4 py-1.5 rounded-full border shadow-sm ${
              terminalTheme === 'beige'
                ? 'bg-[#fdf6e3] border-[#d5ceba] text-[#586e75]'
                : isBright
                  ? 'bg-white border-gray-200 text-slate-800'
                  : 'bg-white/5 border-white/10 text-gray-300'
            }`}>
              <span className="text-primary mr-1.5">{data?.logs.length || 0}</span> {isKo ? "로그 라인" : "LINES"}
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
              className="relative w-full max-w-2xl glass-card rounded-3xl border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-black tracking-tight underline decoration-primary/30 underline-offset-8">
                    PENTEST STATUS
                  </h2>
                </div>
                <button
                  onClick={() => setShowStatus(false)}
                  className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="p-8">
                {statusLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-bold text-gray-500 animate-pulse">
                      FETCHING ENGINE STATUS...
                    </p>
                  </div>
                ) : (
                  <div
                    className="font-mono text-sm text-gray-300 bg-black/60 p-6 rounded-2xl border border-white/10 leading-relaxed overflow-x-auto custom-scrollbar max-h-[60vh]"
                  >
                    {renderStatusLines(statusResult || "")}
                  </div>
                )}

                {statusCommand && !statusLoading && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Executed Command (Debug)</p>
                      <AnimatePresence>
                        {copiedCommand && (
                          <motion.span
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-[10px] font-black text-primary uppercase"
                          >
                            Copied to clipboard!
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      onClick={handleCopyCommand}
                      className="w-full text-left bg-black/40 border border-white/5 p-4 rounded-xl font-mono text-[11px] text-primary/70 break-all hover:bg-black/60 hover:border-primary/20 transition-all active:scale-[0.99] group relative overflow-hidden"
                      title="Click to copy command"
                    >
                      <div className="relative z-10">{statusCommand}</div>
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                )}
              </div>

              <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex justify-end">
                <button
                  onClick={() => setShowStatus(false)}
                  className="px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all border border-white/10"
                >
                  CLOSE
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
