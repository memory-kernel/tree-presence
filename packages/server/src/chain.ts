import {
  createPublicClient,
  http,
  hexToString,
  encodeFunctionData,
  keccak256,
  stringToHex,
  type PublicClient,
  type Chain,
  type Transport,
} from 'viem';
import { celo } from 'viem/chains';

const IDENTITY_REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432' as const;
const REPUTATION_REGISTRY = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63' as const;

// Minimal ABIs — only what the web server needs for reads
const identityAbi = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'metadataKey', type: 'string' },
    ],
    name: 'getMetadata',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const reputationAbi = [
  {
    inputs: [{ name: 'agentId', type: 'uint256' }],
    name: 'getClients',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    name: 'getSummary',
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const newFeedbackEvent = {
  type: 'event' as const,
  name: 'NewFeedback',
  inputs: [
    { indexed: true, name: 'agentId', type: 'uint256' },
    { indexed: true, name: 'clientAddress', type: 'address' },
    { indexed: false, name: 'feedbackIndex', type: 'uint64' },
    { indexed: false, name: 'value', type: 'int128' },
    { indexed: false, name: 'valueDecimals', type: 'uint8' },
    { indexed: true, name: 'indexedTag1', type: 'string' },
    { indexed: false, name: 'tag1', type: 'string' },
    { indexed: false, name: 'tag2', type: 'string' },
    { indexed: false, name: 'endpoint', type: 'string' },
    { indexed: false, name: 'feedbackURI', type: 'string' },
    { indexed: false, name: 'feedbackHash', type: 'bytes32' },
  ],
};

const responseAppendedEvent = {
  type: 'event' as const,
  name: 'ResponseAppended',
  inputs: [
    { indexed: true, name: 'agentId', type: 'uint256' },
    { indexed: true, name: 'clientAddress', type: 'address' },
    { indexed: false, name: 'feedbackIndex', type: 'uint64' },
    { indexed: true, name: 'respondentAddress', type: 'address' },
    { indexed: false, name: 'responseURI', type: 'string' },
    { indexed: false, name: 'responseHash', type: 'bytes32' },
  ],
};

const RPC_URL = process.env.CELO_RPC_URL || undefined;

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL),
}) as PublicClient<Transport, Chain>;

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
  blockNumber: bigint;
  timestamp: number;
  txHash: string;
}

export interface ResponseData {
  clientAddress: string;
  feedbackIndex: number;
  message: string;
  responseHash: string;
  blockNumber: bigint;
  timestamp: number;
  txHash: string;
}

function decodeDataUri(uri: string): string | null {
  const match = uri.match(/^data:[^;]+;base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[1], 'base64').toString('utf-8');
}

const METADATA_KEYS = [
  'type', 'name', 'status', 'health', 'season', 'last_observation',
  'framework', 'creator', 'bindingStrategy', 'bindingCommitment',
  'overall_health', 'active_concerns', 'tree_count', 'last_patrol',
  'imageURI', 'latitude', 'longitude',
];

