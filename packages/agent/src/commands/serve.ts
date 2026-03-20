import type { Command } from 'commander';
import { hexToString, keccak256, stringToHex } from 'viem';
import { MemoryKernelAgent } from '../agent.js';
import { getWitnessEvents, getSummary, appendResponse } from '../erc8004/reputation.js';
import { getMetadata, setMetadata, encodeStringMetadata, getTokenURI } from '../erc8004/identity.js';
import { appendLog, txUrl } from '../utils/logger.js';
import { createDataUri } from '../utils/ipfs.js';
import { ClaudeReasoningProvider } from '../reasoning/claude.js';
import type { AnchorContext, AgentAction } from '../reasoning/provider.js';

const POLL_INTERVAL_MS = 10_000;
const METADATA_KEYS = ['type', 'name', 'status', 'health', 'season', 'last_observation', 'framework'];

async function fetchAnchorMetadata(
  agent: MemoryKernelAgent,
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
  agent: MemoryKernelAgent,
  anchorId: bigint,
  action: AgentAction,
): Promise<void> {
  switch (action.type) {
    case 'update_metadata': {
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

export function registerServeCommand(program: Command): void {
  program
    .command('serve')
    .description('Start autonomous guardian agent for an anchor — watches for witnesses and reasons about them')
    .requiredOption('--anchor <id>', 'Anchor ID to guard')
    .option('--model <model>', 'Claude model to use', 'claude-sonnet-4-20250514')
    .action(async (opts: { anchor: string; model: string }) => {
      const anchorId = BigInt(opts.anchor);
      const agent = new MemoryKernelAgent();
      agent.load({ requireSigner: true });

      if (!agent.state?.agentId) {
        console.error('Agent not initialized on-chain. Run "mk-agent init" first.');
        process.exit(1);
      }

      // Verify the anchor exists in local state
      const anchorRecord = agent.state.anchors[opts.anchor];
      if (!anchorRecord) {
        console.error(`Anchor ${opts.anchor} not found in local state. Known anchors: ${Object.keys(agent.state.anchors).join(', ') || '(none)'}`);
        process.exit(1);
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('ANTHROPIC_API_KEY environment variable is required for the reasoning provider.');
        process.exit(1);
      }

      const provider = new ClaudeReasoningProvider(opts.model);

      console.log(`\n  Guardian Agent for "${anchorRecord.name}" (anchor #${opts.anchor})`);
      console.log(`  Type: ${anchorRecord.type}`);
      console.log(`  Agent address: ${agent.state.address}`);
      console.log(`  Model: ${opts.model}`);
      console.log(`  Polling every ${POLL_INTERVAL_MS / 1000}s for new witnesses...\n`);

      // Determine starting block
      let lastProcessedBlock: bigint;
      if (agent.state.lastProcessedBlock) {
        lastProcessedBlock = BigInt(agent.state.lastProcessedBlock);
        console.log(`  Resuming from block ${lastProcessedBlock}`);
      } else {
        const currentBlock = await agent.publicClient.getBlockNumber();
        lastProcessedBlock = currentBlock - 1000n > 0n ? currentBlock - 1000n : 0n;
        console.log(`  Starting from block ${lastProcessedBlock} (current: ${currentBlock})`);
      }

      appendLog({
        command: 'serve:start',
        details: {
          anchorId: Number(anchorId),
          anchorName: anchorRecord.name,
          startBlock: Number(lastProcessedBlock),
        },
      });

      // Main polling loop
      while (true) {
        try {
          const currentBlock = await agent.publicClient.getBlockNumber();

          if (currentBlock > lastProcessedBlock) {
            // Get new witness events since last processed block
            const newEvents = await getWitnessEvents(
              agent.publicClient,
              anchorId,
              lastProcessedBlock + 1n,
            );

            if (newEvents.length > 0) {
              console.log(`\n  Found ${newEvents.length} new witness(es) in blocks ${lastProcessedBlock + 1n}-${currentBlock}`);

              // Get all witnesses for full context
              const allWitnesses = await getWitnessEvents(agent.publicClient, anchorId);
              const metadata = await fetchAnchorMetadata(agent, anchorId);
              const summary = await getSummary(agent.publicClient, anchorId);
              const confidence = Math.min(100, summary.count * 20);

              for (const witness of newEvents) {
                console.log(`\n  Processing witness from ${witness.clientAddress} (block ${witness.blockNumber})...`);

                const context: AnchorContext = {
                  anchor: {
                    id: Number(anchorId),
                    name: anchorRecord.name,
                    type: anchorRecord.type,
                    metadata,
                  },
                  newWitness: witness,
                  allWitnesses,
                  summary: { count: summary.count, confidence },
                };

                console.log('  Reasoning...');
                const actions = await provider.reason(context);
                console.log(`  Agent decided on ${actions.length} action(s):`);

                for (const action of actions) {
                  try {
                    await executeAction(agent, anchorId, action);
                  } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(`  [ERROR] Failed to execute ${action.type}: ${message}`);
                    appendLog({
                      command: `serve:error`,
                      details: { action: action.type, error: message },
                    });
                  }
                }
              }
            }

            lastProcessedBlock = currentBlock;
            agent.state!.lastProcessedBlock = Number(currentBlock);
            agent.save();
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`  [ERROR] Poll cycle failed: ${message}`);
          appendLog({
            command: 'serve:poll_error',
            details: { error: message },
          });
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    });
}
