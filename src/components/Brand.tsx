import { Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Brand({ className, showText = true, size = "md" }: BrandProps) {
  const dims = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const iconSize = size === "lg" ? 20 : size === "sm" ? 16 : 18;
  const textSize = size === "lg" ? "text-xl" : "text-base";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative grid place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30", dims)}>
        <ShieldCheck size={iconSize} className="text-primary-foreground" strokeWidth={2.5} />
        <Shield size={iconSize + 4} className="absolute text-primary-foreground/20" strokeWidth={1} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn("font-bold tracking-tight", textSize)}>
            Shield<span className="text-primary">AI</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
            Detect · Prevent · Protect
          </span>
        </div>
      )}
    </div>
  );
}
