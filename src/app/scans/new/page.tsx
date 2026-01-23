"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Globe, HardDrive, FileCode, Play, ChevronLeft, Loader2, AlertTriangle, Plus, X, Save, Github, Briefcase } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { SearchableCollectionModal } from "@/components/SearchableCollectionModal";

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
    targetUrl: process.env.NEXT_PUBLIC_DEFAULT_TARGET_URL || "http://localhost:3000",
    sourcePath: "",
    config: "",
  });

  // Project Modal States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<'git' | 'manual'>('git');
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [manualPath, setManualPath] = useState("");
  const [newName, setNewName] = useState("");
  const [projectActionLoading, setProjectActionLoading] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showConfigPicker, setShowConfigPicker] = useState(false);

  // New Profile Modal States
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: "",
    content: `# Example configuration file for pentest-agent
# Copy this file and modify it for your specific testing needs

authentication:
  login_type: form  # Options: 'form' or 'sso'
  login_url: "https://example.com/login"
  credentials:
    username: "testuser"
    password: "testpassword"
    totp_secret: "JBSWY3DPEHPK3PXP"  # Optional TOTP secret for 2FA

  # Natural language instructions for login flow
  login_flow:
    - "Type $username into the email field"
    - "Type $password into the password field"
    - "Click the 'Sign In' button"
    - "Enter $totp in the verification code field"
    - "Click 'Verify'"

  success_condition:
    type: url_contains  # Options: 'url_contains' or 'element_present'
    value: "/dashboard"

rules:
  avoid:
    - description: "Do not test the marketing site subdomain"
      type: subdomain
      url_path: "www"

    - description: "Skip logout functionality"
      type: path
      url_path: "/logout"

    - description: "No DELETE operations on user API"
      type: path
      url_path: "/api/v1/users/*"

  focus:
    - description: "Prioritize beta admin panel subdomain"
      type: subdomain
      url_path: "beta-admin"

    - description: "Focus on user profile updates"
      type: path
      url_path: "/api/v2/user-profile"`
  });
  const [savingConfig, setSavingConfig] = useState(false);

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
          fetch("/api/configs"),
          fetch("/api/projects?limit=1000")
        ]);

        const [configsData, projectsData] = await Promise.all([
          configsRes.json().catch(() => ({})),
          projectsRes.json().catch(() => ({}))
        ]);

        const rawConfigs = configsData.configs || configsData.data || [];
        const rawProjects = projectsData.projects || projectsData.data || [];

        setConfigs(rawConfigs);
        if (rawConfigs.length > 0) {
          const defaultInternal = rawConfigs.find((c: string) => c === "None.yaml") || rawConfigs[0];
          setFormData(prev => ({ ...prev, config: String(defaultInternal) }));
        }

        setProjects(rawProjects);

        const targetPath = searchParams.get("targetPath");
        if (targetPath) {
          setFormData(prev => ({ ...prev, sourcePath: targetPath || "" }));
        } else if (projectsData.projects?.length > 0) {
          setFormData(prev => ({
            ...prev,
            sourcePath: projectsData.projects[0].localPath,
            targetUrl: projectsData.projects[0].repoUrl || ""
          }));
        }
      } catch (err) {
        console.error("Initialization failed", err);
      }
    }
    fetchData();
  }, [router, searchParams, authenticated, authLoading, user]);

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

  const deriveProfileName = (content: string) => {
    if (!content) return "";
    try {
      const match = content.match(/^name:\s*(['"]?)([^'"\n\r]+)\1/m);
      if (match && match[2]) {
        const base = match[2].trim();
        return base.endsWith(".yaml") || base.endsWith(".yml") ? base : `${base}.yaml`;
      }
      return "";
    } catch { return ""; }
  };

  const fetchConfigs = async (selectNew?: string) => {
    try {
      const res = await fetch("/api/configs");
      const data = await res.json();
      setConfigs(data.configs || []);
      if (selectNew) {
        setFormData(prev => ({ ...prev, config: selectNew }));
      } else if (!formData.config && data.configs?.length > 0) {
        const defaultInternal = data.configs.find((c: string) => c === "None.yaml") || data.configs[0];
        setFormData(prev => ({ ...prev, config: defaultInternal }));
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

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectActionLoading(true);
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
        setShowProjectModal(false);
        // Refresh project list and select the new one
        await fetchProjects(data.localPath);
      } else {
        const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || "Failed to register project.");
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Register project error:", err);
      setError("Connection error while registering project.");
    } finally {
      setProjectActionLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    const finalName = newProfile.name.trim() || deriveProfileName(newProfile.content);

    if (!finalName || !newProfile.content) {
      alert("Please provide both name and YAML content.");
      return;
    }

    setSavingConfig(true);
    try {
      const res = await fetch("/api/configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProfile,
          name: finalName
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await fetchConfigs(data.filename);
        setShowNewModal(false);
        setNewProfile({ name: "", content: "name: custom-profile\ndescription: Customized pentest profile\nagents:\n  - pre-recon\n  - recon\n  - codei-vuln\n" });
      } else {
        alert(data.error || "Failed to save configuration");
      }
    } catch (err) {
      console.error("Save config error:", err);
      alert("Connection error");
    } finally {
      setSavingConfig(false);
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

        <Link
          href="/scans"
          className="group inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 mb-12 transition-all active:scale-95"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </div>
          {t('back to history') || 'Back to History'}
        </Link>

        <div className="mb-12 flex items-center justify-between gap-12">
          <div className="flex-1 space-y-4">
            <h1 className="text-5xl font-black text-white leading-none">Start New Pentest</h1>
            <p className="text-gray-400 max-w-xl font-medium text-lg leading-relaxed">
              Configure your targets and parameters for an automated security assessment.
            </p>
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
                placeholder="https://dokodemodoor.com"
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
                    <div className="text-white font-black text-lg truncate">
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
                  Configuration Profile
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewModal(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors bg-emerald-400/5 px-3 py-1.5 rounded-lg border border-emerald-400/20"
                >
                  <Plus className="w-3 h-3" />
                  New Profile
                </button>
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
                    <div className="text-white font-black text-lg truncate">
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
            className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-2xl font-extrabold text-xl flex items-center justify-center gap-3 transition-all glow-primary disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Initializing Engine...
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-white" />
                Execute Pentest
              </>
            )}
          </button>
        </form>
      </div>

      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f111a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{t('create_config')}</h2>
                    <p className="text-xs text-gray-500">{t('config_desc')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                    {t('profile_name')}
                    <span className="text-gray-700 italic lowercase font-normal ml-2">
                      (optional, defaults to {deriveProfileName(newProfile.content) || "filename.yaml"})
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newProfile.name || ""}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                    placeholder={deriveProfileName(newProfile.content) || "my-custom-scan.yaml"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                  />
                </div>
                <div className="space-y-2 flex-1 flex flex-col">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('yaml_content')}</label>
                  <textarea
                    value={newProfile.content || ""}
                    onChange={(e) => setNewProfile({ ...newProfile, content: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm h-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none custom-scrollbar"
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="p-6 bg-white/5 border-t border-white/5 flex gap-3">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="flex-[2] py-4 rounded-xl font-black bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50"
                >
                  {savingConfig ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {t('save_config')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProjectModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f111a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 text-accent">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{t('register_project')}</h2>
                    <p className="text-xs text-gray-500">{registrationMode === 'git' ? 'Clone from External Repository' : 'Direct Local path registration'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-8 pt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegistrationMode('git')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    registrationMode === 'git' ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-white/5 text-gray-500 hover:text-white"
                  }`}
                >
                  {t("git_clone")}
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationMode('manual')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    registrationMode === 'manual' ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-white/5 text-gray-500 hover:text-white"
                  }`}
                >
                  {t("manual_registration")}
                </button>
              </div>

              <form onSubmit={handleAddProject} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500">
                      {t('project_name')}
                      <span className="text-gray-700 italic lowercase font-normal ml-2">
                        (optional, defaults to {deriveProjectName(registrationMode === 'git' ? newRepoUrl : manualPath, registrationMode) || "folder name"})
                      </span>
                    </label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-accent transition-colors" />
                      <input
                        type="text"
                        value={newName || ""}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={deriveProjectName(registrationMode === 'git' ? newRepoUrl : manualPath, registrationMode) || "my-project"}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {registrationMode === 'git' ? (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('repo_url')}</label>
                      <div className="relative group">
                        <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-accent transition-colors" />
                        <input
                          required
                          type="url"
                          value={newRepoUrl || ""}
                          onChange={(e) => setNewRepoUrl(e.target.value)}
                          placeholder="https://github.com/user/repo"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-500">{t('local_path')}</label>
                      <div className="relative group">
                        <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-accent transition-colors" />
                        <input
                          required
                          type="text"
                          value={manualPath || ""}
                          onChange={(e) => setManualPath(e.target.value)}
                          placeholder="/var/www/my-project"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all font-mono text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-gray-600 mt-1 italic">
                        {t('local_path_desc')}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowProjectModal(false)}
                    className="flex-1 py-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={projectActionLoading || (registrationMode === 'git' ? !newRepoUrl : !manualPath)}
                    className="flex-[2] py-4 rounded-xl font-black bg-accent text-white hover:bg-accent/90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/20 disabled:opacity-50"
                  >
                    {projectActionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {registrationMode === 'git' ? t('git_clone') : t('manual_registration')}
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
            targetUrl: selectedProject?.repoUrl || formData.targetUrl || ""
          });
        }}
        placeholder="Search projects by name or path..."
      />

      <SearchableCollectionModal
        isOpen={showConfigPicker}
        onClose={() => setShowConfigPicker(false)}
        title="Configuration Profile"
        description="Select the ruleset and AI agent configurations for this security scan."
        items={configs.map(c => ({
          id: String(c || ""),
          title: String(c || "Unknown Profile"),
          subtitle: "YAML Configuration File",
          metadata: `Scan rules and parameters`,
          icon: <FileCode className="w-6 h-6" />
        }))}
        selectedValue={formData.config}
        onSelect={(val) => setFormData({ ...formData, config: val })}
        placeholder="Search profiles..."
      />
    </>
  );
}
