import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { fetchAnchor } from './chain.js';
import { renderLanding, renderTree, renderPark } from './views.js';

const app = new Hono();

// Landing page
app.get('/', (c) => {
  return c.html(renderLanding());
});

// Tree status page
app.get('/tree/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id) || id <= 0) return c.text('Invalid anchor ID', 400);
  try {
    const data = await fetchAnchor(id);
    return c.html(renderTree(data));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.text(`Error fetching anchor #${id}: ${msg}`, 500);
  }
});

// Park overview page
app.get('/park/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const treesParam = c.req.query('trees') || '';
  if (isNaN(id) || id <= 0) return c.text('Invalid park anchor ID', 400);

  try {
    const park = await fetchAnchor(id);

    // Parse tree IDs from query param or park metadata
    let treeIds: number[] = [];
    if (treesParam) {
      treeIds = treesParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
    }

    const trees = await Promise.all(treeIds.map(fetchAnchor));
    return c.html(renderPark(park, trees));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.text(`Error fetching park #${id}: ${msg}`, 500);
  }
});

// JSON API for tree
app.get('/api/tree/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (isNaN(id) || id <= 0) return c.json({ error: 'Invalid anchor ID' }, 400);
  try {
    const data = await fetchAnchor(id);
    // Convert bigints to strings for JSON serialization
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

// JSON API for park
app.get('/api/park/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const treesParam = c.req.query('trees') || '';
  if (isNaN(id) || id <= 0) return c.json({ error: 'Invalid park anchor ID' }, 400);

  try {
    const park = await fetchAnchor(id);
    let treeIds: number[] = [];
    if (treesParam) {
      treeIds = treesParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
    }
    const trees = await Promise.all(treeIds.map(fetchAnchor));

    const serialize = (d: typeof park) => ({
      ...d,
      witnesses: d.witnesses.map((w) => ({ ...w, blockNumber: w.blockNumber.toString() })),
      responses: d.responses.map((r) => ({ ...r, blockNumber: r.blockNumber.toString() })),
    });

    return c.json({ park: serialize(park), trees: trees.map(serialize) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ error: msg }, 500);
  }
});

const port = Number(process.env.PORT) || 8080;

serve({ fetch: app.fetch, port }, (info: { port: number }) => {
  console.log(`Memory Kernel web server listening on http://localhost:${info.port}`);
});
