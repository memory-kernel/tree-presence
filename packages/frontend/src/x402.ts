import { createWalletClient, custom } from 'viem';
import { base, baseSepolia, celo } from 'viem/chains';
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const CHAINS_BY_ID: Record<number, object> = {
  8453: base,
  84532: baseSepolia,
  42220: celo,
};

const ADD_CHAIN_PARAMS: Record<string, object> = {
  '0x2105': {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
  },
  '0x14a34': {
    chainId: '0x14a34',
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  },
};

/**
 * Creates a browser-wallet-compatible EVM signer for x402.
 * Uses viem's WalletClient to correctly encode EIP-712 typed data
 * for MetaMask's eth_signTypedData_v4.
 */
function createBrowserSigner(address: `0x${string}`) {
  return {
    address,
    async signTypedData(message: {
      domain: Record<string, unknown>;
      types: Record<string, unknown>;
      primaryType: string;
      message: Record<string, unknown>;
    }): Promise<`0x${string}`> {
      if (!window.ethereum) throw new Error('No wallet available');

      // Switch to the payment chain if needed (x402 pays on Base, app uses Celo)
      const requiredChainId = message.domain.chainId
        ? Number(message.domain.chainId)
        : null;
      const requiredChainHex = requiredChainId
        ? '0x' + requiredChainId.toString(16)
        : null;

      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const needsSwitch = requiredChainHex && requiredChainHex !== currentChainId;

      if (needsSwitch) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: requiredChainHex }],
          });
        } catch (e: unknown) {
          if ((e as { code?: number }).code === 4902) {
            const config = ADD_CHAIN_PARAMS[requiredChainHex!];
            if (config) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [config],
              });
            } else {
              throw new Error(`Please add chain ${requiredChainHex} to your wallet`);
            }
          } else {
            throw e;
          }
        }
      }

      try {
        // Use viem's WalletClient — it correctly serializes BigInt values
        // and EIP-712 typed data for MetaMask's eth_signTypedData_v4
        const chain = requiredChainId ? CHAINS_BY_ID[requiredChainId] : undefined;
        const walletClient = createWalletClient({
          account: address,
          chain: chain as Parameters<typeof createWalletClient>[0]['chain'],
          transport: custom(window.ethereum!),
        });

        // Strip EIP712Domain — viem adds it automatically
        const { EIP712Domain: _, ...typesWithoutDomain } = message.types as Record<
          string,
          { name: string; type: string }[]
        >;

        const signature = await walletClient.signTypedData({
          account: address,
          domain: message.domain as Parameters<typeof walletClient.signTypedData>[0]['domain'],
          types: typesWithoutDomain,
          primaryType: message.primaryType,
          message: message.message,
        });

        return signature;
      } finally {
        // Switch back to Celo so witness inscriptions still work
        if (needsSwitch) {
          window.ethereum!.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: currentChainId }],
          }).catch(() => {});
        }
      }
    },
  };
}

/**
 * Creates an x402-payment-aware fetch function for the connected wallet.
 * Returns null if no wallet address is provided.
 */
export function createX402Fetch(address: string | null): typeof fetch | null {
  if (!address || !window.ethereum) return null;

  const signer = createBrowserSigner(address as `0x${string}`);
  const client = new x402Client();
  registerExactEvmScheme(client, { signer });

  return wrapFetchWithPayment(fetch, client);
}
