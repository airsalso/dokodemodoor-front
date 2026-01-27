"use client";

import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, ShieldCheck, Save, AlertCircle, CheckCircle2,
  Loader2, Languages, Globe, Zap, Cpu, Bell,
  Palette, Terminal, Trash2
} from "lucide-react";
import { useState, useEffect, useCallback, type ElementType } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAppearance } from "@/context/AppearanceContext";
import { useAuth } from "@/hooks/useAuth";
import { themes, fonts, themeFonts, terminalThemes } from "@/lib/constants";

type SettingsTab = "profile" | "scan" | "notifications" | "appearance";

type DbSettings = {
  exclusions?: string;
  requestDelay?: number;
  timeout?: number;
  webhookUrl?: string;
  emailReports?: boolean;
  language?: string;
  terminalTheme?: string;
  terminalFont?: string;
  themeFont?: string;
  accentColor?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { language, setLanguage, isLoadingSettings, t, refreshSettings: refreshLanguage } = useLanguage();
  const {
    themeColor, setThemeColor, setTerminalTheme, terminalTheme,
    terminalFont, setTerminalFont, themeFont, setThemeFont,
    isLoadingAppearance, refreshSettings: refreshAppearance
  } = useAppearance();
  const { user, authenticated, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User & Settings State
  const [dbSettings, setDbSettings] = useState<DbSettings | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!authenticated && !authLoading) {
        router.push("/login");
        return;
      }

      const settingsRes = await fetch("/api/auth/settings");

      if (!settingsRes.ok) {
        const errData = await settingsRes.json().catch(() => ({ error: "Unknown database error" }));
        throw new Error(`Settings API failed: ${errData.error || settingsRes.statusText}`);
      }

      const dbSets = await settingsRes.json();
      setDbSettings(dbSets);
    } catch (err: unknown) {
      console.error("Fetch Error Detail:", err);
      const message = err instanceof Error ? err.message : "Failed to load settings data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authenticated, authLoading, router]);

  useEffect(() => {
    if (!isLoadingSettings && !isLoadingAppearance && !authLoading) {
      fetchData();
    }
  }, [isLoadingSettings, isLoadingAppearance, authLoading, fetchData]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000); // 5 seconds is better
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleSaveDbSettings = async (updates: Partial<DbSettings>) => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok) {
        setDbSettings(data);

        // Refresh contexts to ensure they are in sync with the new DB values
        await Promise.all([
          refreshLanguage(),
          refreshAppearance()
        ]);

        setSuccess("Settings applied successfully!");
      } else {
        setError(data.error || "Failed to update settings.");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setError("Server connection error.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Password updated!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setError(data.error);
      }
    } catch (e) {
      console.error("Update password error:", e);
      setError("Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    const pw = prompt("Please enter your current password to confirm withdrawal:");
    if (!pw) return;

    if (!confirm("Everything door will be closed forever for this account. Are you absolutely sure?")) return;

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Account successfully withdrawn. Goodbye!");
        window.location.href = "/";
      } else {
        alert(data.error || "Failed to withdraw account.");
      }
    } catch (err) {
      console.error("Withdraw error:", err);
      alert("Connection error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || isLoadingSettings || isLoadingAppearance || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const tabs: { id: SettingsTab; label: string; icon: ElementType; desc: string }[] = [
    { id: "profile", label: t("account_settings"), icon: User, desc: t("manage_profile") },
    { id: "scan", label: t("scan_configs"), icon: Zap, desc: t("scan_configs_desc") },
    { id: "notifications", label: t("notifications"), icon: Bell, desc: t("notifications_desc") },
    { id: "appearance", label: t("appearance"), icon: Palette, desc: t("appearance_desc") },
  ];

  return (
    <>
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-6 py-12 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-2">
          <div className="mb-8 px-4">
            <h1 className="text-3xl font-black mb-2 text-foreground">Settings</h1>
            <p className="text-sm text-gray-500">Configure your DokodemoDoor</p>
          </div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center gap-4 border ${
                activeTab === tab.id
                  ? "bg-primary/10 border-primary/30 text-foreground shadow-[0_0_20px_rgba(139,92,246,0.1)]"
                  : "bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-primary" : ""}`} />
              <div className="flex-1">
                <p className="font-bold text-sm">{tab.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="modal-container p-8 md:p-12 min-h-[600px] border-white/5 bg-card-muted"
            >
              {/* Header */}
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {tabs.find(t => t.id === activeTab)?.desc}
                  </p>
                </div>
                {success && (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> {success}
                  </motion.div>
                )}
                {error && (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </motion.div>
                )}
              </div>

              {/* Tab Contents */}
              <div className="space-y-8">
                {/* 1. Account Settings */}
                {activeTab === "profile" && (
                  <div className="space-y-8 max-w-2xl">
                    <form onSubmit={handleUpdatePassword} className="space-y-8">
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 border border-white/10">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                              {user?.role ? t(`role_${user.role.toLowerCase()}`) : t("verified_user")}
                            </p>
                            <p className="font-bold text-foreground text-lg">{user?.username}</p>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4">
                          <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-widest">
                            <Lock className="w-4 h-4" /> {t("change_password")}
                          </h3>
                          <div className="space-y-4">
                            <div className="grid gap-2">
                              <label className="text-xs font-medium text-gray-500">{t("current_password")}</label>
                              <input
                                type="password"
                                className="input-base"
                                value={passwordData.currentPassword}
                                onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                placeholder="••••••••"
                              />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <label className="text-xs font-medium text-gray-500">{t("new_password")}</label>
                                <input
                                  type="password"
                                  className="input-base"
                                  value={passwordData.newPassword}
                                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                  placeholder="••••••••"
                                />
                              </div>
                              <div className="grid gap-2">
                                <label className="text-xs font-medium text-gray-500">{t("confirm_password")}</label>
                                <input
                                  type="password"
                                  className="input-base"
                                  value={passwordData.confirmPassword}
                                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                  placeholder="••••••••"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button type="submit" disabled={saving} className="btn-accent">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {t("save_password")}
                      </button>
                    </form>

                    {/* Danger Zone */}
                    <div className="pt-12 border-t border-rose-500/10">
                       <h3 className="text-sm font-black text-rose-500 flex items-center gap-2 uppercase tracking-[0.2em] mb-6">
                         <AlertCircle className="w-4 h-4" /> Danger Zone
                       </h3>
                       <div className="p-8 rounded-3xl bg-rose-500/5 border border-rose-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                         <div className="space-y-1">
                           <p className="font-bold text-foreground">Withdraw Account</p>
                           <p className="text-sm text-gray-500">Permanently mark your account as deleted. This action is irreversible.</p>
                         </div>
                         <button
                            onClick={handleWithdraw}
                            disabled={saving}
                            className="px-8 py-4 rounded-2xl btn-secondary font-black transition-all whitespace-nowrap"
                         >
                           Withdraw My Account
                         </button>
                       </div>
                    </div>
                  </div>
                )}

                {/* 2. Scan Configurations */}
                {activeTab === "scan" && (
                  <div className="space-y-8 max-w-2xl">
                     <div className="grid gap-6">
                        <div className="grid gap-2">
                          <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-primary" /> {t("exclusions")}
                          </label>
                          <p className="text-xs text-gray-500">{t("scan_configs_desc")}</p>
                          <input
                            type="text"
                            className="input-base font-mono"
                            value={dbSettings?.exclusions || ""}
                            onChange={e => setDbSettings({...dbSettings, exclusions: e.target.value})}
                            placeholder={t("exclusions_placeholder")}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="grid gap-2">
                            <label className="text-sm font-bold text-gray-300">{t("request_delay")}</label>
                            <input
                              type="number"
                              className="input-base"
                              value={dbSettings?.requestDelay || 500}
                              onChange={e => setDbSettings({...dbSettings, requestDelay: parseInt(e.target.value)})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <label className="text-sm font-bold text-gray-300">{t("timeout")}</label>
                            <input
                              type="number"
                              className="input-base"
                              value={dbSettings?.timeout || parseInt(process.env.NEXT_PUBLIC_DATABASE_TIMEOUT_MS || "30000")}
                              onChange={e => setDbSettings({...dbSettings, timeout: parseInt(e.target.value)})}
                            />
                          </div>
                        </div>
                     </div>
                     <button onClick={() => handleSaveDbSettings({ exclusions: dbSettings?.exclusions, requestDelay: dbSettings?.requestDelay, timeout: dbSettings?.timeout })} disabled={saving} className="btn-accent">
                       {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                       {t("save_changes")}
                     </button>
                  </div>
                )}

                {/* 3. Notifications */}
                {activeTab === "notifications" && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="grid gap-6">
                      <div className="grid gap-2">
                        <label className="text-sm font-bold text-gray-300">{t("webhook_url")}</label>
                        <input
                          type="text"
                          className="input-base font-mono"
                          value={dbSettings?.webhookUrl || ""}
                          onChange={e => setDbSettings({...dbSettings, webhookUrl: e.target.value})}
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>

                      <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Bell className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{t("email_reports")}</p>
                            <p className="text-xs text-gray-500">{t("email_reports_desc")}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSaveDbSettings({ emailReports: !dbSettings?.emailReports })}
                          className={`w-12 h-6 rounded-full transition-all relative ${dbSettings?.emailReports ? 'bg-primary' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all ${dbSettings?.emailReports ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => handleSaveDbSettings({ webhookUrl: dbSettings?.webhookUrl })} disabled={saving} className="btn-accent">
                       {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                       {t("save_changes")}
                    </button>
                  </div>
                )}

                {/* 6. Appearance & Language */}
                {activeTab === "appearance" && (
                  <div className="space-y-8 max-w-2xl">
                    <div className="grid gap-8">
                       <div className="grid gap-4">
                         <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                           <Globe className="w-4 h-4 text-primary" /> {t("select_language")}
                         </label>
                         <div className="grid grid-cols-2 gap-4">
                            <button
                              onClick={() => {
                                setLanguage("en");
                                if (dbSettings) setDbSettings({...dbSettings, language: "en"});
                              }}
                              className={`p-6 rounded-2xl border text-left transition-all ${
                                language === "en" ? "bg-primary/10 border-primary text-white" : "bg-white/5 border-white/10 text-gray-500"
                              }`}
                            >
                              <p className="font-black text-lg">EN</p>
                              <p className="text-xs opacity-60">English Interface</p>
                            </button>
                            <button
                              onClick={() => {
                                setLanguage("ko");
                                if (dbSettings) setDbSettings({...dbSettings, language: "ko"});
                              }}
                              className={`p-6 rounded-2xl border text-left transition-all ${
                                language === "ko" ? "bg-primary/10 border-primary text-white" : "bg-white/5 border-white/10 text-gray-500"
                              }`}
                            >
                              <p className="font-black text-lg">KO</p>
                              <p className="text-xs opacity-60">한국어 인터페이스</p>
                            </button>
                         </div>
                       </div>

                        <div className="grid gap-4">
                          <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-emerald-400" /> {t("terminal_theme")}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {terminalThemes.map(theme => (
                              <button
                                key={theme}
                                onClick={() => {
                                  setTerminalTheme(theme);
                                  if (dbSettings) setDbSettings({...dbSettings, terminalTheme: theme});
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                                  terminalTheme === theme
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                    : "bg-white/5 border-white/10 text-gray-500"
                                }`}
                              >
                                {theme}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-indigo-400" /> {t("terminal_font")}
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {fonts.map(f => (
                              <button
                                key={f.id}
                                onClick={() => {
                                  setTerminalFont(f.id);
                                  if (dbSettings) setDbSettings({...dbSettings, terminalFont: f.id});
                                }}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                  terminalFont === f.id
                                    ? "bg-indigo-500/10 border-indigo-500/50 text-white"
                                    : "bg-white/5 border-white/10 text-gray-500"
                                }`}
                                style={{ fontFamily: f.font }}
                              >
                                <p className="font-bold text-sm mb-1">{f.name}</p>
                                <p className="text-[10px] opacity-60">Terminal Font Style</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                            <Languages className="w-4 h-4 text-rose-400" /> {t("theme_font")}
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {themeFonts.map(f => (
                              <button
                                key={f.id}
                                onClick={() => {
                                  setThemeFont(f.id);
                                  if (dbSettings) setDbSettings({...dbSettings, themeFont: f.id});
                                }}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                  themeFont === f.id
                                    ? "bg-rose-500/10 border-rose-500/50 text-white"
                                    : "bg-white/5 border-white/10 text-gray-500"
                                }`}
                                style={{ fontFamily: f.font }}
                              >
                                <p className="font-bold text-sm mb-1">{f.name}</p>
                                <p className="text-[10px] opacity-60">{f.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                       <div className="grid gap-6">
                         <label className="text-sm font-bold text-gray-300 flex items-center gap-2">
                           <Palette className="w-4 h-4 text-primary" /> {t("accent_color")}
                         </label>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                           {themes.map(theme => (
                             <button
                               key={theme.id}
                               onClick={() => {
                                 setThemeColor(theme.color);
                                 if (dbSettings) setDbSettings({...dbSettings, accentColor: theme.color});
                               }}
                               className={`group relative p-6 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                 dbSettings?.accentColor === theme.color
                                   ? "bg-white/[0.03] border-primary shadow-2xl shadow-primary/20"
                                   : "bg-white/[0.01] border-white/5 hover:border-white/10"
                               }`}
                             >
                               <div className="flex items-center gap-4 mb-4">
                                 <div
                                   className="w-12 h-12 rounded-2xl shadow-inner flex items-center justify-center transition-transform group-hover:rotate-12"
                                   style={{ backgroundColor: theme.color }}
                                 >
                                   <div className="w-4 h-4 rounded-full bg-white/30 backdrop-blur-sm" />
                                 </div>
                                 <div className="text-left">
                                   <p className="font-black text-white text-sm">{theme.name}</p>
                                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{theme.desc}</p>
                                 </div>
                               </div>
                               <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                 <span className="text-[10px] font-black py-1 px-2 rounded-md bg-white/10 text-gray-300 group-hover:text-primary transition-colors">
                                   {theme.tag}
                                 </span>
                                 {dbSettings?.accentColor === theme.color && (
                                   <motion.div layoutId="theme-active" className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                                 )}
                               </div>
                             </button>
                           ))}
                         </div>
                       </div>
                    </div>
                      <button
                         onClick={() => {
                           console.log("Saving Appearance with:", {
                             terminalTheme,
                             accentColor: dbSettings?.accentColor,
                             language,
                             terminalFont,
                             themeFont
                           });
                           handleSaveDbSettings({
                             terminalTheme: dbSettings?.terminalTheme || terminalTheme,
                             accentColor: dbSettings?.accentColor || themeColor,
                             language: language,
                             terminalFont: terminalFont,
                             themeFont: themeFont
                           });
                         }}
                         disabled={saving}
                         className="btn-accent"
                       >
                         {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                         {t("save_changes")}
                       </button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .input-base {
          @apply w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-gray-700;
        }
        .btn-primary {
          @apply bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-2xl font-black transition-all glow-primary disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-primary/20;
        }
      `}</style>
    </>
  );
}
