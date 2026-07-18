import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, MapPin, TrendingUp, TrendingDown, Minus, Flame, Filter,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader, EmptyState } from "@/components/Loader";
import { dataService } from "@/services/data";
import { cn } from "@/lib/utils";
import type { CrimeHotspot } from "@/types";

const SCAM_TYPES = [
  { id: "all", label: "All Types", color: "hsl(199 89% 52%)" },
  { id: "digital_arrest", label: "Digital Arrest", color: "hsl(0 72% 52%)" },
  { id: "fake_currency", label: "Fake Currency", color: "hsl(38 92% 55%)" },
  { id: "phishing", label: "Phishing", color: "hsl(262 70% 62%)" },
  { id: "investment", label: "Investment", color: "hsl(152 60% 42%)" },
];

const SCAM_COLOR: Record<string, string> = {
  digital_arrest: "hsl(0 72% 52%)",
  fake_currency: "hsl(38 92% 55%)",
  phishing: "hsl(262 70% 62%)",
  investment: "hsl(152 60% 42%)",
};

// Simplified India landmass outline (normalized 0-100 x, 0-100 y)
const INDIA_PATH =
  "M28 18 L35 14 L44 16 L52 14 L60 18 L66 22 L72 28 L78 34 L82 40 L80 46 L84 50 L88 56 L90 62 L86 68 L82 74 L76 78 L70 82 L66 86 L60 88 L54 84 L48 80 L44 74 L40 68 L36 62 L32 56 L28 50 L24 44 L22 38 L24 30 L28 18 Z";

// Approx lat/lng bounds for India mapping onto viewBox 0-100
const LNG_MIN = 68;
const LNG_MAX = 89;
const LAT_MIN = 8;
const LAT_MAX = 36;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 100;
  const y = 100 - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 100;
  return { x, y };
}

export function HeatmapPage() {
  const [hotspots, setHotspots] = useState<CrimeHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<CrimeHotspot | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await dataService.getHotspots();
        if (active) setHotspots(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load hotspots");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? hotspots : hotspots.filter((h) => h.scamType === filter)),
    [hotspots, filter]
  );

  const totalCases = filtered.reduce((a, h) => a + h.cases, 0);
  const avgIntensity = filtered.length ? Math.round(filtered.reduce((a, h) => a + h.intensity, 0) / filtered.length) : 0;

  if (loading) return <Loader label="Loading crime hotspots..." />;
  if (error) return <EmptyState title="Could not load heatmap" description={error} icon={<Map size={32} />} />;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
      <PageHeader
        title="Geospatial Crime Heatmap"
        description="Scam density across Indian cities — hotspots, fraud type concentration, and trend intelligence."
        icon={<Map size={22} />}
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5">
            <Flame size={15} className="text-destructive" />
            <span className="text-xs font-medium">{filtered.length} active zones</span>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Reported Cases</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{totalCases.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Average Intensity</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{avgIntensity}/10</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Rising Hotspots</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">
              {filtered.filter((h) => h.trend === "rising").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter size={13} /> Filter:</span>
        {SCAM_TYPES.map((t) => (
          <Button
            key={t.id}
            variant={filter === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(t.id)}
            className={cn("gap-2 text-xs", filter === t.id && "shadow")}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
            {t.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle className="text-base">India Heatmap</CardTitle>
            <p className="text-xs text-muted-foreground">Marker size = intensity · color = scam type</p>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-lg border border-border/40 bg-card/20">
              <div className="absolute inset-0 grid-bg opacity-20" />
              <svg viewBox="0 0 100 100" className="w-full" style={{ minHeight: 420 }}>
                <path d={INDIA_PATH} fill="hsl(var(--muted) / 0.25)" stroke="hsl(var(--border))" strokeWidth={0.4} />
                <path d={INDIA_PATH} fill="url(#heatGrad)" opacity={0.3} />
                <defs>
                  <radialGradient id="heatGrad">
                    <stop offset="0%" stopColor="hsl(0 72% 52%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(0 72% 52%)" stopOpacity={0} />
                  </radialGradient>
                </defs>

                {filtered.map((h, i) => {
                  const p = project(h.lat, h.lng);
                  const color = SCAM_COLOR[h.scamType] || "hsl(199 89% 52%)";
                  const radius = 1.5 + h.intensity * 0.45;
                  const isSel = selected?.id === h.id;
                  return (
                    <g key={h.id} transform={`translate(${p.x}, ${p.y})`} className="cursor-pointer" onClick={() => setSelected(h)}>
                      <motion.circle
                        r={radius * 2.2}
                        fill={color}
                        opacity={0.18}
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2.5, delay: i * 0.2, repeat: Infinity }}
                      />
                      <motion.circle
                        r={radius}
                        fill={color}
                        stroke="hsl(var(--background))"
                        strokeWidth={isSel ? 0.6 : 0.3}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.04, type: "spring" }}
                        style={{ filter: isSel ? "brightness(1.3)" : "none" }}
                      />
                      {isSel && (
                        <g>
                          <rect x={-12} y={-14} width={24} height={5} rx={1} fill="hsl(var(--popover))" stroke="hsl(var(--border))" strokeWidth={0.2} />
                          <text fontSize={2.4} fill="hsl(var(--foreground))" textAnchor="middle" y={-10.5} className="font-semibold">{h.city}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {SCAM_TYPES.filter((t) => t.id !== "all").map((t) => (
                <span key={t.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                  {t.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">{selected.city}, {selected.state}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="gap-1.5 capitalize" variant="secondary">{selected.scamType.replace("_", " ")}</Badge>
                      <Badge variant={selected.trend === "rising" ? "destructive" : selected.trend === "stable" ? "secondary" : "outline"} className="capitalize gap-1">
                        {selected.trend === "rising" ? <TrendingUp size={11} /> : selected.trend === "declining" ? <TrendingDown size={11} /> : <Minus size={11} />}
                        {selected.trend}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Reported Cases</p>
                        <p className="mt-1 text-xl font-bold tabular-nums">{selected.cases.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Intensity</p>
                        <p className="mt-1 text-xl font-bold tabular-nums">{selected.intensity}/10</p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-xs text-muted-foreground">Intensity meter</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <span key={j} className={cn("h-4 flex-1 rounded-sm", j < selected.intensity ? "bg-destructive" : "bg-muted")} />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">All Hotspots</CardTitle>
              <p className="text-xs text-muted-foreground">Sorted by intensity</p>
            </CardHeader>
            <CardContent className="max-h-[340px] space-y-1.5 overflow-y-auto">
              {filtered.sort((a, b) => b.intensity - a.intensity).map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelected(h)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                    selected?.id === h.id ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card/30 hover:border-border"
                  )}
                >
                  <MapPin size={15} className="shrink-0" style={{ color: SCAM_COLOR[h.scamType] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{h.city}</p>
                    <p className="truncate text-[11px] capitalize text-muted-foreground">{h.scamType.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="hidden gap-0.5 sm:flex">
                      {Array.from({ length: 10 }).map((_, j) => (
                        <span key={j} className={cn("h-3 w-1 rounded-full", j < h.intensity ? "bg-destructive" : "bg-muted")} />
                      ))}
                    </div>
                    <span className="text-xs font-bold tabular-nums">{h.intensity}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
