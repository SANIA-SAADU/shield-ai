export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ScamInputType = "voice" | "transcript" | "message";

export interface ScamIndicator {
  label: string;
  weight: number;
  matched: boolean;
  category: "threat" | "urgency" | "authority" | "financial" | "personal" | "pressure";
}

export interface ScamAnalysis {
  id?: string;
  inputType: ScamInputType;
  rawInput: string;
  language: string;
  scamProbability: number;
  riskLevel: RiskLevel;
  pattern: string;
  indicators: ScamIndicator[];
  transcriptExcerpt?: string;
  createdAt?: string;
}

export interface CurrencyCheck {
  feature: string;
  score: number;
  status: "pass" | "fail" | "review";
  note: string;
}

export interface CurrencyAnalysis {
  id?: string;
  imageUrl?: string;
  noteLabel: string;
  authenticityScore: number;
  verdict: "authentic" | "suspicious" | "counterfeit";
  checks: CurrencyCheck[];
  createdAt?: string;
}

export type FraudNodeType = "victim" | "phone" | "bank" | "device" | "complaint";

export interface FraudNode {
  nodeId: string;
  nodeType: FraudNodeType;
  label: string;
  risk: number;
  links: string[];
  meta: Record<string, string | number | boolean>;
}

export interface CrimeHotspot {
  id: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  intensity: number;
  scamType: string;
  cases: number;
  trend: "rising" | "stable" | "declining";
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface Complaint {
  id?: string;
  analysisId?: string | null;
  complainantName: string;
  incidentSummary: string;
  evidenceList: string[];
  suggestedActions: string[];
  emergencyContacts: EmergencyContact[];
  status: "draft" | "filed" | "escalated";
  createdAt?: string;
}

export interface ChatMessage {
  id?: string;
  sessionId: string;
  role: "user" | "assistant";
  language: string;
  content: string;
  createdAt?: string;
}

export type Language = "en" | "te" | "hi";

export interface PhoneTraceRecord {
  id?: string;
  phone: string;
  carrier: string;
  registeredLocation: string;
  latitude: number;
  longitude: number;
  nearBanks: NearBankRecord[];
  nearestBank: string;
  nearestBankDistanceM: number;
  insideBank: boolean;
  riskNotes: string;
  createdAt?: string;
}

export interface NearBankRecord {
  name: string;
  branch: string;
  distanceM: number;
  direction: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  threatsDetected: number;
  moneyProtected: number;
  activeComplaints: number;
  highRiskTrend: { date: string; value: number }[];
  scamTypeBreakdown: { name: string; value: number; color: string }[];
}
