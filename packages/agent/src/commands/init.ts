import { Command } from 'commander';
import { MemoryKernelAgent } from '../agent.js';
import {
  registerIdentity,
  buildRegistrationJson,
  encodeStringMetadata,
} from '../erc8004/identity.js';
import { createDataUri } from '../utils/ipfs.js';
import { appendLog, writeAgentManifest, txUrl } from '../utils/logger.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize agent and register ERC-8004 identity on Celo')
    .action(async () => {
      const agent = new MemoryKernelAgent();

      // If already fully initialized, just show status
      if (agent.isInitialized()) {
        agent.load();
        if (agent.hasOnChainIdentity()) {
          console.log('Agent already initialized.');
          console.log(`  Address:  ${agent.state!.address}`);
          console.log(`  Agent ID: ${agent.state!.agentId}`);
          console.log(`  Balance:  ${await agent.getBalance()} CELO`);
          return;
        }
        // State exists but no on-chain identity — re-register
        console.log('State exists but no on-chain identity. Registering...');
        agent.loadSigner();
      } else {
        // Fresh init — derive address from MK_PRIVATE_KEY
        agent.initializeState();
        agent.save();
        console.log(`Agent address: ${agent.state!.address}`);
      }

      // Check balance before registering
      const balance = await agent.getBalance();
      console.log(`Balance: ${balance} CELO`);
      if (parseFloat(balance) === 0) {
        console.log('\nWallet has no CELO. Fund it and run "mk-agent init" again.');
        console.log(`Send CELO to: ${agent.state!.address}`);
        return;
      }

      // Build agent registration data
      const registrationJson = buildRegistrationJson({
        name: 'memory-kernel-agent',
        description:
          'Memory Kernel agent — manages physical-object identities on Celo via ERC-8004',
      });
      const agentURI = createDataUri(registrationJson);

      const metadata = [
        { metadataKey: 'type', metadataValue: encodeStringMetadata('agent') },
        {
          metadataKey: 'name',
          metadataValue: encodeStringMetadata('memory-kernel-agent'),
        },
        {
          metadataKey: 'framework',
          metadataValue: encodeStringMetadata('memory-kernel'),
        },
      ];

      console.log('Registering agent identity on Celo via ERC-8004...');

      const { agentId, txHash, blockNumber } = await registerIdentity(
        agent.publicClient,
        agent.walletClient!,
        agentURI,
        metadata,
      );

      agent.state!.agentId = Number(agentId);
      agent.state!.registrationTxHash = txHash;
      agent.save();

      // Write agent.json manifest
      writeAgentManifest({
        address: agent.state!.address,
        agentId: Number(agentId),
      });

      // Log
      appendLog({
        command: 'init',
        txHash,
        blockNumber: Number(blockNumber),
        details: { agentId: Number(agentId), address: agent.state!.address },
      });

      console.log('\nAgent registered successfully!');
      console.log(`  Agent ID: ${agentId}`);
      console.log(`  Address:  ${agent.state!.address}`);
      console.log(`  Tx:       ${txUrl(txHash)}`);
      console.log(`  Balance:  ${await agent.getBalance()} CELO`);
      console.log('\nManifest written to agent.json');
    });
}
