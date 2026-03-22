import { Command } from 'commander';
import { keccak256, stringToHex } from 'viem';
import { TreePresenceAgent } from '../agent.js';
import { getWitnessEvents } from '../erc8004/reputation.js';
import { decodeDataUri } from '../utils/ipfs.js';
import { appendLog, txUrl } from '../utils/logger.js';

export function registerVerifyCommand(program: Command): void {
  program
    .command('verify')
    .description('Verify that witness content matches on-chain feedbackHash')
    .requiredOption('--anchor <id>', 'Anchor ID')
    .requiredOption('--witness <index>', 'Witness index (0-based across all witnesses)')
    .option('--content <content>', 'Content to verify against on-chain hash')
    .action(async (opts) => {
      const agent = new TreePresenceAgent();
      // Only need public client
      try {
        agent.load();
      } catch {
        // Can verify without being initialized
      }

      const anchorId = BigInt(opts.anchor);
      const witnessIndex = parseInt(opts.witness, 10);

      console.log(`Verifying witness #${witnessIndex} for anchor #${anchorId}...\n`);

      // Get all witness events for this anchor
      const witnesses = await getWitnessEvents(agent.publicClient, anchorId);

      if (witnesses.length === 0) {
        console.error('No witnesses found for this anchor.');
        process.exit(1);
      }

      if (witnessIndex >= witnesses.length) {
        console.error(
          `Witness index ${witnessIndex} out of range. Found ${witnesses.length} witness(es).`,
        );
        process.exit(1);
      }

      const witness = witnesses[witnessIndex];

      console.log('=== On-chain Witness Data ===');
      console.log(`  From:     ${witness.clientAddress}`);
      console.log(`  Tag:      ${witness.tag1}/${witness.tag2}`);
      console.log(`  Hash:     ${witness.feedbackHash}`);
      console.log(`  Tx:       ${txUrl(witness.txHash)}`);

      // Decode URI content if available
      let uriContent: string | null = null;
      let uriMessage: string | null = null;
      if (witness.feedbackURI) {
        uriContent = decodeDataUri(witness.feedbackURI);
        if (uriContent) {
          try {
            const parsed = JSON.parse(uriContent);
            uriMessage = parsed.message || null;
          } catch {
            // Not JSON
          }
        }
      }

      if (uriContent) {
        console.log('\n=== Inscription Content (from URI) ===');
        try {
          const parsed = JSON.parse(uriContent);
          console.log(`  Message:   "${parsed.message}"`);
          console.log(`  Timestamp: ${parsed.timestamp}`);
          console.log(`  Witness:   ${parsed.witnessAddress}`);
          console.log(`  Secret OK: ${parsed.secretVerified}`);
        } catch {
          console.log(`  Raw: ${uriContent}`);
        }
      }

      // Verify content if provided
      const contentToVerify = opts.content || uriMessage;
      if (contentToVerify) {
        console.log('\n=== Verification ===');
        const computedHash = keccak256(stringToHex(contentToVerify));
        const matches = computedHash === witness.feedbackHash;

        console.log(`  Content:  "${contentToVerify}"`);
        console.log(`  Computed: ${computedHash}`);
        console.log(`  On-chain: ${witness.feedbackHash}`);
        console.log(`  Match:    ${matches ? 'YES — content integrity verified' : 'NO — content does not match on-chain hash'}`);

        appendLog({
          command: 'verify',
          details: {
            anchorId: Number(anchorId),
            witnessIndex,
            contentMatches: matches,
            feedbackHash: witness.feedbackHash,
          },
        });

        if (!matches) process.exit(1);
      } else {
        console.log('\nNo content provided for verification. Use --content to verify.');
      }
    });
}
