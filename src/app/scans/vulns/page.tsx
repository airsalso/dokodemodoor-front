"use client";

import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Search,
    AlertCircle, AlertTriangle, Info, ShieldAlert,
    ExternalLink, Calendar, Hash, Loader2, X, Eye,
    ChevronLeft, ChevronRight, Layers
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";

type Vulnerability = {
    id: string;
    title: string;
    type: string;
    severity: string;
    description?: string | null;
    evidence?: string | null;
    details?: string | null;
    createdAt: string;
    scanId: string;
    scan?: {
        targetUrl?: string | null;
        startTime?: string | Date | null;
    } | null;
};

export default function VulnerabilitiesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [vulns, setVulns] = useState<Vulnerability[]>([]);
    const [search, setSearch] = useState("");
    const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<string>(searchParams.get("severity") || "ALL");
    const [severitySummary, setSeveritySummary] = useState<Record<string, number>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const scanId = searchParams.get("scanId");

    const fetchVulns = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/api/vulns?limit=500`;
            if (scanId) url += `&scanId=${scanId}`;
            if (filterSeverity !== "ALL") url += `&severity=${filterSeverity}`;

            const res = await fetch(url);
            if (res.status === 401) {
                router.push("/login?callback=/scans/vulns");
                return;
            }
            const data = await res.json();
            setVulns(data.vulns || []);
            if (data.summary) {
                setSeveritySummary(data.summary);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [scanId, filterSeverity, router]);

    useEffect(() => {
        fetchVulns();
    }, [fetchVulns]);

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterSeverity]);

    const filteredVulns = vulns.filter(v =>
        v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.type.toLowerCase().includes(search.toLowerCase()) ||
        (v.scan?.targetUrl || "").toLowerCase().includes(search.toLowerCase()) ||
        v.scanId.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredVulns.length / ITEMS_PER_PAGE);
    const paginatedVulns = filteredVulns.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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
                <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-primary">
                            <Shield className="w-6 h-6" />
                            <span className="text-xs font-black uppercase tracking-[0.3em]">Security Center</span>
                        </div>
                        <h1 className="text-4xl font-black text-white">
                            {scanId ? `${scanId}` : "Vulnerability Findings"}
                        </h1>
                        <p className="text-gray-500 max-w-xl">
                            Consolidated security findings from all automated assessments.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-6">
                        <div className="flex items-center gap-2 p-2 bg-black/40 border border-white/10 rounded-[28px] backdrop-blur-xl shadow-2xl">
                            {[
                                { id: 'ALL', icon: Layers, label: 'ALL', color: 'gray' },
                                { id: 'CRITICAL', icon: ShieldAlert, label: 'CRITICAL', color: 'rose' },
                                { id: 'HIGH', icon: AlertCircle, label: 'HIGH', color: 'orange' },
                                { id: 'MEDIUM', icon: AlertTriangle, label: 'MEDIUM', color: 'yellow' },
                                { id: 'LOW', icon: Shield, label: 'LOW', color: 'blue' }
                            ].map((s) => {
                                const Icon = s.icon;
                                const isActive = filterSeverity === s.id;

                                let count = 0;
                                if (s.id === 'ALL') {
                                    count = Object.values(severitySummary).reduce((a, b) => a + b, 0);
                                } else {
                                    count = severitySummary[s.id] || 0;
                                }

                                const colorMap: Record<string, string> = {
                                    rose: isActive ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'text-rose-500 hover:bg-rose-500/10',
                                    orange: isActive ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'text-orange-500 hover:bg-orange-500/10',
                                    yellow: isActive ? 'bg-yellow-500 text-white shadow-xl shadow-yellow-500/20' : 'text-yellow-500 hover:bg-yellow-500/10',
                                    blue: isActive ? 'bg-blue-500 text-white shadow-xl shadow-blue-500/20' : 'text-blue-500 hover:bg-blue-500/10',
                                    gray: isActive ? 'bg-white/20 text-white shadow-xl shadow-white/10' : 'text-gray-400 hover:bg-white/5',
                                };

                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setFilterSeverity(s.id)}
                                        className={`group relative flex items-center gap-3 px-6 py-4 rounded-[22px] transition-all duration-300 ${colorMap[s.color]} ${isActive ? 'scale-105 z-10' : 'opacity-60 hover:opacity-100'}`}
                                    >
                                        <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                                        <div className="flex flex-col items-start leading-tight min-w-0">
                                            <span className="text-[12px] font-black uppercase tracking-tight truncate">{s.label}</span>
                                            <span className={`text-[10px] font-bold whitespace-nowrap ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                                                {count} FOUND
                                            </span>
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeFilter"
                                                className="absolute inset-0 rounded-[22px] bg-white/10"
                                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="relative w-full lg:w-[400px]">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                            <input
                                type="text"
                                placeholder="Search by type or metadata..."
                                className="w-full h-[88px] bg-black/40 border border-white/10 rounded-[28px] pl-16 pr-6 text-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 text-white shadow-inner font-medium backdrop-blur-xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="max-w-[95vw] min-w-[600px] w-fit glass-card relative bg-[#0a0c14] border-primary/20 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                        selectedVuln.severity === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                        selectedVuln.severity === 'HIGH' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                                        'bg-primary/10 border-primary/20 text-primary'
                                    }`}>
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black">{selectedVuln.title}</h2>
                                        <div className="flex items-center gap-3 mt-1">
                                            {getSeverityBadge(selectedVuln.severity)}
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">{selectedVuln.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedVuln(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"><X /></button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                                <section className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" />
                                        Description
                                    </h3>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-gray-300 leading-relaxed">
                                        {selectedVuln.description || "No description available."}
                                    </div>
                                </section>

                                {selectedVuln.evidence && (
                                    <section className="space-y-3">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <Eye className="w-3 h-3" />
                                            Evidence & Payload
                                        </h3>
                                        <div className="p-6 bg-black/40 rounded-2xl border border-white/10 font-mono text-sm text-emerald-400 overflow-x-auto break-all whitespace-pre-wrap">
                                            {selectedVuln.evidence}
                                        </div>
                                    </section>
                                )}

                                <section className="space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                        <Hash className="w-3 h-3" />
                                        Full JSON Data
                                    </h3>
                                    <div className="p-6 bg-black/40 rounded-2xl border border-white/10 font-mono text-sm text-gray-300 overflow-x-auto whitespace-pre">
                                        {JSON.stringify(JSON.parse(selectedVuln.details || "{}"), null, 2)}
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-4">
                                     <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Target Scan URL</p>
                                        <p className="text-sm font-bold text-gray-300 truncate">{selectedVuln.scan?.targetUrl}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Detection Time</p>
                                        <p className="text-sm font-bold text-gray-300">{format(new Date(selectedVuln.createdAt), 'yyyy-MM-dd HH:mm:ss')}</p>
                                    </div>
                                </div>
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
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Target URL</span>
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
                                <ExternalLink className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                                <span className="truncate">{vuln.scan?.targetUrl || "Unknown Target"}</span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Scan ID</span>
                            <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
                                <Hash className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
                                <span className="truncate">{vuln.scanId}</span>
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
