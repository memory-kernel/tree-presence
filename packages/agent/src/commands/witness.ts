import { Command } from 'commander';
import { keccak256, stringToHex } from 'viem';
import { TreePresenceAgent } from '../agent.js';
import { getMetadata, getOwner } from '../erc8004/identity.js';
import { giveFeedback } from '../erc8004/reputation.js';
import { createDataUri } from '../utils/ipfs.js';
import { appendLog, txUrl } from '../utils/logger.js';

export function registerWitnessCommand(program: Command): void {
  program
    .command('witness')
    .description('Record an encounter attestation for an anchor')
    .requiredOption('--anchor <id>', 'Anchor ID (ERC-8004 agentId)')
    .option('--secret <secret>', 'Binding secret to prove physical encounter')
    .option('--message <msg>', 'Inscription message')
    .option('--tag <tag>', 'Witness type tag (default: witness)', 'witness')
    .option('--method <method>', 'Binding method (default: secret-proof)', 'secret-proof')
    .action(async (opts) => {
      const agent = new TreePresenceAgent();
      agent.load({ requireSigner: true });

      const anchorId = BigInt(opts.anchor);

      // Check that the caller is NOT the anchor owner (contract enforces this)
      const owner = await getOwner(agent.publicClient, anchorId);
      if (owner.toLowerCase() === agent.account!.address.toLowerCase()) {
        console.error(
          'Error: You own this anchor. The ERC-8004 ReputationRegistry requires ' +
          'witnesses to be different from the anchor owner.\n' +
          'Use a different wallet to witness this anchor.',
        );
        process.exit(1);
      }

      // If secret provided, verify it matches on-chain binding commitment
      if (opts.secret) {
        console.log('Verifying binding secret against on-chain commitment...');
        const onChainCommitment = await getMetadata(
          agent.publicClient,
          anchorId,
          'bindingCommitment',
        );

        const computedCommitment = keccak256(stringToHex(opts.secret));

        if (onChainCommitment !== computedCommitment) {
          console.error('Error: Secret does not match on-chain binding commitment.');
          console.error(`  Expected: ${onChainCommitment}`);
          console.error(`  Got:      ${computedCommitment}`);
          process.exit(1);
        }
        console.log('Secret verified! Physical encounter confirmed.');
      }

      // Build inscription content
      const message = opts.message || 'Witnessed encounter';
      const inscription = {
        anchorId: Number(anchorId),
        message,
        witnessAddress: agent.account!.address,
        timestamp: new Date().toISOString(),
        secretVerified: !!opts.secret,
      };
      const inscriptionJson = JSON.stringify(inscription);

      // Compute content hash (hash of just the message for easy verification)
      const feedbackHash = keccak256(stringToHex(message));

      // Create data URI for inscription content
      const feedbackURI = createDataUri(inscriptionJson);

      console.log(`Recording witness for anchor #${anchorId}...`);
      console.log(`  Message: "${message}"`);

      const { txHash, blockNumber } = await giveFeedback(
        agent.publicClient,
        agent.walletClient!,
        {
          agentId: anchorId,
          value: 100n, // 1.00 = verified encounter
          valueDecimals: 2,
          tag1: opts.tag,
          tag2: opts.method,
          endpoint: '',
          feedbackURI,
          feedbackHash,
        },
      );

      // Log
      appendLog({
        command: 'witness',
        txHash,
        blockNumber: Number(blockNumber),
        details: {
          anchorId: Number(anchorId),
          message,
          feedbackHash,
          secretVerified: !!opts.secret,
        },
      });

      console.log('\nWitness recorded!');
      console.log(`  Anchor:   #${anchorId}`);
      console.log(`  Message:  "${message}"`);
      console.log(`  Hash:     ${feedbackHash}`);
      console.log(`  Tx:       ${txUrl(txHash)}`);
    });
}
