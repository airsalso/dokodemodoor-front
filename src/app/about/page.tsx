"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import {
  Shield, Zap, Globe, Lock, Code, Server, Heart,
  Bot, Terminal, Layers, GitBranch, Activity, FileText,
  Search, Target, Database, Bug, ArrowRight,
  Sparkles, Boxes, CpuIcon
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { X, Info } from "lucide-react";

type StrategyKey = "sqli" | "codei" | "pathi" | "xss" | "auth" | "ssrf" | "authz" | "ssti";

type ModalKind = "strategy" | "feature" | "workflow" | "architecture";

type ModalItem = {
  id: string;
  icon: ReactNode;
  name: string;
  color: string;
  description?: string;
  kind: ModalKind;
};

export default function AboutPage() {
  const { language } = useLanguage();
  const containerRef = useRef(null);
  const [selectedAgent, setSelectedAgent] = useState<ModalItem | null>(null);

  const isKo = language === "ko";

  const content = {
    hero: {
      title: isKo ? "DokodemoDoor" : "DokodemoDoor",
      subtitle: isKo ? "어디로든 문" : "The Anywhere Door",
      desc: isKo
        ? "최첨단 AI 에이전트 기술을 활용한 자율형 침투 테스트(Autonomous Pentesting) 프레임워크"
        : "An autonomous penetration testing framework powered by cutting-edge AI agent technology.",
      badge: isKo ? "Project DokodemoDoor v1.0" : "Project DokodemoDoor v1.0",
    },
    philosophy: {
      title: isKo ? "핵심 철학" : "Core Philosophy",
      quote: isKo
        ? "깊이 있는 전문성과 산업적 규모의 병렬성의 결합"
        : "Combining Specialist Deepness with Industrial-Scale Parallelism",
      desc: isKo
        ? "단순 스캐너를 넘어 전문 AI 에이전트들이 도구와 소통하며 스스로 판단하고 증명합니다."
        : "Beyond simple scanners, specialized AI agents interact with tools, making autonomous decisions and proofs.",
    },
    agents: [
      { id: "sqli", icon: <Database />, name: "SQLi Specialist", color: "text-blue-400", kind: "strategy" as const },
      { id: "codei", icon: <Code />, name: "Code Injection", color: "text-purple-400", kind: "strategy" as const },
      { id: "pathi", icon: <FileText />, name: "Path Traversal", color: "text-emerald-400", kind: "strategy" as const },
      { id: "xss", icon: <Bug />, name: "XSS Hunter", color: "text-orange-400", kind: "strategy" as const },
      { id: "auth", icon: <Lock />, name: "Auth Auditor", color: "text-rose-400", kind: "strategy" as const },
      { id: "ssrf", icon: <Globe />, name: "SSRF Analyst", color: "text-cyan-400", kind: "strategy" as const },
      { id: "authz", icon: <Shield />, name: "AuthZ/RBAC", color: "text-indigo-400", kind: "strategy" as const },
      { id: "ssti", icon: <Zap />, name: "ServerSide Template Injection", color: "text-yellow-400", kind: "strategy" as const },
    ],
    features: [
      {
        id: "feat_parallel",
        icon: <Activity className="w-8 h-8 text-primary" />,
        title: isKo ? "8x 병렬 가속" : "8x Parallel Speed",
        desc: isKo ? "취약점 분석 및 공격 단계를 병렬로 수행하여 압도적인 속도를 제공합니다." : "Executes analysis and exploitation in parallel for unprecedented speed.",
      },
      {
        id: "feat_healing",
        icon: <GitBranch className="w-8 h-8 text-accent" />,
        title: isKo ? "자가 치유 (Self-Healing)" : "Self-Healing Logic",
        desc: isKo ? "Git Checkpoint 기반 자동 롤백 및 실패 시 자동 재시도를 지원합니다." : "Supports auto-rollback via Git Checkpoints and intelligent retries.",
      },
      {
        id: "feat_hybrid",
        icon: <CpuIcon className="w-8 h-8 text-emerald-400" />,
        title: isKo ? "하이브리드 LLM" : "Hybrid LLM Core",
        desc: isKo ? "Claude의 정밀함과 vLLM의 확장성을 결합한 하이브리드 지능을 사용합니다." : "Combines Claude's precision with vLLM's scalability.",
      },
    ],
    workflow: [
      { phase: "01", name: isKo ? "기초 탐색 (Pre-Recon)" : "Pre-Recon", icon: <Search />, desc: "nmap, subfinder, whatweb" },
      { phase: "02", name: isKo ? "표면 매핑 (Recon)" : "Recon Mapping", icon: <Target />, desc: "Attack Surface Map" },
      { phase: "03", name: isKo ? "전문 분석 (Analysis)" : "Vuln Analysis", icon: <Bot />, desc: "7 Specialist Agents" },
      { phase: "04", name: isKo ? "실제 타격 (Exploit)" : "Exploitation", icon: <Zap />, desc: "Proof of Concept" },
      { phase: "05", name: isKo ? "결과 보고 (Report)" : "Reporting", icon: <FileText />, desc: "Executive Summary" },
    ],
    architecture: [
      { id: "orchestrator", name: "Orchestrator", desc: "Session & Phase Control", level: "Top Level", icon: <Layers /> },
      { id: "mcp", name: "MCP Tool Layer", desc: "Playwright, Bash, Git Integration", level: "Execution", icon: <Terminal /> },
      { id: "pipeline", name: "Deliverable Pipeline", desc: "Inter-agent knowledge sharing", level: "Foundation", icon: <Boxes /> },
    ],
    strategies: {
      sqli: {
        title: isKo ? "SQLi 분석 전략" : "SQLi Analysis Strategy",
        content: isKo
          ? "데이터베이스 쿼리 생성 과정(SQL, NoSQL, ORM)을 정밀 추적하여, 매개변수화되지 않은 입력 슬롯을 통한 구조적 변조 가능성을 식별합니다. 화이트박스 코드 분석을 통해 소스-투-싱크(Source-to-Sink) 전체 경로를 증명합니다."
          : "Traces database query construction (SQL, NoSQL, ORM) to identify structural manipulation opportunities through unparameterized input slots. Uses white-box analysis to prove end-to-end source-to-sink paths."
      },
      codei: {
        title: isKo ? "Code Injection 분석 전략" : "Code Injection Strategy",
        content: isKo
          ? "OS 명령 실행 함수(child_process, eval, template engine)로 유입되는 입력값의 이스케이프 및 화이트리스트 검증 미비점을 추적합니다. 외부 입력이 시스템 명령어나 실행 가능한 코드로 해석되는 지점을 식별합니다."
          : "Traces input to OS command execution sinks (child_process, eval, templates) where input isn't properly escaped or whitelisted. Identifies points where user input interprets as system commands."
      },
      pathi: {
        title: isKo ? "Path Traversal 분석 전략" : "Path Traversal Strategy",
        content: isKo
          ? "모든 파일시스템 작업(읽기, 쓰기, 포함)의 경로 생성 로직을 분석합니다. chroot 이탈이나 path.resolve 우회 가능성을 검토하여 비인가 파일 접근 및 시스템 파일 유출 위험을 진단합니다."
          : "Examines filesystem operations (read, write, include) to ensure path construction doesn't allow traversal or access to restricted files. Tests for chroot escapes and path resolution bypasses."
      },
      xss: {
        title: isKo ? "XSS Hunter 분석 전략" : "XSS Hunter Strategy",
        content: isKo
          ? "클라이언트 사이드 렌더링 시 데이터가 DOM의 특정 컨텍스트(HTML Content, Attribute, JS String)에 적합하게 인코딩되지 않은 '컨텍스트 미스매치'를 정밀 타격합니다. 브라우저 환경에서의 실제 실행 가능성을 시뮬레이션합니다."
          : "Identifies context mismatches in client-side rendering where untrusted data is not encoded correctly for its specific DOM location (HTML, attributes, JS strings). Simulates actual execution in browser environments."
      },
      auth: {
        title: isKo ? "Auth Auditor 분석 전략" : "Auth Auditor Strategy",
        content: isKo
          ? "인증 메커니즘(JWT, 세션 관리, MFA, OAuth)의 설계 및 구현 결함을 전수 조사합니다. 취약한 암호화 알고리즘 사용, 안전하지 않은 토큰 저장 방식, 인증 우회 로직 등을 분석하여 계정 탈취 위협을 진단합니다."
          : "Audits authentication mechanisms (JWT, sessions, MFA, OAuth) for design and implementation flaws. Analyzes weak crypto, insecure storage, and bypass logic to detect account takeover risks."
      },
      ssrf: {
        title: isKo ? "SSRF Analyst 분석 전략" : "SSRF Analyst Strategy",
        content: isKo
          ? "서버에서 발생하는 모든 아웃바운드 HTTP 요청을 매핑합니다. 사용자가 요청 URL이나 호스트를 제어하여 내부 서비스, 관리자 콘솔, 또는 클라우드 메타데이터(IMDS) 엔드포인트에 접근할 수 있는지 확인합니다."
          : "Maps outbound server-side HTTP requests to see if they can be redirected to internal or unintended external resources like admin consoles or cloud metadata (IMDS) endpoints."
      },
      authz: {
        title: isKo ? "AuthZ/RBAC 분석 전략" : "AuthZ/RBAC Strategy",
        content: isKo
          ? "역할 기반 접근 제어(RBAC)와 객체 소유권 검증 로직을 매핑합니다. 비인가 사용자가 타인의 데이터를 조회(IDOR)하거나 관리자 기능에 접근(Privilege Escalation)할 수 있는 수평/수직적 권한 상승 경로를 식별합니다."
          : "Analyzes Role-Based Access Control (RBAC) and object ownership to find IDOR or privilege escalation flaws. Identifies paths where users can access unauthorized data or admin functions."
      },
      ssti: {
        title: isKo ? "ServerSide Template Injection 타격 전략" : "SSTI Strategy",
        content: isKo
          ? "앞선 분석 단계에서 도출된 취약점 가설을 기반으로, 템플릿 표현식 평가 가능 여부를 검증하는 페이로드를 구성합니다. 실제 운영 환경의 보안 통제를 고려하여 탐지·차단 지점을 확인하고, 그 결과를 통해 정보 노출 또는 시스템 영향 가능성을 재현 가능한 증거로 확인합니다."
          : "Based on the vulnerability hypotheses derived in the preceding analysis phase, payloads are constructed to verify whether template expressions can be evaluated. Taking into account the security controls of the actual operational environment, detection and blocking points are assessed, and the results are used to establish reproducible evidence of potential information disclosure or system impact."
      },
      phase01: {
        title: isKo ? "01. 기초 탐색 (Pre-Recon)" : "01. Pre-Recon Phase",
        content: isKo
          ? "대상 인프라의 외부 노출 면을 탐계합니다. nmap을 통한 포트 스캐닝, subfinder를 활용한 서브도메인 수집, whatweb을 이용한 웹 기술 스택 식별을 통해 진단을 위한 기초 데이터를 확보합니다."
          : "Scouts the external exposure of the target infrastructure. Uses nmap for port scanning, subfinder for subdomain collection, and whatweb for identifying tech stacks to gather foundational data."
      },
      phase02: {
        title: isKo ? "02. 표면 매핑 (Recon Mapping)" : "02. Recon Mapping Phase",
        content: isKo
          ? "수집된 데이터를 바탕으로 공격 가능한 애플리케이션 지도를 그립니다. 모든 엔드포인트와 입력 벡터를 식별하고, 침투 우선순위를 결정하여 효율적인 분석 경로를 설계합니다."
          : "Builds a map of the attack surface based on gathered data. Identifies all endpoints and input vectors, prioritizing targets to design an efficient analysis path."
      },
      phase03: {
        title: isKo ? "03. 전문 분석 (Analysis)" : "03. Specialist Analysis",
        content: isKo
          ? "8종의 전문 AI 에이전트가 투입되는 핵심 단계입니다. 소스 코드 분석과 동적 테스트를 병행하여 비즈니스 로직 결함부터 심층적인 인젝션 취약점까지 정밀하게 진단합니다."
          : "The core phase where 8 specialist AI agents are deployed. Combines source code analysis with dynamic testing to detect everything from business logic flaws to deep injection vulnerabilities."
      },
      phase04: {
        title: isKo ? "04. 실제 타격 (Exploit)" : "04. Exploitation Phase",
        content: isKo
          ? "식별된 취약점의 실질적인 위험성을 증명합니다. 단순한 탐지를 넘어 시스템 권한 획득이나 데이터 유출 가능성을 PoC(Proof of Concept)로 입증하여 위협의 증거를 확보합니다."
          : "Proves the actual risk of identified vulnerabilities. Goes beyond detection to demonstrate potential system compromise or data breach through PoC (Proof of Concept) evidence."
      },
      phase05: {
        title: isKo ? "05. 결과 보고 (Reporting)" : "05. Reporting Phase",
        content: isKo
          ? "모든 진단 과정을 종합하여 기술 및 경영 보고서를 생성합니다. 발견된 취약점의 위험도 수치화, 수정 권고 사항, 그리고 전체적인 보안 수준에 대한 종합적인 가이드를 제공합니다."
          : "Synthesizes the entire process into technical and executive reports. Provides risk scoring, remediation advice, and a comprehensive guide on the overall security posture."
      },
      orchestrator: {
        title: isKo ? "Orchestrator (전역 관리자)" : "Orchestrator (Top Level)",
        content: isKo
          ? "전체 펜테스트 세션의 '두뇌' 역할을 수행합니다. 에이전트 간의 페이즈 전환을 관리하고, 세션의 영속성을 보장하며, 복잡한 진단 워크플로우가 중단 없이 목표를 달성하도록 조율합니다."
          : "Serves as the 'brain' of the entire pentest session. Manages phase transitions between agents, ensures session persistence, and orchestrates complex diagnostic workflows to reach targets without interruption."
      },
      mcp: {
        title: isKo ? "MCP Tool Layer (실행 계층)" : "MCP Tool Layer (Execution)",
        content: isKo
          ? "AI 에이전트가 실제 환경과 상호작용하는 핵심 인터페이스입니다. Playwright(브라우저), Bash(터미널), Git(형상 관리) 등 다양한 도구를 통합하여 에이전트가 현실의 보안 도구들을 자율적으로 다룰 수 있게 합니다."
          : "The core interface for AI agents to interact with real-world environments. Integrates tools like Playwright (browser), Bash (terminal), and Git to enable agents to autonomously handle real security tools."
      },
      pipeline: {
        title: isKo ? "Deliverable Pipeline (데이터 기반)" : "Deliverable Pipeline (Foundation)",
        content: isKo
          ? "에이전트 간의 지식 공유를 담당하는 데이터 파이프라인입니다. 각 단계에서 도출된 결과물(Deliverables)을 표준화된 형식으로 관리하여, 이전 단계의 정보가 누락 없이 다음 분석 단계로 전달되도록 보장합니다."
          : "The data pipeline responsible for knowledge sharing between agents. Manages deliverables from each stage in a standardized format, ensuring seamless information flow from one analysis phase to the next."
      },
      feat_parallel: {
        title: isKo ? "8x 병렬 가속 전략" : "8x Parallel Strategy",
        content: isKo
          ? "단일 분석 흐름에 의존하지 않고, 여러 취약점 전문가 에이전트가 동시에 대상 애플리케이션의 서로 다른 영역을 탐색합니다. 이를 통해 기존 선형적 진단 도구 대비 최대 8배 이상의 신속한 전수조사 결과를 도출합니다."
          : "Instead of relying on a single flow, multiple specialist agents simultaneously explore different areas of the application. This achieves full coverage up to 8 times faster than traditional linear pentesting tools."
      },
      feat_healing: {
        title: isKo ? "자가 치유 메커니즘" : "Self-Healing Mechanism",
        content: isKo
          ? "진단 중 에러나 환경적 제약에 직면할 경우, Git 체크포인트를 활용하여 안전한 상태로 자동 롤백합니다. 이후 AI가 에러 원인을 분석하고 대체 분석 경로를 즉시 설계하여 중단 없는 진단을 수행합니다."
          : "When facing errors or environmental constraints, the system automatically rolls back to a safe state using Git checkpoints. The AI then analyzes the cause and immediately designs an alternative path for uninterrupted auditing."
      },
      feat_hybrid: {
        title: isKo ? "하이브리드 지능 시스템" : "Hybrid Intelligence System",
        content: isKo
          ? "보안 정책상 민감한 컨텍스트는 로컬 vLLM(gpt-oss-20b)에서 처리하고, 고도의 추론이 필요한 핵심 분석은 업계 최고 사양의 Claude 4.5를 활용합니다. 성능과 프라이버시, 효율성 사이의 최적의 균형을 제공합니다."
          : "Processes sensitive context on local vLLM (gpt-oss-20b) for privacy, while leveraging top-tier Claude 4.5 for core reasoning. Provides the optimal balance between performance, privacy, and efficiency."
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#05070a] text-foreground font-sans overflow-x-hidden" ref={containerRef}>

        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none"
               style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
        </div>

        {/* Hero Section */}
        <section className="relative pt-40 pb-16 px-6 z-10">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-12"
            >
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <Logo className="w-48 h-48" />
              </Link>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-7xl md:text-9xl font-black mb-6 tracking-tighter"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
                {content.hero.title}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-light text-gray-500 mb-12"
            >
              {content.hero.subtitle} — <span className="text-gray-300">{content.hero.desc}</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-6"
            >
              <Link href="/scans" className="px-8 py-4 rounded-xl bg-primary text-white font-bold hover:scale-105 transition-transform flex items-center gap-2 glow-primary">
                {isKo ? "지금 시작하기" : "Get Started Now"} <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#philosophy" className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors">
                {isKo ? "더 알아보기" : "Learn More"}
              </a>
            </motion.div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="pt-12 pb-32 px-6 relative z-10 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-8"
            >
              <h2 className="text-sm font-mono text-primary uppercase tracking-[0.3em]">{content.philosophy.title}</h2>
              <h3 className="text-4xl md:text-6xl font-bold leading-tight underline decoration-primary/30 underline-offset-8">
                &ldquo;{content.philosophy.quote}&rdquo;
              </h3>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                {content.philosophy.desc}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mt-24">
              {content.features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setSelectedAgent({ id: f.id, name: f.title, icon: f.icon, color: 'text-primary', description: f.desc, kind: "feature" })}
                  className="glass-card p-10 group hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">{f.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6">{f.desc}</p>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-primary uppercase tracking-widest">{isKo ? "설명 보기" : "View Details"}</span>
                    <Info className="w-3 h-3 text-primary" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission / Story Section (Restored from previous version) */}
        <section className="py-32 px-6 border-t border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-sm font-mono text-primary uppercase tracking-[0.3em]">{isKo ? "우리의 미션" : "Our Mission"}</h2>
                <h3 className="text-5xl font-bold tracking-tight">{isKo ? "언제 어디서든, 장벽 없는 보안." : "Access Anything, Anytime."}</h3>
              </div>

              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  {isKo
                    ? "전설적인 '어디로든 문'에서 영감을 받은 DokodemoDoor는 보안 진단의 모든 장벽을 허물고자 탄생했습니다. 복잡한 설정이나 수동 스크립트 체이닝 없이도, 누구나 정밀한 진단을 수행할 수 있는 세상을 꿈꿉니다."
                    : "Inspired by the legendary 'Everywhere Door', DokodemoDoor was created to eliminate the friction in security auditing. We envision a world where deep auditing is possible without complex setups or manual script chaining."}
                </p>
                <p>
                  {isKo
                    ? "강력한 스캔 엔진과 인공지능의 직관적인 추론 능력을 결합하여, 공격자가 취약점을 발견하기 전에 먼저 찾아내어 안전한 디지털 환경을 구축하는 것이 우리의 핵심 가치입니다."
                    : "By combining a robust scanning engine with the intuitive reasoning of artificial intelligence, we enable developers and security teams to find bugs before attackers do."}
                </p>
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-3 text-primary font-bold bg-primary/5 px-4 py-2 rounded-lg border border-primary/20">
                  <Bot className="w-5 h-5" /> {isKo ? "DeepAgent 지능" : "DeepAgent"}
                </div>
                <div className="flex items-center gap-3 text-accent font-bold bg-accent/5 px-4 py-2 rounded-lg border border-accent/20">
                  <Sparkles className="w-5 h-5" /> {isKo ? "AI 기반 자율성" : "AI Driven"}
                </div>
                <div className="flex items-center gap-3 text-emerald-400 font-bold bg-emerald-400/5 px-4 py-2 rounded-lg border border-emerald-400/20">
                  <Zap className="w-5 h-5" /> {isKo ? "24/7 중단 없는 진단" : "Non-stop"}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              className="relative aspect-square"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl opacity-50 animate-pulse" />
              <div className="glass-card h-full flex items-center justify-center p-12 relative z-10 border-white/10">
                <div className="text-center">
                  <div className="relative mb-8">
                    <Server className="w-40 h-40 text-primary mx-auto opacity-20" />
                    <Activity className="w-20 h-20 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                  </div>
                  <p className="text-lg font-mono text-gray-400">DOKODEMODOOR PROTOCOL</p>
                  <p className="text-sm font-mono text-primary/60 mt-2">STATUS: SYSTEM_READY</p>
                </div>
              </div>
              {/* Decorative Floating Elements */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/20 blur-2xl rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 blur-2xl rounded-full" />
            </motion.div>
          </div>
        </section>

        {/* Specialist Agents Section */}
        <section className="py-32 px-6 bg-white/[0.01] relative z-10 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div className="space-y-4">
                <h2 className="text-sm font-mono text-accent uppercase tracking-[0.3em]">{isKo ? "전문 에이전트" : "Specialist Agents"}</h2>
                <h3 className="text-5xl font-bold text-gradient">{isKo ? "분석 전담 에이전트" : "Autonomous Specialists"}</h3>
              </div>
              <p className="text-gray-500 max-w-md text-right">
                {isKo
                  ? "7종의 정밀 분석 전문가와 공격 에이전트가 협업하여 빈틈없는 침투 테스트를 수행합니다."
                  : "Seven precision analysis experts and one exploitation specialist collaborate for seamless penetration testing."}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {content.agents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedAgent({ ...agent, kind: "strategy" })}
                  className="glass-card p-8 flex flex-col items-center text-center group cursor-pointer hover:border-accent/50 transition-all border-white/5"
                >
                  <div className={`mb-6 p-4 rounded-full bg-white/5 ${agent.color} group-hover:bg-white/10 transition-colors`}>
                    {agent.icon}
                  </div>
                  <span className="font-bold text-lg mb-2">{agent.name}</span>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{isKo ? "전략 보기" : "View Strategy"}</span>
                    <Info className="w-3 h-3 text-gray-500" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-32 px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-[0.3em] mb-4">{isKo ? "실행 프로세스" : "Execution Workflow"}</h2>
              <h3 className="text-5xl font-bold mb-8 italic italic decoration-emerald-400/30 underline underline-offset-4">{isKo ? "엔드 투 엔드 자율화" : "End-to-End Automation"}</h3>
              <div className="h-px w-40 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent mx-auto" />
            </div>

            <div className="relative">
              {/* Vertical line for mobile, horizontal for desktop (simplified representation) */}
              <div className="hidden lg:block absolute top-[60px] left-0 w-full h-px bg-white/10 z-0" />

              <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 relative z-10">
                {content.workflow.map((w, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    onClick={() => setSelectedAgent({ id: `phase${w.phase}`, name: w.name, icon: w.icon, color: 'text-emerald-400', description: w.desc, kind: "workflow" })}
                    className="flex flex-col items-center text-center space-y-6 cursor-pointer group"
                  >
                    <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative group-hover:border-emerald-400/50 transition-colors shadow-2xl">
                      <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-emerald-500 text-black font-black flex items-center justify-center shadow-lg text-sm">
                        {w.phase}
                      </div>
                      <div className="text-emerald-400 scale-150 group-hover:rotate-12 transition-transform">
                        {w.icon}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold group-hover:text-emerald-400 transition-colors">{w.name}</h4>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{isKo ? "설명 보기" : "View Details"}</span>
                        <Info className="w-3 h-3 text-gray-500" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="py-32 px-6 bg-white/[0.01] relative z-10">
          <div className="max-w-5xl mx-auto text-center mb-24">
             <h2 className="text-sm font-mono text-indigo-400 uppercase tracking-[0.3em] mb-4">{isKo ? "시스템 아키텍처" : "System Architecture"}</h2>
             <h3 className="text-5xl font-bold">{isKo ? "3-계층 운영 구조" : "3-Layer Managed Stack"}</h3>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {content.architecture.map((layer, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                onClick={() => setSelectedAgent({ id: layer.id, name: layer.name, icon: layer.icon, color: 'text-indigo-400', description: layer.desc, kind: "architecture" })}
                className="glass-card p-12 flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-white/10 cursor-pointer border-white/5 hover:border-indigo-400/50 transition-all"
              >
                <div className="text-left flex items-center gap-6">
                  <div className="p-4 rounded-2xl bg-white/5 text-indigo-400 group-hover:scale-110 transition-transform">
                    {layer.icon}
                  </div>
                  <div>
                    <span className="text-indigo-400 font-mono text-sm block mb-2">{layer.level}</span>
                    <h4 className="text-3xl font-black italic">{layer.name}</h4>
                  </div>
                </div>
                <div className="h-px bg-white/10 flex-grow mx-8 hidden md:block" />
                <div className="flex flex-col items-end gap-2">
                  <p className="text-gray-400 text-lg text-right">
                    {layer.desc}
                  </p>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">{isKo ? "자세히 보기" : "View Details"}</span>
                    <Info className="w-3 h-3 text-indigo-400" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-40 px-6 text-center relative z-10">
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="glass-card max-w-4xl mx-auto p-20 border-primary/30"
           >
             <Link href="/" className="inline-block hover:opacity-100 transition-opacity">
               <Logo className="w-20 h-20 mx-auto mb-10 opacity-50" />
             </Link>
             <h3 className="text-5xl md:text-6xl font-black mb-8 italic">
               {isKo ? "전통적인 침투 테스트의 한계를 파괴하세요." : "Break the boundaries of manual testing."}
             </h3>
             <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
               {isKo
                 ? "DokodemoDoor는 당신의 보안 인프라를 지키는 가장 강력한 투명이자 무기가 될 것입니다."
                 : "DokodemoDoor will be the strongest shield and weapon guarding your security infrastructure."}
             </p>
             <Link href="/scans" className="inline-flex items-center gap-4 px-12 py-6 rounded-2xl bg-white text-black font-black hover:scale-105 transition-transform">
               {isKo ? "보안 진단 시작하기" : "Initialize Audit"} <Terminal className="w-6 h-6" />
             </Link>
           </motion.div>
        </section>

        {/* Footer info */}
        <footer className="py-20 px-6 border-t border-white/5 text-center relative z-10">
          <p className="text-gray-500 flex items-center justify-center gap-2 mb-4">
            Built with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> for the Security Community & Researchers.
          </p>
          <div className="flex flex-col gap-2">
            <p className="text-gray-700 text-xs font-mono">v1.0.0-DOKODEMODOOR STABLE RELEASE</p>
            <p className="text-gray-800 text-[10px] font-mono uppercase tracking-[0.5em]">2026 KEYGRAPH HQ | DOKODEMODOOR</p>
          </div>
        </footer>

        {/* Agent Strategy Modal */}
        <AnimatePresence>
          {selectedAgent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedAgent(null)}
                className="absolute inset-0"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xl glass-card p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10"
              >
                <div className={`p-8 ${selectedAgent.color.replace('text-', 'bg-')}/5 border-b border-white/5 flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-white/5 ${selectedAgent.color}`}>
                      {selectedAgent.icon}
                    </div>
                    <div>
                      {selectedAgent.kind === "strategy" && selectedAgent.id in content.strategies ? (
                        <>
                          <h3 className="text-2xl font-black">
                            {content.strategies[selectedAgent.id as StrategyKey].title}
                          </h3>
                          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Autonomous Specialist Profile</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-2xl font-black">{selectedAgent.name}</h3>
                          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            {selectedAgent.kind === "feature"
                              ? "Product Capability"
                              : selectedAgent.kind === "workflow"
                                ? "Workflow Phase"
                                : "Architecture Layer"}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-gray-400 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                      <Terminal className="w-4 h-4" />
                      {isKo ? "분석 로직 (Analysis Logic)" : "Analysis Logic"}
                    </div>
                    <p className="text-gray-300 leading-relaxed text-lg font-light">
                      {selectedAgent.kind === "strategy" && selectedAgent.id in content.strategies
                        ? content.strategies[selectedAgent.id as StrategyKey].content
                        : (selectedAgent.description || (isKo ? "상세 정보가 없습니다." : "No additional details available."))}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Status</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                         Operational
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Intelligence</span>
                      <span className="text-primary font-bold">Hybrid LLM Hub</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end">
                   <button
                     onClick={() => setSelectedAgent(null)}
                     className="px-8 py-3 rounded-xl bg-white text-black font-black hover:scale-105 transition-transform text-sm"
                   >
                     {isKo ? "확인" : "Dismiss"}
                   </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
