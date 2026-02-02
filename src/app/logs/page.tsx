"use client";

import { Navbar } from "@/components/Navbar";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
  Edit3,
  Eye,
  Terminal,
  Trash2,
  Download,
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
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

const syntaxTheme = oneLight as unknown as { [key: string]: CSSProperties };

const TreeItem = React.memo(({
  node,
  level,
  onToggle,
  onSelect,
  onDelete,
  onDownload,
  isSelected,
  isExpanded
}: {
  node: LogNode;
  level: number;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onDelete: (e: React.MouseEvent, path: string, type: string) => void;
  onDownload: (e: React.MouseEvent, path: string, name: string) => void;
  isSelected: boolean;
  isExpanded: boolean;
}) => {
  const isDirectory = node.type === "directory";

  if (isDirectory) {
    return (
      <div key={node.path} className="group flex items-center min-w-0 mb-0.5 relative">
        <button
          onClick={() => onToggle(node.path)}
          className="flex-1 flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-xl transition-all duration-200 text-sm text-gray-400 hover:text-gray-200 min-w-0 group/btn"
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {isExpanded ?
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-white/50 group-hover/btn:text-white transition-colors" /> :
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/50 group-hover/btn:text-white transition-colors" />
          }
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-sm rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity" />
            <Folder className="w-4 h-4 text-blue-400 shrink-0 relative z-10" />
          </div>
          <span className="truncate font-medium tracking-tight" title={node.name}>{node.name}</span>
        </button>

        <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
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
    <div key={node.path} className="group flex items-center min-w-0 mb-0.5 relative">
      <button
        onClick={() => onSelect(node.path)}
        className={`flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200 text-[13px] min-w-0 font-medium ${
          isSelected
            ? "bg-blue-500/20 text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30"
            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
        }`}
        style={{ paddingLeft: `${level * 1.5 + 1.5}rem` }}
      >
        <FileCode className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-slate-600 group-hover:text-slate-400"}`} />
        <span className="truncate" title={node.name}>{node.name}</span>
      </button>

      <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <button
          onClick={(e) => onDownload(e, node.path, node.name)}
          className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-lg transition-all shrink-0"
          title="Download File"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => onDelete(e, node.path, 'file')}
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

const LogViewer = ({
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
  const highlightLogs = (text: string) => {
    if (!text) return "";

    // First, escape all HTML tags by using React's default behavior or manual escaping
    // Here we use manual escaping to be compatible with the regex replacement below
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const largeFileThreshold = parseInt(process.env.NEXT_PUBLIC_LARGE_FILE_THRESHOLD_BYTES || "800000");
    if (text.length > largeFileThreshold) return escaped;

    return escaped
      .replace(/&quot;type&quot;\s*:\s*&quot;agent_start&quot;/g, '<span class="text-rose-600 font-bold">$&</span>')
      .replace(/&quot;type&quot;\s*:\s*&quot;agent_end&quot;/g, '<span class="text-rose-600 font-bold">$&</span>')
      .replace(/&quot;agentName&quot;\s*:\s*&quot;[^&]*&quot;/g, '<span class="text-rose-600 font-bold">$&</span>')
      .replace(/&quot;type&quot;\s*:\s*&quot;llm_response&quot;/g, '<span class="text-blue-600 font-bold">$&</span>')
      .replace(/&quot;type&quot;\s*:\s*&quot;tool_start&quot;/g, '<span class="text-purple-600 font-bold">$&</span>')
      .replace(/&quot;type&quot;\s*:\s*&quot;tool_end&quot;/g, '<span class="text-purple-600 font-bold">$&</span>')
      .replace(/&quot;toolName&quot;\s*:\s*&quot;[^&]*&quot;/g, '<span class="text-purple-600 font-bold">$&</span>')
      .replace(/&quot;result&quot;\s*:/g, '<span class="text-purple-600 font-bold">$&</span>')
      .replace(/&quot;turn&quot;\s*:\s*\d+/g, '<span class="text-rose-600 font-bold">$&</span>');
  };

  const largeFileThreshold = parseInt(process.env.NEXT_PUBLIC_LARGE_FILE_THRESHOLD_BYTES || "800000");
  const isTooLarge = content.length > largeFileThreshold; // 800KB threshold to be safe

  const renderedContent = useMemo(() => {
    if (!content || isTooLarge) return "";
    if (ext === 'json') {
      try {
        const formatted = JSON.stringify(JSON.parse(content), null, 2);
        return highlightLogs(formatted);
      } catch {
        return highlightLogs(content);
      }
    }
    return highlightLogs(content);
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
    return (
      <div className="flex-1 overflow-auto p-8 max-w-full min-w-0 custom-scrollbar bg-[#fdfcf6] text-gray-900 markdown-preview break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ inline, className, children, ...props }: MarkdownCodeProps) {
              const { style: _style, ...rest } = props;
              void _style;
              const match = /language-(\w+)/.exec(className || '');
              if (!inline && match) {
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
                    {...rest}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              }
              return (
                <code
                  className={`${className} ${!inline ? 'block p-6 whitespace-pre-wrap break-all bg-[#f9fafb] rounded-xl border border-[#e5e7eb]' : ''}`}
                  {...props}
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
    <pre className="flex-1 overflow-auto p-8 font-mono text-sm text-gray-900 bg-[#fdfcf6] custom-scrollbar whitespace-pre-wrap break-all min-h-0 min-w-0 max-w-full">
      {isTooLarge ? (
        <code className="whitespace-pre-wrap break-all">{content}</code>
      ) : (
        <code className="whitespace-pre-wrap break-all" dangerouslySetInnerHTML={{ __html: renderedContent }} />
      )}
    </pre>
  );
};

export default function LogsPage() {
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = React.useDeferredValue(searchQuery);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'mtime', order: 'desc' });
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean }>({ x: 0, y: 0, visible: false });

  const fetchList = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/logs/list");
      const data = await res.json();

      if (res.status === 401) {
        router.push("/login?callback=/logs");
        return;
      }

      if (data.files) setNodes(data.files);
    } catch (err) {
      console.error("Fetch list error:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchList();
    const intervalMs = parseInt(process.env.NEXT_PUBLIC_LOG_REFRESH_INTERVAL_MS || "10000");
    const interval = setInterval(() => {
      fetchList(true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [fetchList]);

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
        const res = await fetch(`/api/logs/file?path=${encodeURIComponent(selectedPath)}`);
        const data = await res.json();
        if (data.content !== undefined) {
          setContent(data.content);
          setEditContent(data.content);
        }
      } catch (err) {
        console.error("Read file error:", err);
      }
    };

    fetchFile();
  }, [selectedPath]);

  const handleFileSelect = React.useCallback((path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("path", path);
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const handleSave = React.useCallback(async () => {
    if (!selectedPath) return;
    setSaving(true);
    try {
      const res = await fetch("/api/logs/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selectedPath, content: editContent }),
      });
      if (res.ok) {
        setContent(editContent);
        setIsEditing(false);
        alert("Saved successfully");
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

  const handleDelete = React.useCallback(async (e: React.MouseEvent, path: string, type: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete this ${type}? ${type === 'directory' ? 'All contents will be removed.' : ''}`)) return;

    try {
      const res = await fetch(`/api/logs/file?path=${encodeURIComponent(path)}`, {
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
      const res = await fetch(`/api/logs/file?path=${encodeURIComponent(path)}`);
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

  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const visibleNodes = useMemo(() => {
    const result: { node: LogNode, level: number, isExpanded: boolean }[] = [];
    const searchLower = deferredSearch.toLowerCase();

    const walk = (items: LogNode[], level: number) => {
      // Respect server-side sorting (mtime descending)
      items.forEach(node => {
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
    return result;
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
              <Terminal className="w-8 h-8 text-primary" />
              {t("logs")}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Review and manage system audit logs from the engine.</p>
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
                {isEditing ? "VIEW MODE" : "Edit Log"}
              </button>
            )}

            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all shadow-lg glow-primary"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {t("save_changes")}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0 min-w-0">
          <div className="w-[480px] flex flex-col glass-card rounded-[2rem] border-white/5 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none" />

            <div className="p-6 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl z-10">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-blue-500/30 rounded-2xl pl-11 pr-4 py-3.5 text-sm ring-2 ring-blue-500/20 text-white placeholder:text-gray-400 transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar z-10" onContextMenu={handleContextMenu}>
              {loading && nodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-medium">Scanning audit-logs...</span>
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
                      onToggle={toggleFolder}
                      onSelect={handleFileSelect}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col glass-card rounded-2xl border-white/5 overflow-hidden relative min-w-0">
            {!selectedPath ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                  <FileText className="w-10 h-10 opacity-20" />
                </div>
                <p className="font-medium">Select a log file to view</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                <div className="px-6 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-4 h-4 text-primary" />
                    <span className="text-sm font-mono text-gray-300 truncate max-w-md">{selectedPath}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isEditing ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
                      {isEditing ? 'Editing' : 'Viewing'}
                    </div>
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
                      {selectedPath.split('.').pop() || 'log'}
                    </div>
                  </div>
                </div>
                <LogViewer
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
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-bold">Saving changes...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sort Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-[100] w-64 bg-white/80 dark:bg-[#1a1c1e]/90 border border-blue-500/20 dark:border-white/10 rounded-[2rem] shadow-[0_20px_50px_rgba(59,130,246,0.15)] overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in duration-200"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-blue-500/10 bg-blue-500/5">
            <span className="text-[10px] font-black text-blue-600/60 dark:text-gray-500 uppercase tracking-widest px-2">Sort Logs By</span>
          </div>
          <div className="p-2">
            <button
              onClick={() => {
                setSortConfig({ field: 'name', order: 'asc' });
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${sortConfig.field === 'name' && sortConfig.order === 'asc' ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-gray-300 hover:bg-blue-500/5 hover:text-blue-600'}`}
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${sortConfig.field === 'name' && sortConfig.order === 'desc' ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-gray-300 hover:bg-blue-500/5 hover:text-blue-600'}`}
            >
              <div className="flex items-center gap-3">
                <SortDesc className="w-4 h-4" />
                Name (Z-A)
              </div>
            </button>
            <div className="my-1.5 border-t border-blue-500/5" />
            <button
              onClick={() => {
                setSortConfig({ field: 'mtime', order: 'asc' });
                setContextMenu(prev => ({ ...prev, visible: false }));
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${sortConfig.field === 'mtime' && sortConfig.order === 'asc' ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-gray-300 hover:bg-blue-500/5 hover:text-blue-600'}`}
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${sortConfig.field === 'mtime' && sortConfig.order === 'desc' ? 'bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/30' : 'text-slate-600 dark:text-gray-300 hover:bg-blue-500/5 hover:text-blue-600'}`}
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
