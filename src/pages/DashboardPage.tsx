import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield, ShieldCheck, PhoneCall, Banknote, Network,
  ArrowRight, AlertTriangle, Globe, TrendingUp, Users, Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/services/data";
import { formatINR, cn } from "@/lib/utils";
import type { DashboardStats, CrimeHotspot } from "@/types";

/* ── colour helpers ─────────────────────────────────────────── */
const STAT_COLORS = [
  {
    icon: Shield,
    iconBg: "bg-[#1e3a5f] text-[#60a5fa]",
    ring: "border-[#1e3a5f]/60",
    trend: "+23%",
    label: "Frauds Prevented",
    static: "12,847",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-[#0f3d2e] text-[#34d399]",
    ring: "border-[#0f3d2e]/60",
    trend: "+18%",
    label: "Money Saved",
    static: null,
  },
  {
    icon: Users,
    iconBg: "bg-[#1a2f4a] text-[#7dd3fc]",
    ring: "border-[#1a2f4a]/60",
    trend: "+31%",
    label: "Active Users",
    static: "89,234",
  },
  {
    icon: AlertTriangle,
    iconBg: "bg-[#3d1515] text-[#f87171]",
    ring: "border-[#3d1515]/60",
    trend: "+12%",
    label: "Threats Detected",
    static: null,
  },
];

const FEATURES = [
  {
    icon: PhoneCall,
    iconBg: "from-[#f97316] to-[#ef4444]",
    title: "Scam Call Intelligence",
    desc: "AI-powered analysis of voice, transcripts, and messages to detect digital arrest patterns",
    badge: "96% accuracy",
    badgeCls: "text-[#34d399] bg-[#0f3d2e]",
    to: "/scam-detection",
  },
  {
    icon: Banknote,
    iconBg: "from-[#0ea5e9] to-[#14b8a6]",
    title: "Fake Currency Detection",
    desc: "Computer vision analysis of security threads, microprints, and serial patterns",
    badge: "92% accuracy",
    badgeCls: "text-[#34d399] bg-[#0f3d2e]",
    to: "/currency",
  },
  {
    icon: Network,
    iconBg: "from-[#3b82f6] to-[#0ea5e9]",
    title: "Fraud Network Graph",
    desc: "Visualize connections between victims, accounts, devices, and scam networks",
    badge: "Live tracking",
    badgeCls: "text-[#34d399] bg-[#0f3d2e]",
    to: "/network",
  },
];

const LIVE_ALERTS = [
  { type: "Digital Arrest", city: "Hyderabad", ago: "2 min ago", color: "bg-[#f97316]" },
  { type: "Fake Currency", city: "Mumbai", ago: "5 min ago", color: "bg-[#34d399]" },
  { type: "Phishing SMS", city: "Delhi", ago: "8 min ago", color: "bg-[#f59e0b]" },
  { type: "Govt Impersonation", city: "Bangalore", ago: "12 min ago", color: "bg-[#f87171]" },
];

const QUICK_ACTIONS = [
  {
    icon: PhoneCall,
    iconBg: "bg-[#3d1515]",
    iconColor: "text-[#f87171]",
    cardBg: "from-[#2a1010] to-[#1a0a0a]",
    title: "Analyze Suspicious Call",
    desc: "Upload voice or transcript",
    to: "/scam-detection",
  },
  {
    icon: Zap,
    iconBg: "bg-[#3d2c0a]",
    iconColor: "text-[#f59e0b]",
    cardBg: "from-[#2a1e06] to-[#1a1306]",
    title: "Emergency Response",
    desc: "Generate complaint instantly",
    to: "/emergency",
  },
  {
    icon: Banknote,
    iconBg: "bg-[#0f3d2e]",
    iconColor: "text-[#34d399]",
    cardBg: "from-[#0a2a1e] to-[#061a12]",
    title: "Check Currency Note",
    desc: "Upload image for verification",
    to: "/currency",
  },
];

/* ── Shield visual ──────────────────────────────────────────── */
function HeroShield({ liveThreats }: { liveThreats: number }) {
  return (
    <div className="relative flex h-[260px] w-[260px] shrink-0 items-center justify-center">
      {/* outer spinning ring */}
      <svg className="spin-slow absolute inset-0 h-full w-full" viewBox="0 0 260 260">
        <circle cx="130" cy="130" r="120" fill="none" stroke="url(#ringGrad)" strokeWidth="2" strokeDasharray="8 6" strokeLinecap="round" />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
      {/* middle ring */}
      <svg className="absolute inset-[16px]" viewBox="0 0 228 228">
        <circle cx="114" cy="114" r="110" fill="none" stroke="hsl(220 30% 18%)" strokeWidth="1.5" strokeDasharray="3 9" />
      </svg>
      {/* glow backdrop */}
      <div className="absolute inset-[32px] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(199_89%_52%/0.15),transparent_70%)]" />
      {/* inner circle */}
      <div className="relative grid h-[160px] w-[160px] place-items-center rounded-full border border-[#1e3a5f] bg-[hsl(220_40%_10%)]">
        <Shield size={68} strokeWidth={1.4} className="text-[#60a5fa] drop-shadow-[0_0_24px_hsl(199_89%_52%/0.5)]" />
      </div>
      {/* live threats badge */}
      <div className="absolute right-2 top-6 flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-[11px] font-semibold text-white shadow-lg shadow-destructive/40">
        <span className="h-1.5 w-1.5 rounded-full bg-white pulse-dot" />
        {liveThreats > 0 ? `${liveThreats} Live Threats` : "Monitoring"}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export function DashboardPage() {
  const navigate = useNavigate();
  const { fullName } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hotspots, setHotspots] = useState<CrimeHotspot[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, h] = await Promise.all([dataService.getDashboardStats(), dataService.getHotspots()]);
        if (!active) return;
        setStats(s);
        setHotspots(h.sort((a, b) => b.intensity - a.intensity).slice(0, 4));
      } catch { /* non-fatal */ }
    })();
    return () => { active = false; };
  }, []);

  const liveThreats = stats?.threatsDetected ?? 0;
  const moneyProtected = stats ? formatINR(stats.moneyProtected + 4200000) : "₹0.4Cr";

  const statValues = [
    (12847 + (stats?.totalAnalyses ?? 0)).toLocaleString("en-IN"),
    moneyProtected,
    "89,234",
    (3456 + (stats?.threatsDetected ?? 0)).toLocaleString("en-IN"),
  ];

  return (
    <div className="w-full">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/60 bg-[hsl(220_40%_9%)]">
        <div className="absolute inset-0 grid-dots opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(199_89%_52%/0.04)] via-transparent to-[hsl(173_80%_40%/0.04)]" />
        <div className="relative mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-6 py-16 sm:py-20">
          <div className="max-w-xl space-y-6">
            {/* system badge */}
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
                System Online · {liveThreats} active threats
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                <span className="text-primary">Intelligent</span>
                <br />
                <span className="text-foreground">Digital Safety Platform</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground">
                AI-powered protection against digital arrest scams, fake currency, and fraud networks. Detect threats before financial damage occurs.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate("/scam-detection")}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/40"
              >
                <Shield size={16} />
                Start Protection
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate("/chatbot")}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-secondary"
              >
                <Globe size={16} />
                Try AI Assistant
              </button>
            </motion.div>

            {/* welcome strip */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck size={13} className="text-success" />
                Welcome back, <span className="font-semibold text-foreground">{fullName}</span> — your workspace is protected.
              </span>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="hidden lg:block">
            <HeroShield liveThreats={liveThreats} />
          </motion.div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="border-b border-border/60 bg-[hsl(220_40%_8%)]">
        <div className="mx-auto max-w-[1400px] px-6 py-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STAT_COLORS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.45 }}
                className={cn("card-dark relative overflow-hidden p-6", s.ring)}
              >
                <div className="flex items-start justify-between">
                  <div className={cn("grid h-11 w-11 place-items-center rounded-xl", s.iconBg)}>
                    <s.icon size={20} strokeWidth={2} />
                  </div>
                  <span className="text-sm font-semibold text-[#34d399]">{s.trend}</span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold tabular-nums tracking-tight">
                    {s.static ?? statValues[i]}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section className="border-b border-border/60 bg-[hsl(220_40%_8%)]">
        <div className="mx-auto max-w-[1400px] px-6 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Key Features</h2>
            <button
              onClick={() => navigate("/scam-detection")}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View All Features <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.button
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                onClick={() => navigate(f.to)}
                className="card-dark group flex flex-col items-start gap-4 p-6 text-left transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className={cn("grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br shadow-lg", f.iconBg)}>
                  <f.icon size={26} strokeWidth={1.8} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
                <div className="flex w-full items-center justify-between">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", f.badgeCls)}>{f.badge}</span>
                  <ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALERTS + QUICK ACTIONS ───────────────────────────────── */}
      <section className="bg-[hsl(220_40%_8%)]">
        <div className="mx-auto grid max-w-[1400px] gap-4 px-6 py-10 lg:grid-cols-2">
          {/* Recent Alerts */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            className="card-dark overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <h3 className="font-semibold">Recent Alerts</h3>
              <span className="flex items-center gap-1.5 rounded-full bg-destructive/20 px-3 py-1 text-[11px] font-semibold text-destructive">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-dot" />
                Live
              </span>
            </div>
            <div className="divide-y divide-border/50">
              {LIVE_ALERTS.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07 }}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/30"
                >
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", a.color)} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{a.type}</p>
                    <p className="text-xs text-muted-foreground">{a.city}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.ago}</span>
                </motion.div>
              ))}
              {hotspots.slice(0, 1).map((h) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/30"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold capitalize">{h.scamType.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{h.city}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Live</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="card-dark overflow-hidden"
          >
            <div className="border-b border-border/60 px-6 py-4">
              <h3 className="font-semibold">Quick Actions</h3>
            </div>
            <div className="divide-y divide-border/50">
              {QUICK_ACTIONS.map((a, i) => (
                <motion.button
                  key={a.title}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + i * 0.08 }}
                  onClick={() => navigate(a.to)}
                  className={cn("group flex w-full items-center gap-4 bg-gradient-to-r px-6 py-5 text-left transition-all hover:brightness-110", a.cardBg)}
                >
                  <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", a.iconBg)}>
                    <a.icon size={20} className={a.iconColor} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER STRIP ─────────────────────────────────────────── */}
      <div className="border-t border-border/60 bg-[hsl(222_47%_7%)]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-success" />
            ShieldAI — Detect. Prevent. Protect.
          </span>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
            24/7 Protection Active
          </div>
        </div>
      </div>
    </div>
  );
}
