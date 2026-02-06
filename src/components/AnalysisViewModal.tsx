"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Loader2, Copy, Check, Edit2, Save } from "lucide-react";

interface AnalysisViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    isLoading: boolean;
    onSave?: (newContent: string) => Promise<void>;
}

export const AnalysisViewModal = ({
    isOpen,
    onClose,
    title,
    content: initialContent,
    isLoading,
    onSave
}: AnalysisViewModalProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentContent, setCurrentContent] = useState(initialContent);
    const [copied, setCopied] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentContent(initialContent);
            setIsEditing(false);
        }
    }, [isOpen, initialContent]);

    const handleCopy = () => {
        if (isEditing) return;
        navigator.clipboard.writeText(currentContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!onSave) return;
        setSaveLoading(true);
        try {
            await onSave(currentContent);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save:", err);
        } finally {
            setSaveLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
                >
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="w-full max-w-6xl h-[90vh] bg-[#f0f9ff] border border-blue-200 shadow-[0_32px_120px_-20px_rgba(30,58,138,0.3)] overflow-hidden rounded-[3rem] cursor-default flex flex-col relative"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-blue-50/50 bg-white/40 backdrop-blur-sm flex items-center justify-between relative">
                            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400" />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-lg border border-white/20">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight uppercase">
                                        {title}
                                    </h2>
                                    <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-[0.15em] mt-0.5">
                                        {isEditing ? "Editor Mode" : "Viewer Mode"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {onSave && (
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border ${
                                            isEditing
                                                ? "bg-amber-100 border-amber-200 text-amber-600 shadow-sm"
                                                : "bg-white/80 border-slate-200 text-slate-500 hover:bg-white hover:border-blue-300 hover:text-blue-500"
                                        }`}
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        {isEditing ? "View Mode" : "Edit Report"}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2.5 rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-hidden p-8 bg-gradient-to-b from-white/40 to-blue-50/20 relative">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Preparing Content...</p>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col gap-4">
                                    {!isEditing && (
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                                Click code block to copy
                                            </span>
                                            {copied && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"
                                                >
                                                    <Check className="w-3 h-3" /> Copied!
                                                </motion.span>
                                            )}
                                        </div>
                                    )}

                                    {isEditing ? (
                                        <textarea
                                            value={currentContent}
                                            onChange={(e) => setCurrentContent(e.target.value)}
                                            spellCheck={false}
                                            className="w-full flex-1 bg-white border-2 border-blue-100 rounded-[2rem] p-8 font-mono text-[14px] text-slate-600 focus:outline-none focus:border-blue-400 focus:ring-8 focus:ring-blue-500/5 transition-all resize-none custom-scrollbar leading-relaxed shadow-inner"
                                        />
                                    ) : (
                                        <div
                                            onClick={handleCopy}
                                            className="w-full flex-1 bg-slate-900 border border-slate-800 rounded-[2rem] p-8 font-mono text-[14px] text-blue-200/90 overflow-auto custom-dark-scrollbar cursor-copy active:scale-[0.998] transition-all group relative"
                                        >
                                            <pre className="whitespace-pre-wrap break-all leading-relaxed">
                                                {currentContent || "No content available."}
                                            </pre>
                                            <div className="absolute top-6 right-6 p-4 rounded-2xl bg-white/5 border border-white/5 opacity-0 group-hover:opacity-100 transition-all">
                                                <Copy className="w-5 h-5 text-white/40" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-10 bg-white/40 border-t border-blue-50/50 flex justify-between items-center relative overflow-hidden">
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Status</span>
                                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Ready for External Use
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-10 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
                                >
                                    Close
                                </button>
                                {isEditing && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saveLoading}
                                        className="px-12 py-4 bg-[#0070f3] hover:bg-[#0060df] text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_10px_25px_-5px_rgba(0,112,243,0.4)] flex items-center gap-3 disabled:opacity-50"
                                    >
                                        {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save Changes
                                    </button>
                                )}
                            </div>
                        </div>

                        <style jsx global>{`
                            .custom-dark-scrollbar::-webkit-scrollbar {
                                width: 8px;
                            }
                            .custom-dark-scrollbar::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .custom-dark-scrollbar::-webkit-scrollbar-thumb {
                                background: rgba(255, 255, 255, 0.1);
                                border-radius: 20px;
                            }
                            .custom-dark-scrollbar::-webkit-scrollbar-thumb:hover {
                                background: rgba(255, 255, 255, 0.2);
                            }
                        `}</style>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
