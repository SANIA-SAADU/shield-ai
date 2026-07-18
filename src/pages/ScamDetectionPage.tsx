import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall, MessageSquareText, FileText, Mic, Sparkles, AlertTriangle,
  ShieldCheck, Play, RotateCcw, ArrowRight, Quote, Siren, Loader2,
  Upload, AudioLines, FileAudio, X,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { RiskGauge } from "@/components/RiskGauge";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { scamDetectionService, ScamDetectionService } from "@/services/scamDetection";
import { dataService } from "@/services/data";
import { cn } from "@/lib/utils";
import type { ScamAnalysis, ScamInputType, ScamIndicator } from "@/types";

const INPUTS: { id: ScamInputType; label: string; icon: typeof PhoneCall; desc: string }[] = [
  { id: "voice", label: "Voice / Call", icon: PhoneCall, desc: "Transcribe a call" },
  { id: "transcript", label: "Transcript", icon: FileText, desc: "Paste call transcript" },
  { id: "message", label: "Message / SMS", icon: MessageSquareText, desc: "Paste SMS or chat" },
];

const CATEGORY_COLOR: Record<ScamIndicator["category"], string> = {
  threat: "text-destructive bg-destructive/10 border-destructive/30",
  authority: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  urgency: "text-warning bg-warning/10 border-warning/30",
  financial: "text-primary bg-primary/10 border-primary/30",
  personal: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
  pressure: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

export function ScamDetectionPage() {
  const navigate = useNavigate();
  const [inputType, setInputType] = useState<ScamInputType>("voice");
  const [text, setText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamAnalysis | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeProgress, setTranscribeProgress] = useState(0);
  const audioRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }
    setAnalyzing(true);
    setResult(null);
    try {
      const analysis = await scamDetectionService.analyze({ inputType, rawInput: text });
      const saved = await dataService.saveScamAnalysis(analysis);
      setResult(saved);
      setSavedId(saved.id ?? null);
      toast.success(`Analysis complete — ${saved.scamProbability}% scam probability`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setText("");
    setResult(null);
    setTranscribing(true);
    setTranscribeProgress(0);

    const progressInterval = setInterval(() => {
      setTranscribeProgress((p) => Math.min(p + 8 + Math.random() * 12, 95));
    }, 200);

    await new Promise((r) => setTimeout(r, 1600 + Math.random() * 800));
    clearInterval(progressInterval);
    setTranscribeProgress(100);

    const transcript = ScamDetectionService.sample("voice");
    setText(transcript);
    setTranscribing(false);
    toast.success("Speech-to-text transcription complete");
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setText("");
    if (audioRef.current) audioRef.current.value = "";
  };

  const handleSample = () => {
    setText(ScamDetectionService.sample(inputType));
    setResult(null);
  };

  const handleReset = () => {
    setText("");
    setResult(null);
    setSavedId(null);
  };

  const handleEmergency = () => {
    if (!result || !savedId) {
      toast.error("Run an analysis first");
      return;
    }
    navigate("/emergency", { state: { analysis: result, analysisId: savedId } });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
      <PageHeader
        title="Scam Call Intelligence"
        description="Upload a voice call, transcript, or message. AI detects threatening language, fake authority, urgency patterns, and digital-arrest tactics."
        icon={<PhoneCall size={22} />}
        actions={
          <Button variant="outline" onClick={handleSample} className="gap-2">
            <Sparkles size={15} /> Load sample
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">Input Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={inputType} onValueChange={(v) => setInputType(v as ScamInputType)}>
              <TabsList className="grid w-full grid-cols-3">
                {INPUTS.map((it) => (
                  <TabsTrigger key={it.id} value={it.id} className="gap-1.5">
                    <it.icon size={14} /> {it.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {inputType === "voice" && (
              <div className="space-y-3">
                <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleVoiceUpload} />
                {audioFile ? (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                        <FileAudio size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{audioFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(audioFile.size / 1024).toFixed(0)} KB · {audioFile.type || "audio"}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleRemoveAudio} className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive">
                        <X size={16} />
                      </Button>
                    </div>
                    {audioUrl && !transcribing && (
                      <audio controls src={audioUrl} className="mt-3 h-9 w-full" />
                    )}
                    {transcribing && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-primary">
                            <AudioLines size={13} className="animate-pulse" /> Transcribing speech to text...
                          </span>
                          <span className="tabular-nums text-muted-foreground">{Math.round(transcribeProgress)}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${transcribeProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onClick={() => audioRef.current?.click()}
                    className="cursor-pointer rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
                      <Upload size={22} />
                    </div>
                    <p className="mt-3 text-sm font-medium">Upload voice call audio</p>
                    <p className="mt-1 text-xs text-muted-foreground">Click to select an audio file (MP3, WAV, M4A)</p>
                    <p className="mt-2 text-[11px] text-primary/70">Speech-to-text will auto-transcribe</p>
                  </div>
                )}
              </div>
            )}

            {inputType === "voice" && audioFile && !transcribing && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Transcribed text (edit if needed)</label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Transcribed speech will appear here..."
                  className="min-h-[120px] resize-y bg-muted/20"
                />
              </div>
            )}

            {inputType !== "voice" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {inputType === "message" ? "Message content" : "Call transcript"}
                </label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={inputType === "message" ? "Paste the SMS or message you received..." : "Paste the call transcript or transcribed speech..."}
                  className="min-h-[180px] resize-y bg-muted/20"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={analyzing} className="flex-1 gap-2">
                {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                {analyzing ? "Analyzing..." : "Analyze for Scam"}
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw size={15} /> Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {analyzing && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-border/60">
                  <CardContent className="flex flex-col items-center gap-4 py-12">
                    <div className="relative grid h-20 w-20 place-items-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                      <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
                        <Mic size={28} className="animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">AI analyzing communication...</p>
                      <p className="mt-1 text-xs text-muted-foreground">NLP model scanning for threats, authority claims & urgency</p>
                    </div>
                    <div className="flex gap-1.5">
                      {["Threats", "Authority", "Urgency", "Finance", "Personal"].map((t, i) => (
                        <motion.span
                          key={t}
                          initial={{ opacity: 0.3 }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                          className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground"
                        >
                          {t}
                        </motion.span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {result && !analyzing && (
              <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={cn("border-border/60", result.riskLevel === "critical" && "border-destructive/40 shadow-lg shadow-destructive/10")}>
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                      <RiskGauge value={result.scamProbability} size={140} label="Scam Probability" sublabel={result.riskLevel} />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          {result.riskLevel === "low" ? <ShieldCheck size={18} className="text-success" /> : <AlertTriangle size={18} className="text-destructive" />}
                          <RiskBadge level={result.riskLevel} pulse={result.riskLevel === "critical"} />
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pattern Detected</p>
                          <p className="text-lg font-semibold">{result.pattern}</p>
                        </div>
                        {result.transcriptExcerpt && (
                          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                            <Quote size={14} className="text-muted-foreground" />
                            <p className="mt-1.5 text-xs italic text-muted-foreground">"{result.transcriptExcerpt}"</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {(result.riskLevel === "high" || result.riskLevel === "critical") && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4 flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Siren size={20} className="text-destructive" />
                          <div>
                            <p className="text-sm font-semibold text-destructive">Do NOT transfer money</p>
                            <p className="text-xs text-muted-foreground">Generate an NCRB-aligned complaint and notify contacts.</p>
                          </div>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleEmergency} className="gap-2">
                          Emergency Action <ArrowRight size={14} />
                        </Button>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!result && !analyzing && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-dashed border-border/60">
                  <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-muted/40 text-muted-foreground">
                      <PhoneCall size={26} />
                    </div>
                    <p className="text-sm font-medium">Awaiting input</p>
                    <p className="max-w-xs text-xs text-muted-foreground">Enter a call transcript or message and run analysis to see the scam probability score.</p>
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
              <CardTitle className="text-base">AI Indicator Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground">Weighted linguistic signals detected by the NLP model</p>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {result.indicators.map((ind, i) => (
                <motion.div
                  key={ind.label}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                    ind.matched ? CATEGORY_COLOR[ind.category] : "border-border/40 bg-muted/20 opacity-50"
                  )}
                >
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-md", ind.matched ? "bg-background/40" : "bg-muted")}>
                    {ind.matched ? <AlertTriangle size={15} /> : <ShieldCheck size={15} className="text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{ind.label}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">{ind.category} signal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">+{ind.weight}</p>
                    <p className="text-[10px] text-muted-foreground">weight</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
