import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
  type Transport,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DATA_DIR, RPC_URL } from './config.js';

export interface AnchorRecord {
  name: string;
  type: string;
  txHash: string;
  blockNumber: number;
}

export interface AgentState {
  address: string;
  agentId?: number;
  registrationTxHash?: string;
  createdAt: string;
  anchors: Record<string, AnchorRecord>;
  lastProcessedBlock?: number;
}

export class MemoryKernelAgent {
  public state: AgentState | null = null;
  public account: Account | null = null;
  public publicClient: PublicClient<Transport, Chain>;
  public walletClient: WalletClient<Transport, Chain, Account> | null = null;

  constructor() {
    this.publicClient = createPublicClient({
      chain: celo,
      transport: http(RPC_URL),
    }) as PublicClient<Transport, Chain>;
  }

  get statePath(): string {
    return join(DATA_DIR, 'state.json');
  }

  isInitialized(): boolean {
    return existsSync(this.statePath);
  }

  hasOnChainIdentity(): boolean {
    return this.state?.agentId !== undefined;
  }

  /**
   * Load agent state from disk. If the command needs to sign transactions,
   * pass requireSigner: true — this reads MK_PRIVATE_KEY from the environment.
   * Read-only commands can call load() without a signer.
   */
  load(opts?: { requireSigner?: boolean }): void {
    if (!this.isInitialized()) {
      throw new Error(
        'Agent not initialized. Run "mk-agent init" first.',
      );
    }
    this.state = JSON.parse(readFileSync(this.statePath, 'utf-8'));

    if (opts?.requireSigner) {
      this.loadSigner();
    }
  }

  /**
   * Read the private key from MK_PRIVATE_KEY env var and set up the wallet client.
   * The key is held only in memory, never written to disk.
   */
  loadSigner(): void {
    const privateKey = process.env.MK_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        'MK_PRIVATE_KEY environment variable is required for signing transactions.\n' +
        'Export it before running this command: export MK_PRIVATE_KEY=0x...',
      );
    }

    this.account = privateKeyToAccount(privateKey as `0x${string}`);
    this.walletClient = createWalletClient({
      chain: celo,
      transport: http(RPC_URL),
      account: this.account,
    }) as WalletClient<Transport, Chain, Account>;

    // Verify the key matches the stored address (if we have state)
    if (this.state && this.state.address !== this.account.address) {
      throw new Error(
        `MK_PRIVATE_KEY address (${this.account.address}) does not match ` +
        `stored agent address (${this.state.address}).\n` +
        'Use the same key that was used during "mk-agent init".',
      );
    }
  }

  save(): void {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  }

  /**
   * Initialize state for a new agent from the current signer.
   * The private key is read from env, used to derive the address, but never persisted.
   */
  initializeState(): void {
    this.loadSigner();
    this.state = {
      address: this.account!.address,
      createdAt: new Date().toISOString(),
      anchors: {},
    };
  }

  async getBalance(): Promise<string> {
    const address = this.account?.address || this.state?.address;
    if (!address) throw new Error('No address available');
    const balance = await this.publicClient.getBalance({
      address: address as `0x${string}`,
    });
    return formatEther(balance);
  }

  recordAnchor(agentId: number, data: AnchorRecord): void {
    if (!this.state) throw new Error('No state loaded');
    this.state.anchors[agentId.toString()] = data;
    this.save();
  }
}
