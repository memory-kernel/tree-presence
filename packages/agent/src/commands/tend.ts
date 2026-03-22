import type { Command } from 'commander';
import { hexToString, keccak256, stringToHex } from 'viem';
import { TreePresenceAgent } from '../agent.js';
import { getWitnessEvents, getSummary, appendResponse } from '../erc8004/reputation.js';
import { getMetadata, setMetadata, encodeStringMetadata } from '../erc8004/identity.js';
import { appendLog, txUrl } from '../utils/logger.js';
import { createDataUri } from '../utils/ipfs.js';
import { ClaudeReasoningProvider } from '../reasoning/claude.js';
import { getTimeContext } from '../reasoning/prompts.js';
import type { AnchorContext, AgentAction } from '../reasoning/provider.js';

const METADATA_KEYS = ['type', 'name', 'status', 'health', 'season', 'last_observation', 'framework'];

async function fetchAnchorMetadata(
  agent: TreePresenceAgent,
  anchorId: bigint,
): Promise<Record<string, string>> {
  const metadata: Record<string, string> = {};
  for (const key of METADATA_KEYS) {
    try {
      const raw = await getMetadata(agent.publicClient, anchorId, key);
      if (raw && raw !== '0x') {
        metadata[key] = hexToString(raw);
      }
    } catch {
      // Key not set — skip
    }
  }
  return metadata;
}

async function executeAction(
  agent: TreePresenceAgent,
  anchorId: bigint,
  action: AgentAction,
): Promise<void> {
  switch (action.type) {
    case 'update_metadata': {
      if (!action.key || !action.value || action.value === 'undefined') {
        console.log(`  [SKIP] Invalid metadata update: key="${action.key}" value="${action.value}" — skipping`);
        return;
      }
      console.log(`  [TX] Updating metadata: ${action.key} = "${action.value}"`);
      console.log(`        Reasoning: ${action.reasoning}`);
      const txHash = await setMetadata(
        agent.publicClient,
        agent.walletClient!,
        anchorId,
        action.key,
        encodeStringMetadata(action.value),
      );
      console.log(`        TX: ${txUrl(txHash)}`);
      appendLog({
        command: 'serve:update_metadata',
        txHash,
        details: { anchorId: Number(anchorId), key: action.key, value: action.value, reasoning: action.reasoning },
      });
      break;
    }
    case 'respond_to_witness': {
      if (!action.witnessAddress || !action.message || action.message === 'undefined') {
        console.log(`  [SKIP] Invalid witness response: address="${action.witnessAddress}" message="${action.message}" — skipping`);
        return;
      }
      console.log(`  [TX] Responding to witness ${action.witnessAddress} (#${action.feedbackIndex})`);
      console.log(`        Message: ${action.message}`);
      console.log(`        Reasoning: ${action.reasoning}`);
      const responseContent = JSON.stringify({
        type: 'guardian-response',
        message: action.message,
        timestamp: new Date().toISOString(),
      });
      const responseURI = createDataUri(responseContent);
      const responseHash = keccak256(stringToHex(action.message));
      const txHash = await appendResponse(
        agent.publicClient,
        agent.walletClient!,
        {
          agentId: anchorId,
          clientAddress: action.witnessAddress as `0x${string}`,
          feedbackIndex: action.feedbackIndex,
          responseURI,
          responseHash,
        },
      );
      console.log(`        TX: ${txUrl(txHash)}`);
      appendLog({
        command: 'serve:respond_to_witness',
        txHash,
        details: {
          anchorId: Number(anchorId),
          witnessAddress: action.witnessAddress,
          feedbackIndex: action.feedbackIndex,
          message: action.message,
          reasoning: action.reasoning,
        },
      });
      break;
    }
    case 'log_observation': {
      console.log(`  [LOG] ${action.note}`);
      appendLog({
        command: 'serve:observation',
        details: { anchorId: Number(anchorId), note: action.note },
      });
      break;
    }
  }
}

