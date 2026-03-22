#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerRootCommand } from './commands/root.js';
import { registerWitnessCommand } from './commands/witness.js';
import { registerInspectCommand } from './commands/inspect.js';
import { registerVerifyCommand } from './commands/verify.js';
import { registerTendCommand } from './commands/tend.js';
import { registerStewardCommand } from './commands/steward.js';

const program = new Command();

program
  .name('tree-presence')
  .description(
    'Tree Presence — physical trees get verifiable digital presence on Celo',
  )
  .version('0.1.0');

registerInitCommand(program);
registerRootCommand(program);
registerWitnessCommand(program);
registerInspectCommand(program);
registerVerifyCommand(program);
registerTendCommand(program);
registerStewardCommand(program);

program.parse();
