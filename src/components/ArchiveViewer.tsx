"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FileCode, FileText, Terminal, Download, Search, Loader2, CornerDownRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { motion, AnimatePresence } from "framer-motion";
import { useAppearance } from "@/context/AppearanceContext";
import { TERMINAL_THEMES } from "@/constants/terminalThemes";

interface ArchiveReport {
  id: string;
  filename: string;
  content: string;
  type: string;
  createdAt: string;
}

interface ArchiveViewerProps {
  scanId: string;
  initialLogs?: string;
}

type MarkdownCodeProps = {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export function ArchiveViewer({ scanId, initialLogs }: ArchiveViewerProps) {
  const { terminalTheme } = useAppearance();
  const currentTheme = TERMINAL_THEMES[terminalTheme] || TERMINAL_THEMES.bright;
  const isBright = ["bright", "beige", "doraemon"].includes(terminalTheme);

  const [reports, setReports] = useState<ArchiveReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | "logs">("logs");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`/api/scan/${scanId}/reports`);
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports);
          if (!initialLogs && data.reports.length > 0) {
            setSelectedReportId(data.reports[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch archived reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [scanId, initialLogs]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => r.filename.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [reports, searchTerm]);

  const selectedReport = useMemo(() => {
    if (selectedReportId === "logs") return null;
    return reports.find(r => r.id === selectedReportId);
  }, [reports, selectedReportId]);

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
        <span className="text-sm font-black tracking-[0.3em] text-gray-500 animate-pulse">SYNCHRONIZING ARCHIVE...</span>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full border rounded-[2rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative transition-all duration-500 ${
        isBright ? 'border-gray-200' : 'border-white/5'
      }`}
      style={{ backgroundColor: isBright ? `${currentTheme.background}CC` : `${currentTheme.background}80` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      {/* Sidebar - Precision Glassmorphism */}
      <div
        className={`w-80 border-r flex flex-col relative z-10 transition-all duration-500 ${
          isBright ? 'border-gray-200 bg-black/5' : 'border-white/10 bg-black/40'
        }`}
      >
        <div className={`p-6 border-b ${isBright ? 'border-gray-200' : 'border-white/5'}`}>
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              isBright ? 'text-gray-400 group-focus-within:text-primary' : 'text-gray-500 group-focus-within:text-primary'
            }`} />
            <input
              type="text"
              placeholder="Search artifacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full rounded-2xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:ring-2 transition-all font-medium ${
                isBright
                  ? 'bg-white/50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:ring-primary/20 focus:bg-white'
                  : 'bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:ring-primary/40 focus:bg-white/10'
              }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 archive-scrollbar">
          <div className="space-y-4">
            {initialLogs && (
              <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-3">System</span>
                <button
                  onClick={() => setSelectedReportId("logs")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all relative overflow-hidden group ${
                    selectedReportId === "logs"
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-gray-400 hover:bg-white/5"
                  }`}
                >
                  <Terminal className={`w-4 h-4 ${selectedReportId === "logs" ? "text-primary-foreground" : "text-primary/70"}`} />
                  <span className="font-bold tracking-tight">Terminal Output</span>
                  {selectedReportId === "logs" && (
                    <motion.div layoutId="active-pill" className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between px-3">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isBright ? 'text-gray-400' : 'text-gray-600'}`}>Artifacts</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${isBright ? 'bg-black/5 text-gray-400' : 'bg-white/5 text-gray-500'}`}>{filteredReports.length}</span>
              </div>

              <div className="space-y-1 mt-2">
                {filteredReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all group relative overflow-hidden border ${
                      selectedReportId === report.id
                        ? (isBright ? "bg-white text-foreground border-gray-200 shadow-sm" : "bg-white/10 text-foreground border-white/10")
                        : (isBright ? "text-muted-foreground hover:bg-white/40 border-transparent" : "text-muted-foreground hover:bg-white/5 border-transparent")
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      selectedReportId === report.id
                        ? (isBright ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary")
                        : (isBright ? "bg-gray-100 text-gray-400 group-hover:bg-gray-200" : "bg-white/5 text-gray-600 group-hover:text-gray-400")
                    }`}>
                      {report.type === 'md' ? <FileText className="w-3.5 h-3.5" /> : <FileCode className="w-3.5 h-3.5" />}
                    </div>
                    <span className="flex-1 text-left truncate font-semibold tracking-tight">{report.filename}</span>
                    {selectedReportId === report.id && (
                      <div className="w-1 h-4 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {filteredReports.length === 0 && searchTerm && (
              <div className="py-20 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-5 h-5 text-gray-700" />
                </div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">No matching results</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area - Premium Dark Theme */}
      <div
        className={`flex-1 flex flex-col relative min-w-0 z-10 transition-all duration-500 ${
          isBright ? 'bg-white/20' : 'bg-[#010204]/40'
        }`}
      >
        <div
          className={`px-8 py-5 border-b flex items-center justify-between backdrop-blur-md transition-all duration-500 ${
            isBright ? 'bg-white/40 border-gray-200' : 'bg-black/20 border-white/10'
          }`}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <CornerDownRight className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Current Artifact</span>
            </div>
            <h3 className={`text-sm font-black tracking-widest flex items-center gap-3 uppercase transition-colors duration-500 ${
              isBright ? "text-foreground" : "text-white"
            }`}>
              {selectedReportId === "logs" ? "SYSTEM_AUDIT_TERMINAL.log" : selectedReport?.filename}
              <div className={`px-2 py-0.5 rounded-md text-[9px] font-mono transition-colors duration-500 ${
                isBright ? 'bg-black/5 text-gray-400' : 'bg-white/5 text-gray-500'
              }`}>
                {selectedReportId === "logs" ? "TEXT/LOG" : (selectedReport?.type?.toUpperCase() || "DATA")}
              </div>
            </h3>
          </div>
          <button
            onClick={() => handleDownload(
              selectedReportId === "logs" ? "terminal_log.txt" : selectedReport!.filename,
              selectedReportId === "logs" ? initialLogs! : selectedReport!.content
            )}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all text-xs font-bold active:scale-95 shadow-lg group ${
              isBright
                ? 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
            }`}
          >
            <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
            DOWNLOAD
          </button>
        </div>

        <div className="flex-1 overflow-y-auto archive-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedReportId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {selectedReportId === "logs" ? (
                <div className="p-10 font-mono text-[13px] leading-relaxed relative min-h-full">
                  <div className={`absolute top-0 left-0 w-full h-full pointer-events-none ${isBright ? 'bg-grid-black/[0.02]' : 'bg-grid-white/[0.02]'}`} />
                  <pre
                    className="relative z-10 whitespace-pre-wrap break-all selection:bg-primary/30"
                    style={{ color: currentTheme.foreground }}
                  >
                    {initialLogs}
                  </pre>
                </div>
              ) : selectedReport?.type === 'md' ? (
                <div className="p-6 md:p-10 w-full min-h-full flex flex-col">
                  <div
                    className={`px-8 md:px-12 py-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden border transition-all duration-500 flex-1 ${
                      isBright ? 'border-gray-100 bg-white' : 'border-white/5 bg-white/[0.02]'
                    }`}
                    style={{ backgroundColor: isBright ? currentTheme.background : undefined }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div
                      className={`markdown-preview-dark selection:bg-primary/30 relative z-10 transition-colors duration-500 h-full`}
                      style={{ color: currentTheme.foreground }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: (props) => <h1 className={`text-4xl font-black mb-8 border-b-4 pb-4 tracking-tighter transition-colors ${isBright ? 'text-foreground border-primary/20' : 'text-white border-primary/20'}`} {...props} />,
                          h2: (props) => <h2 className={`text-3xl font-black mt-12 mb-6 tracking-tight flex items-center gap-3 before:w-1.5 before:h-8 before:bg-primary before:rounded-full transition-colors ${isBright ? 'text-foreground' : 'text-white'}`} {...props} />,
                          h3: (props) => <h3 className={`text-2xl font-black mt-10 mb-5 tracking-tight transition-colors ${isBright ? 'text-foreground' : 'text-white/90'}`} {...props} />,
                          h4: (props) => <h4 className={`text-xl font-bold mt-8 mb-4 tracking-tight transition-colors ${isBright ? 'text-foreground' : 'text-white/80'}`} {...props} />,
                          p: (props) => <p className={`leading-relaxed mb-6 font-medium text-lg transition-colors ${isBright ? 'text-gray-700' : 'text-gray-300'}`} {...props} />,
                          ul: (props) => <ul className="mb-8 ml-4 space-y-3" {...props} />,
                          ol: (props) => <ol className="mb-8 ml-4 list-decimal space-y-3" {...props} />,
                          li: (props) => (
                             <li className={`flex gap-3 font-medium text-lg leading-relaxed transition-colors ${isBright ? 'text-gray-700' : 'text-gray-300'}`}>
                               <span className="text-primary mt-2 shrink-0 text-sm">●</span>
                               <span className="flex-1" {...props} />
                             </li>
                          ),
                          blockquote: (props) => (
                            <blockquote className={`pl-6 py-2 border-l-4 italic mb-8 rounded-r-xl transition-colors ${isBright ? 'bg-gray-50 border-gray-300 text-gray-600' : 'bg-white/5 border-primary/40 text-gray-400'}`} {...props} />
                          ),
                          hr: () => <hr className={`my-12 border-t-2 transition-colors ${isBright ? 'border-gray-100' : 'border-white/5'}`} />,
                          table: (props) => (
                            <div className="overflow-x-auto mb-8 rounded-2xl border border-white/10">
                              <table className="w-full border-collapse" {...props} />
                            </div>
                          ),
                          thead: (props) => <thead className={`${isBright ? 'bg-gray-50' : 'bg-white/5'}`} {...props} />,
                          th: (props) => <th className={`px-6 py-4 text-left text-sm font-black uppercase tracking-wider border-b transition-colors ${isBright ? 'border-gray-200 text-gray-700' : 'border-white/10 text-gray-300'}`} {...props} />,
                          td: (props) => <td className={`px-6 py-4 text-sm border-b transition-colors ${isBright ? 'border-gray-100 text-gray-600' : 'border-white/5 text-gray-400'}`} {...props} />,
                          a: (props) => <a className="text-primary hover:underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />,
                          code: React.memo(function MarkdownCode({ inline, className, children, ...props }: MarkdownCodeProps) {
                            const { style: _style, ...rest } = props;
                            void _style;
                            const match = /language-(\w+)/.exec(className || '');
                            if (!inline && match) {
                              return (
                                <div className="my-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                  <div className={`px-4 py-2 border-b flex items-center justify-between ${isBright ? 'bg-gray-50 border-gray-100' : 'bg-white/5 border-white/5'}`}>
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{match[1]}</span>
                                    <div className="flex gap-1.5">
                                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20" />
                                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20" />
                                    </div>
                                  </div>
                                  <SyntaxHighlighter
                                    language={match[1]}
                                    PreTag="div"
                                    wrapLongLines={true}
                                    customStyle={{
                                      margin: 0,
                                      padding: '1.5rem',
                                      fontSize: '14px',
                                      backgroundColor: isBright ? '#ffffff' : 'transparent',
                                      lineHeight: '1.7',
                                    }}
                                    {...rest}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              );
                            }
                            return (
                              <code
                                className={`${className} px-2 py-0.5 rounded text-primary font-mono text-[0.9em] border transition-all ${
                                  isBright
                                    ? 'bg-gray-100 border-gray-200'
                                    : 'bg-white/5 border-white/10'
                                }`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          })
                        }}
                      >
                        {selectedReport.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 font-mono text-[13px] leading-relaxed min-h-full">
                  <pre
                    className="whitespace-pre-wrap break-all selection:bg-primary/30"
                    style={{ color: currentTheme.foreground }}
                  >
                    {selectedReport?.content}
                  </pre>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
