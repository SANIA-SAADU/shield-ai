import type { ScamAnalysis, ScamIndicator, ScamInputType, RiskLevel } from "@/types";

interface PatternDef {
  label: string;
  indicators: string[];
  minScore: number;
  categories: ScamIndicator["category"][];
}

const PATTERNS: PatternDef[] = [
  {
    label: "Digital Arrest Pattern",
    minScore: 70,
    categories: ["threat", "authority"],
    indicators: ["arrest", "custody", "police", "cbi", "crime", "case filed", "warrant", "legal action"],
  },
  {
    label: "Fake Government Authority",
    minScore: 65,
    categories: ["authority"],
    indicators: ["aadhaar", "pan", "income tax", "government", "official", "ministry", "department", "verification"],
  },
  {
    label: "Urgent Money Transfer",
    minScore: 60,
    categories: ["urgency", "financial"],
    indicators: ["immediately", "right now", "urgent", "within", "deadline", "transfer", "send money", "pay now", "deposit"],
  },
  {
    label: "Account Suspension Threat",
    minScore: 55,
    categories: ["threat", "financial"],
    indicators: ["suspend", "block", "freeze", "deactivate", "disable", "close account", "disconnected"],
  },
  {
    label: "Personal Data Harvesting",
    minScore: 50,
    categories: ["personal"],
    indicators: ["otp", "cvv", "password", "pin", "card details", "aadh", "verify identity", "share otp"],
  },
];

const THREAT_WORDS = ["arrest", "jail", "prison", "custody", "penalty", "fine", "punish", "legal action", "consequences"];
const AUTHORITY_WORDS = ["cbi", "police", "officer", "income tax", "government", "ministry", "department", "official", "supreme court", "enforcement", "customs"];
const URGENCY_WORDS = ["immediately", "right now", "urgent", "now only", "within 10 minutes", "deadline", "last chance", "hurry", "quickly"];
const FINANCIAL_WORDS = ["transfer", "send money", "pay", "deposit", "refund", "compensation", "₹", "rupees", "account", "upi", "wire"];
const PERSONAL_WORDS = ["otp", "cvv", "pin", "password", "aadhaar", "pan card", "card number", "bank details"];
const PRESSURE_WORDS = ["do not disconnect", "stay on the line", "do not tell anyone", "secret", "confidential", "do not inform family"];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function countMatches(text: string, words: string[]): { count: number; matched: string[] } {
  const matched: string[] = [];
  for (const w of words) {
    if (text.includes(w)) matched.push(w);
  }
  return { count: matched.length, matched };
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function detectLanguage(text: string): string {
  const telugu = /[\u0C00-\u0C7F]/;
  const hindi = /[\u0900-\u097F]/;
  if (telugu.test(text)) return "te";
  if (hindi.test(text)) return "hi";
  return "en";
}

function buildIndicators(text: string): ScamIndicator[] {
  const checks: { label: string; words: string[]; weight: number; category: ScamIndicator["category"] }[] = [
    { label: "Threatening language", words: THREAT_WORDS, weight: 22, category: "threat" },
    { label: "Fake authority claim", words: AUTHORITY_WORDS, weight: 25, category: "authority" },
    { label: "Urgency / time pressure", words: URGENCY_WORDS, weight: 18, category: "urgency" },
    { label: "Demand for money transfer", words: FINANCIAL_WORDS, weight: 15, category: "financial" },
    { label: "Request for sensitive data", words: PERSONAL_WORDS, weight: 12, category: "personal" },
    { label: "Secrecy / isolation tactics", words: PRESSURE_WORDS, weight: 8, category: "pressure" },
  ];

  return checks.map((c) => {
    const { count } = countMatches(text, c.words);
    return {
      label: c.label,
      weight: c.weight,
      matched: count > 0,
      category: c.category,
    } as ScamIndicator;
  });
}

function findPattern(text: string, score: number): string {
  for (const p of PATTERNS) {
    if (score < p.minScore) continue;
    const hit = countMatches(text, p.indicators);
    if (hit.count >= 2) return p.label;
  }
  if (score >= 70) return "Coercive Scam Pattern";
  if (score >= 45) return "Suspicious Communication";
  return "No scam pattern detected";
}

function excerpt(text: string, keywords: string[]): string {
  if (text.length <= 160) return text;
  const lower = text.toLowerCase();
  let bestIdx = 0;
  let bestScore = -1;
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i].toLowerCase();
    const score = keywords.reduce((acc, k) => acc + (s.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  void lower;
  return sentences.slice(bestIdx, bestIdx + 3).join(" ").slice(0, 240);
}

export interface ScamAnalysisInput {
  inputType: ScamInputType;
  rawInput: string;
  language?: string;
}

export class ScamDetectionService {
  async analyze(input: ScamAnalysisInput): Promise<ScamAnalysis> {
    await new Promise((r) => setTimeout(r, 650 + Math.random() * 500));

    const text = normalize(input.rawInput);
    const indicators = buildIndicators(text);

    let raw = 4;
    for (const ind of indicators) {
      if (ind.matched) raw += ind.weight;
    }

    const lengthBoost = Math.min(8, Math.floor(text.length / 80));
    const multiHitBonus = indicators.filter((i) => i.matched).length >= 4 ? 6 : 0;
    const score = Math.max(2, Math.min(99, raw + lengthBoost + multiHitBonus));

    const lang = input.language || detectLanguage(input.rawInput);
    const pattern = findPattern(text, score);
    const allKeywords = [...THREAT_WORDS, ...AUTHORITY_WORDS, ...URGENCY_WORDS, ...FINANCIAL_WORDS, ...PERSONAL_WORDS];

    return {
      inputType: input.inputType,
      rawInput: input.rawInput,
      language: lang,
      scamProbability: score,
      riskLevel: riskFromScore(score),
      pattern,
      indicators,
      transcriptExcerpt: excerpt(input.rawInput, allKeywords),
    };
  }

  static sample(inputType: ScamInputType): string {
    if (inputType === "message") {
      return "Dear customer, your Aadhaar is linked to a serious crime. CBI officer calling. Transfer ₹50,000 immediately to settle the case or face legal action and arrest within 30 minutes. Do not disconnect.";
    }
    return "Hello, I am calling from the CBI office. Your Aadhaar number has been linked to a money laundering case. A non-bailable warrant has been issued in your name. You must transfer fifty thousand rupees immediately to the account I give you, otherwise you will be arrested within the next thirty minutes. Do not disconnect this call and do not inform your family.";
  }
}

export const scamDetectionService = new ScamDetectionService();
