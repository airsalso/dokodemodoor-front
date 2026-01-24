"use client";

import { Navbar } from "@/components/Navbar";
import React, { useState, useEffect, useCallback, useMemo, useDeferredValue } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  Save,
  Search,
  RefreshCw,
  Loader2,
  FileCode,
  FileCheck,
  Edit3,
  Eye,
  FileBarChart,
  Trash2,
  Download,
  Languages
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { CSSProperties } from "react";
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LogNode {
  name: string;
  type: "directory" | "file";
  path: string;
  isRegistered?: boolean;
  scanId?: string;
  children?: LogNode[];
}

type MarkdownCodeProps = {
  className?: string;
  children?: React.ReactNode;
  node?: unknown;
} & React.HTMLAttributes<HTMLElement>;

const syntaxTheme = oneLight as unknown as { [key: string]: CSSProperties };

const TreeItem = React.memo(({
  node,
  level,
  onToggle,
  onSelect,
  onDelete,
  onDownload,
  onRegister,
  onTranslate,
  isSelected,
  isExpanded,
  isTranslating,
  hasTranslation,
  isRoot
}: {
  node: LogNode;
  level: number;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onDelete: (e: React.MouseEvent, path: string, type: string) => void;
  onDownload: (e: React.MouseEvent, path: string, name: string) => void;
  onRegister?: (e: React.MouseEvent, projectName: string) => void;
  onTranslate?: (e: React.MouseEvent, path: string) => void;
  isSelected: boolean;
  isExpanded: boolean;
  isTranslating?: boolean;
  hasTranslation?: boolean;
  isRoot?: boolean;
}) => {
  const isDirectory = node.type === "directory";

  if (isDirectory) {
    return (
      <div key={node.path} className="group flex items-center min-w-0">
        <button
          onClick={() => onToggle(node.path)}
          className="flex-1 flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded-lg transition-colors text-sm text-gray-400 min-w-0"
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
          <Folder className={`w-4 h-4 shrink-0 ${node.isRegistered ? "text-primary/70" : "text-emerald-400/70"}`} />
          <span className="truncate" title={node.name}>{node.name}</span>
          {isRoot && node.isRegistered && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-[9px] font-black text-primary uppercase border border-primary/20 shrink-0">
              <FileCheck className="w-2.5 h-2.5" />
              REGISTERED
            </div>
          )}
        </button>

        {isRoot && !node.isRegistered && (
          <button
            onClick={(e) => onRegister?.(e, node.name)}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 transition-all shrink-0 mr-1"
          >
            <RefreshCw className="w-3 h-3" />
            REGISTER
          </button>
        )}

        {isRoot && node.isRegistered && node.scanId && (
          <Link
            href={`/scans/${node.scanId}`}
            className="p-1.5 hover:text-primary transition-all shrink-0"
            title="View Scan Detail"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
        )}

        <button
          onClick={(e) => onDelete(e, node.path, 'directory')}
          className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-rose-500 transition-all shrink-0"
          title="Delete Folder"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div key={node.path} className={`group flex items-center min-w-0 transition-opacity ${isTranslating ? "opacity-40 bg-indigo-500/5" : ""}`}>
      <button
        onClick={() => onSelect(node.path)}
        disabled={isTranslating}
        className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-sm mb-0.5 min-w-0 ${
          isSelected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-gray-400 hover:bg-white/5 border border-transparent"
        }`}
        style={{ paddingLeft: `${level * 1.5 + 1.25}rem` }}
      >
        <FileCheck className={`w-4 h-4 shrink-0 ${isSelected ? "text-emerald-400" : "text-gray-500"}`} />
        <span className="truncate" title={node.name}>{node.name}</span>
      </button>

      {node.name.endsWith("_deliverable.md") && !node.name.endsWith("_kr.md") && (
        <button
          onClick={(e) => onTranslate?.(e, node.path)}
          disabled={isTranslating || hasTranslation}
          className={`p-1.5 transition-all mb-0.5 shrink-0 ${
            isTranslating
              ? "opacity-100 text-indigo-400"
              : hasTranslation
                ? "opacity-40 text-gray-600 cursor-not-allowed"
                : "opacity-0 group-hover:opacity-100 hover:text-indigo-400"
          }`}
          title={hasTranslation ? "Korean version already exists" : "Translate to Korean"}
        >
          {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
        </button>
      )}

      <button
        onClick={(e) => onDownload(e, node.path, node.name)}
        disabled={isTranslating}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-emerald-400 transition-all mb-0.5 shrink-0"
        title="Download File"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={(e) => onDelete(e, node.path, 'file')}
        disabled={isTranslating}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-rose-500 transition-all mb-0.5 shrink-0"
        title="Delete File"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});

TreeItem.displayName = "TreeItem";

const ReportViewer = ({
  content,
  ext,
  isEditing,
  editContent,
  setEditContent
}: {
  content: string;
  ext: string | undefined;
  isEditing: boolean;
  editContent: string;
  setEditContent: (val: string) => void;
}) => {
  const largeFileThreshold = parseInt(process.env.NEXT_PUBLIC_LARGE_FILE_THRESHOLD_BYTES || "800000");
  const isTooLarge = content.length > largeFileThreshold; // 800KB threshold

  const renderedContent = useMemo(() => {
    if (!content || isTooLarge) return "";
    if (ext === 'json') {
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        return content;
      }
    }
    return content;
  }, [content, ext, isTooLarge]);

  if (isEditing) {
    return (
      <textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        className="flex-1 bg-[#fdfcf6] p-6 font-mono text-sm resize-none focus:outline-none text-gray-900 leading-relaxed custom-scrollbar overflow-y-auto whitespace-pre-wrap break-all"
        spellCheck={false}
        autoFocus
      />
    );
  }

  if (ext === 'md') {
    if (isTooLarge) {
      return (
        <pre className="flex-1 overflow-auto p-6 font-mono text-sm text-gray-900 bg-[#fdfcf6] custom-scrollbar whitespace-pre-wrap break-all min-h-0 min-w-0 max-w-full">
          <code className="whitespace-pre-wrap break-all">{content}</code>
        </pre>
      );
    }
    return (
      <div className="flex-1 overflow-auto p-8 max-w-full min-w-0 custom-scrollbar bg-[#fdfcf6] text-gray-900 markdown-preview break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code(props: MarkdownCodeProps) {
              const { children, className, node: _node, ...rest } = props;
              void _node;
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match;

              if (!isInline && match) {
                return (
                  <SyntaxHighlighter
                    style={syntaxTheme}
                    language={match[1]}
                    PreTag="div"
                    wrapLongLines={true}
                    customStyle={{
                      margin: 0,
                      padding: '1.25rem',
                      fontSize: '0.9em',
                      backgroundColor: '#f9fafb',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              }

              return (
                <code
                  className={`${className || ''} ${!isInline ? 'block p-6 whitespace-pre-wrap break-all bg-[#f9fafb] rounded-xl border border-[#e5e7eb]' : ''}`}
                  {...rest}
                >
                  {children}
                </code>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <pre className="flex-1 overflow-auto p-6 font-mono text-sm text-gray-900 bg-[#fdfcf6] custom-scrollbar whitespace-pre-wrap break-all min-h-0 min-w-0 max-w-full">
      {isTooLarge ? (
        <code className="whitespace-pre-wrap break-all">{content}</code>
      ) : (
        <code className="whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: renderedContent }} />
      )}
    </pre>
  );
};

export default function ReportsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedPath = searchParams.get("path");

  const [nodes, setNodes] = useState<LogNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [translatingPaths, setTranslatingPaths] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  const fetchList = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/reports/list");
      const data = await res.json();

      if (res.status === 401) {
        router.push("/login?callback=/reports");
        return;
      }

      if (data.files) setNodes(data.files);
    } catch (err) {
      console.error("Fetch reports list error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  const fetchTranslatingStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/translate");
      if (res.ok) {
        const data = await res.json();
        if (data.translatingPaths) {
          setTranslatingPaths(new Set(data.translatingPaths));
        }
      }
    } catch (err) {
      console.error("Fetch translating status error:", err);
    }
  }, []);

  useEffect(() => {
    fetchList();
    fetchTranslatingStatus();
    const intervalMs = parseInt(process.env.NEXT_PUBLIC_LOG_REFRESH_INTERVAL_MS || "10000");
    const interval = setInterval(() => {
      fetchList(true);
      fetchTranslatingStatus();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [fetchList, fetchTranslatingStatus]);

  useEffect(() => {
    if (!selectedPath) {
      setContent("");
      setEditContent("");
      setIsEditing(false);
      return;
    }

    const fetchFile = async () => {
      try {
        const res = await fetch(`/api/reports/file?path=${encodeURIComponent(selectedPath)}`);
        const data = await res.json();
        if (data.content !== undefined) {
          setContent(data.content);
          setEditContent(data.content);
        }
      } catch (err) {
        console.error("Read report file error:", err);
      }
    };

    fetchFile();
  }, [selectedPath]);

  const handleFileSelect = useCallback((path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("path", path);
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleSave = useCallback(async () => {
    if (!selectedPath) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reports/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedPath, content: editContent }),
      });
      if (res.ok) {
        setContent(editContent);
        setIsEditing(false);
        alert("Report saved successfully");
      } else {
        const data = await res.json();
        alert(data.error || "Save failed");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Connection error");
    } finally {
      setSaving(false);
    }
  }, [selectedPath, editContent]);

  const handleDelete = useCallback(async (e: React.MouseEvent, path: string, type: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete this ${type}? ${type === 'directory' ? 'All contents will be removed.' : ''}`)) return;

    try {
      const res = await fetch(`/api/reports/file?path=${encodeURIComponent(path)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        if (selectedPath === path) {
          const params = new URLSearchParams(searchParams.toString());
          params.delete("path");
          router.replace(`${pathname}?${params.toString()}`);
        }
        fetchList();
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Connection error");
    }
  }, [selectedPath, fetchList, pathname, router, searchParams]);

  const handleDownload = useCallback(async (e: React.MouseEvent, path: string, name: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/reports/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.content !== undefined) {
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download file");
    }
  }, []);

  const handleRegister = useCallback(async (e: React.MouseEvent, projectName: string) => {
    e.stopPropagation();
    if (!confirm(`Do you want to register manual findings for '${projectName}' into the Pentest History?`)) return;

    setRegistering(projectName);
    try {
      const res = await fetch("/api/reports/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully registered! ${data.vulnerabilities} vulnerabilities found.`);
        fetchList(true); // Silent refresh to update status
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Connection error");
    } finally {
      setRegistering(null);
    }
  }, [fetchList]);
  const handleTranslateReport = useCallback(async (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    if (!confirm("Do you want to translate this analysis deliverable into Korean? This will use AI and may take a moment.")) return;

    setTranslatingPaths(prev => new Set(prev).add(filePath));
    try {
      const res = await fetch("/api/reports/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Translation successful! A Korean version has been created.");
        fetchList(true); // Silent refresh to show the new _kr.md file
      } else {
        alert(data.error || "Translation failed");
      }
    } catch (err) {
      console.error("Translate report error:", err);
      alert("Connection error");
    } finally {
      setTranslatingPaths(prev => {
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      });
    }
  }, [fetchList]);

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const { visibleNodes, allFilePaths } = useMemo(() => {
    const result: { node: LogNode, level: number, isExpanded: boolean }[] = [];
    const paths = new Set<string>();
    const searchLower = deferredSearch.toLowerCase();

    const walk = (items: LogNode[], level: number) => {
      const sorted = [...items].sort((a, b) =>
        a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1
      );

      sorted.forEach(node => {
        if (node.type === "file") paths.add(node.path);

        const matches = !searchLower || node.name.toLowerCase().includes(searchLower) || (node.children && node.children.some(c => c.name.toLowerCase().includes(searchLower)));
        if (!matches && node.type === 'file') return;

        const isExpanded = expandedFolders.has(node.path) || (searchLower !== "" && node.type === "directory");
        result.push({ node, level, isExpanded });

        if (node.type === "directory" && isExpanded && node.children) {
          walk(node.children, level + 1);
        }
      });
    };

    walk(nodes, 0);
    return { visibleNodes: result, allFilePaths: paths };
  }, [nodes, expandedFolders, deferredSearch]);

  return (
    <div className="h-screen w-full flex flex-col bg-background overflow-hidden relative">
      {/* Navbar Fixed Container */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md">
        <Navbar />
      </div>

      {/* Spacer for Fixed Navbar */}
      <div className="h-20 flex-shrink-0" />

      <main className="flex-1 flex flex-col w-full px-8 py-8 gap-8 min-h-0 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <FileBarChart className="w-8 h-8 text-emerald-500" />
              {t("reports")}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Review and manage deliverables from project repositories.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchList()}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {selectedPath && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border ${
                  isEditing
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                  : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                }`}
              >
                {isEditing ? <Eye className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                {isEditing ? "VIEW MODE" : "Edit Report"}
              </button>
            )}

            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all shadow-lg glow-emerald"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {t("save_changes")}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0 min-w-0">
          {/* Project Tree Panel */}
          <div className="w-[480px] flex flex-col glass-card rounded-2xl border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter deliverables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 text-white"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loading && nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-medium">Scanning deliverables...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {visibleNodes.map(({ node, level, isExpanded }) => (
                    <TreeItem
                      key={node.path}
                      node={node}
                      level={level}
                      isSelected={selectedPath === node.path}
                      isExpanded={isExpanded}
                      isRoot={level === 0}
                      onToggle={toggleFolder}
                      onSelect={handleFileSelect}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                      onRegister={handleRegister}
                      onTranslate={handleTranslateReport}
                      isTranslating={translatingPaths.has(node.path)}
                      hasTranslation={allFilePaths.has(node.path.replace(".md", "_kr.md"))}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Report Editor/Viewer Panel */}
          <div className="flex-1 flex flex-col glass-card rounded-2xl border-white/5 overflow-hidden relative min-w-0">
            {!selectedPath ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                  <FileText className="w-10 h-10 opacity-20" />
                </div>
                <p className="font-medium">Select a deliverable (report) to view</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-mono text-gray-300 truncate max-w-md">{selectedPath}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isEditing ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isEditing ? 'Editing' : 'Viewing'}
                    </div>
                    <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                      {selectedPath.split('.').pop() || 'report'}
                    </div>
                  </div>
                </div>
                <ReportViewer
                  content={content}
                  ext={selectedPath.split('.').pop()?.toLowerCase()}
                  isEditing={isEditing}
                  editContent={editContent}
                  setEditContent={setEditContent}
                />
              </div>
            )}

            {saving && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="bg-black/60 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <span className="text-sm font-bold">Saving report...</span>
                </div>
              </div>
            )}

            {registering && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100]">
                <div className="bg-black border border-white/10 px-8 py-6 rounded-[2rem] flex flex-col items-center gap-4 shadow-2xl">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                    <div className="absolute inset-0 blur-lg bg-emerald-500/20 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black tracking-widest text-emerald-500 uppercase">Synchronizing Data</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{registering}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
