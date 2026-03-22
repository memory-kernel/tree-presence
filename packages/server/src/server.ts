import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { fetchAnchor, prepareWitnessTx } from './chain.js';
import { converseWithTree, isConversationAvailable } from './converse.js';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// x402 payment imports
import { paymentMiddleware, x402ResourceServer } from '@x402/hono';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { facilitator } from '@coinbase/x402';
import { HTTPFacilitatorClient } from '@x402/core/server';

const app = new Hono();

const DEFAULT_ANCHOR_ID = Number(process.env.DEFAULT_ANCHOR_ID) || 3058;

// --- CORS ---
app.use('/api/*', cors());

// --- x402 payment setup (optional — enabled by X402_PAY_TO env var) ---

const X402_PAY_TO = process.env.X402_PAY_TO;
const X402_NETWORK = process.env.X402_NETWORK || 'eip155:84532'; // Base Sepolia default
const X402_PRICE = process.env.X402_PRICE || '$0.01';
const X402_FACILITATOR = process.env.X402_FACILITATOR || 'https://x402.org/facilitator';

if (X402_PAY_TO) {
  console.log(`x402 payments enabled: ${X402_PRICE} on ${X402_NETWORK} → ${X402_PAY_TO}`);

  const facilitatorClient = process.env.CDP_API_KEY_ID
    ? new HTTPFacilitatorClient(facilitator)
    : new HTTPFacilitatorClient({ url: X402_FACILITATOR });

  const resourceServer = new x402ResourceServer(facilitatorClient)
    .register(X402_NETWORK as `${string}:${string}`, new ExactEvmScheme());

  const routeKey = `POST /api/converse`;
  const routesConfig = {
    [routeKey]: {
      accepts: [
        {
          scheme: 'exact' as const,
          price: X402_PRICE,
          network: X402_NETWORK,
          payTo: X402_PAY_TO,
        },
      ],
      description: 'Converse with The Brunswick Plane — a 230-year-old London plane tree',
      mimeType: 'application/json',
    },
  };

  app.use(paymentMiddleware(routesConfig as any, resourceServer));
} else {
  console.log('x402 payments disabled (set X402_PAY_TO to enable)');
}

// --- Service discovery ---

app.get('/api/docs', (c) => {
  const base = new URL(c.req.url).origin;

  return c.json({
    name: 'Tree Presence API',
    description: 'API for interacting with a tree\'s on-chain digital presence. The tree accumulates witness inscriptions from people who encounter it, and can converse drawing on its accumulated history.',
    anchorId: DEFAULT_ANCHOR_ID,
    chain: 'celo',
    contracts: {
      identityRegistry: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
      reputationRegistry: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
    },
    endpoints: {
      status: {
        method: 'GET',
        path: `${base}/api/status`,
        description: 'Returns the tree\'s full on-chain state: identity, metadata, all witness inscriptions, guardian responses, and confidence score.',
        parameters: null,
        returns: {
          id: 'number — ERC-8004 agent ID',
          owner: 'string — tree owner address',
          registration: 'object — ERC-8004 registration data (name, description, services)',
          metadata: 'object — on-chain key/value metadata (type, health, status, season, etc.)',
          witnesses: 'array — all witness inscriptions with message, author, tag, timestamp, tx hash',
          responses: 'array — guardian/tree responses to specific witnesses',
          summary: 'object — { count: number of witnesses, confidence: 0-100 score }',
        },
      },
      witness: {
        method: 'POST',
        path: `${base}/api/witness`,
        description: 'Prepares a witness attestation transaction. Returns encoded calldata for the caller to sign and submit to the Celo ReputationRegistry. The server does not sign — your wallet does.',
        parameters: {
          message: 'string (required) — what you observed about the tree',
          witnessAddress: 'string (required) — your Celo address (must not be the tree owner)',
          tag1: 'string (optional, default: "witness") — observation type (e.g., "ecological-observation", "damage-report", "community-observation")',
          secret: 'string (optional) — binding secret to prove physical encounter',
        },
        returns: {
          to: 'string — ReputationRegistry contract address',
          data: 'string — encoded transaction calldata for giveFeedback()',
          verified: 'boolean — whether the secret matched the on-chain binding commitment',
        },
      },
      converse: {
        method: 'POST',
        path: `${base}/api/converse`,
        description: 'Talk to the tree. The tree responds as itself, drawing on its accumulated witness inscriptions, metadata, and history. Payment required via x402.',
        payment: X402_PAY_TO ? {
          protocol: 'x402',
          price: X402_PRICE,
          network: X402_NETWORK,
          payTo: X402_PAY_TO,
        } : null,
        parameters: {
          message: 'string (required) — what you want to say to the tree',
          history: 'array (optional) — prior conversation turns as [{ role: "user"|"assistant", content: string }]',
        },
        returns: {
          response: 'string — the tree\'s reply',
        },
      },
    },
  });
});

// --- API routes ---

// Tree status
app.get('/api/status', async (c) => {
  try {
    const data = await fetchAnchor(DEFAULT_ANCHOR_ID);
    return c.json({
      ...data,
      witnesses: data.witnesses.map((w) => ({
        ...w,
        blockNumber: w.blockNumber.toString(),
      })),
      responses: data.responses.map((r) => ({
        ...r,
        blockNumber: r.blockNumber.toString(),
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// Prepare witness transaction
app.post('/api/witness', async (c) => {
  try {
    const body = await c.req.json<{
      message: string;
      witnessAddress: string;
      tag1: string;
      secret?: string;
    }>();

    if (!body.message?.trim()) return c.json({ error: 'Message is required' }, 400);
    if (!body.witnessAddress) return c.json({ error: 'Witness address is required' }, 400);

    const result = await prepareWitnessTx(DEFAULT_ANCHOR_ID, {
      message: body.message.trim(),
      witnessAddress: body.witnessAddress,
      tag1: body.tag1 || 'witness',
      secret: body.secret || undefined,
    });

    return c.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 400);
  }
});

// Converse with the tree
app.post('/api/converse', async (c) => {
  if (!isConversationAvailable()) {
    return c.json({ error: 'Conversation unavailable — no API key configured' }, 503);
  }

  try {
    const body = await c.req.json<{
      message: string;
      history?: { role: string; content: string }[];
    }>();

    if (!body.message?.trim()) return c.json({ error: 'Message is required' }, 400);

    const data = await fetchAnchor(DEFAULT_ANCHOR_ID);
    const response = await converseWithTree(data, body.message.trim(), body.history || []);

    return c.json({ response });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

// --- Static frontend ---
// In production, serve the built frontend from ../frontend/dist
// The Dockerfile copies it to a sibling directory

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, '../../frontend/dist');

if (existsSync(frontendDir)) {
  console.log(`Serving frontend from ${frontendDir}`);

  app.use('/*', serveStatic({ root: frontendDir }));

  // SPA fallback — serve index.html for non-API, non-file routes
  const indexHtml = readFileSync(resolve(frontendDir, 'index.html'), 'utf-8');
  app.get('*', (c) => c.html(indexHtml));
} else {
  console.log('No frontend build found — API-only mode');
}

const port = Number(process.env.PORT) || 8080;

serve({ fetch: app.fetch, port }, (info: { port: number }) => {
  console.log(`Tree Presence API server listening on http://localhost:${info.port}`);
  console.log(`Anchor ID: ${DEFAULT_ANCHOR_ID}`);
});
