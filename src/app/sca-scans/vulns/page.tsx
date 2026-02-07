"use client";

import { Navbar } from "@/components/Navbar";
import React, { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Search,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Shield,
    X,
    Hash,
    Info,
    Eye,
    Calendar,
    AlertCircle,
    AlertTriangle,
    Layers
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useVulns, type Vulnerability } from "@/hooks/useVulns";
import { useAuth } from "@/hooks/useAuth";
import { useScanDetail } from "@/hooks/useScanDetail";

const SEVERITY_RANK: Record<string, number> = {
    'CRITICAL': 0,
    'HIGH': 1,
    'MEDIUM': 2,
    'LOW': 3,
    'INFO': 4
};

const TYPE_RANK: Record<string, number> = {
    'codei': 0,
    'sqli': 1,
    'ssti': 2,
    'ssrf': 3,
    'auth': 4,
    'authz': 5,
    'pathi': 6,
    'xss': 7
};



export default function VulnerabilitiesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { authenticated, loading: authLoading } = useAuth();

    const [search, setSearch] = useState("");
    const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [copiedJson, setCopiedJson] = useState(false);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        if (!authLoading && !authenticated) {
            router.push(`/login?callback=/sca-scans/vulns`);
        }
    }, [router, authenticated, authLoading]);

    const scanId = searchParams.get("scanId");
    const { data: scanData } = useScanDetail(scanId || "");
    const [filterSeverity, setFilterSeverity] = useState<string>(searchParams.get("severity") || "ALL");

    const { data: vulnData, isLoading: vulnsLoading } = useVulns(scanId, filterSeverity, "SCA");

    const vulns = useMemo(() => vulnData?.vulnerabilities || [], [vulnData]);
    const severitySummary = vulnData?.summary || {};

    const deferredSearch = useDeferredValue(search);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setCurrentPage(1);
    };

    const handleSeverityChange = (sev: string) => {
        setFilterSeverity(sev);
        setCurrentPage(1);
    };

    const handleCopyJson = async (data: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(data);
            } else {
                // Fallback for non-secure contexts (HTTP)
                const textArea = document.createElement("textarea");
                textArea.value = data;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                } catch (err) {
                    console.error('Fallback copy failed', err);
                }
                document.body.removeChild(textArea);
            }
            setCopiedJson(true);
            setTimeout(() => setCopiedJson(false), 2000);
        } catch (err) {
            console.error("Failed to copy JSON:", err);
        }
    };



    const filteredVulns = useMemo(() => {
        return vulns
            .filter(v =>
                v.title.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                v.type.toLowerCase().includes(deferredSearch.toLowerCase()) ||
                (v.scan?.targetUrl || "").toLowerCase().includes(deferredSearch.toLowerCase()) ||
                (v.scan?.projectName || "").toLowerCase().includes(deferredSearch.toLowerCase()) ||
                v.scanId.toLowerCase().includes(deferredSearch.toLowerCase())
            )
            .sort((a, b) => {
                // 1. Severity Rank
                const sevA = SEVERITY_RANK[a.severity.toUpperCase()] ?? 99;
                const sevB = SEVERITY_RANK[b.severity.toUpperCase()] ?? 99;
                if (sevA !== sevB) return sevA - sevB;

                // 2. Type Rank (8 specific types)
                const typeA = TYPE_RANK[a.type.toLowerCase()] ?? 99;
                const typeB = TYPE_RANK[b.type.toLowerCase()] ?? 99;
                if (typeA !== typeB) return typeA - typeB;

                // 3. Title (Alphabetical)
                return a.title.localeCompare(b.title);
            });
    }, [vulns, deferredSearch]);

    const totalPages = Math.ceil(filteredVulns.length / ITEMS_PER_PAGE);
    const paginatedVulns = useMemo(() => {
        return filteredVulns.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredVulns, currentPage]);

    const loading = vulnsLoading && !vulnData;

    const getSeverityBadge = (severity: string) => {
        const base = "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border";
        switch (severity.toUpperCase()) {
            case 'CRITICAL': return <span className={`${base} bg-rose-500/10 text-rose-500 border-rose-500/20`}><ShieldAlert className="w-3 h-3" /> CRITICAL</span>;
            case 'HIGH': return <span className={`${base} bg-orange-500/10 text-orange-500 border-orange-500/20`}><AlertCircle className="w-3 h-3" /> HIGH</span>;
            case 'MEDIUM': return <span className={`${base} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`}><AlertTriangle className="w-3 h-3" /> MEDIUM</span>;
            case 'LOW': return <span className={`${base} bg-blue-500/10 text-blue-500 border-blue-500/20`}><Shield className="w-3 h-3" /> LOW</span>;
            default: return <span className={`${base} bg-gray-500/10 text-gray-500 border-gray-500/20`}><Info className="w-3 h-3" /> INFO</span>;
        }
    };

    return (
        <>
            <Navbar />
            <div className="max-w-[1600px] mx-auto px-6 py-12">
                <header className="mb-12 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-6 flex-1">
                        <Link
                            href={scanId ? `/sca-scans/${scanId}` : "/sca-scans"}
                            className="mt-1 group p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 transition-all active:scale-95 shadow-lg shadow-rose-500/5 hover:shadow-rose-500/10"
                            title={scanId ? "Back to SCA Scan Detail" : "Back to History"}
                        >
                            <ChevronLeft className="w-7 h-7 transition-transform group-hover:-translate-x-1" />
                        </Link>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3 text-primary">
                                <Shield className="w-6 h-6" />
                                <span className="text-xs font-black uppercase tracking-[0.3em]">Security Center</span>
                            </div>
                            <h1 className="text-4xl font-black text-white">
                                {scanData?.projectName || scanId || "SCA Findings"}
                            </h1>
                            <p className="text-gray-500 max-w-xl">
                                Consolidated security findings from all automated assessments.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-6 w-full xl:w-auto">
                        {/* Status Filters */}
                        <div className="flex flex-nowrap items-center gap-2 p-2 bg-white/5 border border-white/20 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar">
                            {[
                                { id: 'ALL', icon: Layers, label: 'TOTAL', color: 'blue' },
                                { id: 'CRITICAL', icon: ShieldAlert, label: 'CRITICAL', color: 'rose' },
                                { id: 'HIGH', icon: AlertCircle, label: 'HIGH', color: 'orange' },
                                { id: 'MEDIUM', icon: AlertTriangle, label: 'MEDIUM', color: 'amber' },
                                { id: 'LOW', icon: Shield, label: 'LOW', color: 'sky' }
                            ].map((s) => {
                                const Icon = s.icon;
                                const isActive = filterSeverity === s.id;

                                let count = 0;
                                if (s.id === 'ALL') {
                                    count = Object.values(severitySummary).reduce((a, b) => a + b, 0);
                                } else {
                                    count = severitySummary[s.id] || 0;
                                }

                                const colorClasses: Record<string, string> = {
                                    rose: isActive ? 'bg-rose-500 border-rose-400 text-slate-50 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'text-rose-400/70 border-rose-500/5 hover:bg-rose-500/10 hover:text-rose-400',
                                    orange: isActive ? 'bg-orange-600 border-orange-500 text-slate-50 shadow-[0_0_20px_rgba(234,88,12,0.3)]' : 'text-orange-400/70 border-orange-500/5 hover:bg-orange-500/10 hover:text-orange-400',
                                    amber: isActive ? 'bg-amber-500 border-amber-400 text-slate-50 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'text-amber-400/70 border-amber-500/5 hover:bg-amber-500/10 hover:text-amber-400',
                                    sky: isActive ? 'bg-sky-500 border-sky-400 text-slate-50 shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'text-sky-400/70 border-sky-500/5 hover:bg-sky-500/10 hover:text-sky-400',
                                    blue: isActive ? 'bg-blue-700 border-blue-600 text-slate-50 shadow-[0_0_25px_rgba(29,78,216,0.4)]' : 'text-blue-400/70 border-blue-500/5 hover:bg-blue-500/10 hover:text-blue-400',
                                };

                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSeverityChange(s.id)}
                                        className={`group relative flex items-center gap-2 px-2 py-2 rounded-[2.5rem] border transition-all duration-300 ${colorClasses[s.color]} ${isActive ? 'scale-105 z-10' : 'bg-white/[0.03] opacity-60 hover:opacity-100'} whitespace-nowrap`}
                                    >
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${isActive ? 'bg-white/20' : 'bg-white/5'}`}>
                                            <Icon className={`w-6 h-6 transition-all duration-500 ${isActive ? 'text-slate-50 scale-110 drop-shadow-md' : 'group-hover:scale-110'}`} />
                                        </div>
                                        <div className="flex items-center leading-none min-w-0 pr-3">
                                            <p className={`text-2xl font-black tracking-tight ${isActive ? 'text-slate-50' : ''}`}>
                                                {count}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full lg:w-[400px] xl:w-[450px] group flex">
                            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 group-focus-within:text-blue-300 transition-colors z-10" />
                            <input
                                type="text"
                                placeholder="Search findings..."
                                className="w-full h-full min-h-[72px] bg-white/5 border border-white/10 rounded-[2.5rem] pl-16 pr-8 text-base transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 text-white shadow-inner font-bold placeholder:text-white/20 backdrop-blur-3xl"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                    </div>
                </header>

                <div className="grid gap-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-sm font-bold text-gray-500 animate-pulse uppercase tracking-[0.2em]">Aggregating Findings...</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4">
                                <AnimatePresence mode="popLayout">
                                    {paginatedVulns.map((vuln) => (
                                        <VulnCard
                                            key={vuln.id}
                                            vuln={vuln}
                                            getSeverityBadge={getSeverityBadge}
                                            onView={() => setSelectedVuln(vuln)}
                                        />
                                    ))}
                                </AnimatePresence>

                                {filteredVulns.length === 0 && (
                                    <div className="py-24 text-center glass-card border-dashed border-white/10 rounded-2xl">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Shield className="w-8 h-8 text-gray-600" />
                                        </div>
                                        <p className="text-gray-400 font-bold text-lg">No vulnerability findings matching your filters.</p>
                                        <p className="text-sm text-gray-600 mt-2">Try adjusting your search or severity filters.</p>
                                    </div>
                                )}
                            </div>

                            {/* Pagination UI */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-3 rounded-xl glass-card border-white/10 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const pages = [];
                                            const showEllipsis = totalPages > 7;

                                            if (!showEllipsis) {
                                                // Show all pages if 7 or fewer
                                                for (let i = 1; i <= totalPages; i++) {
                                                    pages.push(i);
                                                }
                                            } else {
                                                // Always show first page
                                                pages.push(1);

                                                // Show ellipsis or pages near current
                                                if (currentPage > 3) {
                                                    pages.push('ellipsis-start');
                                                }

                                                // Show current page and neighbors
                                                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                                                    if (!pages.includes(i)) {
                                                        pages.push(i);
                                                    }
                                                }

                                                // Show ellipsis or pages before last
                                                if (currentPage < totalPages - 2) {
                                                    pages.push('ellipsis-end');
                                                }

                                                // Always show last page
                                                if (!pages.includes(totalPages)) {
                                                    pages.push(totalPages);
                                                }
                                            }

                                            return pages.map((page) => {
                                                if (typeof page === 'string') {
                                                    return <span key={page} className="text-gray-600 px-2">...</span>;
                                                }

                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`w-12 h-12 rounded-xl border font-bold transition-all ${
                                                            currentPage === page
                                                                ? "bg-primary border-primary text-white glow-primary"
                                                                : "glass-card border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            });
                                        })()}
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

            {/* Details Modal */}
            <AnimatePresence>
                {selectedVuln && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl transition-all"
                        onClick={() => setSelectedVuln(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-4xl modal-container bg-[#f0f9ff] backdrop-blur-2xl border border-blue-200 shadow-[0_32px_120px_-20px_rgba(30,58,138,0.4)] flex flex-col h-full max-h-[90vh] overflow-hidden rounded-[3rem]"
                        >
                                {/* Red Top Border - Doraemon Collar */}
                                <div className="absolute top-0 left-0 right-0 h-2 bg-[#ef4444] z-50 shadow-[0_2px_10px_rgba(239,68,68,0.3)]" />

                                {/* Header */}
                                <div className="px-12 py-10 border-b border-blue-100 bg-white/60 flex items-center justify-between relative overflow-hidden">
                                    <div className="relative z-10 flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-xl ${
                                            selectedVuln.severity === 'CRITICAL' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                                            selectedVuln.severity === 'HIGH' ? 'bg-orange-500 text-white shadow-orange-500/20' :
                                            selectedVuln.severity === 'MEDIUM' ? 'bg-amber-400 text-amber-950 shadow-amber-400/20' :
                                            'bg-blue-500 text-white shadow-blue-500/20'
                                        }`}>
                                            <ShieldAlert className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-tight">{selectedVuln.title}</h2>
                                            <div className="flex items-center gap-4 mt-2">
                                                {getSeverityBadge(selectedVuln.severity)}
                                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                                                    <Hash className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">{selectedVuln.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedVuln(null)}
                                        className="relative z-10 p-4 rounded-3xl hover:bg-rose-50 transition-all text-slate-300 hover:text-rose-500 border border-transparent hover:border-rose-100 focus:outline-none"
                                    >
                                        <X className="w-8 h-8" />
                                    </button>
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                </div>

                                <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-10">
                                    {/* Description Section */}
                                    <section className="space-y-4">
                                        <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3 ml-1">
                                            <Info className="w-4 h-4" />
                                            FINDING DESCRIPTION
                                        </h3>
                                        <div className="p-8 bg-white border border-blue-100 rounded-[2.5rem] text-slate-700 leading-relaxed text-lg shadow-sm">
                                            {selectedVuln.description || "No description available for this finding."}
                                        </div>
                                    </section>

                                    {/* Evidence Section */}
                                    {selectedVuln.evidence && (
                                        <section className="space-y-4">
                                            <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3 ml-1">
                                                <Eye className="w-4 h-4" />
                                                EVIDENCE & PAYLOAD
                                            </h3>
                                            <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-blue-200 font-mono text-[15px] text-emerald-400 overflow-x-auto break-all whitespace-pre-wrap shadow-inner leading-relaxed">
                                                {selectedVuln.evidence}
                                            </div>
                                        </section>
                                    )}

                                    {/* JSON Data Section */}
                                    <section className="space-y-4">
                                        <div className="flex items-center justify-between ml-1">
                                            <h3 className="text-[13px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3">
                                                <Hash className="w-4 h-4" />
                                                DETAILED ENGINE DATA (JSON)
                                            </h3>
                                            <AnimatePresence>
                                                {copiedJson && (
                                                    <motion.span
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100"
                                                    >
                                                        Copied to Clipboard!
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div
                                            onClick={() => handleCopyJson(JSON.stringify(JSON.parse(selectedVuln.details || "{}"), null, 2))}
                                            className="p-8 bg-slate-100 rounded-[2.5rem] border border-blue-50 font-mono text-[13px] text-slate-600 overflow-x-auto whitespace-pre shadow-inner cursor-pointer hover:bg-white hover:border-blue-200 transition-all active:scale-[0.99] group relative"
                                            title="Click to copy JSON data"
                                        >
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm text-blue-500">
                                                    <Hash className="w-4 h-4" />
                                                </div>
                                            </div>
                                            {JSON.stringify(JSON.parse(selectedVuln.details || "{}"), null, 2)}
                                        </div>
                                    </section>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                                        <div className="p-6 bg-white border border-blue-100 rounded-[2rem] shadow-sm flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
                                                <Layers className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-1">Target Project</p>
                                                <p className="text-[15px] font-bold text-slate-700 truncate">{selectedVuln.scan?.projectName || "Unknown Project"}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-white border border-blue-100 rounded-[2rem] shadow-sm flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                                <Calendar className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-1">Detection Time</p>
                                                <p className="text-[15px] font-bold text-slate-700">
                                                    {selectedVuln.createdAt ? format(new Date(selectedVuln.createdAt), 'yyyy-MM-dd HH:mm:ss') : "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-12 py-8 bg-[#ffcc00] border-t-4 border-amber-300 flex justify-end items-center relative overflow-hidden">
                                     <div className="absolute inset-0 opacity-10 pointer-events-none"
                                          style={{ backgroundImage: `radial-gradient(circle at 1.5px 1.5px, black 1.5px, transparent 0)`, backgroundSize: '15px 15px' }} />
                                    <button
                                        onClick={() => setSelectedVuln(null)}
                                        className="relative z-10 px-12 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] text-amber-950 bg-white/40 hover:bg-white/60 transition-all border-2 border-amber-950/10 shadow-xl active:scale-95"
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </motion.div>
                    </div>
                )}
            </AnimatePresence>


            <style jsx global>{`
                .glass-card {
                    @apply bg-white/[0.01] backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-2xl;
                }
            `}</style>
        </>
    );
}

type VulnCardProps = {
    vuln: Vulnerability;
    getSeverityBadge: (severity: string) => React.ReactNode;
    onView: () => void;
};

const VulnCard = ({ vuln, getSeverityBadge, onView }: VulnCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            onClick={onView}
            className="glass-card p-6 border-white/5 hover:border-primary/30 transition-all hover:bg-white/5 group cursor-pointer"
        >
            <div className="flex items-start justify-between gap-6">
                {/* Left Section: Severity + Title + Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 pt-1">
                            {getSeverityBadge(vuln.severity)}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <h3 className="font-black text-lg text-white mb-1 group-hover:text-primary transition-colors">
                                {vuln.title}
                            </h3>
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-black flex items-center gap-1.5">
                                <Hash className="w-3 h-3 text-primary/50" /> {vuln.type}
                            </span>
                        </div>
                    </div>

                    {/* Target & Scan Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Project Name</span>
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
                                <Layers className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                                <Link
                                    href={`/sca-scans/${vuln.scanId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="truncate hover:text-primary hover:underline transition-colors"
                                >
                                    {vuln.scan?.projectName || "Unknown Project"}
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Scan ID</span>
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
                                <Hash className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                                <Link
                                    href={`/sca-scans/${vuln.scanId}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="truncate hover:text-primary hover:underline transition-colors"
                                >
                                    {vuln.scanId}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Date + Action */}
                <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Detected</span>
                        <div className="flex items-center gap-2 text-sm text-gray-400 font-bold font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(vuln.createdAt), "MMM d, HH:mm")}
                        </div>
                    </div>

                    <button
                        onClick={onView}
                        className="p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:text-white hover:bg-rose-500/90 transition-all border border-rose-500/20 hover:border-rose-500/50 group/btn"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
