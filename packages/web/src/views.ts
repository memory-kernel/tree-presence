import type { AnchorData, WitnessData, ResponseData } from './chain.js';

const CELOSCAN = 'https://celoscan.io';

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — Memory Kernel</title>
<style>
  :root { --bg: #0a0f0d; --fg: #d4e4d4; --accent: #4ade80; --muted: #6b8068; --card: #111a14; --border: #1e2e22; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Berkeley Mono', 'SF Mono', 'Menlo', monospace; background: var(--bg); color: var(--fg); line-height: 1.6; padding: 2rem; max-width: 960px; margin: 0 auto; }
  h1 { color: var(--accent); font-size: 1.5rem; margin-bottom: 0.5rem; }
  h2 { color: var(--accent); font-size: 1.1rem; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; }
  h3 { color: var(--fg); font-size: 0.95rem; margin: 1rem 0 0.3rem; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .subtitle { color: var(--muted); font-size: 0.85rem; margin-bottom: 1.5rem; }
  .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin: 0.5rem 0; }
  .meta-row { display: flex; gap: 0.5rem; padding: 0.2rem 0; font-size: 0.85rem; }
  .meta-key { color: var(--muted); min-width: 140px; }
  .meta-val { color: var(--fg); word-break: break-all; }
  .badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; }
  .badge-green { background: #166534; color: #4ade80; }
  .badge-yellow { background: #713f12; color: #fbbf24; }
  .badge-red { background: #7f1d1d; color: #f87171; }
  .badge-blue { background: #1e3a5f; color: #60a5fa; }
  .witness { border-left: 3px solid var(--accent); padding-left: 1rem; margin: 0.75rem 0; }
  .witness.steward { border-left-color: #60a5fa; }
  .witness-from { font-size: 0.75rem; color: var(--muted); }
  .witness-msg { margin: 0.25rem 0; }
  .response { margin-left: 2rem; border-left: 3px solid #fbbf24; padding-left: 1rem; margin-top: 0.5rem; }
  .response-label { font-size: 0.75rem; color: #fbbf24; font-weight: bold; }
  .confidence-bar { height: 8px; background: var(--border); border-radius: 4px; margin: 0.5rem 0; overflow: hidden; }
  .confidence-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.3s; }
  .services { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0; }
  .service { padding: 0.3rem 0.6rem; background: var(--card); border: 1px solid var(--border); border-radius: 4px; font-size: 0.8rem; }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.75rem; text-align: center; }
  .tree-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
</style>
</head>
<body>
${body}
<div class="footer">
  Memory Kernel — physical objects with verifiable digital presence on <a href="https://celo.org">Celo</a> via <a href="https://eips.ethereum.org/EIPS/eip-8004">ERC-8004</a>
</div>
</body>
</html>`;
}

function confidenceLabel(score: number): { label: string; cls: string } {
  if (score === 0) return { label: 'unverified', cls: 'badge-red' };
  if (score < 40) return { label: 'emerging', cls: 'badge-yellow' };
  if (score < 70) return { label: 'established', cls: 'badge-yellow' };
  if (score < 100) return { label: 'strong', cls: 'badge-green' };
  return { label: 'maximum', cls: 'badge-green' };
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function renderLanding(): string {
  return layout('Home', `
<h1>Memory Kernel</h1>
<p class="subtitle">Physical objects acquire verifiable digital presence through human encounter.</p>

<div class="card">
  <h3>What is this?</h3>
  <p style="margin-top: 0.5rem; font-size: 0.9rem;">
    Memory Kernel is infrastructure that lets physical things — trees, books, vinyl records, landmarks —
    have their own on-chain digital identities on Celo. People who encounter these objects leave
    <strong>witness attestations</strong>, and autonomous <strong>guardian agents</strong> powered by AI
    watch over the objects, maintaining their digital presence.
  </p>
</div>

<h2>The Tree Story</h2>
<div class="card">
  <p style="font-size: 0.9rem;">
    Imagine an old oak tree in a community park. It has an NFC tag on a nearby bench.
    When you tap the tag, you can leave a witness — an observation about the tree's health,
    beauty, or a memory of your encounter. A guardian agent watches over the tree, updating
    its on-chain status based on accumulated witness evidence. A park steward agent monitors
    multiple trees, looking for patterns across the park.
  </p>
  <p style="font-size: 0.9rem; margin-top: 0.5rem;">
    Two autonomous AI agents communicating through on-chain state — that's what ERC-8004 enables.
  </p>
</div>

<h2>Explore</h2>
<p style="font-size: 0.9rem; margin-top: 0.5rem;">
  View a tree: <code>/tree/:id</code> &nbsp;|&nbsp; View a park: <code>/park/:id</code> &nbsp;|&nbsp; JSON API: <code>/api/tree/:id</code>
</p>
`);
}

export function renderTree(data: AnchorData): string {
  const conf = confidenceLabel(data.summary.confidence);

  const metaRows = Object.entries(data.metadata)
    .filter(([k]) => !['framework'].includes(k))
    .map(([k, v]) => `<div class="meta-row"><span class="meta-key">${k}</span><span class="meta-val">${escHtml(v)}</span></div>`)
    .join('');

  const servicesTags = data.services.length > 0
    ? `<div class="services">${data.services.map((s) => `<span class="service">${escHtml(s.name)}: <span style="color:var(--muted)">${escHtml(s.endpoint.length > 50 ? s.endpoint.slice(0, 50) + '...' : s.endpoint)}</span></span>`).join('')}</div>`
    : '';

  // Build a map of responses by (clientAddress, feedbackIndex)
  const responseMap = new Map<string, ResponseData>();
  for (const r of data.responses) {
    responseMap.set(`${r.clientAddress.toLowerCase()}-${r.feedbackIndex}`, r);
  }

  const witnessCards = data.witnesses.length > 0
    ? data.witnesses.map((w) => {
        const isSteward = w.tag2 === 'steward' || w.tag1 === 'steward-analysis';
        const verified = w.tag2 === 'secret-proof' ? '<span class="badge badge-green">verified</span>' : '';
        const stewardBadge = isSteward ? '<span class="badge badge-blue">steward</span>' : '';
        const resp = responseMap.get(`${w.from.toLowerCase()}-${w.index}`);
        const responseHtml = resp
          ? `<div class="response"><span class="response-label">Guardian Response:</span><div class="witness-msg">${escHtml(resp.message)}</div><div class="witness-from"><a href="${CELOSCAN}/tx/${resp.txHash}">tx</a></div></div>`
          : '';
        return `<div class="witness${isSteward ? ' steward' : ''}">
  <div class="witness-from">${shortAddr(w.from)} ${verified} ${stewardBadge} &middot; block ${w.blockNumber} &middot; <a href="${CELOSCAN}/tx/${w.txHash}">tx</a></div>
  <div class="witness-msg">${escHtml(w.message || '(no message)')}</div>
  <div style="font-size:0.75rem;color:var(--muted)">tag: ${escHtml(w.tag1)}</div>
  ${responseHtml}
</div>`;
      }).join('')
    : '<p style="color:var(--muted)">No witnesses yet.</p>';

  return layout(data.metadata.name || `Tree #${data.id}`, `
<h1>${escHtml(data.metadata.name || `Tree #${data.id}`)}</h1>
<p class="subtitle">${escHtml(data.metadata.type || 'anchor')} &middot; anchor #${data.id} &middot; owned by ${shortAddr(data.owner)}</p>

<h2>Confidence</h2>
<div style="display:flex;align-items:center;gap:1rem;">
  <div class="confidence-bar" style="flex:1"><div class="confidence-fill" style="width:${data.summary.confidence}%"></div></div>
  <span class="badge ${conf.cls}">${data.summary.confidence}% ${conf.label}</span>
</div>
<div style="font-size:0.85rem;color:var(--muted);margin-top:0.25rem">${data.summary.count} witness(es)</div>

<h2>On-chain Metadata</h2>
<div class="card">${metaRows || '<span style="color:var(--muted)">(none)</span>'}</div>

${data.services.length > 0 ? '<h2>Services</h2>' + servicesTags : ''}

<h2>Witnesses &amp; Guardian Responses</h2>
${witnessCards}

<p style="margin-top:1rem;font-size:0.85rem"><a href="/api/tree/${data.id}">View as JSON</a></p>
`);
}

export function renderPark(park: AnchorData, trees: AnchorData[]): string {
  const conf = confidenceLabel(park.summary.confidence);

  const metaRows = Object.entries(park.metadata)
    .filter(([k]) => !['framework'].includes(k))
    .map(([k, v]) => `<div class="meta-row"><span class="meta-key">${k}</span><span class="meta-val">${escHtml(v)}</span></div>`)
    .join('');

  const treeCards = trees.map((t) => {
    const tc = confidenceLabel(t.summary.confidence);
    const healthBadge = t.metadata.health ? `<span class="badge ${t.metadata.health.includes('damage') ? 'badge-yellow' : 'badge-green'}">${escHtml(t.metadata.health)}</span>` : '';
    return `<div class="card">
  <h3><a href="/tree/${t.id}">${escHtml(t.metadata.name || `Tree #${t.id}`)}</a></h3>
  <div style="font-size:0.85rem;color:var(--muted)">anchor #${t.id} &middot; ${t.summary.count} witnesses</div>
  ${healthBadge}
  <div class="confidence-bar"><div class="confidence-fill" style="width:${t.summary.confidence}%"></div></div>
  <div style="font-size:0.75rem;color:var(--muted)">${t.summary.confidence}% ${tc.label}</div>
</div>`;
  }).join('');

  return layout(park.metadata.name || `Park #${park.id}`, `
<h1>${escHtml(park.metadata.name || `Park #${park.id}`)}</h1>
<p class="subtitle">park &middot; anchor #${park.id} &middot; steward ${shortAddr(park.owner)}</p>

<h2>Park Status</h2>
<div class="card">${metaRows || '<span style="color:var(--muted)">(none)</span>'}</div>

<h2>Trees (${trees.length})</h2>
<div class="tree-grid">${treeCards || '<p style="color:var(--muted)">No trees registered.</p>'}</div>

<h2>Steward Activity</h2>
${park.witnesses.length > 0
  ? park.witnesses.map((w) => `<div class="witness steward"><div class="witness-from">${shortAddr(w.from)} &middot; block ${w.blockNumber}</div><div class="witness-msg">${escHtml(w.message || '(no message)')}</div></div>`).join('')
  : '<p style="color:var(--muted)">No steward activity yet.</p>'}
`);
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
