"use client";

import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Trash2, Loader2,
    Calendar, ChevronLeft, ChevronRight,
    CheckCircle2, AlertCircle, X, FileSearch, BarChart3
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { FileText } from "lucide-react";
import { AnalysisViewModal } from "@/components/AnalysisViewModal";
import { AnalyzerRunModal } from "@/components/AnalyzerRunModal";
import { DocumentationModal } from "@/components/DocumentationModal";

export default function AnalyzerPage() {
    const router = useRouter();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<string[]>([]);
    const [search, setSearch] = useState("");

    // Modal States
    const [showRunModal, setShowRunModal] = useState(false);

    // Help/Documentation State
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpContent, setHelpContent] = useState("");
    const [helpLoading, setHelpLoading] = useState(false);

    // Analysis View State
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingResult, setViewingResult] = useState<{name: string, content: string} | null>(null);
    const [resultContent, setResultContent] = useState("");
    const [resultLoading, setResultLoading] = useState(false);

    // UI Feedback
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // This is currently a placeholder logic, as the backend is not yet implemented.
    const fetchResults = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/configs?folder=analyzer-result&type=txt");
            if (res.status === 401) {
                router.push("/login?callback=/projects/analyzer");
                return;
            }
            const data = await res.json();
            setResults(data.configs || []);
        } catch (err) {
            console.error("Failed to load results:", err);
            setError("Failed to load analysis results.");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    const fetchDocs = async () => {
        if (helpContent) {
            setShowHelpModal(true);
            return;
        }
        setHelpLoading(true);
        setShowHelpModal(true);
        try {
            const res = await fetch("/api/docs/project-analyzer");
            const data = await res.json();
            if (data.content) {
                setHelpContent(data.content);
            } else {
                setHelpContent("Failed to load documentation.");
            }
        } catch (err) {
            console.error("Failed to fetch docs:", err);
            setHelpContent("Error loading documentation.");
        } finally {
            setHelpLoading(false);
        }
    };

    const handleStartAnalysis = (project: { name: string; path: string }) => {
        setSuccess(`Analysis started for project "${project.name}". The report will appear in the list shortly.`);

        // Refresh after 5 seconds to give the analyzer time to create the file
        setTimeout(() => {
            fetchResults();
        }, 5000);
    };

    const handleViewResult = async (filename: string) => {
        setResultLoading(true);
        setShowViewModal(true);
        try {
            const res = await fetch(`/api/configs?folder=analyzer-result&filename=${encodeURIComponent(filename)}`);
            const data = await res.json();
            if (res.ok) {
                setViewingResult({
                    name: filename,
                    content: data.content
                });
                setResultContent(data.content);
            } else {
                setError(data.error || "Failed to load result content.");
                setShowViewModal(false);
            }
        } catch (err) {
            console.error("Load result error:", err);
            setError("Connection error.");
            setShowViewModal(false);
        } finally {
            setResultLoading(false);
        }
    };

    const handleSaveResult = async (newContent: string) => {
        if (!viewingResult) return;
        try {
            const res = await fetch("/api/configs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: viewingResult.name,
                    content: newContent,
                    folder: "analyzer-result"
                }),
            });
            if (res.ok) {
                setViewingResult({
                    ...viewingResult,
                    content: newContent
                });
                setResultContent(newContent);
                setSuccess(`Analysis result "${viewingResult.name}" updated.`);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to save changes.");
            }
        } catch (err) {
            console.error("Save result error:", err);
            setError("Connection error.");
        }
    };

    const handleDeleteResult = async (filename: string) => {
        if (!confirm(`Are you sure you want to delete analysis result "${filename}"?`)) return;

        try {
            const res = await fetch(`/api/configs?folder=analyzer-result&filename=${encodeURIComponent(filename)}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setSuccess(`Analysis result "${filename}" deleted.`);
                fetchResults();
            } else {
                const data = await res.json();
                setError(data.error || "Deletion failed.");
            }
        } catch (err) {
            console.error("Delete result error:", err);
            setError("Connection error.");
        }
    };

    const filteredResults = results.filter(r =>
        r.toLowerCase().includes(search.toLowerCase())
    );

    const ITEMS_PER_PAGE = 7;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE);
    const paginatedResults = filteredResults.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <>
            <Navbar />
            <div className="max-w-[1600px] mx-auto px-6 py-12">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-primary">
                            <BarChart3 className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">{t("project_analyzer") || "Project Analyzer"}</span>
                        </div>
                        <h1 className="text-4xl font-black text-white">{t("project_analyzer") || "Project Analyzer"}</h1>
                        <p className="text-gray-500 max-w-xl">
                            {t("analyzer_desc") || "Deeply analyze your project source code for security patterns and structural enhancements."}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[300px] relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                            <input
                                type="text"
                                placeholder="Search results..."
                                className="w-full bg-input-bg border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-inner font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={fetchDocs}
                                className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-primary transition-all shadow-lg active:scale-95"
                                title="Documentation"
                            >
                                <FileText className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setShowRunModal(true)}
                                className="w-full md:w-auto px-10 py-4 btn-accent rounded-2xl font-black flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
                            >
                                <FileSearch className="w-5 h-5" />
                                {t("run_analyzer") || "Run Analyzer"}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="grid gap-6">
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-sm font-bold flex items-center gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {success}
                                <button onClick={() => setSuccess(null)} className="ml-auto p-1 hover:bg-emerald-500/20 rounded-lg"><X className="w-4 h-4" /></button>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5" />
                                {error}
                                <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-500/20 rounded-lg"><X className="w-4 h-4" /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-[0.2em]">Analyzing Project...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4">
                                <AnimatePresence mode="popLayout">
                                    {paginatedResults.map((filename) => (
                                        <AnalysisCard
                                            key={filename}
                                            filename={filename}
                                            onView={() => handleViewResult(filename)}
                                            onDelete={() => handleDeleteResult(filename)}
                                        />
                                    ))}
                                </AnimatePresence>

                                {filteredResults.length === 0 && (
                                    <div className="py-24 text-center glass-card border-dashed border-white/10 rounded-2xl">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <BarChart3 className="w-8 h-8 text-gray-600" />
                                        </div>
                                        <p className="text-gray-400 font-bold text-lg">No analysis results found.</p>
                                        <p className="text-sm text-gray-600 mt-2">Start a new analysis to see results here.</p>
                                    </div>
                                )}
                            </div>

                            {totalPages >= 1 && filteredResults.length > 0 && (
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
                        </>
                    )}
                </div>
            </div>

            <AnalyzerRunModal
                isOpen={showRunModal}
                onClose={() => setShowRunModal(false)}
                onStart={handleStartAnalysis}
            />

            <AnalysisViewModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setViewingResult(null);
                    setResultContent("");
                }}
                title={viewingResult ? viewingResult.name.replace('.txt', '') : "Project Analyzer"}
                content={resultContent}
                isLoading={resultLoading}
                onSave={handleSaveResult}
            />

            <DocumentationModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
                title="Project Analyzer Manual"
                content={helpContent}
                isLoading={helpLoading}
            />

            <style jsx global>{`
                .glass-card {
                    @apply bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[1.5rem] shadow-2xl;
                }
            `}</style>
        </>
    );
}

type AnalysisCardProps = {
    filename: string;
    onView: () => void;
    onDelete: () => void;
};

const AnalysisCard = ({ filename, onView, onDelete }: AnalysisCardProps) => {
    const displayName = filename.replace('.txt', '');

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={onView}
            className="glass-card p-6 border-white/5 hover:border-primary/30 transition-all hover:bg-white/5 group cursor-pointer"
        >
            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                        <BarChart3 className="w-7 h-7" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-black text-lg text-white mb-1 truncate">{displayName}</span>
                        <span className="text-[10px] text-gray-600 uppercase tracking-widest font-black flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-primary/50" /> Text Report
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(); }}
                        className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:text-white hover:bg-blue-500/90 transition-all border border-blue-500/20 hover:border-blue-500/50"
                        title="View Report"
                    >
                        <FileSearch className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:text-white hover:bg-rose-500/90 transition-all border border-rose-500/20 hover:border-rose-500/50"
                        title="Delete Result"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
