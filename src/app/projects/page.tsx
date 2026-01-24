"use client";

import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase, Plus, Github, Search, Trash2, Loader2,
    ExternalLink, Folder, Calendar, ChevronLeft, ChevronRight,
    CheckCircle2, AlertCircle, X, Terminal, Globe, HardDrive, Settings
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

type Project = {
    id: string;
    name: string;
    repoUrl?: string | null;
    localPath: string;
    createdAt: string;
};

type ProjectCardProps = {
    project: Project;
    onEdit: () => void;
    onDelete: () => void;
    onStartScan: () => void;
    actionLoading: boolean;
};

export default function ProjectsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();
    const { authenticated, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [pages, setPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
    const [search, setSearch] = useState(searchParams.get("search") || "");

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [registrationMode, setRegistrationMode] = useState<'git' | 'manual'>('git');
    const [newRepoUrl, setNewRepoUrl] = useState("");
    const [manualPath, setManualPath] = useState("");
    const [newName, setNewName] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    // Edit States
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [editName, setEditName] = useState("");
    const [editPath, setEditPath] = useState("");

    const [success, setSuccess] = useState<string | null>(null);
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

    const fetchProjects = useCallback(async () => {
        try {
            // Initial loading is true by default.
            // We never call setLoading(true) again to provide smooth silent updates (matching Scans page).
            const res = await fetch(`/api/projects?page=${currentPage}&limit=5&search=${encodeURIComponent(search)}`);

            if (res.status === 401) {
                router.push("/login?callback=/projects");
                return;
            }

            const data = await res.json();
            setProjects(data.projects || []);
            setPages(data.pages || 1);
        } catch (err) {
            console.error("Failed to fetch projects:", err);
            setError("Failed to load projects.");
        } finally {
            setLoading(false);
        }
    }, [currentPage, router, search]);

    // Initial Load & Page Sync (Matching Scans page dependencies)
    useEffect(() => {
        if (!authLoading) {
            if (!authenticated) {
                router.push("/login?callback=/projects");
            } else {
                fetchProjects();
            }
        }
    }, [authenticated, authLoading, currentPage, fetchProjects, router]);

    // Handle Search Debounce (Matching Scans page precisely)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (authenticated) {
                fetchProjects();
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [search, authenticated, fetchProjects]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleAddProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);
        setSuccess(null);

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
                setSuccess(registrationMode === 'git' ? "Project successfully registered and cloned." : "Project successfully registered from local path.");
                setNewRepoUrl("");
                setManualPath("");
                setNewName("");
                setShowAddModal(false);
                fetchProjects();
            } else {
                const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to register project.");
                setError(errorMessage);
            }
        } catch (err) {
            console.error("Add project error:", err);
            setError("Connection error.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteProject = async (id: string, name: string) => {
        const deleteFiles = confirm(`Are you sure you want to delete project "${name}"?\nSelect OK to delete the database entry AND the local source code files.`);

        if (!deleteFiles) return;

        setActionLoading(true);
        try {
            const res = await fetch("/api/projects", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, deleteFiles: true }),
            });

            if (res.ok) {
                setSuccess(`Project "${name}" deleted.`);
                fetchProjects();
            } else {
                const data = await res.json();
                setError(data.error || "Deletion failed.");
            }
        } catch (err) {
            console.error("Delete project error:", err);
            setError("Connection error.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;

        setActionLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const fallbackName = deriveProjectName(
                editPath,
                (selectedProject.repoUrl && selectedProject.repoUrl !== "") ? 'git' : 'manual'
            );

            const res = await fetch("/api/projects", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedProject.id,
                    name: (editName.trim() || fallbackName),
                    localPath: editPath.trim(),
                }),
            });

            if (res.ok) {
                setSuccess("Project updated successfully.");
                setShowEditModal(false);
                fetchProjects();
            } else {
                const data = await res.json();
                setError(data.error || "Failed to update project.");
            }
        } catch (err) {
            console.error("Update project error:", err);
            setError("Connection error.");
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (project: Project) => {
        setSelectedProject(project);
        setEditName(project.name);
        setEditPath(project.localPath);
        setShowEditModal(true);
    };

    return (
        <>
            <Navbar />
            <div className="max-w-[1600px] mx-auto px-6 py-12">
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-primary">
                            <Briefcase className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Workspace</span>
                        </div>
                        <h1 className="text-4xl font-black text-white">Project Management</h1>
                        <p className="text-gray-500 max-w-xl">
                            Manage your local source code repositories. Register new projects by cloning from GitHub.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative min-w-[300px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                className="w-full bg-[#0a0c14] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-base transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 text-white shadow-inner font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full md:w-auto px-8 py-4 bg-primary text-white rounded-xl font-black flex items-center justify-center gap-3 glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 whitespace-nowrap"
                        >
                            <Plus className="w-5 h-5" />
                            {t("new_project")}
                        </button>
                    </div>
                </header>

                <div className="grid gap-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-[0.2em]">Loading Repositories...</p>
                        </div>
                    ) : (
                        <>
                            {/* Status Feedback */}
                            <AnimatePresence>
                                {success && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-sm font-bold flex items-center gap-3 mb-4"
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
                                        className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm font-bold flex items-center gap-3 mb-4"
                                    >
                                        <AlertCircle className="w-5 h-5" />
                                        {error}
                                        <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-500/20 rounded-lg"><X className="w-4 h-4" /></button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid gap-4">
                                <AnimatePresence mode="popLayout">
                                    {projects.map((p) => (
                                        <ProjectCard
                                            key={p.id}
                                            project={p}
                                            onEdit={() => openEditModal(p)}
                                            onDelete={() => handleDeleteProject(p.id, p.name)}
                                            onStartScan={() => router.push(`/scans/new?targetPath=${encodeURIComponent(p.localPath)}`)}
                                            actionLoading={actionLoading}
                                        />
                                    ))}
                                </AnimatePresence>

                                {projects.length === 0 && (
                                    <div className="py-24 text-center glass-card border-dashed border-white/10 rounded-2xl">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Briefcase className="w-8 h-8 text-gray-600" />
                                        </div>
                                        <p className="text-gray-400 font-bold text-lg">No projects registered yet.</p>
                                        <p className="text-sm text-gray-600 mt-2">Click &quot;New Project&quot; to clone your first repository.</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {pages > 1 && projects.length > 0 && (
                                <div className="mt-12 flex items-center justify-center gap-4">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className="p-3 rounded-xl glass-card border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {[...Array(pages)].map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`w-12 h-12 rounded-xl border font-bold transition-all ${
                                                    currentPage === i + 1
                                                        ? "bg-primary border-primary text-white glow-primary"
                                                        : "glass-card border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        disabled={currentPage === pages}
                                        onClick={() => handlePageChange(currentPage + 1)}
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

            {/* Registration Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl cursor-pointer"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="w-full max-w-xl glass-card relative bg-[#0a0c14] border-primary/20 shadow-2xl overflow-hidden z-10"
                        >
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                             <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">{t("register_project")}</h2>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{registrationMode === 'git' ? "Clone from External Repository" : "Direct Local path registration"}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"><X /></button>
                            </div>

                            <div className="px-8 pt-6">
                                <div className="flex p-1.5 bg-black/40 rounded-[20px] border border-white/5 gap-1.5 font-sans">
                                    <button
                                        type="button"
                                        onClick={() => setRegistrationMode('git')}
                                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                                            registrationMode === 'git'
                                                ? "bg-primary text-white shadow-2xl shadow-primary/40 scale-[1.02]"
                                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                        }`}
                                    >
                                        <div className={`transition-all duration-500 ${registrationMode === 'git' ? 'scale-110 text-white' : 'group-hover:scale-110 text-[#86efac]'}`}>
                                            <Github className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[14px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${registrationMode === 'git' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                            {t("git_clone")}
                                        </span>
                                        {registrationMode === 'git' && (
                                            <motion.div
                                                initial={{ x: '-100%', opacity: 0 }}
                                                animate={{ x: '100%', opacity: 1 }}
                                                className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0"
                                                transition={{ x: { duration: 1.5, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.3 } }}
                                            />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRegistrationMode('manual')}
                                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                                            registrationMode === 'manual'
                                                ? "bg-primary text-white shadow-2xl shadow-primary/40 scale-[1.02]"
                                                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                        }`}
                                    >
                                        <div className={`transition-all duration-500 ${registrationMode === 'manual' ? 'scale-110 text-white' : 'group-hover:scale-110 text-[#93c5fd]'}`}>
                                            <Briefcase className="w-5 h-5" />
                                        </div>
                                        <span className={`text-[14px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${registrationMode === 'manual' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                            {t("manual_registration")}
                                        </span>
                                        {registrationMode === 'manual' && (
                                            <motion.div
                                                initial={{ x: '-100%', opacity: 0 }}
                                                animate={{ x: '100%', opacity: 1 }}
                                                className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0"
                                                transition={{ x: { duration: 1.5, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.3 } }}
                                            />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleAddProject} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <Briefcase className="w-3 h-3" /> {t("project_name")} <span className="text-gray-700 italic lowercase font-normal">(optional, defaults to {deriveProjectName(registrationMode === 'git' ? newRepoUrl : manualPath, registrationMode) || "folder name"})</span>
                                    </label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder={deriveProjectName(registrationMode === 'git' ? newRepoUrl : manualPath, registrationMode) || "My Project Name"}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                {registrationMode === 'git' ? (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <Globe className="w-3 h-3" /> {t("repo_url")}
                                        </label>
                                        <div className="relative group">
                                            <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                type="url"
                                                value={newRepoUrl}
                                                onChange={(e) => setNewRepoUrl(e.target.value)}
                                                placeholder="https://github.com/username/project.git"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                            <HardDrive className="w-3 h-3" /> {t("local_path")}
                                        </label>
                                        <div className="relative group">
                                            <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                            <input
                                                required
                                                type="text"
                                                value={manualPath}
                                                onChange={(e) => setManualPath(e.target.value)}
                                                placeholder="/var/www/my-project"
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium font-mono text-sm"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-600 mt-1 italic">
                                            {t("local_path_desc")}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={actionLoading || (registrationMode === 'git' ? !newRepoUrl : !manualPath)}
                                        className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg glow-primary flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                {registrationMode === 'git' ? "Cloning Repository..." : "Validating Path..."}
                                            </>
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

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowEditModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl cursor-pointer"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="w-full max-w-xl glass-card relative bg-[#0a0c14] border-primary/20 shadow-2xl overflow-hidden z-10"
                        >
                             <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Settings className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black">{t("edit_project")}</h2>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Update project details</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"><X /></button>
                            </div>

                            <form onSubmit={handleEditProject} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <Briefcase className="w-3 h-3" /> {t("project_name")} <span className="text-gray-700 italic lowercase font-normal">(optional, defaults to {deriveProjectName(editPath, (selectedProject?.repoUrl ? 'git' : 'manual')) || "folder name"})</span>
                                    </label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            placeholder={deriveProjectName(editPath, (selectedProject?.repoUrl ? 'git' : 'manual')) || "Project Name"}
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                        <HardDrive className="w-3 h-3" /> {t("local_path")}
                                    </label>
                                    <div className="relative group">
                                        <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                                        <input
                                            required
                                            type="text"
                                            readOnly={!!selectedProject?.repoUrl && selectedProject?.repoUrl !== ""}
                                            disabled={!!selectedProject?.repoUrl && selectedProject?.repoUrl !== ""}
                                            value={editPath}
                                            onChange={(e) => setEditPath(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium font-mono text-sm ${
                                                (!!selectedProject?.repoUrl && selectedProject?.repoUrl !== "") ? "opacity-50 cursor-not-allowed bg-white/[0.02]" : ""
                                            }`}
                                        />
                                    </div>
                                    {(!!selectedProject?.repoUrl && selectedProject?.repoUrl !== "") && (
                                        <p className="text-[10px] text-primary/60 mt-1 italic">
                                            Path editing is disabled for GitHub cloned projects.
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg glow-primary flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                    >
                                        {actionLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : t("save_changes")}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .glass-card {
                    @apply bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-2xl;
                }
                .glow-primary {
                    box-shadow: 0 8px 32px -8px rgba(var(--primary-rgb), 0.5);
                }
            `}</style>
        </>
    );
}

const ProjectCard = ({ project, onEdit, onDelete, onStartScan, actionLoading }: ProjectCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="glass-card p-6 border-white/5 hover:border-primary/30 transition-all hover:bg-white/5 group"
        >
            <div className="flex items-start justify-between gap-6">
                {/* Left Section: Project Info + Repository Path */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                            {project.repoUrl ? <Github className="w-7 h-7" /> : <HardDrive className="w-7 h-7" />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-black text-lg text-white mb-1">{project.name}</span>
                            {project.repoUrl ? (
                                <a
                                    href={project.repoUrl}
                                    target="_blank"
                                    className="text-xs text-gray-500 hover:text-primary flex items-center gap-1.5 transition-colors font-medium truncate"
                                >
                                    <Globe className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{project.repoUrl.replace(/^https?:\/\//, '')}</span>
                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                            ) : (
                                <span className="text-[10px] text-gray-600 uppercase tracking-widest font-black flex items-center gap-1.5">
                                    <HardDrive className="w-3 h-3 text-primary/50" /> Local Storage
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Repository Path */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Repository Path</span>
                        <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
                            <Folder className="w-3.5 h-3.5 text-emerald-500/50 flex-shrink-0" />
                            <span className="truncate">{project.localPath}</span>
                        </div>
                    </div>
                </div>

                {/* Right Section: Date + Actions */}
                <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Registered</span>
                        <div className="flex items-center gap-2 text-sm text-gray-400 font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(project.createdAt), "MMM d, yyyy")}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onStartScan}
                            className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 hover:text-white hover:bg-emerald-500/90 transition-all border border-emerald-500/20 hover:border-emerald-500/50"
                            title="Start Pentest"
                        >
                            <Terminal className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onEdit}
                            className="p-3 rounded-xl bg-blue-500/10 text-blue-500 hover:text-white hover:bg-blue-500/90 transition-all border border-blue-500/20 hover:border-blue-500/50"
                            title="Edit Project"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:text-white hover:bg-rose-500/90 transition-all border border-rose-500/20 hover:border-rose-500/50"
                            title="Delete Project"
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
