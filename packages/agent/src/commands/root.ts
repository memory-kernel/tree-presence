import { Command } from 'commander';
import { keccak256, stringToHex } from 'viem';
import { TreePresenceAgent } from '../agent.js';
import {
  registerIdentity,
  buildRegistrationJson,
  buildServices,
  updateAgentURI,
  encodeStringMetadata,
} from '../erc8004/identity.js';
import { createDataUri } from '../utils/ipfs.js';
import { appendLog, txUrl } from '../utils/logger.js';

export function registerRootCommand(program: Command): void {
  program
    .command('root')
    .description('Root a tree — register it as an on-chain identity with ERC-8004')
    .requiredOption('--type <type>', 'Presence type (e.g., tree-presence, vinyl-record, book)')
    .requiredOption('--name <name>', 'Human-readable name')
    .option('--secret <secret>', 'Binding secret (NFC secret, passphrase, etc.)')
    .option('--description <desc>', 'Description of the physical object')
    .option('--image-uri <uri>', 'Image URI (IPFS, HTTP, or data URI)')
    .option('--latitude <lat>', 'Latitude of the physical subject')
    .option('--longitude <lng>', 'Longitude of the physical subject')
    .option('--profile-url <url>', 'Canonical human-readable page URL')
    .option('--presence-url <url>', 'Base URL for presence API (e.g., https://presence.example.com)')
    .action(async (opts) => {
      const agent = new TreePresenceAgent();
      agent.load({ requireSigner: true });

      // Check if an anchor with this name already exists locally
      const existing = Object.entries(agent.state!.anchors).find(
        ([, a]) => a.name === opts.name,
      );
      if (existing) {
        const [id, anchor] = existing;
        console.log(`Anchor already exists for "${opts.name}".`);
        console.log(`  Anchor ID: ${id}`);
        console.log(`  Type:      ${anchor.type}`);
        console.log(`  Tx:        ${txUrl(anchor.txHash)}`);
        return;
      }

      // Build initial registration JSON (no services yet — agentId unknown)
      const description =
        opts.description || `Physical ${opts.type}: ${opts.name}`;
      const registrationJson = buildRegistrationJson({
        name: opts.name,
        description,
        type: opts.type,
        imageURI: opts.imageUri,
        latitude: opts.latitude,
        longitude: opts.longitude,
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

      // Add image URI
      if (opts.imageUri) {
        metadata.push({
          metadataKey: 'imageURI',
          metadataValue: encodeStringMetadata(opts.imageUri),
        });
      }

      // Add location
      if (opts.latitude && opts.longitude) {
        metadata.push({
          metadataKey: 'latitude',
          metadataValue: encodeStringMetadata(opts.latitude),
        });
        metadata.push({
          metadataKey: 'longitude',
          metadataValue: encodeStringMetadata(opts.longitude),
        });
      }

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

      console.log(`Rooting "${opts.name}" (${opts.type})...`);
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
      const services = buildServices(agentId, opts.profileUrl, opts.presenceUrl);
      const updatedJson = buildRegistrationJson({
        name: opts.name,
        description,
        type: opts.type,
        imageURI: opts.imageUri,
        latitude: opts.latitude,
        longitude: opts.longitude,
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

      console.log('\nTree rooted!');
      console.log(`  Anchor ID: ${agentId}`);
      console.log(`  Type:      ${opts.type}`);
      console.log(`  Name:      ${opts.name}`);
      console.log(`  Services:  ${services.map((s) => s.name).join(', ')}`);
      console.log(`  Tx:        ${txUrl(txHash)}`);
    });
}
