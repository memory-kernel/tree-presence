/**
 * Content addressing utilities.
 * Uses data URIs for now; upgrade to Pinata/IPFS if time permits.
 */

export function createDataUri(content: string): string {
  const base64 = Buffer.from(content, 'utf-8').toString('base64');
  return `data:application/json;base64,${base64}`;
}

export function decodeDataUri(uri: string): string | null {
  const match = uri.match(/^data:[^;]+;base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[1], 'base64').toString('utf-8');
}
