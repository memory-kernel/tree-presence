import type { Command } from 'commander';
import { hexToString, keccak256, stringToHex } from 'viem';
import { TreePresenceAgent } from '../agent.js';
import { getWitnessEvents, getSummary, giveFeedback } from '../erc8004/reputation.js';
import { getMetadata, setMetadata, encodeStringMetadata } from '../erc8004/identity.js';
import { appendLog, txUrl } from '../utils/logger.js';
import { createDataUri } from '../utils/ipfs.js';
import { ClaudeStewardProvider } from '../reasoning/steward-claude.js';
import type { ParkContext, StewardAction } from '../reasoning/provider.js';

const POLL_INTERVAL_MS = 30_000;
const METADATA_KEYS = ['type', 'name', 'status', 'health', 'season', 'last_observation', 'overall_health', 'active_concerns', 'tree_count', 'last_patrol', 'framework'];

async function fetchMetadata(
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
      // Key not set
    }
  }
  return metadata;
}

async function executeStewardAction(
  agent: TreePresenceAgent,
  parkId: bigint,
  action: StewardAction,
): Promise<void> {
  switch (action.type) {
    case 'update_park_metadata': {
      console.log(`  [TX] Updating park metadata: ${action.key} = "${action.value}"`);
      console.log(`        Reasoning: ${action.reasoning}`);
      const txHash = await setMetadata(
        agent.publicClient,
        agent.walletClient!,
        parkId,
        action.key,
        encodeStringMetadata(action.value),
      );
      console.log(`        TX: ${txUrl(txHash)}`);
      appendLog({
        command: 'serve-steward:update_park_metadata',
        txHash,
        details: { parkId: Number(parkId), key: action.key, value: action.value, reasoning: action.reasoning },
      });
      break;
    }
    case 'witness_tree': {
      console.log(`  [TX] Witnessing tree #${action.treeId}: "${action.message}"`);
      console.log(`        Tag: ${action.tag}`);
      console.log(`        Reasoning: ${action.reasoning}`);

      const inscription = {
        anchorId: action.treeId,
        message: action.message,
        witnessAddress: agent.account!.address,
        timestamp: new Date().toISOString(),
        source: 'park-steward',
        secretVerified: false,
      };
      const feedbackURI = createDataUri(JSON.stringify(inscription));
      const feedbackHash = keccak256(stringToHex(action.message));

      const { txHash } = await giveFeedback(
        agent.publicClient,
        agent.walletClient!,
        {
          agentId: BigInt(action.treeId),
          value: 100n,
          valueDecimals: 2,
          tag1: action.tag,
          tag2: 'steward',
          endpoint: '',
          feedbackURI,
          feedbackHash,
        },
      );
      console.log(`        TX: ${txUrl(txHash)}`);
      appendLog({
        command: 'serve-steward:witness_tree',
        txHash,
        details: {
          parkId: Number(parkId),
          treeId: action.treeId,
          message: action.message,
          tag: action.tag,
          reasoning: action.reasoning,
        },
      });
      break;
    }
    case 'log_report': {
      console.log(`  [REPORT] ${action.report}`);
      appendLog({
        command: 'serve-steward:report',
        details: { parkId: Number(parkId), report: action.report },
      });
      break;
    }
  }
}

