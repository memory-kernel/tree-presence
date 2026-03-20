import Anthropic from '@anthropic-ai/sdk';
import type { ReasoningProvider, AnchorContext, AgentAction } from './provider.js';
import { buildSystemPrompt, buildContextMessage } from './prompts.js';

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_metadata',
    description: 'Update the on-chain metadata for this anchor. Use for status, health, season, last_observation, or any key you deem appropriate.',
    input_schema: {
      type: 'object' as const,
      properties: {
        key: { type: 'string', description: 'Metadata field name (e.g., "status", "health", "season", "last_observation")' },
        value: { type: 'string', description: 'New value for the field' },
        reasoning: { type: 'string', description: 'Why this update is warranted based on witness evidence' },
      },
      required: ['key', 'value', 'reasoning'],
    },
  },
  {
    name: 'respond_to_witness',
    description: 'Respond to a specific witness on-chain, acknowledging their observation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        witnessAddress: { type: 'string', description: 'Address of the witness to respond to' },
        feedbackIndex: { type: 'number', description: 'Feedback index of the witness entry' },
        message: { type: 'string', description: 'Response message to the witness' },
        reasoning: { type: 'string', description: 'Why this response is appropriate' },
      },
      required: ['witnessAddress', 'feedbackIndex', 'message', 'reasoning'],
    },
  },
  {
    name: 'log_observation',
    description: 'Record an observation or reasoning note without taking on-chain action. Use for internal notes, pattern tracking, or when no on-chain action is warranted.',
    input_schema: {
      type: 'object' as const,
      properties: {
        note: { type: 'string', description: 'The observation or reasoning to log' },
      },
      required: ['note'],
    },
  },
];

export class ClaudeReasoningProvider implements ReasoningProvider {
  private client: Anthropic;
  private model: string;

  constructor(model = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic();
    this.model = model;
  }

  async reason(context: AnchorContext): Promise<AgentAction[]> {
    const systemPrompt = buildSystemPrompt(context.anchor.name, context.anchor.type);
    const userMessage = buildContextMessage(context);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: systemPrompt,
      tools: TOOLS,
      messages: [{ role: 'user', content: userMessage }],
    });

    const actions: AgentAction[] = [];

    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const input = block.input as Record<string, unknown>;
        switch (block.name) {
          case 'update_metadata':
            actions.push({
              type: 'update_metadata',
              key: input.key as string,
              value: input.value as string,
              reasoning: input.reasoning as string,
            });
            break;
          case 'respond_to_witness':
            actions.push({
              type: 'respond_to_witness',
              witnessAddress: input.witnessAddress as string,
              feedbackIndex: input.feedbackIndex as number,
              message: input.message as string,
              reasoning: input.reasoning as string,
            });
            break;
          case 'log_observation':
            actions.push({
              type: 'log_observation',
              note: input.note as string,
            });
            break;
        }
      }
    }

    // If the model returned only text (no tool calls), log it as an observation
    if (actions.length === 0) {
      const textBlocks = response.content.filter(b => b.type === 'text');
      if (textBlocks.length > 0) {
        actions.push({
          type: 'log_observation',
          note: (textBlocks[0] as Anthropic.TextBlock).text,
        });
      }
    }

    return actions;
  }
}
