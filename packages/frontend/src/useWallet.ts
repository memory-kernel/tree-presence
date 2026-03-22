import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

const CELO_CHAIN_ID = '0xa4ec';

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const hasWallet = typeof window.ethereum !== 'undefined';

  useEffect(() => {
    if (!hasWallet) return;
    window.ethereum!.request({ method: 'eth_accounts' }).then((accounts) => {
      const accs = accounts as string[];
      if (accs.length > 0) setAddress(accs[0]);
    });
  }, [hasWallet]);

  const connect = useCallback(async () => {
    if (!hasWallet) return;
    const accounts = (await window.ethereum!.request({
      method: 'eth_requestAccounts',
    })) as string[];
    const addr = accounts[0];

    // Switch to Celo
    const chainId = await window.ethereum!.request({ method: 'eth_chainId' });
    if (chainId !== CELO_CHAIN_ID) {
      try {
        await window.ethereum!.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CELO_CHAIN_ID }],
        });
      } catch (e: unknown) {
        if ((e as { code?: number }).code === 4902) {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: CELO_CHAIN_ID,
                chainName: 'Celo',
                nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
                rpcUrls: ['https://forno.celo.org'],
                blockExplorerUrls: ['https://celoscan.io'],
              },
            ],
          });
        }
      }
    }

    setAddress(addr);
  }, [hasWallet]);

  const sendTransaction = useCallback(
    async (tx: { to: string; data: string }) => {
      if (!address) throw new Error('Not connected');
      return window.ethereum!.request({
        method: 'eth_sendTransaction',
        params: [{ from: address, to: tx.to, data: tx.data }],
      }) as Promise<string>;
    },
    [address],
  );

  return { address, hasWallet, connect, sendTransaction };
}
