import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import type { RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

const MAP: Record<RiskLevel, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
  low: { label: "Low Risk", cls: "bg-success/15 text-success border-success/30", Icon: ShieldCheck },
  medium: { label: "Medium Risk", cls: "bg-warning/15 text-warning border-warning/30", Icon: ShieldAlert },
  high: { label: "High Risk", cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: AlertTriangle },
  critical: { label: "Critical Risk", cls: "bg-destructive text-destructive-foreground border-destructive", Icon: ShieldX },
};

export function RiskBadge({ level, className, pulse }: { level: RiskLevel; className?: string; pulse?: boolean }) {
  const { label, cls, Icon } = MAP[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", cls, className)}>
      <Icon size={13} className={cn(level === "critical" && pulse && "animate-pulse-ring rounded-full")} />
      {label}
    </span>
  );
}
