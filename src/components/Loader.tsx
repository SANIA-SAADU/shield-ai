import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground", className)}>
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      {label && <p className="text-sm animate-pulse">{label}</p>}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-5", className)}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-muted/40 to-transparent animate-shimmer" />
      <div className="space-y-3">
        <div className="h-10 w-10 rounded-lg bg-muted/60" />
        <div className="h-6 w-24 rounded bg-muted/60" />
        <div className="h-3 w-32 rounded bg-muted/40" />
      </div>
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-12 text-center">
      {icon && <div className="text-muted-foreground/50">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
