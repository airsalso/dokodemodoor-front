"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Github, Briefcase, HardDrive, Globe, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ProjectCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (project: { localPath: string; name: string }) => void;
}

export function ProjectCreateModal({ isOpen, onClose, onSuccess }: ProjectCreateModalProps) {
    const { t } = useLanguage();
    const [registrationMode, setRegistrationMode] = useState<'git' | 'manual'>('git');
    const [newRepoUrl, setNewRepoUrl] = useState("");
    const [manualPath, setManualPath] = useState("");
    const [newName, setNewName] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deriveProjectName = (urlOrPath: string, mode: 'git' | 'manual') => {
        if (!urlOrPath) return "";
        try {
            if (mode === 'git') {
                const cleanUrl = urlOrPath.trim().replace(/\/+$/, "");
                const name = cleanUrl.replace(/\.git$/, "").split("/").pop();
                return name || "";
            } else {
                const name = urlOrPath.replace(/[\\/]$/, "").split(/[\\/]/).pop();
                return name || "";
            }
        } catch { return ""; }
    };

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            const finalName = newName.trim() || deriveProjectName(
                registrationMode === 'git' ? newRepoUrl : manualPath,
                registrationMode
            );

            const body = registrationMode === 'git'
                ? { repoUrl: newRepoUrl.trim(), name: finalName, isManual: false }
                : { localPath: manualPath.trim(), name: finalName, isManual: true };

            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (res.ok) {
                setNewRepoUrl("");
                setManualPath("");
                setNewName("");
                onSuccess({ localPath: data.localPath, name: finalName });
                onClose();
            } else {
                const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to register project.");
                setError(errorMessage);
            }
        } catch (err) {
            console.error("Register project error:", err);
            setError("Connection error while registering project.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl cursor-pointer"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xl modal-container bg-card-muted relative border border-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden z-10"
                    >
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                         <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground">{t("register_project")}</h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                        {registrationMode === 'git' ? "Clone from External Repository" : "Direct Local path registration"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 rounded-2xl hover:bg-white/5 transition-all text-muted-foreground hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="px-8 pt-6">
                            <div className="flex p-1.5 bg-black/40 rounded-[20px] border border-white/5 gap-1.5 font-sans overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setRegistrationMode('git')}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                                        registrationMode === 'git'
                                            ? "btn-accent shadow-xl shadow-amber-500/20"
                                            : "text-muted-foreground hover:bg-white/5"
                                    }`}
                                >
                                    <div className={`transition-all duration-500 ${registrationMode === 'git' ? 'scale-110 text-foreground' : 'group-hover:scale-110 text-emerald-400'}`}>
                                        <Github className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[14px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${registrationMode === 'git' ? 'text-foreground' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {t("git_clone")}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegistrationMode('manual')}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                                        registrationMode === 'manual'
                                            ? "btn-secondary shadow-xl shadow-rose-500/20"
                                            : "text-muted-foreground hover:bg-white/5"
                                    }`}
                                >
                                    <div className={`transition-all duration-500 ${registrationMode === 'manual' ? 'scale-110 text-foreground' : 'group-hover:scale-110 text-blue-400'}`}>
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[14px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${registrationMode === 'manual' ? 'text-foreground' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {t("manual_registration")}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddProject} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Briefcase className="w-3 h-3" /> {t("project_name")}
                                    <span className="text-gray-700 italic lowercase font-normal">
                                        (optional, defaults to {deriveProjectName(registrationMode === 'git' ? newRepoUrl : manualPath, registrationMode) || "folder name"})
                                    </span>
                                </label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder={deriveProjectName(registrationMode === 'git' ? newRepoUrl : manualPath, registrationMode) || "My Project Name"}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {registrationMode === 'git' ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Globe className="w-3 h-3" /> {t("repo_url")}
                                    </label>
                                    <div className="relative group">
                                        <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            type="url"
                                            value={newRepoUrl}
                                            onChange={(e) => setNewRepoUrl(e.target.value)}
                                            placeholder="https://github.com/username/project.git"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <HardDrive className="w-3 h-3" /> {t("local_path")}
                                    </label>
                                    <div className="relative group">
                                        <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            type="text"
                                            value={manualPath}
                                            onChange={(e) => setManualPath(e.target.value)}
                                            placeholder="/var/www/my-project"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium font-mono text-sm"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-700 mt-1 italic">
                                        {t("local_path_desc")}
                                    </p>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={actionLoading || (registrationMode === 'git' ? !newRepoUrl : !manualPath)}
                                    className="w-full py-5 btn-accent rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-6 h-6" />
                                            {registrationMode === 'git' ? t("git_clone") : t("manual_registration")}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Add missing icon
import { AlertCircle } from "lucide-react";
