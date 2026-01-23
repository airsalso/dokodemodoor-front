"use client";

import { Lock, User, ArrowRight, Loader2, AlertCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const callback = searchParams.get("callback") || "/";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        // Update global auth state immediately
        if (data.user) {
          login(data.user);
        } else {
          // If the login API doesn't return user, we might need a separate check
          // but usually it should. Let's make sure it's robust.
          const meRes = await fetch("/api/auth/me");
          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.authenticated) login(meData.user);
          }
        }

        router.push(callback);
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#05070a] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-2 mb-8 transform hover:scale-110 transition-transform">
            <Logo className="w-20 h-20" />
          </Link>
          <h1 className="text-3xl font-extrabold text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Securely access your pentest dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-card p-8 space-y-6">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" /> Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="group flex items-center justify-between">
              <label
                htmlFor="rememberMe"
                className="flex items-center gap-3 cursor-pointer select-none group/label"
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                    className="sr-only"
                  />
                  <motion.div
                    animate={{
                      backgroundColor: formData.rememberMe ? "rgba(var(--primary-rgb), 1)" : "rgba(255, 255, 255, 0.05)",
                      borderColor: formData.rememberMe ? "rgba(var(--primary-rgb), 1)" : "rgba(255, 255, 255, 0.1)",
                      boxShadow: formData.rememberMe ? "0 0 15px rgba(var(--primary-rgb), 0.3)" : "none"
                    }}
                    className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors overflow-hidden backdrop-blur-sm"
                  >
                    <AnimatePresence mode="popLayout">
                      {formData.rememberMe && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                          <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-400 group-hover/label:text-white transition-colors">
                    Keep me signed in
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest leading-none mt-0.5">
                    Session valid for 7 days
                  </span>
                </div>
              </label>

              <Link
                href="#"
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-primary transition-all duration-300"
                onClick={(e) => e.preventDefault()}
              >
                Forgot?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all glow-primary disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>

        <p className="text-center mt-8 text-gray-500">
          계정이 없으신가요?{" "}
          <Link href="/register" className="text-primary hover:text-primary/80 font-bold">
            회원 가입하기
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
