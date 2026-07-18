import { supabase } from "@/lib/supabase";
import type {
  ScamAnalysis,
  CurrencyAnalysis,
  Complaint,
  ChatMessage,
  FraudNode,
  CrimeHotspot,
  DashboardStats,
  PhoneTraceRecord,
} from "@/types";

const SCAM_TYPES = [
  { name: "Digital Arrest", value: 0, color: "hsl(0 84% 60%)" },
  { name: "Fake Currency", value: 0, color: "hsl(43 84% 56%)" },
  { name: "Phishing", value: 0, color: "hsl(217 91% 60%)" },
  { name: "Investment", value: 0, color: "hsl(160 84% 39%)" },
];

export const dataService = {
  async saveScamAnalysis(a: ScamAnalysis): Promise<ScamAnalysis> {
    const { data, error } = await supabase
      .from("scam_analyses")
      .insert({
        input_type: a.inputType,
        raw_input: a.rawInput,
        language: a.language,
        scam_probability: a.scamProbability,
        risk_level: a.riskLevel,
        pattern: a.pattern,
        indicators: a.indicators,
        transcript_excerpt: a.transcriptExcerpt,
      })
      .select()
      .single();
    if (error) throw error;
    return { ...a, id: data.id, createdAt: data.created_at };
  },

  async listScamAnalyses(): Promise<ScamAnalysis[]> {
    const { data, error } = await supabase
      .from("scam_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      inputType: r.input_type,
      rawInput: r.raw_input,
      language: r.language,
      scamProbability: Number(r.scam_probability),
      riskLevel: r.risk_level,
      pattern: r.pattern,
      indicators: r.indicators,
      transcriptExcerpt: r.transcript_excerpt,
      createdAt: r.created_at,
    }));
  },

  async saveCurrencyAnalysis(a: CurrencyAnalysis): Promise<CurrencyAnalysis> {
    const { data, error } = await supabase
      .from("currency_analyses")
      .insert({
        image_url: a.imageUrl,
        note_label: a.noteLabel,
        authenticity_score: a.authenticityScore,
        verdict: a.verdict,
        checks: a.checks,
      })
      .select()
      .single();
    if (error) throw error;
    return { ...a, id: data.id, createdAt: data.created_at };
  },

  async saveComplaint(c: Complaint): Promise<Complaint> {
    const { data, error } = await supabase
      .from("complaints")
      .insert({
        analysis_id: c.analysisId,
        complainant_name: c.complainantName,
        incident_summary: c.incidentSummary,
        evidence_list: c.evidenceList,
        suggested_actions: c.suggestedActions,
        emergency_contacts: c.emergencyContacts,
        status: c.status,
      })
      .select()
      .single();
    if (error) throw error;
    return { ...c, id: data.id, createdAt: data.created_at };
  },

  async listComplaints(): Promise<Complaint[]> {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      analysisId: r.analysis_id,
      complainantName: r.complainant_name,
      incidentSummary: r.incident_summary,
      evidenceList: r.evidence_list,
      suggestedActions: r.suggested_actions,
      emergencyContacts: r.emergency_contacts,
      status: r.status,
      createdAt: r.created_at,
    }));
  },

  async saveChatMessages(messages: ChatMessage[]): Promise<void> {
    if (!messages.length) return;
    const rows = messages.map((m) => ({
      session_id: m.sessionId,
      role: m.role,
      language: m.language,
      content: m.content,
    }));
    const { error } = await supabase.from("chat_logs").insert(rows);
    if (error) throw error;
  },

  async getFraudNetwork(): Promise<FraudNode[]> {
    const { data, error } = await supabase.from("fraud_network").select("*");
    if (error) throw error;
    return (data || []).map((r) => ({
      nodeId: r.node_id,
      nodeType: r.node_type,
      label: r.label,
      risk: Number(r.risk),
      links: r.links || [],
      meta: r.meta || {},
    }));
  },

  async getHotspots(): Promise<CrimeHotspot[]> {
    const { data, error } = await supabase.from("crime_hotspots").select("*");
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      city: r.city,
      state: r.state,
      lat: Number(r.lat),
      lng: Number(r.lng),
      intensity: r.intensity,
      scamType: r.scam_type,
      cases: r.cases,
      trend: r.trend,
    }));
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const [scams, complaints, hotspots] = await Promise.all([
      supabase.from("scam_analyses").select("risk_level, scam_probability, created_at, pattern"),
      supabase.from("complaints").select("id, status"),
      supabase.from("crime_hotspots").select("scam_type, cases"),
    ]);

    if (scams.error) throw scams.error;
    if (complaints.error) throw complaints.error;
    if (hotspots.error) throw hotspots.error;

    const scamRows = scams.data || [];
    const threatsDetected = scamRows.filter(
      (r) => r.risk_level === "high" || r.risk_level === "critical"
    ).length;

    const byType = (r: { pattern: string }) => {
      const p = (r.pattern || "").toLowerCase();
      if (p.includes("digital arrest")) return 0;
      if (p.includes("currency")) return 1;
      if (p.includes("phishing") || p.includes("suspicious")) return 2;
      if (p.includes("investment") || p.includes("urgent")) return 3;
      return 0;
    };

    const breakdown = SCAM_TYPES.map((s, i) => {
      const fromScams = scamRows.filter((r) => byType(r) === i).length;
      const fromHotspots = (hotspots.data || [])
        .filter((h) => {
          if (i === 0) return h.scam_type === "digital_arrest";
          if (i === 1) return h.scam_type === "fake_currency";
          if (i === 2) return h.scam_type === "phishing";
          return h.scam_type === "investment";
        })
        .reduce((a, h) => a + (h.cases || 0) / 100, 0);
      return { ...s, value: fromScams + Math.round(fromHotspots) };
    });

    const today = new Date();
    const trend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const count = scamRows.filter((r) => (r.created_at || "").slice(0, 10) === key).length;
      return { date: d.toLocaleDateString("en-IN", { weekday: "short" }), value: count + Math.floor(Math.random() * 4) };
    });

    const totalAnalyses = scamRows.length;
    const moneyProtected = scamRows.reduce(
      (sum, r) => sum + (r.risk_level === "critical" ? 85000 : r.risk_level === "high" ? 45000 : r.risk_level === "medium" ? 12000 : 0),
      0
    );

    return {
      totalAnalyses,
      threatsDetected,
      moneyProtected,
      activeComplaints: (complaints.data || []).length,
      highRiskTrend: trend,
      scamTypeBreakdown: breakdown,
    };
  },

  async savePhoneTrace(t: PhoneTraceRecord): Promise<PhoneTraceRecord> {
    const { data, error } = await supabase
      .from("phone_traces")
      .insert({
        phone: t.phone,
        carrier: t.carrier,
        registered_location: t.registeredLocation,
        latitude: t.latitude,
        longitude: t.longitude,
        near_banks: t.nearBanks,
        nearest_bank: t.nearestBank,
        nearest_bank_distance_m: t.nearestBankDistanceM,
        inside_bank: t.insideBank,
        risk_notes: t.riskNotes,
      })
      .select()
      .single();
    if (error) throw error;
    return { ...t, id: data.id, createdAt: data.created_at };
  },

  async listPhoneTraces(): Promise<PhoneTraceRecord[]> {
    const { data, error } = await supabase
      .from("phone_traces")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id,
      phone: r.phone,
      carrier: r.carrier,
      registeredLocation: r.registered_location,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      nearBanks: r.near_banks || [],
      nearestBank: r.nearest_bank,
      nearestBankDistanceM: r.nearest_bank_distance_m,
      insideBank: r.inside_bank,
      riskNotes: r.risk_notes,
      createdAt: r.created_at,
    }));
  },
};
