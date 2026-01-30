"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Settings, PlayCircle, LogIn, LogOut, User as UserIcon, HelpCircle, Users, Terminal, Lock, FileBarChart, Briefcase, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    }
  };

  const allNavItems = [
    { name: t("dashboard"), href: "/", icon: LayoutDashboard, color: "text-blue-400" },
    { name: t("about"), href: "/about", icon: HelpCircle, color: "text-purple-400" },
    { name: t("projects"), href: "/projects", icon: Briefcase, color: "text-amber-400" },
    { name: t("scans"), href: "/scans", icon: History, color: "text-rose-400" },
    { name: t("logs"), href: "/logs", icon: Terminal, color: "text-emerald-400" },
    { name: t("reports"), href: "/reports", icon: FileBarChart, color: "text-indigo-400" },
    { name: t("settings"), href: "/settings", icon: Settings, color: "text-cyan-400" },
    ...(user?.role && ['ADMIN', 'SECURITY'].includes(user.role)
      ? [{ name: t("management"), href: "/management/users", icon: Briefcase, color: "text-teal-400" }]
      : [])
  ];

  const navItems = user ? allNavItems : allNavItems.slice(0, 2);

  const isManagementActive = pathname.startsWith('/management');
  const isProjectsActive = pathname.startsWith('/projects');
  const isScansActive = pathname.startsWith('/scans');

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      <nav className="w-full backdrop-blur-3xl px-8 py-4 flex items-center justify-between relative overflow-hidden"
           style={{
             background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
             color: 'white',
             borderBottom: '4px solid #ef4444', // Doraemon's red collar
           }}>
        {/* Subtle glass effect overlay */}
        <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <Link href="/" className="hover:scale-105 transition-transform duration-300">
            <Logo className="w-12 h-12 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </Link>
          <Link href="/" className="flex flex-col -space-y-1 group">
            <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-blue-400 group-hover:from-blue-200 group-hover:to-white transition-all duration-500">
              DokodemoDoor
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400/60 group-hover:text-blue-400 transition-colors">
              Autonomous Pentesting
            </span>
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-2 relative z-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-5 py-2.5 rounded-2xl text-[14px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 group ${
                  isActive
                    ? "!text-amber-400 bg-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`w-5 h-5 transition-all duration-500 group-hover:scale-110 ${
                  isActive
                    ? item.color + " drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                    : "text-white/40 group-hover:" + item.color
                }`} />
                <span className="relative z-10">
                  {item.name}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-[-10px] left-6 right-6 h-[3px] bg-amber-400 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.6)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-6 relative z-10">
          {user ? (
            <div className="flex items-center gap-5">
              {user.role !== 'USER' && (
                <Link
                  href="/scans/new"
                  className="btn-accent !rounded-2xl !px-6 !py-3 !text-[13px] hover:scale-[1.05] active:scale-[0.95] transition-all shadow-[0_8px_20px_-5px_rgba(251,191,36,0.4)]"
                >
                  <PlayCircle className="w-5 h-5" />
                  {t("start_pentest")}
                </Link>
              )}

              <div className="h-8 w-px bg-white/10 mx-2" />

              <div className="flex items-center gap-4">
                <Link
                  href="/settings"
                  className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-blue-500/30 transition-all group shadow-inner"
                  title="My Account Settings"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <UserIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex flex-col items-start -space-y-0.5">
                    <span className="text-sm font-black text-white/90 group-hover:text-white transition-colors">{user.username}</span>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest px-2 py-0.5 bg-blue-500/20 rounded-md border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                      {user.role ? t(`role_${user.role.toLowerCase()}`) : t("role_admin")}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="group p-3 hover:bg-rose-500/10 rounded-2xl transition-all duration-300 border border-transparent hover:border-rose-500/20"
                  title={t("logout")}
                >
                  <LogOut className="w-5 h-5 text-white/40 group-hover:text-rose-400 transition-colors" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-accent !rounded-2xl !px-8 !py-3 font-black uppercase tracking-widest text-[13px]"
            >
              <LogIn className="w-5 h-5" />
              {t("login")}
            </Link>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {isManagementActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-white/[0.02] border-b border-white/5 backdrop-blur-md overflow-hidden"
          >
            <div className="max-w-[1600px] mx-auto px-6 h-11 flex items-center justify-center gap-10">
              <Link
                href="/management/users"
                className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                  pathname.startsWith('/management/users') ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Users className="w-3 h-3" />
                {t("user_management")}
              </Link>
              <Link
                href="/management/engine"
                className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                  pathname.startsWith('/management/engine') ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Shield className="w-3 h-3" />
                {t("ai_engine_settings")}
              </Link>
              <Link
                href="/management/data"
                className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                  pathname.startsWith('/management/data') ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <History className="w-3 h-3" />
                {t("data_management")}
              </Link>
              <Link
                href="/management/security"
                className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                  pathname.startsWith('/management/security') ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Shield className="w-3 h-3 text-rose-500" />
                {t("network_security")}
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  href="/management/permissions"
                  className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                    pathname.startsWith('/management/permissions') ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  {t("permission_management")}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secondary Sub-Navbar for Projects */}
      <AnimatePresence>
        {isProjectsActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-white/[0.02] border-b border-white/5 backdrop-blur-md overflow-hidden"
          >
            <div className="max-w-[1600px] mx-auto px-6 h-11 flex items-center justify-center gap-10">
              <Link
                href="/projects"
                className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                  pathname === '/projects' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Briefcase className="w-3 h-3" />
                {t("project_management")}
              </Link>
              <Link
                href="/projects/profiles"
                className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                  pathname.startsWith('/projects/profiles') ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Settings className="w-3 h-3" />
                {t("project_profiles")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secondary Sub-Navbar for Scans */}
      <AnimatePresence>
        {isScansActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full bg-white/[0.02] border-b border-white/5 backdrop-blur-md overflow-hidden"
          >
            <div className="max-w-[1600px] mx-auto px-6 h-11 flex items-center justify-center gap-10">
              <Link
                href="/scans"
                className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                  pathname === '/scans' ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <History className="w-3 h-3" />
                {t("scan_history") || "Scan History"}
              </Link>
              <Link
                href="/scans/vulns"
                className={`text-[10px] uppercase font-black tracking-[0.2em] transition-colors flex items-center gap-2 h-full ${
                  pathname.startsWith('/scans/vulns') ? "text-primary border-b-2 border-primary" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Shield className="w-3 h-3" />
                {t("vulnerabilities") || "Vulnerabilities"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
