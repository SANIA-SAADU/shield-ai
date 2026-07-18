import type { CurrencyAnalysis, CurrencyCheck } from "@/types";

const NOTE_LABELS = ["₹100", "₹200", "₹500", "₹2000"];

function verdictFromScore(score: number): CurrencyAnalysis["verdict"] {
  if (score >= 80) return "authentic";
  if (score >= 55) return "suspicious";
  return "counterfeit";
}

function checkStatus(score: number): CurrencyCheck["status"] {
  if (score >= 80) return "pass";
  if (score >= 50) return "review";
  return "fail";
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 999.13) * 10000;
  return x - Math.floor(x);
}

export interface CurrencyAnalysisInput {
  imageSeed: number;
  noteLabel?: string;
  imageUrl?: string;
}

export class CurrencyDetectionService {
  async analyze(input: CurrencyAnalysisInput): Promise<CurrencyAnalysis> {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    const noteLabel = input.noteLabel || NOTE_LABELS[Math.floor(pseudoRandom(input.imageSeed) * NOTE_LABELS.length)];

    const baseScores = [
      { feature: "Security thread", note: "Continuous metallic thread correctly positioned", weight: 22 },
      { feature: "Watermark", note: "Mahatma Gandhi watermark visible in transmitted light", weight: 18 },
      { feature: "Microprint pattern", note: "Micro-lettering legible under magnification", weight: 16 },
      { feature: "Intaglio printing", note: "Raised ink on portrait and Ashoka pillar", weight: 14 },
      { feature: "Serial number structure", note: "Prefix + 9 digits, fluorescent ink alignment", weight: 14 },
      { feature: "Note alignment & dimensions", note: "Within tolerance of RBI specification", weight: 8 },
      { feature: "Color shift ink", note: "Denomination numeral shifts green-to-blue", weight: 8 },
    ];

    const bias = pseudoRandom(input.imageSeed);
    const verdictTarget = bias > 0.62 ? "authentic" : bias > 0.32 ? "suspicious" : "counterfeit";

    const checks: CurrencyCheck[] = baseScores.map((b, i) => {
      const r = pseudoRandom(input.imageSeed + i * 1.7);
      let v: number;
      if (verdictTarget === "authentic") v = 82 + r * 16;
      else if (verdictTarget === "suspicious") v = 48 + r * 26;
      else v = 22 + r * 30;
      const score = Math.round(Math.min(99, Math.max(8, v)));
      return {
        feature: b.feature,
        score,
        status: checkStatus(score),
        note: score >= 80 ? b.note : score >= 50 ? `${b.note} — partial match` : `${b.note} — anomaly detected`,
      };
    });

    const total = checks.reduce((acc, c, i) => acc + c.score * baseScores[i].weight, 0);
    const weightSum = baseScores.reduce((a, b) => a + b.weight, 0);
    const authenticityScore = Math.round(total / weightSum);

    return {
      imageUrl: input.imageUrl,
      noteLabel,
      authenticityScore,
      verdict: verdictFromScore(authenticityScore),
      checks,
    };
  }
}

export const currencyDetectionService = new CurrencyDetectionService();
