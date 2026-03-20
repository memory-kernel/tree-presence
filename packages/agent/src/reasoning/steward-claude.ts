import Anthropic from '@anthropic-ai/sdk';
import type { StewardReasoningProvider, ParkContext, StewardAction } from './provider.js';
import { buildStewardSystemPrompt, buildStewardContextMessage } from './steward-prompts.js';

const STEWARD_TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_park_metadata',
    description: 'Update the park anchor\'s on-chain metadata. Keys: overall_health, active_concerns, tree_count, last_patrol.',
    input_schema: {
      type: 'object' as const,
      properties: {
        key: { type: 'string', description: 'Metadata field name (e.g., "overall_health", "active_concerns", "tree_count", "last_patrol")' },
        value: { type: 'string', description: 'New value for the field' },
        reasoning: { type: 'string', description: 'Why this update is warranted based on cross-tree analysis' },
      },
      required: ['key', 'value', 'reasoning'],
    },
  },
  {
    name: 'witness_tree',
    description: 'File a witness attestation on a specific tree with your steward analysis. This creates an agent-to-agent signal that the tree\'s guardian will pick up and reason about.',
    input_schema: {
      type: 'object' as const,
      properties: {
        treeId: { type: 'number', description: 'The tree anchor ID to witness' },
        message: { type: 'string', description: 'Your steward analysis message' },
        tag: { type: 'string', description: 'Tag for this witness (default: steward-analysis)' },
        reasoning: { type: 'string', description: 'Why this witness is warranted' },
      },
      required: ['treeId', 'message', 'tag', 'reasoning'],
    },
  },
  {
    name: 'log_report',
    description: 'Log a park-wide observation or report without on-chain action. Use for general notes or when no action is needed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        report: { type: 'string', description: 'The park-wide report or observation' },
      },
      required: ['report'],
    },
  },
];

export class ClaudeStewardProvider implements StewardReasoningProvider {
  private client: Anthropic;
  private model: string;

  constructor(model = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic();
    this.model = model;
  }

  async reason(context: ParkContext): Promise<StewardAction[]> {
    const systemPrompt = buildStewardSystemPrompt(context.park.name);
    const userMessage = buildStewardContextMessage(context);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: STEWARD_TOOLS,
      messages: [{ role: 'user', content: userMessage }],
    });

    const actions: StewardAction[] = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const input = block.input as Record<string, unknown>;
        switch (block.name) {
          case 'update_park_metadata':
            actions.push({
              type: 'update_park_metadata',
              key: input.key as string,
              value: input.value as string,
              reasoning: input.reasoning as string,
            });
            break;
          case 'witness_tree':
            actions.push({
              type: 'witness_tree',
              treeId: input.treeId as number,
              message: input.message as string,
              tag: input.tag as string || 'steward-analysis',
              reasoning: input.reasoning as string,
            });
            break;
          case 'log_report':
            actions.push({
              type: 'log_report',
              report: input.report as string,
            });
            break;
        }
      }
    }

    // If no tool calls, log text as a report
    if (actions.length === 0) {
      const textBlocks = response.content.filter(b => b.type === 'text');
      if (textBlocks.length > 0) {
        actions.push({
          type: 'log_report',
          report: (textBlocks[0] as Anthropic.TextBlock).text,
        });
      }
    }

    return actions;
  }
}
