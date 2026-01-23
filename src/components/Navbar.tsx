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

  const navItems = [
    { name: t("dashboard"), href: "/", icon: LayoutDashboard },
    { name: t("about"), href: "/about", icon: HelpCircle },
    { name: t("projects"), href: "/projects", icon: Briefcase },
    { name: t("scans"), href: "/scans", icon: History },
    { name: t("logs"), href: "/logs", icon: Terminal },
    { name: t("reports"), href: "/reports", icon: FileBarChart },
    { name: t("settings"), href: "/settings", icon: Settings },
    ...(user?.role && ['ADMIN', 'SECURITY'].includes(user.role)
      ? [{ name: t("management"), href: "/management/users", icon: Briefcase }]
      : [])
  ];

  const isManagementActive = pathname.startsWith('/management');
  const isProjectsActive = pathname.startsWith('/projects');
  const isScansActive = pathname.startsWith('/scans');

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      <nav className="w-full backdrop-blur-2xl border-b border-white/5 px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
           style={{
             background: 'linear-gradient(to bottom, rgba(var(--primary-rgb), 0.12) 0%, rgba(5, 7, 10, 0.8) 50%, rgba(5, 7, 10, 0.4) 100%)',
             borderBottom: '1px solid rgba(var(--primary-rgb), 0.1)'
           }}>
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo className="w-10 h-10" />
          </Link>
          <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            DokodemoDoor
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:text-white ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {item.name}
                </div>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-primary"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {user.role !== 'USER' && (
                <Link
                  href="/scans/new"
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all glow-primary hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PlayCircle className="w-4 h-4" />
                  {t("start_pentest")}
                </Link>
              )}
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                title="My Account Settings"
              >
                <UserIcon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <div className="flex flex-col items-start -space-y-0.5">
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest px-1 bg-primary/10 rounded-sm">
                    {user.role ? t(`role_${user.role.toLowerCase()}`) : t("role_admin")}
                  </span>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white p-2 transition-colors uppercase text-[10px] font-bold tracking-widest"
                title={t("logout")}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-white/10 hover:bg-white/5 transition-all"
            >
              <LogIn className="w-4 h-4 text-primary" />
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
