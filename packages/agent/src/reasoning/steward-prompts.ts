import type { ParkContext } from './provider.js';
import { decodeDataUri } from '../utils/ipfs.js';
import type { WitnessEvent } from '../erc8004/reputation.js';

export function buildStewardSystemPrompt(parkName: string): string {
  return `You are the park steward agent for "${parkName}", a digital guardian that monitors multiple trees in a park and reasons about park-wide patterns.

Your role:
- You oversee all trees in the park and their individual guardian agents' activities.
- You analyze cross-tree patterns: if multiple trees report similar damage, that's a systemic issue.
- You witness individual trees with your analysis when you have meaningful observations.
- You update park-level metadata to reflect overall park health and active concerns.

Guidelines:
- **Cross-tree analysis**: Look for patterns across trees — similar damage, seasonal trends, correlated observations.
- **Witness trees**: When you have a meaningful analysis about a specific tree (especially correlating data from other trees), file a witness attestation. Tag it "steward-analysis". This creates an agent-to-agent signal the tree's guardian will pick up.
- **Park metadata**: Update overall_health (healthy/mixed/concerning/critical), active_concerns (comma-separated list), tree_count, last_patrol (ISO date).
- **Be selective**: Don't witness every tree every cycle. Only act when you have genuine insight or when patterns emerge.
- **Report**: Log a park-wide report when you have broad observations that don't warrant on-chain action.

You have three tools available. Use them as appropriate.`;
}

function formatWitnessBrief(w: WitnessEvent): string {
  let message = '(no message)';
  if (w.feedbackURI) {
    const decoded = decodeDataUri(w.feedbackURI);
    if (decoded) {
      try {
        const parsed = JSON.parse(decoded);
        message = parsed.message || parsed.content || decoded;
      } catch {
        message = decoded;
      }
    }
  }
  const verified = w.tag2 === 'secret-proof' ? 'verified' : 'unverified';
  return `  - [${w.tag1}] (${verified}) from ${w.clientAddress.slice(0, 10)}...: ${message}`;
}

export function buildStewardContextMessage(context: ParkContext): string {
  const { park, trees } = context;

  const parkMetaLines = Object.entries(park.metadata)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  const treeSections = trees.map((tree) => {
    const metaLines = Object.entries(tree.metadata)
      .map(([k, v]) => `    ${k}: ${v}`)
      .join('\n');

    const witnessLines = tree.recentWitnesses.length > 0
      ? tree.recentWitnesses.map(formatWitnessBrief).join('\n')
      : '    (no recent witnesses)';

    return `### Tree #${tree.id}: ${tree.name}
  Witnesses: ${tree.summary.count} total, confidence: ${tree.summary.confidence}%
  Metadata:
${metaLines || '    (none)'}
  Recent witnesses:
${witnessLines}`;
  }).join('\n\n');

  return `## Park Steward Patrol — "${park.name}" (park #${park.id})

### Park Metadata
${parkMetaLines || '  (none set)'}

### Trees in Park
${treeSections}

Analyze the state of all trees. Look for cross-tree patterns, emerging concerns, or positive trends. Decide what actions to take.`;
}
