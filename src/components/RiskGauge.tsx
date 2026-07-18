import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function RiskGauge({ value, size = 180, label, sublabel, className }: RiskGaugeProps) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  const color = pct >= 85 ? "hsl(0 72% 52%)" : pct >= 70 ? "hsl(20 80% 52%)" : pct >= 45 ? "hsl(38 92% 55%)" : "hsl(152 60% 42%)";

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-bold tabular-nums"
          style={{ fontSize: size * 0.22, color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {Math.round(pct)}%
        </motion.span>
        {label && <span className="text-xs font-medium text-muted-foreground mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{sublabel}</span>}
      </div>
    </div>
  );
}
