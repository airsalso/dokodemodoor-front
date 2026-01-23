"use client";

import { Navbar } from "@/components/Navbar";
import { Database, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type DbSettings = {
  autoCleanupDays?: number;
};

export default function DataManagementPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbSettings, setDbSettings] = useState<DbSettings | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/settings");
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to load settings");
      setDbSettings(await res.json());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load settings";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleSaveDbSettings = async (updates: Partial<DbSettings>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setDbSettings(await res.json());
        setSuccess("Settings applied successfully!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update settings.");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setError("Server connection error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary">
              <Database className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">{t("management")}</span>
            </div>
            <h1 className="text-4xl font-black text-white">{t("data_management")}</h1>
            <p className="text-gray-500 max-w-xl">{t("data_management_desc")}</p>
          </div>

          <div className="flex flex-wrap gap-3">
             {success && (
                <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {success}
                </div>
              )}
              {error && (
                <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
          </div>
        </header>

        <div className="grid gap-8">
          <section className="glass-card p-8 space-y-8">
            <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Download className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{t("export_history")}</p>
                  <p className="text-sm text-gray-500">Download all scan data and system logs in JSON format.</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-sm font-black hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                Export Data
              </button>
            </div>

            <div className="grid gap-4">
              <label className="text-sm font-black text-gray-300 uppercase tracking-widest">{t("auto_cleanup")}</label>
              <p className="text-xs text-gray-500">{t("auto_cleanup_desc")}</p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  className="w-32 bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-primary/50"
                  value={dbSettings?.autoCleanupDays || 0}
                  onChange={e => setDbSettings({...dbSettings, autoCleanupDays: parseInt(e.target.value)})}
                />
                <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">Days</span>
                <button
                  onClick={() => handleSaveDbSettings({ autoCleanupDays: dbSettings?.autoCleanupDays ?? 0 })}
                  className="ml-auto px-6 py-3.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Policy"}
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5">
              <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-6">Danger Zone</h3>
              <div className="p-8 rounded-3xl bg-rose-500/[0.03] border border-rose-500/20 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-lg">Wipe Database</p>
                  <p className="text-sm text-gray-500">Permanently remove all scan history and logs from the system.</p>
                </div>
                <button className="px-8 py-4 bg-rose-500 text-white rounded-xl text-sm font-black hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">
                  Wipe All Data
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
