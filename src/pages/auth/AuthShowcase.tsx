import { motion } from "framer-motion";
import {
  ShieldCheck, AlertTriangle, PhoneCall, Banknote, Network, Map, Bot, Siren,
} from "lucide-react";
import { Brand } from "@/components/Brand";

const FEATURES = [
  { icon: PhoneCall, title: "Scam Call Intelligence", desc: "NLP-powered threat & authority detection" },
  { icon: Banknote, title: "Fake Currency Detection", desc: "Computer-vision authenticity scoring" },
  { icon: Network, title: "Fraud Network Graph", desc: "Trace numbers to banks & devices" },
  { icon: Map, title: "Crime Heatmap", desc: "Geospatial scam hotspot mapping" },
  { icon: Bot, title: "Multilingual Chatbot", desc: "English · Telugu · Hindi assistant" },
  { icon: Siren, title: "Emergency Action Agent", desc: "Auto-generate NCRB complaints" },
];

export function AuthShowcase() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/15 via-card to-accent/10 p-10">
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative">
        <Brand size="lg" />
      </div>

      <div className="relative space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h2 className="text-3xl font-bold leading-tight">
            Detect. Prevent. <span className="text-primary">Protect.</span>
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            An intelligent digital public-safety platform that stops fraud before money is lost — powered by multi-source AI intelligence.
          </p>
        </motion.div>

        <div className="grid max-w-md gap-2.5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-card/40 p-2.5 backdrop-blur-sm"
            >
              <f.icon size={16} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-semibold leading-tight">{f.title}</p>
                <p className="text-[10px] leading-tight text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck size={14} className="text-success" />
        Bank-grade encryption · Supabase Auth · Your data stays private
      </div>
    </div>
  );
}

export function AuthErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertTriangle size={15} className="shrink-0" />
      <span>{error}</span>
    </motion.div>
  );
}
