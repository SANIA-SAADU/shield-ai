import type { FraudNode } from "@/types";

export interface GraphCluster {
  id: string;
  label: string;
  nodeIds: string[];
  sharedRisk: number;
  description: string;
}

export class FraudGraphService {
  buildClusters(nodes: FraudNode[]): GraphCluster[] {
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const visited = new Set<string>();
    const clusters: GraphCluster[] = [];

    const dfs = (start: string, acc: string[]) => {
      if (visited.has(start)) return;
      visited.add(start);
      acc.push(start);
      const node = byId.get(start);
      if (!node) return;
      for (const link of node.links) {
        if (byId.has(link) && !visited.has(link)) dfs(link, acc);
      }
    };

    for (const n of nodes) {
      if (visited.has(n.nodeId)) continue;
      const acc: string[] = [];
      dfs(n.nodeId, acc);
      if (acc.length < 2) continue;
      const sharedRisk = Math.round(
        acc.reduce((sum, id) => sum + (byId.get(id)?.risk || 0), 0) / acc.length
      );
      const victim = acc.find((id) => byId.get(id)?.nodeType === "victim");
      const phone = acc.find((id) => byId.get(id)?.nodeType === "phone");
      clusters.push({
        id: `cluster_${clusters.length + 1}`,
        label: victim ? byId.get(victim)!.label.replace(" (Victim)", "") : "Unknown network",
        nodeIds: acc,
        sharedRisk,
        description: `${acc.length} linked entities · central number ${phone ? byId.get(phone)?.label : "n/a"} · risk ${sharedRisk}`,
      });
    }

    return clusters.sort((a, b) => b.sharedRisk - a.sharedRisk);
  }

  tracePath(nodes: FraudNode[], fromId: string, toId: string): string[] | null {
    const byId = new Map(nodes.map((n) => [n.nodeId, n]));
    const prev = new Map<string, string | null>();
    const queue: string[] = [fromId];
    prev.set(fromId, null);

    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === toId) break;
      const node = byId.get(cur);
      if (!node) continue;
      for (const link of node.links) {
        if (!prev.has(link) && byId.has(link)) {
          prev.set(link, cur);
          queue.push(link);
        }
      }
    }

    if (!prev.has(toId)) return null;
    const path: string[] = [];
    let cur: string | null = toId;
    while (cur) {
      path.unshift(cur);
      cur = prev.get(cur) ?? null;
    }
    return path;
  }
}

export const fraudGraphService = new FraudGraphService();