export function registerTendCommand(program: Command): void {
  program
    .command('tend')
    .description('Tend a tree — start the guardian agent that watches for witnesses and reasons about them')
    .requiredOption('--anchor <id>', 'Anchor ID to guard')
    .option('--interval <seconds>', 'Wake-up interval in seconds', '86400')
    .option('--model <model>', 'Claude model to use', 'claude-haiku-4-5-20251001')
    .action(async (opts: { anchor: string; interval: string; model: string }) => {
      const anchorId = BigInt(opts.anchor);
      const intervalMs = parseInt(opts.interval, 10) * 1000;
      const agent = new TreePresenceAgent();
      agent.load({ requireSigner: true });

      if (!agent.state?.agentId) {
        console.error('Agent not initialized. Run "tree-presence init" first.');
        process.exit(1);
      }

      const anchorRecord = agent.state.anchors[opts.anchor];
      if (!anchorRecord) {
        console.error(`Anchor ${opts.anchor} not found in local state. Known anchors: ${Object.keys(agent.state.anchors).join(', ') || '(none)'}`);
        process.exit(1);
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY environment variable is required.');
        process.exit(1);
      }

      const provider = new ClaudeReasoningProvider(opts.model);

      console.log(`\n  Tree Presence: "${anchorRecord.name}" (anchor #${opts.anchor})`);
      console.log(`  Type: ${anchorRecord.type}`);
      console.log(`  Agent address: ${agent.state.address}`);
      console.log(`  Model: ${opts.model}`);
      console.log(`  Wake interval: ${opts.interval}s\n`);

      appendLog({
        command: 'serve:start',
        details: {
          anchorId: Number(anchorId),
          anchorName: anchorRecord.name,
          intervalSeconds: parseInt(opts.interval, 10),
        },
      });

      // Track which witnesses have been acknowledged (by txHash)
      const acknowledgedWitnesses = new Set<string>();

      // If we have prior response history, we could seed this set —
      // for now, everything before first wake-up is considered "known"
      let firstWake = true;

      // Main wake-up loop
      while (true) {
        try {
          const time = getTimeContext();
          console.log(`\n  ── Waking up: ${time.dayOfWeek} ${time.localTime} (${time.season}) ──`);

          // Gather full state
          const allWitnesses = await getWitnessEvents(agent.publicClient, anchorId);
          const metadata = await fetchAnchorMetadata(agent, anchorId);
          const summary = await getSummary(agent.publicClient, anchorId);
          const confidence = Math.min(100, summary.count * 20);

          // On first wake, mark all existing witnesses as acknowledged
          if (firstWake) {
            for (const w of allWitnesses) {
              acknowledgedWitnesses.add(w.txHash);
            }
            firstWake = false;
            console.log(`  Known witnesses: ${allWitnesses.length}`);
          }

          // Find unacknowledged witnesses
          const unacknowledged = allWitnesses.filter(w => !acknowledgedWitnesses.has(w.txHash));

          if (unacknowledged.length > 0) {
            console.log(`  New witnesses since last wake: ${unacknowledged.length}`);
          } else {
            console.log(`  No new witnesses.`);
          }

          const context: AnchorContext = {
            anchor: {
              id: Number(anchorId),
              name: anchorRecord.name,
              type: anchorRecord.type,
              metadata,
            },
            time,
            witnesses: allWitnesses,
            unacknowledged,
            summary: { count: summary.count, confidence },
            lastWakeUp: agent.state.lastWakeUp || null,
          };

          console.log('  Reasoning...');
          const actions = await provider.reason(context);
          console.log(`  Actions: ${actions.length}`);

          for (const action of actions) {
            try {
              await executeAction(agent, anchorId, action);
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              console.error(`  [ERROR] Failed to execute ${action.type}: ${message}`);
              appendLog({
                command: 'serve:error',
                details: { action: action.type, error: message },
              });
            }
          }

          // Mark all current witnesses as acknowledged
          for (const w of allWitnesses) {
            acknowledgedWitnesses.add(w.txHash);
          }

          // Persist last wake-up time
          agent.state!.lastWakeUp = time.iso;
          agent.save();

        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`  [ERROR] Wake cycle failed: ${message}`);
          appendLog({
            command: 'serve:wake_error',
            details: { error: message },
          });
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    });
}
