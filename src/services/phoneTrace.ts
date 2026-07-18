import type { FraudNode } from "@/types";

export interface PhoneTrace {
  phone: string;
  carrier: string;
  registeredLocation: string;
  latitude: number;
  longitude: number;
  nearBanks: NearBank[];
  nearestBank: string;
  nearestBankDistanceM: number;
  insideBank: boolean;
  riskNotes: string;
}

export interface NearBank {
  name: string;
  branch: string;
  distanceM: number;
  direction: string;
}

interface CityDef {
  city: string;
  state: string;
  lat: number;
  lng: number;
  carriers: string[];
  banks: { name: string; branch: string; latOffset: number; lngOffset: number }[];
}

const CITIES: CityDef[] = [
  {
    city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867,
    carriers: ["Airtel", "Jio", "BSNL"],
    banks: [
      { name: "SBI", branch: "Banjara Hills", latOffset: 0.012, lngOffset: 0.008 },
      { name: "HDFC", branch: "Jubilee Hills", latOffset: -0.009, lngOffset: 0.014 },
      { name: "ICICI", branch: "Gachibowli", latOffset: 0.018, lngOffset: -0.011 },
    ],
  },
  {
    city: "Delhi", state: "Delhi", lat: 28.6139, lng: 77.209,
    carriers: ["Airtel", "Vodafone Idea", "Jio"],
    banks: [
      { name: "SBI", branch: "Connaught Place", latOffset: 0.008, lngOffset: 0.006 },
      { name: "HDFC", branch: "Karol Bagh", latOffset: -0.011, lngOffset: 0.009 },
      { name: "Axis", branch: "Lajpat Nagar", latOffset: 0.014, lngOffset: -0.007 },
    ],
  },
  {
    city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8774,
    carriers: ["Jio", "Airtel", "Vodafone Idea"],
    banks: [
      { name: "SBI", branch: "Bandra West", latOffset: 0.010, lngOffset: -0.008 },
      { name: "HDFC", branch: "Andheri East", latOffset: -0.013, lngOffset: 0.011 },
      { name: "Kotak", branch: "Worli", latOffset: 0.007, lngOffset: 0.015 },
    ],
  },
  {
    city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946,
    carriers: ["Airtel", "Jio"],
    banks: [
      { name: "SBI", branch: "Indiranagar", latOffset: 0.011, lngOffset: 0.009 },
      { name: "ICICI", branch: "Koramangala", latOffset: -0.008, lngOffset: 0.012 },
      { name: "HDFC", branch: "Whitefield", latOffset: 0.016, lngOffset: -0.010 },
    ],
  },
  {
    city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639,
    carriers: ["Vodafone Idea", "Airtel", "BSNL"],
    banks: [
      { name: "SBI", branch: "Park Street", latOffset: 0.009, lngOffset: 0.007 },
      { name: "HDFC", branch: "Salt Lake", latOffset: -0.012, lngOffset: 0.010 },
    ],
  },
  {
    city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707,
    carriers: ["Airtel", "Jio", "BSNL"],
    banks: [
      { name: "SBI", branch: "T. Nagar", latOffset: 0.010, lngOffset: -0.006 },
      { name: "ICICI", branch: "Anna Nagar", latOffset: -0.009, lngOffset: 0.013 },
    ],
  },
];

function hashPhone(phone: string): number {
  let h = 0;
  for (let i = 0; i < phone.length; i++) h = (h * 31 + phone.charCodeAt(i)) % 100000;
  return h;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function directionTo(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const angle = (Math.atan2(dLat, dLng) * 180) / Math.PI;
  const dirs = ["E", "NE", "N", "NW", "W", "SW", "S", "SE"];
  const idx = Math.round(((angle + 360) % 360) / 45) % 8;
  return dirs[idx];
}

export class PhoneTraceService {
  async trace(phone: string): Promise<PhoneTrace> {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const cleaned = phone.replace(/[^0-9+]/g, "");
    const seed = hashPhone(cleaned);
    const city = CITIES[seed % CITIES.length];
    const carrier = city.carriers[seed % city.carriers.length];

    const jitterLat = ((seed % 100) / 100 - 0.5) * 0.04;
    const jitterLng = (((seed >> 3) % 100) / 100 - 0.5) * 0.04;
    const lat = city.lat + jitterLat;
    const lng = city.lng + jitterLng;

    const nearBanks: NearBank[] = city.banks.map((b) => {
      const bLat = city.lat + b.latOffset;
      const bLng = city.lng + b.lngOffset;
      return {
        name: b.name,
        branch: b.branch,
        distanceM: haversineMeters(lat, lng, bLat, bLng),
        direction: directionTo(lat, lng, bLat, bLng),
      };
    }).sort((a, b) => a.distanceM - b.distanceM);

    const nearest = nearBanks[0];
    const insideBank = nearest.distanceM < 250;

    const riskNotes = insideBank
      ? `HIGH RISK: Caller located within ${nearest.distanceM}m of ${nearest.name} (${nearest.branch}) — possible in-person cash deposit coordination.`
      : nearest.distanceM < 800
      ? `MEDIUM RISK: Caller ${nearest.distanceM}m from ${nearest.name} (${nearest.branch}) — within walking distance of a bank.`
      : `LOW RISK: No bank branch within ${nearest.distanceM}m of caller location.`;

    return {
      phone,
      carrier,
      registeredLocation: `${city.city}, ${city.state}`,
      latitude: lat,
      longitude: lng,
      nearBanks,
      nearestBank: `${nearest.name} — ${nearest.branch}`,
      nearestBankDistanceM: nearest.distanceM,
      insideBank,
      riskNotes,
    };
  }
}

export const phoneTraceService = new PhoneTraceService();

export function traceResultToNode(trace: PhoneTrace, existing: FraudNode[]): { nodes: FraudNode[]; linkedVictim: string } {
  const phoneNodeId = `phone_${trace.phone.replace(/[^0-9]/g, "").slice(-8)}`;
  const phoneNode: FraudNode = {
    nodeId: phoneNodeId,
    nodeType: "phone",
    label: trace.phone,
    risk: trace.insideBank ? 95 : trace.nearestBankDistanceM < 800 ? 78 : 60,
    links: [],
    meta: {
      location: trace.registeredLocation,
      carrier: trace.carrier,
      nearestBank: trace.nearestBank,
      distanceM: trace.nearestBankDistanceM,
      insideBank: trace.insideBank,
    },
  };

  const bankNodeId = `bank_${phoneNodeId}`;
  const bankNode: FraudNode = {
    nodeId: bankNodeId,
    nodeType: "bank",
    label: trace.nearestBank,
    risk: trace.insideBank ? 88 : 65,
    links: [phoneNodeId],
    meta: { branch: trace.nearestBank, distanceM: trace.nearestBankDistanceM },
  };
  phoneNode.links = [bankNodeId];

  const victimId = existing.find((n) => n.nodeType === "victim")?.nodeId ?? "victim_new";
  if (victimId !== "victim_new") {
    const victimNode = existing.find((n) => n.nodeId === victimId);
    if (victimNode && !victimNode.links.includes(phoneNodeId)) {
      victimNode.links = [...victimNode.links, phoneNodeId];
    }
    phoneNode.links = [bankNodeId, victimId];
  }

  return { nodes: [phoneNode, bankNode], linkedVictim: victimId };
}
