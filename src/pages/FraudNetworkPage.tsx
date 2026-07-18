import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Users, Phone, Building2, Smartphone, FileWarning,
  Target, Share2, MapPin, Search, Loader2, Navigation, AlertTriangle, ShieldAlert, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, EmptyState } from "@/components/Loader";
import { dataService } from "@/services/data";
import { fraudGraphService } from "@/services/fraudGraph";
import { phoneTraceService, traceResultToNode, type PhoneTrace } from "@/services/phoneTrace";
import { cn } from "@/lib/utils";
import type { FraudNode, FraudNodeType, PhoneTraceRecord } from "@/types";

const TYPE_STYLE: Record<FraudNodeType, { color: string; bg: string; Icon: typeof Users; label: string }> = {
  victim: { color: "hsl(199 89% 60%)", bg: "hsl(199 89% 52% / 0.15)", Icon: Users, label: "Victim" },
  phone: { color: "hsl(0 72% 58%)", bg: "hsl(0 72% 52% / 0.15)", Icon: Phone, label: "Phone Number" },
  bank: { color: "hsl(38 92% 58%)", bg: "hsl(38 92% 55% / 0.15)", Icon: Building2, label: "Bank Account" },
  device: { color: "hsl(262 70% 68%)", bg: "hsl(262 70% 62% / 0.15)", Icon: Smartphone, label: "Device" },
  complaint: { color: "hsl(152 60% 50%)", bg: "hsl(152 60% 42% / 0.15)", Icon: FileWarning, label: "Complaint" },
};

function layoutNodes(nodes: FraudNode[], width: number, height: number): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  const cx = width / 2;
  const cy = height / 2;

  const byType: Record<string, FraudNode[]> = {};
  nodes.forEach((n) => { (byType[n.nodeType] ??= []).push(n); });

  const typeOrder: FraudNodeType[] = ["victim", "phone", "bank", "device", "complaint"];
  const rings = [0, 1, 2, 3, 4];

  typeOrder.forEach((type, ringIdx) => {
    const group = byType[type] || [];
    const radius = 80 + rings[ringIdx] * 95;
    group.forEach((node, i) => {
      const angle = (i / group.length) * Math.PI * 2 - Math.PI / 2 + ringIdx * 0.3;
      pos.set(node.nodeId, {
        x: cx + Math.cos(angle) * radius + (Math.sin(i) * 20),
        y: cy + Math.sin(angle) * radius + (Math.cos(i) * 20),
      });
    });
  });

  return pos;
}

