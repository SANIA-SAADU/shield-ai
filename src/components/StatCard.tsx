import { motion } from "framer-motion";
import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; up: boolean };
  accent?: "primary" | "success" | "warning" | "destructive";
  delay?: number;
  className?: string;
}

const ACCENT: Record<string, string> = {
  primary: "from-primary/20 to-primary/5 text-primary",
  success: "from-success/20 to-success/5 text-success",
  warning: "from-warning/20 to-warning/5 text-warning",
  destructive: "from-destructive/20 to-destructive/5 text-destructive",
};

export function StatCard({ icon: Icon, label, value, hint, trend, accent = "primary", delay = 0, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn("glass relative overflow-hidden rounded-xl border border-border/60 p-5", className)}
    >
      <div className={cn("absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl opacity-50", ACCENT[accent])} />
      <div className="relative flex items-start justify-between">
        <div className={cn("grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br", ACCENT[accent])}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
        {trend && (
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trend.up ? "text-success" : "text-destructive")}>
            {trend.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trend.value}
          </span>
        )}
      </div>
      <div className="relative mt-4">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground/70">{hint}</div>}
      </div>
    </motion.div>
  );
}
