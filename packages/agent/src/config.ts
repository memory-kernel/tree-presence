import { join } from 'path';
import { celo } from 'viem/chains';

export const CHAIN = celo;

export const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const;
export const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as const;

export const DATA_DIR = process.env.TP_DATA_DIR
  ? join(process.cwd(), process.env.TP_DATA_DIR)
  : join(process.cwd(), '.tp-agent');

export const CELOSCAN_URL = 'https://celoscan.io';

export const RPC_URL = process.env.CELO_RPC_URL || undefined;