export function FraudNetworkPage() {
  const [nodes, setNodes] = useState<FraudNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FraudNode | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [tracing, setTracing] = useState(false);
  const [traceResult, setTraceResult] = useState<PhoneTrace | null>(null);
  const [recentTraces, setRecentTraces] = useState<PhoneTraceRecord[]>([]);

  const W = 760;
  const H = 460;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await dataService.getFraudNetwork();
        if (!active) return;
        setNodes(data);
        dataService.listPhoneTraces().then(setRecentTraces).catch(() => {});
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load network");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleTrace = async () => {
    const phone = phoneInput.trim();
    if (!phone || phone.length < 6) {
      toast.error("Enter a valid phone number");
      return;
    }
    setTracing(true);
    setTraceResult(null);
    try {
      const trace = await phoneTraceService.trace(phone);
      setTraceResult(trace);
      const { nodes: newNodes } = traceResultToNode(trace, nodes);
      setNodes((prev) => {
        const existingIds = new Set(prev.map((n) => n.nodeId));
        const fresh = newNodes.filter((n) => !existingIds.has(n.nodeId));
        return [...prev, ...fresh];
      });
      await dataService.savePhoneTrace({
        phone: trace.phone,
        carrier: trace.carrier,
        registeredLocation: trace.registeredLocation,
        latitude: trace.latitude,
        longitude: trace.longitude,
        nearBanks: trace.nearBanks,
        nearestBank: trace.nearestBank,
        nearestBankDistanceM: trace.nearestBankDistanceM,
        insideBank: trace.insideBank,
        riskNotes: trace.riskNotes,
      });
      dataService.listPhoneTraces().then(setRecentTraces).catch(() => {});
      toast.success(`Traced to ${trace.registeredLocation}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Trace failed");
    } finally {
      setTracing(false);
    }
  };

  const positions = useMemo(() => layoutNodes(nodes, W, H), [nodes]);
  const clusters = useMemo(() => fraudGraphService.buildClusters(nodes), [nodes]);

  if (loading) return <Loader label="Building fraud network..." />;
  if (error) return <EmptyState title="Could not load network" description={error} icon={<Network size={32} />} />;

  const edges: { from: string; to: string }[] = [];
  nodes.forEach((n) => n.links.forEach((to) => edges.push({ from: n.nodeId, to })));

  const isHighlighted = (id: string) => {
    if (!selected && !hovered) return true;
    const focus = selected?.nodeId ?? hovered;
    if (focus === id) return true;
    const focusNode = nodes.find((n) => n.nodeId === focus);
    if (focusNode) return focusNode.links.includes(id) || nodes.some((n) => n.nodeId === id && n.links.includes(focus ?? ""));
    return false;
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
      <PageHeader
        title="Fraud Network Graph"
        description="Intelligence graph mapping relationships between victims, phone numbers, mule bank accounts, devices, and prior complaints."
        icon={<Network size={22} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(TYPE_STYLE).map(([type, s], i) => {
          const count = nodes.filter((n) => n.nodeType === type).length;
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass flex items-center gap-3 rounded-xl border border-border/60 p-4"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: s.bg, color: s.color }}>
                <s.Icon size={18} />
              </div>
              <div>
                <div className="text-xl font-bold tabular-nums">{count}</div>
                <div className="text-xs text-muted-foreground">{s.label}s</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Relationship Graph</CardTitle>
            <Badge variant="outline" className="gap-1.5">
              <Share2 size={12} /> {clusters.length} networks
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTrace(); }}
                  placeholder="Enter phone number to trace (e.g. +91-98XXX-41205)"
                  className="h-9 bg-muted/20 pl-9"
                />
              </div>
              <Button onClick={handleTrace} disabled={tracing} size="sm" className="gap-2">
                {tracing ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                {tracing ? "Tracing..." : "Trace"}
              </Button>
            </div>
            <div className="relative overflow-hidden rounded-lg border border-border/40 bg-card/20">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minHeight: 380 }}>
                {edges.map((e, i) => {
                  const from = positions.get(e.from);
                  const to = positions.get(e.to);
                  if (!from || !to) return null;
                  const active = isHighlighted(e.from) && isHighlighted(e.to);
                  return (
                    <line
                      key={i}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={active ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border) / 0.3)"}
                      strokeWidth={active ? 1.5 : 1}
                      strokeDasharray={active ? "0" : "4 4"}
                    />
                  );
                })}
                {nodes.map((n) => {
                  const p = positions.get(n.nodeId);
                  if (!p) return null;
                  const s = TYPE_STYLE[n.nodeType];
                  const active = isHighlighted(n.nodeId);
                  const isSel = selected?.nodeId === n.nodeId;
                  const r = n.nodeType === "victim" ? 22 : n.nodeType === "phone" ? 18 : 15;
                  return (
                    <g
                      key={n.nodeId}
                      transform={`translate(${p.x}, ${p.y})`}
                      className="cursor-pointer"
                      onClick={() => setSelected(n)}
                      onMouseEnter={() => setHovered(n.nodeId)}
                      onMouseLeave={() => setHovered(null)}
                      style={{ opacity: active ? 1 : 0.3, transition: "opacity 0.2s" }}
                    >
                      {isSel && <circle r={r + 8} fill="none" stroke={s.color} strokeWidth={1.5} strokeDasharray="3 3" className="animate-spin" style={{ transformOrigin: "center", animationDuration: "8s" }} />}
                      <motion.circle
                        r={r}
                        fill={s.bg}
                        stroke={s.color}
                        strokeWidth={isSel ? 2.5 : 1.5}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 18 }}
                        style={{ filter: isSel ? `drop-shadow(0 0 8px ${s.color})` : "none" }}
                      />
                      <foreignObject x={-10} y={-10} width={20} height={20} style={{ pointerEvents: "none" }}>
                        <div className="grid h-full w-full place-items-center" style={{ color: s.color }}>
                          <s.Icon size={14} />
                        </div>
                      </foreignObject>
                      <text y={r + 14} textAnchor="middle" fontSize={10} fill="hsl(var(--foreground))" className="font-medium" style={{ opacity: active ? 1 : 0.5 }}>
                        {n.label.length > 22 ? n.label.slice(0, 20) + "…" : n.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {Object.entries(TYPE_STYLE).map(([type, s]) => (
                <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Node Inspector</CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <motion.div key={selected.nodeId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  {(() => {
                    const s = TYPE_STYLE[selected.nodeType];
                    return (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-lg" style={{ background: s.bg, color: s.color }}>
                            <s.Icon size={20} />
                          </div>
                          <div>
                            <p className="font-semibold leading-tight">{selected.label}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Risk Score</span>
                            <span className="font-bold" style={{ color: s.color }}>{selected.risk}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Connections</span>
                            <span className="font-medium">{selected.links.length}</span>
                          </div>
                          {Object.entries(selected.meta).map(([k, v]) => (
                            <div key={k} className="flex items-center justify-between text-sm">
                              <span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}</span>
                              <span className="font-medium">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <Target size={28} className="opacity-40" />
                  <p className="text-xs">Click a node to inspect its details and connections</p>
                </div>
              )}
            </CardContent>
          </Card>

          <AnimatePresence>
            {traceResult && (
              <motion.div key="trace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className={cn("border", traceResult.insideBank ? "border-destructive/40 shadow-lg shadow-destructive/10" : traceResult.nearestBankDistanceM < 800 ? "border-warning/40" : "border-border/60")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Navigation size={16} className="text-primary" /> Phone Trace Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="gap-1.5"><Phone size={11} /> {traceResult.phone}</Badge>
                      <Badge variant="outline">{traceResult.carrier}</Badge>
                      <Badge variant="outline" className="gap-1.5"><MapPin size={11} /> {traceResult.registeredLocation}</Badge>
                    </div>

                    <div className={cn(
                      "flex items-start gap-3 rounded-lg border p-3",
                      traceResult.insideBank ? "border-destructive/30 bg-destructive/5" : traceResult.nearestBankDistanceM < 800 ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"
                    )}>
                      {traceResult.insideBank ? <ShieldAlert size={18} className="mt-0.5 shrink-0 text-destructive" /> : traceResult.nearestBankDistanceM < 800 ? <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" /> : <ShieldCheck size={18} className="mt-0.5 shrink-0 text-success" />}
                      <div>
                        <p className="text-sm font-semibold">{traceResult.insideBank ? "Caller near bank — high risk" : traceResult.nearestBankDistanceM < 800 ? "Caller within walking distance of bank" : "No bank nearby"}</p>
                        <p className="text-xs text-muted-foreground">{traceResult.riskNotes}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Nearest Bank</p>
                        <p className="mt-1 text-sm font-semibold">{traceResult.nearestBank}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">{traceResult.nearestBankDistanceM} m</p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nearby Bank Branches</p>
                      <div className="space-y-1.5">
                        {traceResult.nearBanks.map((b, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 p-2.5 text-sm">
                            <Building2 size={14} className="shrink-0 text-primary" />
                            <span className="font-medium">{b.name}</span>
                            <span className="text-muted-foreground">{b.branch}</span>
                            <span className="ml-auto flex items-center gap-1 tabular-nums text-muted-foreground">
                              <Navigation size={11} /> {b.distanceM}m {b.direction}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2.5 text-xs text-muted-foreground">
                      <MapPin size={13} className="text-primary" />
                      Coordinates: {traceResult.latitude.toFixed(4)}, {traceResult.longitude.toFixed(4)} — node added to graph
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Detected Networks</CardTitle>
              <p className="text-xs text-muted-foreground">Linked clusters ranked by shared risk</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {clusters.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-lg border border-border/40 bg-card/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{c.label}</p>
                    <Badge variant={c.sharedRisk >= 80 ? "destructive" : c.sharedRisk >= 60 ? "secondary" : "outline"} className="text-[10px]">
                      {c.sharedRisk} risk
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {recentTraces.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Recent Phone Traces</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTraces.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-2.5">
                    <Phone size={14} className="shrink-0 text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.phone}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.registeredLocation} · {t.carrier}</p>
                    </div>
                    <Badge variant={t.insideBank ? "destructive" : t.nearestBankDistanceM < 800 ? "secondary" : "outline"} className="text-[10px]">
                      {t.nearestBankDistanceM}m
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
