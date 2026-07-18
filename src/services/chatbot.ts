import type { Language } from "@/types";

interface IntentRule {
  id: string;
  keywords: string[];
  weight: number;
}

interface RuleSet {
  language: Language;
  rules: IntentRule[];
  responses: Record<string, string>;
  fallback: string;
}

const RULES: Record<Language, RuleSet> = {
  en: {
    language: "en",
    fallback:
      "I'm your Citizen Fraud Shield. Share the call message, SMS, or ask 'Should I trust this call?' and I'll assess the risk and tell you the safest next step.",
    rules: [
      { id: "trust_call", keywords: ["trust", "this call", "real call", "genuine", "should i trust"], weight: 5 },
      { id: "transfer", keywords: ["transfer", "send money", "pay", "deposit", "upi"], weight: 5 },
      { id: "otp", keywords: ["otp", "cvv", "pin", "password", "card details"], weight: 6 },
      { id: "arrest", keywords: ["arrest", "cbi", "police", "custody", "warrant", "case filed"], weight: 6 },
      { id: "refund", keywords: ["refund", "bonus", "prize", "lottery", "gift", "win"], weight: 4 },
      { id: "aadhaar", keywords: ["aadhaar", "pan", "kyc", "verify"], weight: 4 },
      { id: "block", keywords: ["block", "suspend", "deactivate", "disconnect", "sim"], weight: 5 },
      { id: "general", keywords: ["fraud", "scam", "fake", "suspicious", "doubt"], weight: 3 },
    ],
    responses: {
      trust_call:
        "Do NOT trust the call if the caller pressures you to act immediately. Genuine officials never demand instant transfers over a phone call. Hang up and dial the official helpline yourself from the number printed on the back of your card or the official website.",
      transfer:
        "Never transfer money to someone who called you first. Pause, verify the request through an official channel, and tell a family member. If you already sent money, call 1930 (cyber crime helpline) immediately.",
      otp:
        "Never share OTP, CVV, PIN, or password with anyone — not even a bank employee or police officer. Sharing an OTP is the most common way accounts are drained. This is a scam.",
      arrest:
        "This is a classic 'digital arrest' scam. No real police officer or CBI official demands money to stop an arrest. Hang up, do not stay on the line, and report to 1930 or cybercrime.gov.in.",
      refund:
        "Unsolicited refunds, prizes, and lottery wins are bait. Do not click any link or pay a 'processing fee'. Block the number and report it.",
      aadhaar:
        "Government departments never ask you to verify Aadhaar/PAN over a phone call by sharing details. Visit the nearest centre or use the official UIDAI/Income Tax portal instead.",
      block:
        "Threats to block or suspend your SIM/account are pressure tactics. Contact your provider directly through their verified app or helpline to confirm status.",
      general:
        "Treat it as suspicious until verified. Do not share personal or financial details, do not click links, and report the number on cybercrime.gov.in or call 1930.",
    },
  },
  te: {
    language: "te",
    fallback:
      "నేను మీ సిటిజన్ ఫ్రాడ్ షీల్డ్. కాల్ మెసేజ్‌ని పంపండి లేదా 'ఈ కాల్ నిజమేనా?' అని అడగండి — మీకు రిస్క్‌ను చెబుతాను.",
    rules: [
      { id: "trust_call", keywords: ["nijamena", "nammacha", "call", "nammana"], weight: 5 },
      { id: "transfer", keywords: ["transfer", "dabbu", "pampu", "pay"], weight: 5 },
      { id: "otp", keywords: ["otp", "pin", "password", "cvv"], weight: 6 },
      { id: "arrest", keywords: ["arrest", "cbi", "police", "case"], weight: 6 },
      { id: "general", keywords: ["fraud", "scam", "fake", "anumana"], weight: 3 },
    ],
    responses: {
      trust_call:
        "కాలర్ మిమ్మల్ని త్వరగా ఏదైనా చేయమంటే ఆ కాల్‌ను నమ్మవద్దు. అసలు అధికారులు ఫోన్‌లో డబ్బు అడగరు. కాల్ కట్ చేసి అధికారిక హెల్ప్‌లైన్‌కు మీరే డయల్ చేయండి.",
      transfer:
        "ముందు కాల్ చేసిన వారికి డబ్బు పంపవద్దు. అధికారిక ఛానెల్ ద్వారా ధృవీకరించండి. ఇప్పటికే పంపినట్లయితే 1930 కు కాల్ చేయండి.",
      otp:
        "OTP, PIN, పాస్‌వర్డ్ ఎవరితోనూ పంచుకోవద్దు — బ్యాంక్ ఉద్యోగి అయినా కూడా. ఇది ఘోర మోసం.",
      arrest:
        "ఇది 'డిజిటల్ అరెస్ట్' మోసం. అసలు పోలీసులు ఫోన్‌లో డబ్బు అడగరు. కాల్ కట్ చేసి 1930 కు కాల్ చేయండి.",
      general:
        "ధృవీకరణ వరకు దానిని అనుమానంగా పరిగణించండి. cybercrime.gov.in లో రిపోర్ట్ చేయండి.",
    },
  },
  hi: {
    language: "hi",
    fallback:
      "मैं आपका सिटिजन फ्रॉड शील्ड हूँ। कॉल मैसेज भेजें या पूछें 'क्या यह फ्रॉड है?' — मैं रिस्क बताऊँगा।",
    rules: [
      { id: "trust_call", keywords: ["fraud hai", "sach hai", "kya yeh", "bharosa"], weight: 5 },
      { id: "transfer", keywords: ["transfer", "paisa", "bhej", "pay"], weight: 5 },
      { id: "otp", keywords: ["otp", "pin", "password", "cvv"], weight: 6 },
      { id: "arrest", keywords: ["arrest", "cbi", "police", "case"], weight: 6 },
      { id: "general", keywords: ["fraud", "scam", "fake", "shak"], weight: 3 },
    ],
    responses: {
      trust_call:
        "अगर कॉलर आपको तुरंत कुछ करने के लिए दबाव डाले तो उस पर भरोसा न करें। असली अधिकारी फोन पर पैसे नहीं माँगते। कॉल काटें और अधिकारिक हेल्पलाइन पर खुद डायल करें।",
      transfer:
        "जो पहले कॉल करे उसे पैसे मत भेजें। अधिकारिक चैनल से पुष्टि करें। पैसे भेज चुके हैं तो तुरंत 1930 पर कॉल करें।",
      otp:
        "OTP, PIN, पासवर्ड किसी के साथ शेयर न करें — बैंक कर्मचारी हो या पुलिस। यह सबसे आम धोखाधड़ी है।",
      arrest:
        "यह 'डिजिटल अरेस्ट' घोटाला है। असली पुलिस फोन पर गिरफ्तारी रोकने के लिए पैसे नहीं माँगती। कॉल काटें और 1930 पर रिपोर्ट करें।",
      general:
        "जब तक पुष्टि न हो इसे संदिग्ध मानें। cybercrime.gov.in पर रिपोर्ट करें या 1930 पर कॉल करें।",
    },
  },
};

function detectLanguage(text: string): Language {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  const lower = text.toLowerCase();
  if (/\b(fraud hai|sach hai|paisa|bharosa)\b/.test(lower)) return "hi";
  if (/\b(nijamena|nammacha|dabbu|anumana)\b/.test(lower)) return "te";
  return "en";
}

function scoreIntent(text: string, language: Language): string {
  const lower = text.toLowerCase();
  const set = RULES[language];
  let best: { id: string; weight: number } | null = null;
  for (const rule of set.rules) {
    const hits = rule.keywords.filter((k) => lower.includes(k)).length;
    if (hits === 0) continue;
    const weight = rule.weight + hits;
    if (!best || weight > best.weight) best = { id: rule.id, weight };
  }
  return best?.id ?? "fallback";
}

export interface ChatbotResult {
  language: Language;
  intent: string;
  reply: string;
}

export class ChatbotService {
  respond(message: string, forcedLang?: Language): ChatbotResult {
    const language = forcedLang || detectLanguage(message);
    const intent = scoreIntent(message, language);
    const set = RULES[language];
    const reply = set.responses[intent] ?? set.fallback;
    return { language, intent, reply };
  }
}

export const chatbotService = new ChatbotService();
