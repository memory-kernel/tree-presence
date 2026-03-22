import type { WitnessEvent } from '../erc8004/reputation.js';

export interface AnchorContext {
  anchor: {
    id: number;
    name: string;
    type: string;
    metadata: Record<string, string>;
  };
  time: {
    iso: string;
    localTime: string;
    dayOfWeek: string;
    season: string;
  };
  witnesses: WitnessEvent[];
  unacknowledged: WitnessEvent[];
  summary: { count: number; confidence: number };
  lastWakeUp: string | null;
}

export type AgentAction =
  | { type: 'update_metadata'; key: string; value: string; reasoning: string }
  | { type: 'respond_to_witness'; witnessAddress: string; feedbackIndex: number; message: string; reasoning: string }
  | { type: 'log_observation'; note: string };

export interface ReasoningProvider {
  reason(context: AnchorContext): Promise<AgentAction[]>;
}

// --- Park Steward types ---

export interface ParkContext {
  park: { id: number; name: string; metadata: Record<string, string> };
  trees: Array<{
    id: number;
    name: string;
    metadata: Record<string, string>;
    recentWitnesses: WitnessEvent[];
    summary: { count: number; confidence: number };
  }>;
}

export type StewardAction =
  | { type: 'update_park_metadata'; key: string; value: string; reasoning: string }
  | { type: 'witness_tree'; treeId: number; message: string; tag: string; reasoning: string }
  | { type: 'log_report'; report: string };

export interface StewardReasoningProvider {
  reason(context: ParkContext): Promise<StewardAction[]>;
}
