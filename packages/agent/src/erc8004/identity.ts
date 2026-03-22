import {
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  type Transport,
  stringToHex,
  decodeEventLog,
} from 'viem';
import { IDENTITY_REGISTRY } from '../config.js';
import { identityRegistryAbi } from './abis.js';

type MetadataEntry = {
  metadataKey: string;
  metadataValue: `0x${string}`;
};

export type ServiceEntry = {
  name: string;
  endpoint: string;
};

/**
 * Register a new ERC-8004 identity with URI and metadata.
 * Returns the minted agentId and tx hash.
 */
export async function registerIdentity(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  agentURI: string,
  metadata: MetadataEntry[],
): Promise<{ agentId: bigint; txHash: `0x${string}`; blockNumber: bigint }> {
  const { request } = await publicClient.simulateContract({
    address: IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: 'register',
    args: [agentURI, metadata],
    account: walletClient.account,
  });
  const txHash = await walletClient.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Extract agentId from Registered event
  const registeredLog = receipt.logs.find((log) => {
    try {
      const decoded = decodeEventLog({
        abi: identityRegistryAbi,
        data: log.data,
        topics: log.topics,
      });
      return decoded.eventName === 'Registered';
    } catch {
      return false;
    }
  });

  if (!registeredLog) {
    throw new Error('Registered event not found in tx receipt');
  }

  const decoded = decodeEventLog({
    abi: identityRegistryAbi,
    data: registeredLog.data,
    topics: registeredLog.topics,
  });

  const agentId = (decoded.args as { agentId: bigint }).agentId;
  return { agentId, txHash, blockNumber: receipt.blockNumber };
}

/**
 * Set metadata on an existing identity.
 */
export async function setMetadata(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  agentId: bigint,
  key: string,
  value: `0x${string}`,
): Promise<`0x${string}`> {
  const { request } = await publicClient.simulateContract({
    address: IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: 'setMetadata',
    args: [agentId, key, value],
    account: walletClient.account,
  });
  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Read metadata from an identity.
 */
export async function getMetadata(
  publicClient: PublicClient<Transport, Chain>,
  agentId: bigint,
  key: string,
): Promise<`0x${string}`> {
  return publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: 'getMetadata',
    args: [agentId, key],
  }) as Promise<`0x${string}`>;
}

/**
 * Get the owner of an identity token.
 */
export async function getOwner(
  publicClient: PublicClient<Transport, Chain>,
  agentId: bigint,
): Promise<`0x${string}`> {
  return publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: 'ownerOf',
    args: [agentId],
  }) as Promise<`0x${string}`>;
}

/**
 * Get the token URI for an identity.
 */
export async function getTokenURI(
  publicClient: PublicClient<Transport, Chain>,
  agentId: bigint,
): Promise<string> {
  return publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: 'tokenURI',
    args: [agentId],
  }) as Promise<string>;
}

/**
 * Update the agent URI for an existing ERC-8004 identity.
 * Used after registration to populate services with the actual agentId.
 */
export async function updateAgentURI(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  agentId: bigint,
  newURI: string,
): Promise<`0x${string}`> {
  const { request } = await publicClient.simulateContract({
    address: IDENTITY_REGISTRY,
    abi: identityRegistryAbi,
    functionName: 'setAgentURI',
    args: [agentId, newURI],
    account: walletClient.account,
  });
  const txHash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

/**
 * Build a registration JSON for an ERC-8004 agent URI.
 */
export function buildRegistrationJson(params: {
  name: string;
  description: string;
  type?: string;
  imageURI?: string;
  latitude?: string;
  longitude?: string;
  services?: ServiceEntry[];
}): string {
  const json: Record<string, unknown> = {
    type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
    name: params.name,
    description: params.description,
    services: params.services ?? [],
    active: true,
  };
  if (params.imageURI) json.imageURI = params.imageURI;
  if (params.latitude && params.longitude) {
    json.location = { latitude: params.latitude, longitude: params.longitude };
  }
  return JSON.stringify(json);
}

/**
 * Build the default services array for an anchor.
 *
 * @param agentId — on-chain identity token ID
 * @param profileUrl — canonical human-readable page (e.g., https://treeappreciation.com/tree/brunswick-plane)
 * @param presenceUrl — base URL for presence API (e.g., https://presence.treeappreciation.com)
 */
export function buildServices(
  agentId: bigint,
  profileUrl?: string,
  presenceUrl?: string,
): ServiceEntry[] {
  const services: ServiceEntry[] = [];
  if (profileUrl) {
    services.push({ name: 'profile', endpoint: profileUrl });
  }
  if (presenceUrl) {
    const base = `${presenceUrl.replace(/\/$/, '')}/tree/${agentId}`;
    services.push(
      { name: 'witness', endpoint: `${base}/witness` },
      { name: 'converse', endpoint: `${base}/converse` },
      { name: 'health', endpoint: `${base}/health` },
    );
  }
  return services;
}

/**
 * Encode a string value as bytes for metadata storage.
 */
export function encodeStringMetadata(value: string): `0x${string}` {
  return stringToHex(value);
}
