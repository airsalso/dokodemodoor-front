"use client";

import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight, Loader2, ChevronDown, Trash2, Languages, Activity, RefreshCw, Layout } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useScans, ScanRecord } from "@/hooks/useScans";
import React from "react";

type ScanStatus = "all" | "running" | "completed" | "failed" | "translating";





export default function ScansHistory() {
  const router = useRouter();
  const { t, language, formatDuration } = useLanguage();
  const { user, authenticated, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScanStatus>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  const deferredSearch = useDeferredValue(search);

  const { data: scanData, isLoading: scansLoading, mutate: refreshScans } = useScans({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    query: deferredSearch,
    status: statusFilter,
    type: "SCA"
  });

  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const processedData = useMemo(() => {
    if (!scanData) return { history: [], stats: { total: 0, running: 0, completed: 0, failed: 0 }, totalPages: 1 };

    const historyWithoutActive = scanData.active
      ? (scanData.history || []).filter((scan: ScanRecord) => scan.id !== scanData.active?.id)
      : (scanData.history || []);

    return {
      history: historyWithoutActive,
      stats: scanData.stats,
      totalPages: scanData.pagination?.totalPages || 1
    };
  }, [scanData]);

  const { history: scans, stats: totalCounts, totalPages } = processedData;

  const activeScan = useMemo(() => {
    if (!scanData?.active || currentTime === 0) return null;
    const elapsed = Math.round((currentTime - Number(scanData.active.startTime)) / 1000);
    return {
      ...scanData.active,
      target: scanData.active.target || scanData.active.targetUrl || "In progress...",
      duration: `${elapsed}s`
    } as ScanRecord;
  }, [scanData, currentTime]);

  const loading = scansLoading && !scanData;

  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/login?callback=/sca-scans");
    }
  }, [router, authenticated, authLoading]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(language === "ko" ? "이 스캔 이력을 정말 삭제하시겠습니까?" : "Are you sure you want to delete this scan history?")) return;

    try {
      const res = await fetch(`/api/scan/delete/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete scan");
      } else {
        // Refresh the list immediately
        refreshScans();
      }
    } catch (err) {
      console.error("Delete scan error:", err);
      alert("Connection error");
    }
  };

  const handleRestart = async (e: React.MouseEvent, scan: ScanRecord) => {
    e.preventDefault();
    e.stopPropagation();

    if (!scan.targetUrl || !scan.config) {
      alert("Missing scan parameters to restart.");
      return;
    }

    if (!confirm(language === "ko" ? "이 스캔을 현재 ID 그대로 재시작하시겠습니까?" : "Do you want to restart this scan with current ID?")) return;

    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: scan.targetUrl,
          sourcePath: scan.sourcePath || "",
          config: scan.config,
          scanId: scan.id,
          type: "SCA"
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to restart scan");
      } else {
        // Refresh the list to show "running" status
        refreshScans();
      }
    } catch (err) {
      console.error("Restart scan error:", err);
      alert("Connection error");
    }
  };

  // No longer needed due to server-side filtering
  // const filteredScans = useMemo(() => ...);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshScans();
  };

  const statusOptions: { label: string; value: ScanStatus; color: string }[] = [
    { label: t("all_status"), value: "all", color: "text-gray-400" },
    { label: t("running"), value: "running", color: "text-primary" },
    { label: t("translating"), value: "translating", color: "text-indigo-400" },
    { label: t("completed"), value: "completed", color: "text-emerald-400" },
    { label: t("failed"), value: "failed", color: "text-rose-400" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary">
              <Search className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">Scan Management</span>
            </div>
            <h1 className="text-4xl font-black text-foreground">{t("sca_scans") || t("Software Composition Analysis") || "SCA Scans"}</h1>
            <p className="text-gray-500 max-w-xl">
              {language === "ko" ? "모든 자동화된 보안 평가 기록을 관리합니다." : "Manage all automated security assessment records."}
            </p>
          </div>
          {user?.role !== 'USER' && (
            <Link
              href="/sca-scans/new"
              className="w-full md:w-auto px-10 py-4 btn-accent rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              {t("start New scan") || "Start New Scan"}
            </Link>
          )}
        </header>

        {/* Filters & Statistics Row */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[600px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input-bg border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium text-foreground shadow-inner"
            />
          </form>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-6 py-4 bg-input-bg border border-white/10 rounded-xl text-sm font-bold flex items-center gap-3 hover:bg-white/5 transition-all text-foreground min-w-[180px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="capitalize">{statusFilter === 'all' ? t('all_status') : t(statusFilter)}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showFilterDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden p-1.5"
                  >
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setStatusFilter(opt.value);
                          setShowFilterDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-white/5 ${
                          statusFilter === opt.value ? 'bg-primary/10 text-white' : 'text-gray-400'
                        }`}
                      >
                        <span className={opt.color}>{opt.label}</span>
                        {statusFilter === opt.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary glow-primary" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Compact Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer active:scale-95 ${
              statusFilter === 'all'
                ? 'bg-blue-500/20 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              statusFilter === 'all' ? 'bg-blue-500 text-white shadow-lg' : 'bg-blue-500/10 text-blue-400'
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none mb-1">{totalCounts.total}</p>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusFilter === 'all' ? 'text-blue-300' : 'text-gray-500'}`}>Total</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            onClick={() => {
              setStatusFilter("running");
              setCurrentPage(1);
            }}
            className={`px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer active:scale-95 ${
              statusFilter === 'running'
                ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              statusFilter === 'running' ? 'bg-amber-500 text-white shadow-lg' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none mb-1">
                {totalCounts.running + (totalCounts.translating || 0)}
              </p>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusFilter === 'running' ? 'text-amber-300' : 'text-gray-500'}`}>Active</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onClick={() => {
              setStatusFilter("completed");
              setCurrentPage(1);
            }}
            className={`px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer active:scale-95 ${
              statusFilter === 'completed'
                ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              statusFilter === 'completed' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none mb-1">
                {totalCounts.completed}
              </p>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusFilter === 'completed' ? 'text-emerald-300' : 'text-gray-500'}`}>Done</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            onClick={() => {
              setStatusFilter("failed");
              setCurrentPage(1);
            }}
            className={`px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer active:scale-95 ${
              statusFilter === 'failed'
                ? 'bg-rose-500/20 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              statusFilter === 'failed' ? 'bg-rose-500 text-white shadow-lg' : 'bg-rose-500/10 text-rose-400'
            }`}>
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-white leading-none mb-1">
                {totalCounts.failed}
              </p>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${statusFilter === 'failed' ? 'text-rose-300' : 'text-gray-500'}`}>Failed</p>
            </div>
          </motion.div>
        </div>

        {/* Active Scan Section */}
        {activeScan && (
           <div className="mb-8 p-1 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20">
              <ScanCard scan={activeScan} isActive t={t} language={language} formatDuration={formatDuration} userRole={user?.role} onDelete={handleDelete} onRestart={handleRestart} router={router} />
           </div>
        )}

        {/* History Cards */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-gray-500 font-medium">Loading...</p>
            </div>
          ) : scans.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {scans.map((scan) => (
                <ScanCard
                  key={scan.id}
                  scan={scan}
                  isActive={false}
                  t={t}
                  language={language}
                  formatDuration={formatDuration}
                  userRole={user?.role}
                  onDelete={handleDelete}
                  onRestart={handleRestart}
                  router={router}
                />
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-24 text-center glass-card border-dashed border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-gray-600" /></div>
              <p className="text-gray-400 font-bold text-lg">{t("no_results")}</p>
            </div>
          )}
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-3 rounded-xl glass-card border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-12 h-12 rounded-xl border font-bold transition-all ${
                    currentPage === pageNum
                      ? "bg-primary border-primary text-white glow-primary"
                      : "glass-card border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-3 rounded-xl glass-card border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

type ScanCardProps = {
  scan: ScanRecord;
  isActive: boolean;
  t: (key: string) => string;
  language: string;
  formatDuration: (duration?: string | number | undefined) => string;
  userRole?: string;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onRestart: (e: React.MouseEvent, scan: ScanRecord) => void;
  router: ReturnType<typeof useRouter>;
};

const ScanCard = React.memo(({ scan, isActive, t, language, formatDuration, userRole, onDelete, onRestart, router }: ScanCardProps) => {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
      <Link href={`/sca-scans/${scan.id}`} className={`group block p-6 glass-card hover:bg-white/5 transition-all border-white/5 hover:border-primary/30 ${isActive ? 'bg-primary/5 border-primary/20 shadow-2xl shadow-primary/10' : ''}`}>
        <div className="flex items-center justify-between gap-8">
          {/* Left: Status Icon + Badge */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {scan.status === "completed" && <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 glow-sm"><CheckCircle2 className="w-6 h-6" /></div>}
            {scan.status === "failed" && <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500"><XCircle className="w-6 h-6" /></div>}
            {scan.status === "running" && <div className="p-3 rounded-xl bg-primary/10 text-primary"><Clock className="w-6 h-6 animate-pulse" /></div>}
            {scan.status === "translating" && <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400"><Languages className="w-6 h-6 animate-pulse" /></div>}
            <div>
              <span className={`text-xs font-black uppercase tracking-widest block mb-1 ${
                scan.status === "completed" ? "text-emerald-500" :
                scan.status === "failed" ? "text-rose-500" :
                scan.status === "running" ? "text-primary" :
                "text-indigo-400"
              }`}>
                {t(scan.status)}
              </span>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Status</p>
            </div>
          </div>

          {/* Center: Target Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors mb-1 truncate">
              {scan.projectName || (() => {
                if (scan.sourcePath) {
                  const parts = scan.sourcePath.replace(/\\/g, '/').split('/');
                  const reposIdx = parts.lastIndexOf('repos');
                  return (reposIdx !== -1 && parts.length > reposIdx + 1)
                    ? parts[reposIdx + 1]
                    : parts[parts.length - 1];
                }
                return scan.id;
              })()}
            </h3>
            <p className="text-sm text-gray-400 font-mono tracking-tight truncate opacity-90">
              {scan.target || scan.targetUrl} <span className="text-gray-500">({scan.id})</span>
            </p>
          </div>

          {/* Right: Metadata Grid */}
          <div className="flex items-center gap-8 flex-shrink-0">
            {/* Date */}
            <div className="hidden lg:flex flex-col items-center min-w-[120px]">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Started</p>
              <p className="text-sm font-bold text-gray-300 text-center">
                {scan.startTime ? (
                  isNaN(new Date(scan.startTime).getTime())
                    ? "Invalid"
                    : formatDistanceToNow(new Date(scan.startTime), { addSuffix: true, locale: language === "ko" ? ko : enUS })
                ) : "N/A"}
              </p>
            </div>

            {/* Vulnerabilities */}
            <div className="hidden sm:flex flex-col items-center min-w-[80px]">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Findings</p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/sca-scans/vulns?scanId=${scan.id}`);
                }}
                className={`text-2xl font-black hover:scale-110 transition-all ${(scan.vulnerabilities ?? 0) > 0 ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}`}
              >
                {scan.vulnerabilities ?? 0}
              </button>
            </div>

            {/* Duration */}
            <div className="flex flex-col items-center min-w-[100px]">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Duration</p>
              <p className="text-sm font-bold text-amber-400">
                  {(() => {
                    if (scan.duration) return formatDuration(scan.duration);
                    if (scan.endTime && scan.startTime) {
                        const diff = Math.round((new Date(scan.endTime).getTime() - new Date(scan.startTime).getTime()) / 1000);
                        if (diff > 0) return formatDuration(diff);
                    }
                    return "...";
                  })()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {scan.status !== "running" && scan.status !== "translating" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/sca-scans/${scan.id}?view=archive`);
                  }}
                  className="p-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/90 hover:text-white transition-all border border-primary/20 hover:border-primary/50"
                  title="View Archive"
                >
                  <Layout className="w-4 h-4" />
                </button>
              )}
              {userRole === "ADMIN" && (
                <>
                  <button
                    onClick={(e) => onRestart(e, scan)}
                    disabled={scan.status === "running" || scan.status === "translating"}
                    className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/90 hover:text-white transition-all border border-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Restart Scan"
                  >
                    <RefreshCw className={`w-4 h-4 ${scan.status === "running" || scan.status === "translating" ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={(e) => onDelete(e, scan.id)}
                    className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/90 hover:text-white transition-all border border-rose-500/20 hover:border-rose-500/50"
                    title="Delete History"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-primary transition-all transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

ScanCard.displayName = "ScanCard";
