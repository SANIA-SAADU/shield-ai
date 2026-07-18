import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren, FileText, ShieldCheck, Plus, Trash2, UserPlus, Phone,
  CheckCircle2, Download, Loader2, AlertTriangle, ListChecks, BadgeCheck,
  ArrowRight, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { RiskBadge } from "@/components/RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { emergencyActionService } from "@/services/emergencyAction";
import { dataService } from "@/services/data";
import { cn } from "@/lib/utils";
import type { Complaint, EmergencyContact, ScamAnalysis } from "@/types";

export function EmergencyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName } = useAuth();
  const passedAnalysis = (location.state as { analysis?: ScamAnalysis; analysisId?: string } | null)?.analysis ?? null;
  const passedId = (location.state as { analysisId?: string } | null)?.analysisId ?? null;

  const [name, setName] = useState("");
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { name: "", relation: "Family", phone: "" },
  ]);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [generating, setGenerating] = useState(false);
  const [filed, setFiled] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<ScamAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ScamAnalysis | null>(passedAnalysis);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(passedId);
  const [manualIncident, setManualIncident] = useState("");

  useEffect(() => {
    dataService.listComplaints().then(setRecent).catch(() => {});
    dataService.listScamAnalyses().then((a) => {
      setRecentAnalyses(a);
      if (!passedAnalysis && a.length > 0) {
        setSelectedAnalysis(a[0]);
        setSelectedAnalysisId(a[0].id ?? null);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!name && fullName) setName(fullName);
  }, [fullName, name]);

  const addContact = () => setContacts((c) => [...c, { name: "", relation: "Family", phone: "" }]);
  const removeContact = (i: number) => setContacts((c) => c.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: keyof EmergencyContact, value: string) =>
    setContacts((c) => c.map((ct, idx) => (idx === i ? { ...ct, [field]: value } : ct)));

  const hasAnalysis = !!selectedAnalysis;
  const hasManual = manualIncident.trim().length >= 20;

  const generate = async () => {
    if (!hasAnalysis && !hasManual) {
      toast.error("Select a recent analysis or describe the incident to generate a complaint");
      return;
    }
    setGenerating(true);
    setComplaint(null);
    setFiled(false);
    await new Promise((r) => setTimeout(r, 900));
    const cleanContacts = contacts.filter((c) => c.name && c.phone);

    let result: Complaint;
    if (selectedAnalysis) {
      result = emergencyActionService.generate({
        analysis: selectedAnalysis,
        complainantName: name || "Anonymous",
        emergencyContacts: cleanContacts,
      });
      result.analysisId = selectedAnalysisId;
    } else {
      result = emergencyActionService.generateManual({
        incidentDescription: manualIncident.trim(),
        complainantName: name || "Anonymous",
        emergencyContacts: cleanContacts,
      });
    }
    setComplaint(result);
    setGenerating(false);
    toast.success("Emergency complaint draft generated");
  };

  const fileComplaint = async () => {
    if (!complaint) return;
    try {
      const saved = await dataService.saveComplaint({ ...complaint, status: "filed" });
      setSavedId(saved.id ?? null);
      setFiled(true);
      setComplaint({ ...complaint, status: "filed" });
      toast.success("Complaint filed — NCRB-aligned draft saved");
      dataService.listComplaints().then(setRecent).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to file complaint");
    }
  };

  const download = () => {
    if (!complaint) return;
    const text = `SHIELDAI — EMERGENCY COMPLAINT DRAFT\n${"=".repeat(40)}\n\nComplainant: ${complaint.complainantName}\nDate: ${new Date().toLocaleString("en-IN")}\nStatus: ${complaint.status.toUpperCase()}\n\nINCIDENT SUMMARY\n${"-".repeat(16)}\n${complaint.incidentSummary}\n\nEVIDENCE COLLECTED\n${"-".repeat(17)}\n${complaint.evidenceList.map((e, i) => `${i + 1}. ${e}`).join("\n")}\n\nSUGGESTED ACTIONS\n${"-".repeat(16)}\n${complaint.suggestedActions.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\nEMERGENCY CONTACTS NOTIFIED\n${"-".repeat(26)}\n${complaint.emergencyContacts.length ? complaint.emergencyContacts.map((c) => `• ${c.name} (${c.relation}) — ${c.phone}`).join("\n") : "None provided"}\n`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shieldai_complaint_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
      <PageHeader
        title="AI Emergency Action Agent"
        description="After fraud is detected, this agent auto-generates an NCRB-aligned complaint, compiles evidence, recommends next actions, and prepares emergency-contact notifications."
        icon={<Siren size={22} />}
        actions={
          <Button variant="outline" onClick={() => navigate("/scam-detection")} className="gap-2">
            <Sparkles size={15} /> Run New Analysis <ArrowRight size={14} />
          </Button>
        }
      />

      {selectedAnalysis && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-primary" />
                <div>
                  <p className="text-sm font-medium">Linked analysis: {selectedAnalysis.pattern}</p>
                  <p className="text-xs text-muted-foreground">Scam probability {selectedAnalysis.scamProbability}%</p>
                </div>
              </div>
              <RiskBadge level={selectedAnalysis.riskLevel} pulse={selectedAnalysis.riskLevel === "critical"} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {/* Source: linked analysis or recent analyses */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText size={16} /> Complaint Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAnalyses.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs">Link a recent scam analysis</Label>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {recentAnalyses.map((a) => {
                      const active = selectedAnalysis?.id === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => { setSelectedAnalysis(a); setSelectedAnalysisId(a.id ?? null); setManualIncident(""); }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                            active ? "border-primary/50 bg-primary/10" : "border-border/40 bg-card/30 hover:bg-secondary/40"
                          )}
                        >
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                            <FileText size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{a.pattern}</p>
                            <p className="truncate text-xs text-muted-foreground">{a.scamProbability}% scam · {a.inputType}</p>
                          </div>
                          <RiskBadge level={a.riskLevel} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                  No analyses yet. You can still describe the incident manually below.
                </div>
              )}

              <div className="relative flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Or describe manually</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="incident" className="text-xs">Incident description (min 20 characters)</Label>
                <Textarea
                  id="incident"
                  value={manualIncident}
                  onChange={(e) => {
                    setManualIncident(e.target.value);
                    if (e.target.value.trim().length >= 20) setSelectedAnalysis(null);
                  }}
                  placeholder="Describe what happened — e.g. 'Received a call from someone claiming to be from RBI threatening digital arrest, asked me to transfer ₹50,000...'"
                  className="min-h-[90px] resize-y bg-muted/20 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">{manualIncident.trim().length}/20 min chars</p>
              </div>
            </CardContent>
          </Card>

          {/* Complainant + contacts */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText size={16} /> Complainant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Complainant name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. R. Sharma" className="bg-muted/20" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Emergency contacts to notify</Label>
                  <Button variant="outline" size="sm" onClick={addContact} className="h-7 gap-1.5 text-xs">
                    <Plus size={13} /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {contacts.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={c.name} onChange={(e) => updateContact(i, "name", e.target.value)} placeholder="Name" className="bg-muted/20" />
                      <Input value={c.relation} onChange={(e) => updateContact(i, "relation", e.target.value)} placeholder="Relation" className="w-28 bg-muted/20" />
                      <Input value={c.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} placeholder="Phone" className="bg-muted/20" />
                      {contacts.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeContact(i)} className="shrink-0 text-muted-foreground hover:text-destructive">
                          <Trash2 size={15} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={generate} disabled={generating || (!hasAnalysis && !hasManual)} className="w-full gap-2">
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Siren size={16} />}
                {generating ? "Agent drafting complaint..." : "Generate Emergency Complaint"}
              </Button>
              {!hasAnalysis && !hasManual && (
                <p className="text-center text-xs text-muted-foreground">
                  Select a recent analysis or write an incident description (min 20 chars) to enable generation.
                </p>
              )}
            </CardContent>
          </Card>

          {recent.length > 0 && (
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-base">Recent Complaints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recent.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.complainantName}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.evidenceList.length} evidence items · {c.suggestedActions.length} actions</p>
                    </div>
                    <Badge variant={c.status === "filed" ? "default" : c.status === "escalated" ? "destructive" : "secondary"} className="text-[10px] capitalize">{c.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <AnimatePresence mode="wait">
            {generating && (
              <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="border-border/60">
                  <CardContent className="flex flex-col items-center gap-4 py-16">
                    <div className="relative grid h-16 w-16 place-items-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
                      <Siren size={28} className="animate-pulse text-destructive" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Emergency agent activating...</p>
                      <p className="mt-1 text-xs text-muted-foreground">Compiling evidence · drafting NCRB complaint · preparing alerts</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {complaint && !generating && (
              <motion.div key="complaint" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={cn("border-border/60", filed && "border-success/40")}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      {filed ? <CheckCircle2 size={16} className="text-success" /> : <FileText size={16} />}
                      {filed ? "Complaint Filed" : "Complaint Draft"}
                    </CardTitle>
                    <Badge variant={filed ? "default" : "secondary"} className="gap-1 capitalize">
                      {filed && <BadgeCheck size={11} />}
                      {complaint.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Incident Summary</p>
                      <p className="rounded-lg border border-border/40 bg-muted/20 p-3 text-sm leading-relaxed">{complaint.incidentSummary}</p>
                    </div>

                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <ListChecks size={13} /> Evidence Collected
                      </p>
                      <div className="space-y-1.5">
                        {complaint.evidenceList.map((e, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-success" />
                            <span>{e}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <ShieldCheck size={13} /> Recommended Actions
                      </p>
                      <div className="space-y-1.5">
                        {complaint.suggestedActions.map((a, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">{i + 1}</span>
                            <span>{a}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {complaint.emergencyContacts.length > 0 && (
                      <div>
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <UserPlus size={13} /> Emergency Contacts
                        </p>
                        <div className="space-y-1.5">
                          {complaint.emergencyContacts.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 p-2.5 text-sm">
                              <Phone size={14} className="text-primary" />
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground">· {c.relation}</span>
                              <span className="ml-auto tabular-nums">{c.phone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {!filed ? (
                        <Button onClick={fileComplaint} variant="destructive" className="flex-1 gap-2">
                          <Siren size={15} /> File Complaint
                        </Button>
                      ) : (
                        <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-success/10 py-2 text-sm font-medium text-success">
                          <CheckCircle2 size={16} /> Complaint #{savedId?.slice(0, 8)} filed
                        </div>
                      )}
                      <Button variant="outline" onClick={download} className="gap-2">
                        <Download size={15} /> Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!complaint && !generating && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="border-dashed border-border/60">
                  <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-muted/40 text-muted-foreground">
                      <Siren size={26} />
                    </div>
                    <p className="text-sm font-medium">Emergency agent standing by</p>
                    <p className="max-w-xs text-xs text-muted-foreground">Select a recent analysis or describe the incident, then generate a complaint draft with evidence and recommended actions.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
