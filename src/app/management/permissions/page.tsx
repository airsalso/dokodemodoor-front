"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Shield, Lock, Check, X, ShieldAlert, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ROLE_PERMISSIONS, Role } from "@/lib/permissions";

export default function PermissionManagementPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.authenticated || data.user.role !== 'ADMIN') {
          router.push("/");
          return;
        }
        setLoading(true);
        // We could fetch dynamic permissions here if we had them in DB
        setTimeout(() => setLoading(false), 500);
      } catch (err) {
        console.error("Permission auth error:", err);
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const roles: Role[] = ["ADMIN", "SECURITY", "USER"];
  const features = [
    { id: "dashboard", label: t("dashboard") },
    { id: "about", label: t("about") },
    { id: "pentest", label: t("scans_title") },
    { id: "settings", label: t("settings") },
    { id: "management", label: t("management") }
  ];

  const getPermissionIcon = (allowed: boolean) => {
    return allowed ? (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <Check className="w-4 h-4" />
      </div>
    ) : (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-gray-700 border border-white/5">
        <X className="w-4 h-4" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Shield className="w-12 h-12 text-primary animate-pulse" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Permission Matrix...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Lock className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">{t("management")}</span>
          </div>
          <h1 className="text-4xl font-black text-white">{t("permission_management")}</h1>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 max-w-2xl">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400">{t("permission_desc")}</p>
          </div>
        </header>

        <div className="grid gap-8">
          {roles.map((role) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              <div className="px-8 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${role === 'ADMIN' ? 'bg-rose-500/10 text-rose-500' : role === 'SECURITY' ? 'bg-primary/10 text-primary' : 'bg-gray-500/10 text-gray-500'}`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{t(`role_${role.toLowerCase()}`)}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Access Matrix</p>
                  </div>
                </div>
                {role === 'ADMIN' && (
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-black tracking-widest border border-rose-500/20">FULL ACCESS</span>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest w-1/4">Feature</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">View</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Execute</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {features.map((feature) => {
                      const perms = ROLE_PERMISSIONS[role][feature.id];
                      if (!perms) return null;

                      return (
                        <tr key={feature.id} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-300 group-hover:text-white transition-colors">{feature.label}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-center">{getPermissionIcon(perms.view)}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-center">{getPermissionIcon(perms.execute)}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-center">{getPermissionIcon(perms.manage)}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">Advanced Policy Editor</h3>
          </div>
          <p className="text-gray-400 mb-6">
            Dynamic policy editing is currently restricted to system-defined roles for stability.
            Modifying these values directly in the database will reflect here in real-time.
          </p>
          <button disabled className="px-6 py-3 rounded-xl bg-primary/20 text-primary/50 font-bold border border-primary/10 cursor-not-allowed">
            Enable Dynamic Policies
          </button>
        </div>
      </div>
    </>
  );
}
