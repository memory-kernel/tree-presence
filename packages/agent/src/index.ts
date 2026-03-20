#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { registerInitCommand } from './commands/init.js';
import { registerAnchorCommand } from './commands/anchor.js';
import { registerWitnessCommand } from './commands/witness.js';
import { registerResolveCommand } from './commands/resolve.js';
import { registerVerifyCommand } from './commands/verify.js';
import { registerServeCommand } from './commands/serve.js';
import { registerServeStewardCommand } from './commands/serve-steward.js';

const program = new Command();

program
  .name('mk-agent')
  .description(
    'Memory Kernel Agent — physical objects get verifiable digital identities on Celo',
  )
  .version('0.1.0');

registerInitCommand(program);
registerAnchorCommand(program);
registerWitnessCommand(program);
registerResolveCommand(program);
registerVerifyCommand(program);
registerServeCommand(program);
registerServeStewardCommand(program);

program.parse();
