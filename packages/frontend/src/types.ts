export interface AnchorData {
  id: number;
  owner: string;
  tokenURI: string;
  registration: Record<string, unknown> | null;
  services: { name: string; endpoint: string }[];
  metadata: Record<string, string>;
  witnesses: WitnessData[];
  responses: ResponseData[];
  summary: { count: number; confidence: number };
}

export interface WitnessData {
  index: number;
  from: string;
  tag1: string;
  tag2: string;
  message: string;
  feedbackHash: string;
  blockNumber: string;
  timestamp: number;
  txHash: string;
}

export interface ResponseData {
  clientAddress: string;
  feedbackIndex: number;
  message: string;
  responseHash: string;
  blockNumber: string;
  timestamp: number;
  txHash: string;
}