export async function fetchAnchor(anchorId: number): Promise<AnchorData> {
  const id = BigInt(anchorId);

  const [owner, tokenURI] = await Promise.all([
    publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityAbi,
      functionName: 'ownerOf',
      args: [id],
    }) as Promise<string>,
    publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityAbi,
      functionName: 'tokenURI',
      args: [id],
    }).catch(() => '') as Promise<string>,
  ]);

  // Parse registration JSON + services
  let registration: Record<string, unknown> | null = null;
  let services: { name: string; endpoint: string }[] = [];
  if (tokenURI) {
    const decoded = decodeDataUri(tokenURI);
    if (decoded) {
      try {
        registration = JSON.parse(decoded);
        if (registration && Array.isArray(registration.services)) {
          services = registration.services as { name: string; endpoint: string }[];
        }
      } catch {
        // Not JSON
      }
    }
  }

  // Fetch metadata
  const metadata: Record<string, string> = {};
  await Promise.all(
    METADATA_KEYS.map(async (key) => {
      try {
        const raw = await publicClient.readContract({
          address: IDENTITY_REGISTRY,
          abi: identityAbi,
          functionName: 'getMetadata',
          args: [id, key],
        }) as `0x${string}`;
        if (raw && raw !== '0x') {
          metadata[key] = hexToString(raw);
        }
      } catch {
        // Key not set
      }
    }),
  );

  // Fetch witness events
  const currentBlock = await publicClient.getBlockNumber();
  const startBlock = BigInt(Math.max(0, Number(currentBlock) - 500_000));

  const witnessLogs = await publicClient.getLogs({
    address: REPUTATION_REGISTRY,
    event: newFeedbackEvent,
    args: { agentId: id },
    fromBlock: startBlock,
    toBlock: 'latest',
  });

  // Fetch response events in parallel with witness parsing
  const responseLogs = await publicClient.getLogs({
    address: REPUTATION_REGISTRY,
    event: responseAppendedEvent,
    args: { agentId: id },
    fromBlock: startBlock,
    toBlock: 'latest',
  });

  // Collect unique block numbers for timestamp resolution
  const allLogs = [...witnessLogs, ...responseLogs];
  const uniqueBlocks = [...new Set(allLogs.map((l) => l.blockNumber))];
  const blockTimestamps = new Map<bigint, number>();
  await Promise.all(
    uniqueBlocks.map(async (bn) => {
      try {
        const block = await publicClient.getBlock({ blockNumber: bn });
        blockTimestamps.set(bn, Number(block.timestamp));
      } catch {
        blockTimestamps.set(bn, 0);
      }
    }),
  );

  const witnesses: WitnessData[] = witnessLogs.map((log) => {
    const args = log.args as Record<string, unknown>;
    let message = '';
    if (args.feedbackURI) {
      const decoded = decodeDataUri(args.feedbackURI as string);
      if (decoded) {
        try {
          const parsed = JSON.parse(decoded);
          message = parsed.message || '';
        } catch {
          message = decoded;
        }
      }
    }
    return {
      index: Number(args.feedbackIndex),
      from: args.clientAddress as string,
      tag1: args.tag1 as string,
      tag2: args.tag2 as string,
      message,
      feedbackHash: args.feedbackHash as string,
      blockNumber: log.blockNumber,
      timestamp: blockTimestamps.get(log.blockNumber) || 0,
      txHash: log.transactionHash!,
    };
  });

  const responses: ResponseData[] = responseLogs.map((log) => {
    const args = log.args as Record<string, unknown>;
    let message = '';
    if (args.responseURI) {
      const decoded = decodeDataUri(args.responseURI as string);
      if (decoded) {
        try {
          const parsed = JSON.parse(decoded);
          message = parsed.message || '';
        } catch {
          message = decoded;
        }
      }
    }
    return {
      clientAddress: args.clientAddress as string,
      feedbackIndex: Number(args.feedbackIndex),
      message,
      responseHash: args.responseHash as string,
      blockNumber: log.blockNumber,
      timestamp: blockTimestamps.get(log.blockNumber) || 0,
      txHash: log.transactionHash!,
    };
  });

  // Fetch summary
  let count = 0;
  try {
    const clients = await publicClient.readContract({
      address: REPUTATION_REGISTRY,
      abi: reputationAbi,
      functionName: 'getClients',
      args: [id],
    }) as `0x${string}`[];
    if (clients.length > 0) {
      const [c] = await publicClient.readContract({
        address: REPUTATION_REGISTRY,
        abi: reputationAbi,
        functionName: 'getSummary',
        args: [id, clients, '', ''],
      }) as [bigint, bigint, number];
      count = Number(c);
    }
  } catch {
    // No witnesses
  }

  return {
    id: anchorId,
    owner,
    tokenURI,
    registration,
    services,
    metadata,
    witnesses,
    responses,
    summary: { count, confidence: Math.min(100, count * 20) },
  };
}

// --- Witness transaction preparation ---

const giveFeedbackAbi = [
  {
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'value', type: 'int128' },
      { name: 'valueDecimals', type: 'uint8' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
      { name: 'endpoint', type: 'string' },
      { name: 'feedbackURI', type: 'string' },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    name: 'giveFeedback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export async function prepareWitnessTx(
  anchorId: number,
  params: {
    message: string;
    witnessAddress: string;
    tag1: string;
    secret?: string;
  },
): Promise<{ to: string; data: string; verified: boolean }> {
  const id = BigInt(anchorId);

  // Check witness is not the owner
  const owner = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: 'ownerOf',
    args: [id],
  }) as string;

  if (owner.toLowerCase() === params.witnessAddress.toLowerCase()) {
    throw new Error('You own this anchor. Witnesses must come from a different address.');
  }

  // Verify secret if provided
  let verified = false;
  let tag2 = 'unverified';
  if (params.secret) {
    const raw = (await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: identityAbi,
      functionName: 'getMetadata',
      args: [id, 'bindingCommitment'],
    })) as `0x${string}`;

    const onChain = raw && raw !== '0x' ? raw : '';
    const computed = keccak256(stringToHex(params.secret));

    if (onChain === computed) {
      verified = true;
      tag2 = 'secret-proof';
    } else {
      throw new Error('Secret does not match on-chain binding commitment');
    }
  }

  // Build inscription
  const inscription = {
    anchorId,
    message: params.message,
    witnessAddress: params.witnessAddress,
    timestamp: new Date().toISOString(),
    secretVerified: verified,
  };
  const feedbackURI = `data:application/json;base64,${Buffer.from(JSON.stringify(inscription)).toString('base64')}`;
  const feedbackHash = keccak256(stringToHex(params.message));

  const data = encodeFunctionData({
    abi: giveFeedbackAbi,
    functionName: 'giveFeedback',
    args: [id, 100n, 2, params.tag1, tag2, '', feedbackURI, feedbackHash],
  });

  return { to: REPUTATION_REGISTRY, data, verified };
}
