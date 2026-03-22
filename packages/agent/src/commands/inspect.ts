import { Command } from 'commander';
import { hexToString } from 'viem';
import { TreePresenceAgent } from '../agent.js';
import { getMetadata, getOwner, getTokenURI } from '../erc8004/identity.js';
import { getWitnessEvents, getSummary } from '../erc8004/reputation.js';
import { decodeDataUri } from '../utils/ipfs.js';
import { appendLog, txUrl } from '../utils/logger.js';

export function registerInspectCommand(program: Command): void {
  program
    .command('inspect')
    .description('Inspect a tree — read its identity, metadata, and accumulated witnesses')
    .requiredOption('--anchor <id>', 'Anchor ID (ERC-8004 agentId)')
    .option('--json', 'Output as JSON')
    .action(async (opts) => {
      const agent = new TreePresenceAgent();
      // Only need public client for reads
      try {
        agent.load();
      } catch {
        // Can still resolve without being initialized (read-only)
      }

      const anchorId = BigInt(opts.anchor);

      console.log(`Resolving anchor #${anchorId}...\n`);

      // Fetch identity data
      const [owner, tokenURIRaw] = await Promise.all([
        getOwner(agent.publicClient, anchorId),
        getTokenURI(agent.publicClient, anchorId).catch(() => ''),
      ]);
      const tokenURI = tokenURIRaw;

      // Parse services from tokenURI (data URI → JSON → services)
      let services: { name: string; endpoint: string }[] = [];
      if (tokenURI) {
        const decoded = decodeDataUri(tokenURI);
        if (decoded) {
          try {
            const parsed = JSON.parse(decoded);
            if (Array.isArray(parsed.services)) {
              services = parsed.services;
            }
          } catch {
            // Not valid JSON
          }
        }
      }

      // Fetch metadata
      const metadataKeys = ['type', 'name', 'framework', 'creator', 'bindingStrategy'];
      const metadataResults = await Promise.all(
        metadataKeys.map(async (key) => {
          try {
            const raw = await getMetadata(agent.publicClient, anchorId, key);
            // Skip empty values
            if (raw === '0x' || raw === '0x0') return { key, value: null };
            try {
              return { key, value: hexToString(raw) };
            } catch {
              return { key, value: raw };
            }
          } catch {
            return { key, value: null };
          }
        }),
      );
      const metadata: Record<string, string> = {};
      for (const { key, value } of metadataResults) {
        if (value) metadata[key] = String(value);
      }

      // Check for binding commitment
      let hasBindingCommitment = false;
      try {
        const commitment = await getMetadata(
          agent.publicClient,
          anchorId,
          'bindingCommitment',
        );
        hasBindingCommitment = commitment !== '0x' && commitment.length > 2;
      } catch {
        // No commitment
      }

      // Fetch witness events
      const witnesses = await getWitnessEvents(agent.publicClient, anchorId);

      // Fetch summary
      const summary = await getSummary(agent.publicClient, anchorId);

      if (opts.json) {
        const result = {
          anchorId: Number(anchorId),
          owner,
          tokenURI,
          metadata,
          services,
          hasBindingCommitment,
          witnesses: witnesses.map((w) => ({
            index: w.feedbackIndex,
            from: w.clientAddress,
            tag1: w.tag1,
            tag2: w.tag2,
            feedbackHash: w.feedbackHash,
            feedbackURI: w.feedbackURI,
            txHash: w.txHash,
          })),
          summary: {
            witnessCount: summary.count,
            confidenceScore: summary.count > 0
              ? Math.min(100, summary.count * 20)
              : 0,
          },
        };
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      // Pretty print
      console.log('=== Anchor Identity ===');
      console.log(`  ID:       ${anchorId}`);
      console.log(`  Owner:    ${owner}`);
      if (metadata.type) console.log(`  Type:     ${metadata.type}`);
      if (metadata.name) console.log(`  Name:     ${metadata.name}`);
      if (metadata.creator) console.log(`  Creator:  ${metadata.creator}`);
      if (metadata.framework) console.log(`  Framework: ${metadata.framework}`);
      if (hasBindingCommitment) console.log(`  Binding:  secret commitment stored`);

      if (services.length > 0) {
        console.log('\n=== Services ===');
        for (const svc of services) {
          console.log(`  ${svc.name}: ${svc.endpoint}`);
        }
      }

      console.log('\n=== Witnesses ===');
      if (witnesses.length === 0) {
        console.log('  No witnesses yet.');
      } else {
        for (const w of witnesses) {
          console.log(`\n  [${w.feedbackIndex}] from ${w.clientAddress}`);
          console.log(`      Tag: ${w.tag1}/${w.tag2}`);
          console.log(`      Hash: ${w.feedbackHash}`);

          // Try to decode feedbackURI
          if (w.feedbackURI) {
            const content = decodeDataUri(w.feedbackURI);
            if (content) {
              try {
                const parsed = JSON.parse(content);
                if (parsed.message) {
                  console.log(`      Message: "${parsed.message}"`);
                }
              } catch {
                // Not JSON
              }
            }
          }

          console.log(`      Tx: ${txUrl(w.txHash)}`);
        }
      }

      // Confidence score
      const confidence = summary.count > 0 ? Math.min(100, summary.count * 20) : 0;
      console.log('\n=== Summary ===');
      console.log(`  Total witnesses: ${summary.count}`);
      console.log(`  Confidence:      ${confidence}% (${getConfidenceLabel(confidence)})`);

      appendLog({
        command: 'resolve',
        details: {
          anchorId: Number(anchorId),
          witnessCount: summary.count,
          confidence,
        },
      });
    });
}

function getConfidenceLabel(score: number): string {
  if (score === 0) return 'unverified';
  if (score < 40) return 'emerging';
  if (score < 70) return 'established';
  if (score < 100) return 'strong';
  return 'maximum';
}
