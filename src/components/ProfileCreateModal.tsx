"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Edit2, X, Save, Github, Globe, User,
    Lock, Key, Briefcase, ChevronDown, Loader2
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

interface ProfileCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (filename?: string) => void;
    initialData?: {
        name: string;
        content: string;
    };
    isEditing?: boolean;
}

export function ProfileCreateModal({
    isOpen,
    onClose,
    onSuccess,
    initialData,
    isEditing: initialIsEditing = false
}: ProfileCreateModalProps) {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(initialIsEditing);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [newProfile, setNewProfile] = useState({
        name: initialData?.name || "",
        content: initialData?.content || ""
    });

    const [projects, setProjects] = useState<Project[]>([]);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [generatorData, setGeneratorData] = useState({
        projectPath: "",
        projectName: "",
        loginUrl: "",
        username: "",
        password: "",
        otp: ""
    });

    useEffect(() => {
        if (isOpen) {
            setIsEditing(initialIsEditing);
            if (initialData) {
                setNewProfile(initialData);
            } else {
                setNewProfile({ name: "", content: "" });
                setGeneratorData({
                    projectPath: "",
                    projectName: "",
                    loginUrl: "",
                    username: "",
                    password: "",
                    otp: ""
                });
            }
            if (!initialIsEditing) {
                fetchProjects();
            }
        }
    }, [isOpen, initialIsEditing, initialData]);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects?limit=1000");
            const data = await res.json();
            setProjects(data.projects || data.data || []);
        } catch (err) {
            console.error("Failed to fetch projects:", err);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            if (isEditing) {
                if (!newProfile.content) {
                    setError("YAML content is required.");
                    setActionLoading(false);
                    return;
                }
                const res = await fetch("/api/configs", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newProfile),
                });
                if (res.ok) {
                    const data = await res.json();
                    onSuccess(data.filename || newProfile.name);
                    onClose();
                } else {
                    const data = await res.json();
                    setError(data.error || "Failed to update profile.");
                }
            } else {
                if (!generatorData.projectPath || !generatorData.loginUrl || !generatorData.username || !generatorData.password) {
                    setError("Please fill in all required fields.");
                    setActionLoading(false);
                    return;
                }

                const res = await fetch("/api/configs/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(generatorData),
                });

                if (res.ok) {
                    const data = await res.json();
                    onSuccess(data.filename);
                    onClose();
                } else {
                    const data = await res.json();
                    setError(data.error || "Failed to generate profile.");
                }
            }
        } catch (err) {
            console.error("Save profile error:", err);
            setError("Connection error.");
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
                            className="w-full max-w-2xl bg-[#f0f9ff] border border-blue-200 shadow-[0_32px_120px_-20px_rgba(30,58,138,0.3)] overflow-hidden rounded-[3rem] cursor-default flex flex-col relative"
                        >
                            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden relative">
                                {/* Header */}
                                <div className="p-8 border-b border-blue-50/50 bg-white/40 backdrop-blur-sm flex items-center justify-between relative">
                                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-400 via-rose-500 to-rose-400" />

                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(59,130,246,0.4)] border border-white/20">
                                            {isEditing ? <Edit2 className="w-5 h-5 text-white/90" /> : <Plus className="w-5 h-5 stroke-[2.5]" />}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">
                                                {isEditing ? "Edit Profile" : "Create Profile"}
                                            </h2>
                                            <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-[0.15em] mt-0.5">
                                                {isEditing ? "Manual YAML Editor" : "Automated Profile Generator"}
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
                                <div className="p-8 space-y-7 overflow-y-auto custom-scrollbar bg-gradient-to-b from-white/40 to-blue-50/30 flex-1">
                                    {error && (
                                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold">
                                            {error}
                                        </div>
                                    )}

                                    {isEditing ? (
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">
                                                    {t("profile_name")}
                                                </label>
                                                <input
                                                    required
                                                    type="text"
                                                    value={newProfile.name}
                                                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                                                    placeholder="custom-profile.yaml"
                                                    disabled={initialIsEditing}
                                                    className={`w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-mono font-bold text-sm ${initialIsEditing ? 'opacity-50 cursor-not-allowed bg-slate-50/50' : ''}`}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1">
                                                    {t("yaml_content")}
                                                </label>
                                                <textarea
                                                    required
                                                    value={newProfile.content}
                                                    onChange={(e) => setNewProfile({ ...newProfile, content: e.target.value })}
                                                    className="w-full bg-white/80 border border-slate-200 rounded-2xl p-5 font-mono text-[13px] h-[320px] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none custom-scrollbar font-medium text-slate-600 leading-relaxed"
                                                    spellCheck={false}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-7">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1 flex items-center gap-2">
                                                    <Briefcase className="w-3.5 h-3.5" /> Target Project
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProjectModal(true)}
                                                    className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-4 text-left flex items-center justify-between hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={generatorData.projectName ? "text-slate-700 font-bold text-sm truncate" : "text-slate-300 font-bold text-sm"}>
                                                            {generatorData.projectName || "Select a project..."}
                                                        </span>
                                                        {generatorData.projectPath && (
                                                            <span className="text-[10px] text-blue-400/60 font-mono mt-0.5 truncate font-medium">
                                                                {generatorData.projectPath}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                                </button>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1 flex items-center gap-2">
                                                    <Globe className="w-3.5 h-3.5" /> Login URL
                                                </label>
                                                <input
                                                    required
                                                    type="url"
                                                    value={generatorData.loginUrl}
                                                    onChange={(e) => setGeneratorData({...generatorData, loginUrl: e.target.value})}
                                                    placeholder="http://127.0.0.1:3000/#/login"
                                                    className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-sm placeholder:text-slate-200"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1 flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5" /> ID
                                                    </label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={generatorData.username}
                                                        onChange={(e) => setGeneratorData({...generatorData, username: e.target.value})}
                                                        placeholder="user"
                                                        className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-sm placeholder:text-slate-200"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1 flex items-center gap-2">
                                                        <Lock className="w-3.5 h-3.5" /> Password
                                                    </label>
                                                    <input
                                                        required
                                                        type="password"
                                                        value={generatorData.password}
                                                        onChange={(e) => setGeneratorData({...generatorData, password: e.target.value})}
                                                        placeholder="••••••••"
                                                        className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-sm placeholder:text-slate-200"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 ml-1 flex items-center gap-2">
                                                    <Key className="w-3.5 h-3.5" /> OTP <span className="text-[9px] text-slate-300 font-medium normal-case ml-1 italic">(Optional)</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={generatorData.otp}
                                                    onChange={(e) => setGeneratorData({...generatorData, otp: e.target.value})}
                                                    placeholder="000000"
                                                    className="w-full bg-white/80 border border-slate-200 rounded-2xl px-5 py-3.5 text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold text-sm placeholder:text-slate-200"
                                                />
                                            </div>
                                        </div>
                                    )}
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
                                        disabled={actionLoading}
                                        className="relative z-10 flex-[2] py-4 px-8 rounded-[1.5rem] text-[15px] font-black uppercase tracking-[0.15em] text-white bg-[#0070f3] hover:bg-[#0060df] transition-all shadow-[0_10px_25px_-5px_rgba(0,112,243,0.4)] flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 group border-t border-white/20"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-white/80" />
                                        ) : (
                                            isEditing ? <Save className="w-5 h-5 text-white/90 group-hover:scale-110 transition-transform" /> : <Plus className="w-5 h-5 text-white stroke-[3.5] group-hover:scale-110 transition-transform" />
                                        )}
                                        <span>{isEditing ? t("save_config") : "Create"}</span>
                                    </button>
                                </div>

                                {/* Mode Toggle (for flexibility if needed, but per request it's the "Create Profile" popup) */}
                                {!initialIsEditing && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(!isEditing);
                                            setError(null);
                                        }}
                                        className="absolute bottom-2 right-1/2 translate-x-1/2 text-[9px] font-bold text-blue-400 hover:text-blue-600 uppercase tracking-tighter opacity-50 transition-opacity hover:opacity-100 z-20"
                                    >
                                        Switch to {isEditing ? "Generator" : "Manual Editor"}
                                    </button>
                                )}
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SearchableCollectionModal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                title="Select Project"
                description="Choose the target project for profile generation"
                placeholder="Search projects..."
                items={projects.map(p => ({
                    id: p.localPath,
                    title: p.name,
                    subtitle: p.repoUrl || "Local Project",
                    metadata: p.localPath,
                    icon: p.type === 'GIT' ? <Github className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />
                }))}
                selectedValue={generatorData.projectPath}
                onSelect={(path) => {
                    const project = projects.find(p => p.localPath === path);
                    if (project) {
                        setGeneratorData({
                            ...generatorData,
                            projectPath: path,
                            projectName: project.name
                        });
                    }
                }}
            />
        </>
    );
}
