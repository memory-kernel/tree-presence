import { Command } from 'commander';
import { keccak256, stringToHex } from 'viem';
import { MemoryKernelAgent } from '../agent.js';
import {
  registerIdentity,
  buildRegistrationJson,
  buildServices,
  updateAgentURI,
  encodeStringMetadata,
} from '../erc8004/identity.js';
import { createDataUri } from '../utils/ipfs.js';
import { appendLog, txUrl } from '../utils/logger.js';

export function registerAnchorCommand(program: Command): void {
  program
    .command('anchor')
    .description('Create an anchor — bind a physical object to an on-chain identity')
    .requiredOption('--type <type>', 'Object type (e.g., vinyl-record, book, tree)')
    .requiredOption('--name <name>', 'Human-readable name')
    .option('--secret <secret>', 'Binding secret (NFC secret, passphrase, etc.)')
    .option('--description <desc>', 'Description of the physical object')
    .option('--service-url <url>', 'Base URL for web service (e.g., https://treeappreciation.com)')
    .action(async (opts) => {
      const agent = new MemoryKernelAgent();
      agent.load({ requireSigner: true });

      if (!agent.hasOnChainIdentity()) {
        console.error('Agent not registered on-chain. Run "mk-agent init" first.');
        process.exit(1);
      }

      // Build initial registration JSON (no services yet — agentId unknown)
      const description =
        opts.description || `Physical ${opts.type}: ${opts.name}`;
      const registrationJson = buildRegistrationJson({
        name: opts.name,
        description,
        type: opts.type,
      });
      const agentURI = createDataUri(registrationJson);

      // Build metadata
      const metadata: { metadataKey: string; metadataValue: `0x${string}` }[] = [
        { metadataKey: 'type', metadataValue: encodeStringMetadata(opts.type) },
        { metadataKey: 'name', metadataValue: encodeStringMetadata(opts.name) },
        {
          metadataKey: 'framework',
          metadataValue: encodeStringMetadata('memory-kernel'),
        },
        {
          metadataKey: 'creator',
          metadataValue: encodeStringMetadata(agent.state!.address),
        },
      ];

      // Add binding commitment if secret provided
      if (opts.secret) {
        const commitment = keccak256(stringToHex(opts.secret));
        metadata.push({
          metadataKey: 'bindingCommitment',
          metadataValue: commitment,
        });
        metadata.push({
          metadataKey: 'bindingStrategy',
          metadataValue: encodeStringMetadata('secret'),
        });
      }

      console.log(`Creating anchor for "${opts.name}" (${opts.type})...`);
      if (opts.secret) {
        console.log(`  Binding commitment: keccak256("${opts.secret}")`);
      }

      // TX 1: Register identity
      const { agentId, txHash, blockNumber } = await registerIdentity(
        agent.publicClient,
        agent.walletClient!,
        agentURI,
        metadata,
      );

      console.log(`  Registration TX: ${txUrl(txHash)}`);

      // TX 2: Update URI with services now that we have agentId
      const services = buildServices(agentId, opts.serviceUrl);
      const updatedJson = buildRegistrationJson({
        name: opts.name,
        description,
        type: opts.type,
        services,
      });
      const updatedURI = createDataUri(updatedJson);
      const updateTxHash = await updateAgentURI(
        agent.publicClient,
        agent.walletClient!,
        agentId,
        updatedURI,
      );
      await agent.publicClient.waitForTransactionReceipt({ hash: updateTxHash });

      console.log(`  Services TX:     ${txUrl(updateTxHash)}`);

      // Record locally
      agent.recordAnchor(Number(agentId), {
        name: opts.name,
        type: opts.type,
        txHash,
        blockNumber: Number(blockNumber),
      });

      // Log
      appendLog({
        command: 'anchor',
        txHash,
        blockNumber: Number(blockNumber),
        details: {
          anchorId: Number(agentId),
          name: opts.name,
          type: opts.type,
          hasSecret: !!opts.secret,
          services: services.map((s) => s.name),
          updateTxHash,
        },
      });

      console.log('\nAnchor created!');
      console.log(`  Anchor ID: ${agentId}`);
      console.log(`  Type:      ${opts.type}`);
      console.log(`  Name:      ${opts.name}`);
      console.log(`  Services:  ${services.map((s) => s.name).join(', ')}`);
      console.log(`  Tx:        ${txUrl(txHash)}`);
    });
}
