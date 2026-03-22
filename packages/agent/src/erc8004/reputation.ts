import {
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  type Transport,
  type Log,
  decodeEventLog,
} from 'viem';
import { REPUTATION_REGISTRY } from '../config.js';
import { reputationRegistryAbi } from './abis.js';

export interface WitnessEvent {
  agentId: bigint;
  clientAddress: `0x${string}`;
  feedbackIndex: number;
  value: bigint;
  valueDecimals: number;
  tag1: string;
  tag2: string;
  endpoint: string;
  feedbackURI: string;
  feedbackHash: `0x${string}`;
  blockNumber: bigint;
  txHash: `0x${string}`;
}

/**
 * Submit a witness attestation (feedback) for an anchor.
 */
export async function giveFeedback(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  params: {
    agentId: bigint;
    value: bigint;
    valueDecimals: number;
    tag1: string;
    tag2: string;
    endpoint: string;
    feedbackURI: string;
    feedbackHash: `0x${string}`;
  },
): Promise<{ txHash: `0x${string}`; blockNumber: bigint }> {
  const { request } = await publicClient.simulateContract({
    address: REPUTATION_REGISTRY,
    abi: reputationRegistryAbi,
    functionName: 'giveFeedback',
    args: [
      params.agentId,
      params.value,
      params.valueDecimals,
      params.tag1,
      params.tag2,
      params.endpoint,
      params.feedbackURI,
      params.feedbackHash,
    ],
    account: walletClient.account,
  });
  const txHash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  return { txHash, blockNumber: receipt.blockNumber };
}

/**
 * Get all NewFeedback events for an anchor.
 */
export async function getWitnessEvents(
  publicClient: PublicClient<Transport, Chain>,
  agentId: bigint,
  fromBlock?: bigint,
): Promise<WitnessEvent[]> {
  const currentBlock = await publicClient.getBlockNumber();
  const startBlock = fromBlock ?? BigInt(Math.max(0, Number(currentBlock) - 500_000));

  const logs = await publicClient.getLogs({
    address: REPUTATION_REGISTRY,
    event: {
      type: 'event',
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
    },
    args: {
      agentId,
    },
    fromBlock: startBlock,
    toBlock: 'latest',
  });

  // The feedbackIndex emitted in NewFeedback events may be a global sequential
  // index across all clients, but appendResponse expects a per-client index.
  // Compute per-client indices by counting feedbacks per client in event order.
  const perClientCounters = new Map<string, number>();
  return logs.map((log) => {
    const client = log.args.clientAddress!.toLowerCase();
    const perClientIndex = perClientCounters.get(client) ?? 0;
    perClientCounters.set(client, perClientIndex + 1);
    return {
      agentId: log.args.agentId!,
      clientAddress: log.args.clientAddress!,
      feedbackIndex: perClientIndex,
      value: log.args.value!,
      valueDecimals: Number(log.args.valueDecimals!),
      tag1: log.args.tag1!,
      tag2: log.args.tag2!,
      endpoint: log.args.endpoint!,
      feedbackURI: log.args.feedbackURI!,
      feedbackHash: log.args.feedbackHash!,
      blockNumber: log.blockNumber,
      txHash: log.transactionHash!,
    };
  });
}

/**
 * Get witness summary (count + aggregate value).
 * Fetches clients first since the contract requires non-empty clientAddresses.
 */
export async function getSummary(
  publicClient: PublicClient<Transport, Chain>,
  agentId: bigint,
  tag1 = '',
  tag2 = '',
): Promise<{ count: number; summaryValue: bigint; summaryValueDecimals: number }> {
  // Contract requires clientAddresses to be non-empty
  const clients = await getClients(publicClient, agentId);
  if (clients.length === 0) {
    return { count: 0, summaryValue: 0n, summaryValueDecimals: 0 };
  }

  const [count, summaryValue, summaryValueDecimals] = await publicClient.readContract({
    address: REPUTATION_REGISTRY,
    abi: reputationRegistryAbi,
    functionName: 'getSummary',
    args: [agentId, clients, tag1, tag2],
  }) as [bigint, bigint, number];

  return {
    count: Number(count),
    summaryValue,
    summaryValueDecimals,
  };
}

/**
 * Get all unique witness addresses for an anchor.
 */
export async function getClients(
  publicClient: PublicClient<Transport, Chain>,
  agentId: bigint,
): Promise<`0x${string}`[]> {
  return publicClient.readContract({
    address: REPUTATION_REGISTRY,
    abi: reputationRegistryAbi,
    functionName: 'getClients',
    args: [agentId],
  }) as Promise<`0x${string}`[]>;
}

/**
 * Append a response to a specific witness feedback entry.
 * Only the anchor owner can call this.
 */
export async function appendResponse(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  params: {
    agentId: bigint;
    clientAddress: `0x${string}`;
    feedbackIndex: number;
    responseURI: string;
    responseHash: `0x${string}`;
  },
): Promise<`0x${string}`> {
  const { request } = await publicClient.simulateContract({
    address: REPUTATION_REGISTRY,
    abi: reputationRegistryAbi,
    functionName: 'appendResponse',
    args: [
      params.agentId,
      params.clientAddress,
      BigInt(params.feedbackIndex),
      params.responseURI,
      params.responseHash,
    ],
    account: walletClient.account,
  });
  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}
