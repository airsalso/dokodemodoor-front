"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Github, Briefcase, ChevronDown, Loader2, Play, BarChart3
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SearchableCollectionModal } from "./SearchableCollectionModal";

interface Project {
    id: string;
    name: string;
    repoUrl?: string | null;
    localPath: string;
    type: string;
}

interface AnalyzerRunModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (project: { name: string; path: string }) => void;
}

export function AnalyzerRunModal({
    isOpen,
    onClose,
    onStart
}: AnalyzerRunModalProps) {
    const { t } = useLanguage();
    const [actionLoading, setActionLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [selectedProject, setSelectedProject] = useState<{ name: string; path: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            setSelectedProject(null);
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects?limit=1000");
            const data = await res.json();
            setProjects(data.projects || data.data || []);
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        }
    };

    const handleRun = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;

        setActionLoading(true);
        try {
            const res = await fetch("/api/analyzer/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectPath: selectedProject.path }),
            });

            if (res.ok) {
                onStart(selectedProject);
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || "Failed to start analysis.");
            }
        } catch (err) {
            console.error("Analyzer run error:", err);
            alert("Connection error.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div
                        onClick={onClose}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md cursor-pointer"
                    >
                        <motion.div
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="w-full max-w-xl bg-[#f0f9ff] border border-blue-200 shadow-[0_32px_120px_-20px_rgba(30,58,138,0.3)] overflow-hidden rounded-[3rem] cursor-default flex flex-col relative"
                        >
                            <form onSubmit={handleRun} className="flex flex-col flex-1 overflow-hidden relative">
                                {/* Header */}
                                <div className="p-8 border-b border-blue-50/50 bg-white/40 backdrop-blur-sm flex items-center justify-between relative">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400" />

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(59,130,246,0.4)] border border-white/20">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                                                {t("run_analyzer") || "Run Analyzer"}
                                            </h2>
                                            <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-[0.15em] mt-0.5">
                                                Extract application context from source code
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-8 space-y-7 bg-gradient-to-b from-white/40 to-blue-50/30 flex-1">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1 flex items-center gap-2">
                                            <Briefcase className="w-3.5 h-3.5" /> Target Project
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowProjectPicker(true)}
                                            className="w-full bg-white/80 border border-slate-200 rounded-2xl px-6 py-5 text-left flex items-center justify-between hover:border-blue-200 hover:bg-white transition-all group shadow-sm"
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className={selectedProject ? "text-slate-800 font-black text-base truncate" : "text-slate-300 font-bold text-base"}>
                                                    {selectedProject?.name || "Select a project..."}
                                                </span>
                                                {selectedProject && (
                                                    <span className="text-[10px] text-blue-400/60 font-mono mt-1 truncate font-medium uppercase tracking-tighter">
                                                        {selectedProject.path}
                                                    </span>
                                                )}
                                            </div>
                                            <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                        </button>
                                        <p className="text-[10px] text-slate-400 ml-1 italic">
                                            Generate application context and structural clues for black-box pentesting tools.
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-10 bg-[#ffcc00] border-t-4 border-amber-300 relative overflow-hidden flex flex-col md:flex-row gap-4 items-center">
                                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                                         style={{ backgroundImage: `radial-gradient(circle at 1.5px 1.5px, black 1.5px, transparent 0)`, backgroundSize: '15px 15px' }} />

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="relative z-10 flex-1 py-4 px-8 rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.2em] text-amber-950 bg-white/40 hover:bg-white/60 transition-all border-2 border-amber-950/10 shadow-lg active:scale-95"
                                    >
                                        {t("cancel")}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || !selectedProject}
                                        className="relative z-10 flex-[2] py-4 px-8 rounded-[1.5rem] text-[15px] font-black uppercase tracking-[0.15em] text-white bg-[#0070f3] hover:bg-[#0060df] transition-all shadow-[0_10px_25px_-5px_rgba(0,112,243,0.4)] flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 group border-t border-white/20"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                                        ) : (
                                            <Play className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform" />
                                        )}
                                        <span>{t("run_analyzer") || "Run Analyzer"}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SearchableCollectionModal
                isOpen={showProjectPicker}
                onClose={() => setShowProjectPicker(false)}
                title="Select Project"
                description="Choose the target project for analysis"
                placeholder="Search projects..."
                items={projects.map(p => ({
                    id: p.localPath,
                    title: p.name,
                    subtitle: p.repoUrl || "Local Project",
                    metadata: p.localPath,
                    icon: p.type === 'GIT' ? <Github className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />
                }))}
                selectedValue={selectedProject?.path || ""}
                onSelect={(path) => {
                    const project = projects.find(p => p.localPath === path);
                    if (project) {
                        setSelectedProject({
                            path: path,
                            name: project.name
                        });
                    }
                }}
            />
        </>
    );
}
