"use client";

import { Navbar } from "@/components/Navbar";
import { Shield, Lock, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Info, RefreshCw, Globe } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

export default function SecurityManagementPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ips, setIps] = useState<string[]>([]);
  const [newIp, setNewIp] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/security/ip-access");
      if (res.status === 401 || res.status === 403) {
        router.push("/");
        return;
      }
      if (!res.ok) throw new Error("Failed to load IP whitelist");
      const data = await res.json();
      setIps(data.ips || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load IP whitelist";
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
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;

    // Simple IP validation (supports IPv4, IPv6, CIDR)
    const ipPattern = /^([0-9a-fA-F:./]+)$/;
    if (!ipPattern.test(newIp.trim())) {
      setError("Invalid IP address format");
      return;
    }

    if (ips.includes(newIp.trim())) {
      setError("IP already in list");
      return;
    }

    setIps([...ips, newIp.trim()]);
    setNewIp("");
    setError(null);
  };

  const handleRemoveIp = (index: number) => {
    const newIps = [...ips];
    newIps.splice(index, 1);
    setIps(newIps);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/security/ip-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ips }),
      });
      if (res.ok) {
        setSuccess("IP whitelist saved. Please remember to reload Nginx!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save IP whitelist.");
      }
    } catch (err) {
      console.error("Save IP whitelist error:", err);
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
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-rose-500">
              <Shield className="w-6 h-6" />
              <span className="text-xs font-black uppercase tracking-[0.3em]">{t("management")}</span>
            </div>
            <h1 className="text-4xl font-black text-white">{t("ip_access_control")}</h1>
            <p className="text-gray-500 max-w-xl">{t("ip_desc")}</p>
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

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="glass-card p-8 rounded-3xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white flex items-center gap-3">
                  <Lock className="w-5 h-5 text-primary" />
                  Whitelisted IP Addresses
                </h2>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full border border-primary/20">
                  {ips.length} IPs Active
                </span>
              </div>

              <form onSubmit={handleAddIp} className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="Enter IP address (e.g., 1.2.3.4 or 192.168.1.0/24)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm ring-2 ring-primary/10 focus:outline-none focus:ring-primary/50 text-white placeholder:text-gray-400 font-medium transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 btn-accent rounded-xl text-xs font-black transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add IP
                </button>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {ips.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-gray-500 text-sm">No IP restrictions configured. System is currently open to all IPs.</p>
                  </div>
                ) : (
                  ips.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                      <span className="font-mono text-emerald-500">{ip}</span>
                      <button
                        onClick={() => handleRemoveIp(index)}
                        className="p-2 text-gray-500 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-4 btn-primary rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Apply IP Whitelist
                </button>
              </div>
            </section>

            <section className="p-8 rounded-3xl bg-blue-500/[0.03] border border-blue-500/10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                   <Info className="w-5 h-5 text-blue-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white">How it works</h3>
                    <p className="text-sm text-gray-300 mt-1 leading-relaxed">
                      This feature generates an Nginx configuration snippet containing <code>allow</code> and <code>deny</code> directives.
                      If the whitelist is not empty, all other IPs will be denied access to the system.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 shadow-inner">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Nginx Setup Instructions (One-time)</p>
                    <p className="text-xs text-gray-300 font-medium">Add the following line to your Nginx site configuration (e.g., <code>/etc/nginx/sites-available/dokodemodoor</code>) inside the <code>server</code> or <code>location /</code> block:</p>
                    <code className="block p-4 rounded-xl bg-gray-200/30 text-emerald-400 font-mono text-[11px] overflow-x-auto border border-white/5 shadow-inner">
                      include /home/ubuntu/dokodemodoor-front/configs/nginx_access.conf;
                    </code>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 shadow-inner">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Activation Command</p>
                    <p className="text-xs text-gray-300 font-medium">After saving changes here, you must reload Nginx for changes to take effect:</p>
                    <code className="block p-4 rounded-xl bg-gray-200/30 text-amber-400 font-mono text-[11px] border border-white/5 shadow-inner">
                      sudo nginx -s reload
                    </code>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="glass-card p-6 rounded-3xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Predefined IPs</h3>
              <div className="space-y-2">
                <button
                  onClick={() => { if(!ips.includes("127.0.0.1")) setIps([...ips, "127.0.0.1"]) }}
                  className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 transition-all"
                >
                  Add Localhost (127.0.0.1)
                </button>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-[10px] text-primary font-bold">
                  Recommended: Always include your own IP to prevent lockouts.
                </div>
              </div>
            </section>

            <section className="glass-card p-6 rounded-3xl space-y-4 border-rose-500/20">
              <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest">Danger Zone</h3>
              <p className="text-xs text-gray-500">Resetting will remove all IP restrictions and allow access from any IP.</p>
              <button
                onClick={() => { if(confirm("Remove all IP restrictions?")) setIps([]) }}
                className="w-full py-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-black hover:bg-rose-500/20 transition-all"
              >
                Clear All Whitelist
              </button>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
