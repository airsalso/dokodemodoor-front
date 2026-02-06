"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Globe, HardDrive, FileCode, Play, ChevronLeft, Loader2, AlertTriangle, Plus, Github, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { SearchableCollectionModal } from "@/components/SearchableCollectionModal";
import { DocumentationModal } from "@/components/DocumentationModal";
import { ProfileCreateModal } from "@/components/ProfileCreateModal";
import { ProjectCreateModal } from "@/components/ProjectCreateModal";

type Project = {
  id: string;
  name: string;
  repoUrl?: string | null;
  localPath: string;
};

export default function NewScan() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, authenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configs, setConfigs] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    targetUrl: "",
    sourcePath: "",
    config: "",
  });

  // Project Modal States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showConfigPicker, setShowConfigPicker] = useState(false);

  // New Profile Modal States
  const [showNewModal, setShowNewModal] = useState(false);

  // Documentation State
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [docContent, setDocContent] = useState("");
  const [docsLoading, setDocsLoading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (authLoading) return;

    if (!authenticated) {
      router.push("/login?callback=/scans/new");
      return;
    }

    if (user?.role === 'USER') {
      setError("Permission Denied: General users are restricted from executing new pentests. Please contact an administrator.");
      return;
    }

    async function fetchData() {
      try {
        const [configsRes, projectsRes] = await Promise.all([
          fetch("/api/configs?folder=profile&type=yaml"),
          fetch("/api/projects?limit=1000")
        ]);

        const [configsData, projectsData] = await Promise.all([
          configsRes.json().catch(() => ({})),
          projectsRes.json().catch(() => ({}))
        ]);

        const rawConfigs = configsData.configs || configsData.data || [];
        const rawProjects = projectsData.projects || projectsData.data || [];

        setConfigs(rawConfigs);
        setProjects(rawProjects);

        const targetPath = searchParams.get("targetPath");
        if (targetPath) {
          const selected = rawProjects.find((p: Project) => p.localPath === targetPath);
          setFormData(prev => ({
            ...prev,
            sourcePath: targetPath || "",
            targetUrl: selected?.repoUrl || prev.targetUrl || ""
          }));
        }
      } catch (err) {
        console.error("Initialization failed", err);
      }
    }
    fetchData();
  }, [router, searchParams, authenticated, authLoading, user]);


  const fetchConfigs = async (selectNew?: string) => {
    try {
      const res = await fetch("/api/configs?folder=profile&type=yaml");
      const data = await res.json();
      setConfigs(data.configs || []);
      if (selectNew) {
        setFormData(prev => ({ ...prev, config: selectNew }));
      }
    } catch (err) {
      console.error("Failed to fetch configs", err);
    }
  };

  const fetchProjects = async (selectNewPath?: string) => {
    try {
      const res = await fetch("/api/projects?limit=1000");
      const data = await res.json();
      setProjects(data.projects || []);
      if (selectNewPath) {
        const selected = data.projects?.find((p: Project) => p.localPath === selectNewPath);
        if (selected) {
           setFormData(prev => ({
             ...prev,
             sourcePath: selected.localPath,
             targetUrl: selected.repoUrl || prev.targetUrl || ""
           }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const handleAddProjectSuccess = (project: { localPath: string; name: string }) => {
    fetchProjects(project.localPath);
  };

  const handleSaveConfig = async (filename?: string) => {
    if (filename) {
      await fetchConfigs(filename);
    }
  };

  const fetchDocs = async () => {
    if (docContent) {
      setShowDocsModal(true);
      return;
    }
    setDocsLoading(true);
    setShowDocsModal(true);
    try {
      const res = await fetch("/api/docs/profile-generator");
      const data = await res.json();
      if (data.content) {
        setDocContent(data.content);
      } else {
        setDocContent("Failed to load documentation.");
      }
    } catch (err) {
      console.error("Failed to fetch docs:", err);
      setDocContent("Error loading documentation.");
    } finally {
      setDocsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/scan/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.scanId) {
        router.push(`/scans/${data.scanId}`);
      } else if (data.error) {
        setError(data.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to start scan", err);
      setError("Failed to connect to the engine API.");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-20 w-full relative">
        <div className="absolute top-0 left-1/2 -z-10 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />



        <div className="mb-12 flex items-start justify-between gap-12">
          <div className="flex items-start gap-6 flex-1">
            <Link
              href="/scans"
              className="mt-1 group p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 transition-all active:scale-95 shadow-lg shadow-rose-500/5 hover:shadow-rose-500/10"
              title={t('back to history') || 'Back to History'}
            >
              <ChevronLeft className="w-7 h-7 transition-transform group-hover:-translate-x-1" />
            </Link>
            <div className="space-y-4 min-w-0">
              <h1 className="text-5xl font-black text-foreground leading-none">Start New Pentest</h1>
              <p className="text-gray-400 max-w-xl font-medium text-lg leading-relaxed">
                Configure your targets and parameters for an automated security assessment.
              </p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-shrink-0"
          >
            <Link href="/" className="group relative block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all duration-700 scale-50" />
              <Logo className="w-40 h-40 relative group-hover:scale-110 transition-transform duration-700 ease-in-out" />
            </Link>
          </motion.div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
          <div className="glass-card !overflow-visible p-8 space-y-8">
            {/* Target URL */}
            <div className="space-y-3">
              <label className="text-sm font-bold flex items-center gap-2 text-gray-300">
                <Globe className="w-4 h-4 text-primary" />
                Target Web Application URL
              </label>
              <input
                type="url"
                required
                value={formData.targetUrl || ""}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                placeholder={process.env.NEXT_PUBLIC_DEFAULT_TARGET_URL || "http://localhost:3000"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
              />
              <p className="text-xs text-gray-500">The live URL of the application to test.</p>
            </div>

            {/* Project Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold flex items-center gap-2 text-gray-300">
                  <HardDrive className="w-4 h-4 text-accent" />
                  Target Project (Source Code)
                </label>
                <button
                  type="button"
                  onClick={() => setShowProjectModal(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-accent/80 flex items-center gap-1.5 transition-colors bg-accent/5 px-3 py-1.5 rounded-lg border border-accent/20"
                >
                  <Plus className="w-3 h-3" />
                  New Project
                </button>
              </div>
              <div
                onClick={() => setShowProjectPicker(true)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.08] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <HardDrive className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-foreground font-black text-lg truncate">
                      {projects.find(p => p.localPath === formData.sourcePath)?.name || "Select a Project"}
                    </div>
                    <div className="text-gray-500 text-xs font-mono truncate max-w-[400px]">
                      {formData.sourcePath || "No project selected currently"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-3 py-2 rounded-lg group-hover:text-white group-hover:bg-white/10 transition-all">
                    Change
                  </div>
                  <ChevronLeft className="w-5 h-5 text-gray-600 rotate-180 group-hover:text-accent transition-colors" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Choose a registered project to scan.</p>
            </div>

            {/* Config Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold flex items-center gap-2 text-gray-300">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  {t("project_profiles")}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchDocs}
                    className="p-1.5 bg-emerald-400/5 border border-emerald-400/20 rounded-lg text-emerald-400 hover:text-emerald-300 transition-all active:scale-95"
                    title="Documentation"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewModal(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors bg-emerald-400/5 px-3 py-1.5 rounded-lg border border-emerald-400/20"
                  >
                    <Plus className="w-3 h-3" />
                    New Profile
                  </button>
                </div>
              </div>
              <div
                onClick={() => setShowConfigPicker(true)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.08] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <FileCode className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-foreground font-black text-lg truncate">
                      {formData.config || "Select a Profile"}
                    </div>
                    <div className="text-gray-500 text-xs font-mono truncate">
                      {formData.config ? "Active configuration profile for this scan" : "No profile selected"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-3 py-2 rounded-lg group-hover:text-white group-hover:bg-white/10 transition-all">
                    Change
                  </div>
                  <ChevronLeft className="w-5 h-5 text-gray-600 rotate-180 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Select the scan ruleset and AI parameters.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-accent py-6 rounded-2xl font-black text-2xl flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                Initializing Engine...
              </>
            ) : (
              <>
                <Play className="w-8 h-8 fill-current" />
                Execute Pentest
              </>
            )}
          </button>
        </form>
      </div>

      <ProfileCreateModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={handleSaveConfig}
      />

      <ProjectCreateModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={handleAddProjectSuccess}
      />
      <SearchableCollectionModal
        isOpen={showProjectPicker}
        onClose={() => setShowProjectPicker(false)}
        title="Select Target Project"
        description="Choose a registered manual project or cloned repository to analyze."
        items={projects.map(p => ({
          id: p.localPath || "",
          title: p.name || p.localPath || "Unnamed Project",
          subtitle: p.localPath || "",
          metadata: p.repoUrl || "Local Path Registration",
          icon: p.repoUrl ? <Github className="w-6 h-6" /> : <HardDrive className="w-6 h-6" />
        }))}
        selectedValue={formData.sourcePath}
        onSelect={(val) => {
          const selectedProject = projects.find(p => p.localPath === val);
          setFormData({
            ...formData,
            sourcePath: val,
            targetUrl: selectedProject?.repoUrl || formData.targetUrl || "",
            config: "" // Reset profile when project changes
          });
        }}
        placeholder="Search projects by name or path..."
      />

      <SearchableCollectionModal
        isOpen={showConfigPicker}
        onClose={() => setShowConfigPicker(false)}
        title="Configuration Profile"
        description="Select the ruleset and AI agent configurations for this security scan."
        items={(() => {
          const projectFolder = formData.sourcePath.split('/').pop()?.toLowerCase();
          const projectName = projects.find(p => p.localPath === formData.sourcePath)?.name?.toLowerCase();

          const filtered = configs.filter(c => {
            if (!formData.sourcePath) return true; // Show all if no project selected? Or none? User said "correspond to selected project"
            const configName = c.toLowerCase();
            return (projectFolder && configName.includes(projectFolder)) ||
                   (projectName && configName.includes(projectName.replace(/\s+/g, '-')));
          });

          return filtered.map(c => ({
            id: String(c || ""),
            title: String(c || "Unknown Profile"),
            subtitle: "YAML Configuration File",
            metadata: `Scan rules and parameters`,
            icon: <FileCode className="w-6 h-6" />
          }));
        })()}
        selectedValue={formData.config}
        onSelect={(val) => setFormData({ ...formData, config: val })}
        placeholder="Search profiles..."
      />
      <DocumentationModal
        isOpen={showDocsModal}
        onClose={() => setShowDocsModal(false)}
        title="Profile Generator Guide"
        content={docContent}
        isLoading={docsLoading}
      />
    </>
  );
}
