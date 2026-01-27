"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { ArrowRight, Bot, ShieldAlert, Zap, Terminal as TerminalIcon } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="flex-1 overflow-x-hidden pt-20 pb-40 relative">
        {/* Background Decorative Grid */}
        <div className="absolute inset-0 -z-10 opacity-[0.03]"
             style={{ backgroundImage: `linear-gradient(rgba(var(--primary-rgb), 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--primary-rgb), 0.5) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
        />

        {/* Dynamic Background Blobs - Optimized with lower blur and hardware acceleration */}
        <motion.div
          animate={{
            x: [0, 60, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 opacity-30 pointer-events-none"
          style={{ backgroundColor: `rgba(var(--primary-rgb), 0.25)`, willChange: 'transform' }}
        />
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 -z-10 w-[500px] h-[500px] rounded-full blur-[80px] -translate-x-1/3 translate-y-1/3 opacity-20 pointer-events-none"
          style={{ backgroundColor: `rgba(var(--accent-rgb), 0.25)`, willChange: 'transform' }}
        />

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider"
            >
              <Zap className="w-3 h-3 fill-primary" />
              AI-Driven Security Engine
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight"
            >
              Secure Your Code with <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-gradient">
                Intelligent Penetration
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl text-lg text-gray-400 leading-relaxed"
            >
              DokodemoDoor automates complex security testing using advanced AI agents.
              Find vulnerabilities, analyze source code, and fix issues before they reach production.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-4"
            >
              <Link
                href="/scans/new"
                className="btn-accent !px-10 !py-4 !rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                Launch New Scan <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/scans"
                className="btn-primary !px-10 !py-3 !rounded-2xl hover:scale-105 active:scale-95 transition-all"
              >
                View History
              </Link>
            </motion.div>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-32">
            {[
              {
                title: "AI Analysis",
                desc: "Powered by Claude and GPT for deep contextual understanding of code.",
                icon: Bot,
                color: "text-blue-400",
                bg: "bg-blue-400/10",
              },
              {
                title: "Real-time Monitoring",
                desc: "Watch the pentest happen live with our advanced terminal streaming.",
                icon: TerminalIcon,
                color: "text-purple-400",
                bg: "bg-purple-400/10",
              },
              {
                title: "Automated Exploits",
                desc: "Identify and safely validate critical vulnerabilities automatically.",
                icon: ShieldAlert,
                color: "text-rose-400",
                bg: "bg-rose-400/10",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl glass-card space-y-4"
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
