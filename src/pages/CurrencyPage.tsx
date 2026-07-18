import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote, Upload, ScanLine, ShieldCheck, ShieldAlert, ShieldX,
  Loader2, RotateCcw, CheckCircle2, XCircle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { RiskGauge } from "@/components/RiskGauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { currencyDetectionService } from "@/services/currencyDetection";
import { dataService } from "@/services/data";
import { cn } from "@/lib/utils";
import type { CurrencyAnalysis, CurrencyCheck } from "@/types";

const VERDICT_STYLE: Record<CurrencyAnalysis["verdict"], { cls: string; Icon: typeof ShieldCheck; label: string }> = {
  authentic: { cls: "border-success/40 bg-success/5 text-success", Icon: ShieldCheck, label: "Authentic Note" },
  suspicious: { cls: "border-warning/40 bg-warning/5 text-warning", Icon: ShieldAlert, label: "Suspicious — Review" },
  counterfeit: { cls: "border-destructive/40 bg-destructive/5 text-destructive", Icon: ShieldX, label: "Counterfeit Detected" },
};

const CHECK_ICON: Record<CurrencyCheck["status"], { Icon: typeof CheckCircle2; cls: string }> = {
  pass: { Icon: CheckCircle2, cls: "text-success" },
  review: { Icon: AlertCircle, cls: "text-warning" },
  fail: { Icon: XCircle, cls: "text-destructive" },
};

export function CurrencyPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSeed, setImageSeed] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<CurrencyAnalysis | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageSeed(Math.floor(Math.random() * 100000) + 1);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!imageUrl) {
      toast.error("Upload a currency note image first");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const analysis = await currencyDetectionService.analyze({ imageSeed, imageUrl });
      await dataService.saveCurrencyAnalysis(analysis);
      setResult(analysis);
      toast.success(`Authenticity score: ${analysis.authenticityScore}% — ${analysis.verdict}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImageUrl(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const verdict = result ? VERDICT_STYLE[result.verdict] : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
      <PageHeader
        title="Fake Currency Detection"
        description="Upload a currency note image. Computer-vision model inspects security thread, watermark, microprint, serial number, and intaglio printing."
        icon={<Banknote size={22} />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Note Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className={cn(
                "relative grid min-h-[280px] cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                imageUrl ? "border-primary/40" : "border-border/60 hover:border-primary/40 hover:bg-muted/20"
              )}
            >
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt="Note" className="h-full max-h-[320px] w-full object-contain" />
                  {analyzing && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm">
                      <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_12px] shadow-primary scan-line" />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="flex flex-col items-center gap-3">
                          <ScanLine size={32} className="text-primary" />
                          <p className="text-sm font-medium">Scanning security features...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
                    <Upload size={26} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Click to upload note image</p>
                    <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={analyzing || !imageUrl} className="flex-1 gap-2">
                {analyzing ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                {analyzing ? "Analyzing..." : "Run CV Analysis"}
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw size={15} /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!result && !analyzing && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-dashed border-border/60">
                  <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-muted/40 text-muted-foreground">
                      <Banknote size={26} />
                    </div>
                    <p className="text-sm font-medium">Awaiting note image</p>
                    <p className="max-w-xs text-xs text-muted-foreground">Upload a currency image to run the authenticity check.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {analyzing && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-border/60">
                  <CardContent className="flex flex-col items-center gap-4 py-12">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Computer vision model running...</p>
                      <p className="mt-1 text-xs text-muted-foreground">Inspecting 7 security features</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {result && verdict && !analyzing && (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={cn("border", verdict.cls)}>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                      <RiskGauge value={result.authenticityScore} size={140} label="Authenticity" sublabel={result.noteLabel} />
                      <div className="flex-1 space-y-3 text-center sm:text-left">
                        <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold", verdict.cls)}>
                          <verdict.Icon size={16} /> {verdict.label}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Note Denomination</p>
                          <p className="text-lg font-semibold">{result.noteLabel}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.verdict === "authentic"
                            ? "All major security features passed verification."
                            : result.verdict === "suspicious"
                            ? "Some features show anomalies — manual review recommended."
                            : "Multiple security features failed — this note is likely counterfeit."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Security Feature Checks</CardTitle>
              <p className="text-xs text-muted-foreground">Per-feature computer-vision inspection results</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.checks.map((c, i) => {
                const { Icon, cls } = CHECK_ICON[c.status];
                return (
                  <motion.div
                    key={c.feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 p-3"
                  >
                    <Icon size={18} className={cn("shrink-0", cls)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{c.feature}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.note}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden w-28 sm:block">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className={cn("h-full rounded-full", c.status === "pass" ? "bg-success" : c.status === "review" ? "bg-warning" : "bg-destructive")}
                            initial={{ width: 0 }}
                            animate={{ width: `${c.score}%` }}
                            transition={{ duration: 0.8, delay: i * 0.08 }}
                          />
                        </div>
                      </div>
                      <span className={cn("w-10 text-right text-sm font-bold tabular-nums", cls)}>{c.score}</span>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