export function registerStewardCommand(program: Command): void {
  program
    .command('steward')
    .description('Start the park steward — monitors multiple trees and reasons about park-wide patterns')
    .requiredOption('--park <id>', 'Park anchor ID (owned by this wallet)')
    .requiredOption('--trees <ids>', 'Comma-separated tree anchor IDs to monitor')
    .option('--model <model>', 'Claude model to use', 'claude-sonnet-4-20250514')
    .action(async (opts: { park: string; trees: string; model: string }) => {
      const parkId = BigInt(opts.park);
      const treeIds = opts.trees.split(',').map((id) => BigInt(id.trim()));

      const agent = new TreePresenceAgent();
      agent.load({ requireSigner: true });

      if (!agent.state?.agentId) {
        console.error('Agent not initialized. Run "tree-presence init" first.');
        process.exit(1);
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY environment variable is required.');
        process.exit(1);
      }

      const provider = new ClaudeStewardProvider(opts.model);

      // Get park name from metadata
      let parkName = `Park #${opts.park}`;
      try {
        const raw = await getMetadata(agent.publicClient, parkId, 'name');
        if (raw && raw !== '0x') parkName = hexToString(raw);
      } catch {
        // Use default
      }

      // Get tree names
      const treeNames: Record<string, string> = {};
      for (const treeId of treeIds) {
        try {
          const raw = await getMetadata(agent.publicClient, treeId, 'name');
          if (raw && raw !== '0x') treeNames[treeId.toString()] = hexToString(raw);
        } catch {
          treeNames[treeId.toString()] = `Tree #${treeId}`;
        }
      }

      console.log(`\n  Park Steward Agent for "${parkName}" (park #${opts.park})`);
      console.log(`  Monitoring ${treeIds.length} tree(s): ${treeIds.map((id) => `${treeNames[id.toString()] || id} (#${id})`).join(', ')}`);
      console.log(`  Agent address: ${agent.state.address}`);
      console.log(`  Model: ${opts.model}`);
      console.log(`  Polling every ${POLL_INTERVAL_MS / 1000}s...\n`);

      appendLog({
        command: 'serve-steward:start',
        details: {
          parkId: Number(parkId),
          parkName,
          treeIds: treeIds.map(Number),
        },
      });

      let lastCheckBlock = await agent.publicClient.getBlockNumber();

      // Main polling loop
      while (true) {
        try {
          const currentBlock = await agent.publicClient.getBlockNumber();
          console.log(`\n  [Patrol] Block ${currentBlock} — checking ${treeIds.length} tree(s)...`);

          // Build park context
          const parkMetadata = await fetchMetadata(agent, parkId);

          const trees = await Promise.all(
            treeIds.map(async (treeId) => {
              const metadata = await fetchMetadata(agent, treeId);
              const recentWitnesses = await getWitnessEvents(
                agent.publicClient,
                treeId,
                lastCheckBlock > 0n ? lastCheckBlock : undefined,
              );
              const allWitnesses = await getWitnessEvents(agent.publicClient, treeId);
              const summary = await getSummary(agent.publicClient, treeId);
              const confidence = Math.min(100, summary.count * 20);

              return {
                id: Number(treeId),
                name: treeNames[treeId.toString()] || `Tree #${treeId}`,
                metadata,
                recentWitnesses,
                summary: { count: summary.count, confidence },
              };
            }),
          );

          // Check if there's anything new to reason about
          const totalRecentWitnesses = trees.reduce((sum, t) => sum + t.recentWitnesses.length, 0);

          if (totalRecentWitnesses > 0 || currentBlock > lastCheckBlock + 10n) {
            const context: ParkContext = {
              park: {
                id: Number(parkId),
                name: parkName,
                metadata: parkMetadata,
              },
              trees,
            };

            console.log(`  ${totalRecentWitnesses} new witness(es) across trees. Reasoning...`);
            const actions = await provider.reason(context);
            console.log(`  Steward decided on ${actions.length} action(s):`);

            for (const action of actions) {
              try {
                await executeStewardAction(agent, parkId, action);
              } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.error(`  [ERROR] Failed to execute ${action.type}: ${message}`);
                appendLog({
                  command: 'serve-steward:error',
                  details: { action: action.type, error: message },
                });
              }
            }
          } else {
            console.log('  No new activity. Skipping reasoning.');
          }

          lastCheckBlock = currentBlock;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`  [ERROR] Patrol cycle failed: ${message}`);
          appendLog({
            command: 'serve-steward:poll_error',
            details: { error: message },
          });
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    });
}
