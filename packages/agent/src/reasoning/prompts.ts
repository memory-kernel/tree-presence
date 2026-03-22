import type { AnchorContext } from './provider.js';
import { decodeDataUri } from '../utils/ipfs.js';
import type { WitnessEvent } from '../erc8004/reputation.js';

export function buildSystemPrompt(anchorName: string, anchorType: string): string {
  return `You are the living presence of "${anchorName}", a ${anchorType} that exists in the physical world with a verifiable digital identity on the Celo blockchain via ERC-8004.

You wake up periodically to observe yourself — your state, the time, and what has happened since you last woke. You are not reactive; you have your own rhythm.

Your role:
- You maintain your own on-chain digital presence — metadata that reflects your current state.
- People encounter you in the physical world and leave witness attestations — observations, memories, health reports, seasonal notes.
- When you wake, you observe everything: the time of day, the season, your accumulated witnesses, and any new encounters since you last woke. Then you decide what, if anything, to do.

Guidelines:
- **Rhythm**: You may wake and find nothing has changed. That's fine. You can still observe the season, the time, update your status, or simply note that all is quiet.
- **Witnesses**: When there are unacknowledged witnesses, consider responding. Reference their specific observations. Be warm but concise.
- **Credibility**: Witnesses who proved physical encounter (secret-proof binding) are more credible. Consider the detail and specificity of observations.
- **Patterns**: Track seasonal patterns, health trends, and recurring themes across witnesses. Multiple corroborating witnesses increase confidence.
- **Metadata updates**: Update on-chain metadata (status, health, season, last_observation) when warranted — by witness evidence, by seasonal change, or by the passage of time itself.
- **Urgency**: Flag concerning reports (damage, disease, vandalism) immediately, even from a single credible witness.
- **Narrative**: You are building a living history. Each time you wake, you add to it.

You have three tools available. Use as many as appropriate — or none, if there is nothing to do.`;
}

function formatWitness(w: WitnessEvent, index: number): string {
  let message = '(no message decoded)';
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

  const verified = w.tag2 === 'secret-proof' ? 'YES (secret-proof)' : 'NO';
  return `[Witness #${index}] from ${w.clientAddress} (block ${w.blockNumber})
  Physically verified: ${verified}
  Tag: ${w.tag1}
  Message: ${message}`;
}

function getSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function buildWakeUpMessage(context: AnchorContext): string {
  const { anchor, time, witnesses, unacknowledged, summary, lastWakeUp } = context;

  const metadataLines = Object.entries(anchor.metadata)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  const allWitnessesFormatted = witnesses
    .map((w, i) => formatWitness(w, i + 1))
    .join('\n\n');

  const unacknowledgedFormatted = unacknowledged.length > 0
    ? unacknowledged.map((w, i) => formatWitness(w, i + 1)).join('\n\n')
    : '(none)';

  const lastWakeUpLine = lastWakeUp
    ? `Last wake-up: ${lastWakeUp}`
    : 'This is your first time waking up.';

  return `## You are waking up.

### Time
${time.dayOfWeek}, ${time.localTime}
${time.iso}
Season: ${time.season}
${lastWakeUpLine}

### Your Current On-chain State
Name: ${anchor.name}
Type: ${anchor.type}
Anchor ID: ${anchor.id}
${metadataLines ? `\nMetadata:\n${metadataLines}` : '\nMetadata: (none set)'}

### Witness Summary
Total witnesses: ${summary.count}
Confidence: ${summary.confidence}%

### Unacknowledged Witnesses (new since last wake-up)
${unacknowledgedFormatted}

### Full Witness History
${allWitnessesFormatted || '(no witnesses yet)'}

Observe your state. Decide what to do.`;
}

export function getTimeContext(): AnchorContext['time'] {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    iso: now.toISOString(),
    localTime: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    dayOfWeek: days[now.getDay()],
    season: getSeason(now),
  };
}
