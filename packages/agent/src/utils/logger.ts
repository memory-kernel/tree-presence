import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DATA_DIR, CELOSCAN_URL } from '../config.js';

export interface LogEntry {
  timestamp: string;
  command: string;
  txHash?: string;
  blockNumber?: number;
  details: Record<string, unknown>;
}

function getLogPath(): string {
  return join(DATA_DIR, 'agent_log.json');
}

function loadLog(): LogEntry[] {
  const path = getLogPath();
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export function appendLog(entry: Omit<LogEntry, 'timestamp'>): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const logs = loadLog();
  logs.push({ timestamp: new Date().toISOString(), ...entry });
  writeFileSync(getLogPath(), JSON.stringify(logs, null, 2));
}

export function writeAgentManifest(data: {
  address: string;
  agentId: number;
}): void {
  const manifest = {
    name: 'tree-presence-agent',
    version: '0.1.0',
    description:
      'Agent that manages physical-object identities on Celo via ERC-8004. ' +
      'Physical objects get verifiable digital presence through human encounter.',
    chain: 'celo',
    chainId: 42220,
    address: data.address,
    agentId: data.agentId,
    capabilities: ['anchor', 'witness', 'resolve', 'verify'],
    contracts: {
      identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    },
    links: {
      celoscan: `${CELOSCAN_URL}/address/${data.address}`,
      identity: `${CELOSCAN_URL}/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=${data.agentId}`,
    },
  };
  writeFileSync(
    join(process.cwd(), 'agent.json'),
    JSON.stringify(manifest, null, 2),
  );
}

export function txUrl(hash: string): string {
  return `${CELOSCAN_URL}/tx/${hash}`;
}
