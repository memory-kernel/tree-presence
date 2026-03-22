const IPFS_GATEWAY = 'https://magenta-neighbouring-crab-308.mypinata.cloud/ipfs/';
export const CELOSCAN = 'https://celoscan.io';

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function resolveImageUri(uri: string): string {
  if (uri.startsWith('ipfs://')) return IPFS_GATEWAY + uri.slice(7);
  return uri;
}

export function confidenceLabel(score: number): { label: string; cls: string } {
  if (score === 0) return { label: 'unverified', cls: 'badge-dim' };
  if (score < 40) return { label: 'emerging', cls: 'badge-warm' };
  if (score < 70) return { label: 'established', cls: 'badge-warm' };
  if (score < 100) return { label: 'strong', cls: 'badge-bright' };
  return { label: 'maximum', cls: 'badge-bright' };
}

export function humanTime(unixSeconds: number): string {
  if (!unixSeconds) return '';
  const date = new Date(unixSeconds * 1000);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ringAge(index: number, total: number): string {
  if (total <= 1) return 'ring--newest';
  if (index === total - 1) return 'ring--newest';
  const position = index / (total - 1);
  if (position < 0.4) return 'ring--old';
  if (position < 0.75) return 'ring--mid';
  return 'ring--recent';
}
