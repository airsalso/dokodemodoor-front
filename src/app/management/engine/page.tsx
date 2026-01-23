"use client";

import { Navbar } from "@/components/Navbar";
import { Cpu, RefreshCw, Loader2, Globe, Trash2, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type EngineEnv = Record<string, string>;

export default function EngineManagementPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [engineEnv, setEngineEnv] = useState<EngineEnv | null>(null);
  const [envSearch, setEnvSearch] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/engine-env");
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to load engine env");
      setEngineEnv(await res.json());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load engine env";
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

  const handleSaveEngineEnv = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/engine-env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(engineEnv),
      });
      if (res.ok) {
        setSuccess("Engine environment updated (.env synced)!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to sync engine .env.");
      }
    } catch (err) {
      console.error("Save engine env error:", err);
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
              <Cpu className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">{t("management")}</span>
            </div>
            <h1 className="text-4xl font-black text-white">{t("ai_engine_settings")}</h1>
            <p className="text-gray-500 max-w-xl">{t("ai_engine_settings_desc")}</p>
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
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
               <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{t("engine_env_warning")}</p>
              <p className="text-xs text-gray-400 mt-1">
                Editing: <span className="font-mono text-primary opacity-80">{process.env.NEXT_PUBLIC_ENGINE_ENV_PATH || "/home/ubuntu/dokodemodoor/.env"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4 rounded-2xl">
            <div className="relative flex-1 w-full">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search environment variables..."
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={envSearch}
                onChange={e => setEnvSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  const key = prompt("Enter new ENV key:");
                  if (key) setEngineEnv({...engineEnv, [key.toUpperCase()]: ""});
                }}
                className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Key
              </button>
              <button
                onClick={handleSaveEngineEnv}
                disabled={saving}
                className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Sync Engine Config
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(engineEnv || {})
              .filter(key => key.toLowerCase().includes(envSearch.toLowerCase()))
              .sort((a, b) => {
                const aP = a.startsWith("DOKODEMO") || a.includes("LLM") || a.includes("VLLM") || a.includes("CLAUDE");
                const bP = b.startsWith("DOKODEMO") || b.includes("LLM") || b.includes("VLLM") || b.includes("CLAUDE");
                if (aP && !bP) return -1;
                if (!aP && bP) return 1;
                return a.localeCompare(b);
              })
              .map(key => (
                <div key={key} className="group flex flex-col gap-3 p-6 rounded-2xl glass-card border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${key.startsWith("DOKODEMO") ? "bg-primary" : "bg-gray-600"}`} />
                      {key}
                    </label>
                    <button
                      onClick={() => {
                        if(confirm(`Remove ${key}?`)) {
                          const newEnv = {...engineEnv};
                          delete newEnv[key];
                          setEngineEnv(newEnv);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-rose-500/50 hover:text-rose-500 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type={key.includes("API_KEY") || key.includes("SECRET") ? "password" : "text"}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono text-emerald-400 placeholder:text-gray-800 focus:outline-none focus:border-primary/50 transition-all"
                    value={engineEnv?.[key] ?? ""}
                    onChange={e => setEngineEnv(prev => ({ ...(prev ?? {}), [key]: e.target.value }))}
                    placeholder="Empty value"
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}
