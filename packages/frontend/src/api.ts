import type { AnchorData } from './types';

export async function fetchAnchor(): Promise<AnchorData> {
  const res = await fetch('/api/status');
  if (!res.ok) throw new Error('Failed to fetch tree status');
  return res.json();
}

export async function prepareWitnessTx(params: {
  message: string;
  witnessAddress: string;
  tag1: string;
  secret?: string;
}): Promise<{ to: string; data: string; verified: boolean }> {
  const res = await fetch('/api/witness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Failed to prepare witness');
  return body;
}

/**
 * Converse with the tree. When x402Fetch is provided, payment is handled
 * automatically — the wrapper detects 402 responses, prompts the wallet
 * to sign a USDC payment authorization, and retries.
 */
export async function converseWithTree(
  message: string,
  history: { role: string; content: string }[],
  x402Fetch?: typeof fetch | null,
): Promise<string> {
  const doFetch = x402Fetch || fetch;

  const res = await doFetch('/api/converse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  // If we get a 402 without x402Fetch, surface it clearly
  if (res.status === 402 && !x402Fetch) {
    throw new Error('x402_payment_required');
  }

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Failed');
  return body.response;
}
