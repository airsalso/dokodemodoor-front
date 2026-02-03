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
  Languages,
  SortAsc,
  SortDesc,
  Clock,
  ArrowUpDown
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
  mtime?: number;
  children?: LogNode[];
}

type SortField = 'name' | 'mtime';
type SortOrder = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  order: SortOrder;
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
  onRegister?: (e: React.MouseEvent, projectName: string, scanId?: string) => void;
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
      <div key={node.path} className="group flex items-center min-w-0 mb-0.5 relative">
        <button
          onClick={() => onToggle(node.path)}
          className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl transition-all duration-200 text-sm text-gray-400 hover:text-gray-200 min-w-0"
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {isExpanded ?
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-white/50 transition-colors" /> :
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/50 transition-colors" />
          }

          <div className="relative">
             <div className={`absolute inset-0 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${node.isRegistered ? 'bg-primary/20' : 'bg-emerald-500/20'}`} />
             <Folder className={`w-4 h-4 shrink-0 relative z-10 ${node.isRegistered ? "text-primary dark:text-blue-400" : "text-emerald-400"}`} />
          </div>

          <span className="truncate font-medium tracking-tight" title={node.name}>{node.name}</span>

          {isRoot && node.isRegistered && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-black text-emerald-500 uppercase border border-emerald-500/20 shrink-0 ml-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <FileCheck className="w-2.5 h-2.5" />
              REG
            </div>
          )}
        </button>

        <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
           {isRoot && node.isRegistered && node.scanId && (
            <Link
              href={`/scans/${node.scanId}`}
              className="p-1.5 hover:bg-amber-500/10 text-amber-400 rounded-lg transition-all shrink-0"
              title="View Scan Detail"
            >
              <Eye className="w-4 h-4" />
            </Link>
          )}

          {isRoot && (
            <button
              onClick={(e) => onRegister?.(e, node.name, node.scanId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black rounded-lg transition-all shrink-0 ${
                node.isRegistered
                  ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                  : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              }`}
              title={node.isRegistered ? "Sync Data" : "Register Manual Findings"}
            >
              <RefreshCw className={`w-3 h-3 ${node.isRegistered ? "text-blue-400" : "text-emerald-400"}`} />
              {node.isRegistered ? "SYNC" : "REGISTER"}
            </button>
          )}

          <button
            onClick={(e) => onDelete(e, node.path, 'directory')}
            className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all shrink-0"
            title="Delete Folder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div key={node.path} className={`group flex items-center min-w-0 mb-0.5 relative transition-opacity ${isTranslating ? "opacity-60" : ""}`}>
      <button
        onClick={() => onSelect(node.path)}
        disabled={isTranslating}
        className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-[13px] min-w-0 font-medium ${
          isSelected
            ? "bg-emerald-500/20 text-white shadow-[inset_0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30"
            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
        }`}
        style={{ paddingLeft: `${level * 1.5 + 1.5}rem` }}
      >
        <FileCheck className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "text-slate-600 group-hover:text-slate-400"}`} />
        <span className="truncate" title={node.name}>{node.name}</span>
      </button>

      {/* Action Buttons Overlay */}
      <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {node.name.endsWith(".md") && !node.name.endsWith("_kr.md") && (
            <button
              onClick={(e) => onTranslate?.(e, node.path)}
              disabled={isTranslating || hasTranslation}
              className={`p-1.5 rounded-lg transition-all shrink-0 ${
                isTranslating
                  ? "text-purple-500"
                  : hasTranslation
                    ? "text-gray-400 cursor-not-allowed"
                    : "hover:bg-purple-500/10 text-purple-500"
              }`}
              title={hasTranslation ? "Korean version already exists" : "Translate to Korean"}
            >
              {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
            </button>
        )}

        <button
          onClick={(e) => onDownload(e, node.path, node.name)}
          disabled={isTranslating}
          className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-all shrink-0"
          title="Download File"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => onDelete(e, node.path, 'file')}
          disabled={isTranslating}
          className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-all shrink-0"
          title="Delete File"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
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
      <div className="flex-1 overflow-auto p-8 max-w-full min-w-0 custom-scrollbar bg-[#fdfcf6] text-gray-900 markdown-preview break-words prose prose-slate max-w-none">
        <style jsx global>{`
          .markdown-preview table {
            display: block;
            width: 100%;
            overflow-x: auto;
            border-collapse: collapse;
            margin-bottom: 1rem;
          }
          .markdown-preview pre {
            max-width: 100% !important;
            overflow-x: auto !important;
            white-space: pre-wrap !important;
            word-break: break-all !important;
          }
           .markdown-preview img {
            max-width: 100%;
            height: auto;
          }
        `}</style>
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
                      wordBreak: 'break-all',
                      overflowX: 'hidden'
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
        <code className="whitespace-pre-wrap break-all">{renderedContent}</code>
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

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'name', order: 'asc' });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean }>({ x: 0, y: 0, visible: false });

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

  // Handle outside click to close context menu
  useEffect(() => {
    const handleClick = () => setContextMenu(prev => ({ ...prev, visible: false }));
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    });
  };

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

  const handleRegister = useCallback(async (e: React.MouseEvent, projectName: string, scanId?: string) => {
    e.stopPropagation();
    const action = scanId ? "re-synchronize" : "register manual";
    if (!confirm(`Do you want to ${action} findings for '${projectName}'? This will update the Pentest History.`)) return;

    setRegistering(projectName);
    try {
      const res = await fetch("/api/reports/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, scanId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully ${scanId ? 'synchronized' : 'registered'}! ${data.vulnerabilities} vulnerabilities found.`);
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
      // Respect server-side sorting (mtime descending)
      items.forEach(node => {
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

    const sortNodes = (items: LogNode[]): LogNode[] => {
      const sortedItems = [...items].sort((a, b) => {
        // Directories always come before files
        if (a.type === "directory" && b.type === "file") return -1;
        if (a.type === "file" && b.type === "directory") return 1;

        let comparison = 0;
        if (sortConfig.field === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else {
          comparison = (a.mtime || 0) - (b.mtime || 0);
        }

        return sortConfig.order === 'asc' ? comparison : -comparison;
      });

      return sortedItems.map(item => ({
        ...item,
        children: item.children ? sortNodes(item.children) : undefined
      }));
    };

    const sortedNodes = sortNodes(nodes);
    walk(sortedNodes, 0);
    return { visibleNodes: result, allFilePaths: paths };
  }, [nodes, expandedFolders, deferredSearch, sortConfig]);

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
              className="p-2.5 rounded-xl bg-white/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all text-emerald-500 hover:text-emerald-400"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {selectedPath && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border ${
                  isEditing
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
                  : "bg-white/5 text-rose-500/80 hover:text-rose-500 border-white/10 hover:bg-rose-500/10"
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

        <div className="flex-1 grid grid-cols-[480px_minmax(0,1fr)] gap-6 min-h-0 min-w-0 overflow-hidden">
          {/* Project Tree Panel */}
          <div className="flex flex-col glass-card rounded-[2rem] border-white/5 overflow-hidden shadow-2xl relative min-w-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] pointer-events-none" />

            <div className="p-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl z-20">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-emerald-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Filter deliverables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-emerald-500/30 rounded-2xl pl-11 pr-4 py-3.5 text-sm ring-2 ring-emerald-500/20 text-white placeholder:text-gray-400 transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar z-10" onContextMenu={handleContextMenu}>
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
                    <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isEditing ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isEditing ? 'Editing' : 'Viewing'}
                    </div>
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
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

      {/* Sort Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[100] w-64 bg-white/80 dark:bg-[#1a1c1e]/90 border border-emerald-500/20 dark:border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(16,185,129,0.15)] overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in duration-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-emerald-500/10 bg-emerald-500/5">
            <span className="text-[10px] font-black text-emerald-600/60 dark:text-gray-500 uppercase tracking-widest px-2">Sort Reports By</span>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                setSortConfig({ field: 'name', order: 'asc' });
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${sortConfig.field === 'name' && sortConfig.order === 'asc' ? 'bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-600 dark:text-gray-300 hover:bg-emerald-500/5 hover:text-emerald-600'}`}
            >
              <div className="flex items-center gap-3">
                <SortAsc className="w-4 h-4" />
                Name (A-Z)
              </div>
            </button>
            <button
              onClick={() => {
                setSortConfig({ field: 'name', order: 'desc' });
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${sortConfig.field === 'name' && sortConfig.order === 'desc' ? 'bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-600 dark:text-gray-300 hover:bg-emerald-500/5 hover:text-emerald-600'}`}
            >
              <div className="flex items-center gap-3">
                <SortDesc className="w-4 h-4" />
                Name (Z-A)
              </div>
            </button>
            <div className="my-1.5 border-t border-emerald-500/5" />
            <button
              onClick={() => {
                setSortConfig({ field: 'mtime', order: 'asc' });
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${sortConfig.field === 'mtime' && sortConfig.order === 'asc' ? 'bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-600 dark:text-gray-300 hover:bg-emerald-500/5 hover:text-emerald-600'}`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
                Oldest First
              </div>
            </button>
            <button
              onClick={() => {
                setSortConfig({ field: 'mtime', order: 'desc' });
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${sortConfig.field === 'mtime' && sortConfig.order === 'desc' ? 'bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/30' : 'text-slate-600 dark:text-gray-300 hover:bg-emerald-500/5 hover:text-emerald-600'}`}
            >
              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-4 h-4" />
                Newest First
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
