import { Command } from 'commander';
import { TreePresenceAgent } from '../agent.js';
import { appendLog } from '../utils/logger.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize local wallet state (no on-chain registration)')
    .action(async () => {
      const agent = new TreePresenceAgent();

      if (agent.isInitialized()) {
        agent.load();
        console.log('Wallet already initialized.');
        console.log(`  Address: ${agent.state!.address}`);
        console.log(`  Balance: ${await agent.getBalance()} CELO`);
        return;
      }

      agent.initializeState();
      agent.save();

      const balance = await agent.getBalance();

      appendLog({
        command: 'init',
        details: { address: agent.state!.address },
      });

      console.log('Wallet initialized.');
      console.log(`  Address: ${agent.state!.address}`);
      console.log(`  Balance: ${balance} CELO`);

      if (parseFloat(balance) === 0) {
        console.log(`\nFund this address with CELO before creating anchors.`);
      }
    });
}
