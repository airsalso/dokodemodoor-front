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
  const [view, setView] = useState<"login" | "forgot">("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);

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
        if (data.user) {
          login(data.user);
        } else {
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
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotEmail }),
      });

      const data = await res.json();
      if (data.success) {
        setForgotSuccess(true);
      } else {
        setError(data.error || "Failed to send reset email");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
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
          <h1 className="text-3xl font-extrabold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Securely access your pentest dashboard</p>
        </div>

        <AnimatePresence mode="wait">
          {view === "login" ? (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="modal-container p-8 space-y-6 bg-card border border-border shadow-[0_32px_80px_-20px_rgba(0,0,0,0.1)]">
                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Username / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-input-bg border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground/50 shadow-sm"
                    placeholder="Enter your username or email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-input-bg border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground/50 shadow-sm"
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
                          backgroundColor: formData.rememberMe ? "var(--primary)" : "var(--input-bg)",
                          borderColor: formData.rememberMe ? "var(--primary)" : "var(--border)",
                          boxShadow: formData.rememberMe ? "0 0 15px rgba(var(--primary-rgb), 0.3)" : "none"
                        }}
                        className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors overflow-hidden"
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
                      <span className="text-sm font-semibold text-foreground group-hover/label:text-primary transition-colors">
                        Keep me signed in
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest leading-none mt-0.5">
                        Session valid for 7 days
                      </span>
                    </div>
                  </label>

                  <button
                    type="button"
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300"
                    onClick={() => setView("forgot")}
                  >
                    Forgot?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-accent py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="forgot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleForgotSubmit}
              className="space-y-4"
            >
              <div className="modal-container p-8 space-y-6 bg-card border border-border shadow-[0_32px_80px_-20px_rgba(0,0,0,0.1)]">
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-foreground">Forgot Password?</h2>
                  <p className="text-sm text-muted-foreground">Enter your email and we&apos;ll send you a link to reset your password.</p>
                </div>

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {forgotSuccess ? (
                  <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center space-y-4">
                    <div className="flex justify-center">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">Reset link sent! Please check your email inbox.</p>

                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="text-primary font-bold hover:underline text-sm block w-full"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" /> Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-input-bg border border-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium placeholder:text-muted-foreground/50 shadow-sm"
                        placeholder="your@email.com"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-accent py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors font-semibold"
                    >
                      Wait, I remembered! Back to login
                    </button>
                  </>
                )}
              </div>
            </motion.form>
          )}
        </AnimatePresence>

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
