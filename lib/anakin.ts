const BASE = 'https://api.anakin.io/v1';

function getHeaders() {
  const key = process.env.ANAKIN_API_KEY;
  if (!key) throw new Error('ANAKIN_API_KEY not set');
  return {
    'X-API-Key': key,
    'Content-Type': 'application/json',
  };
}

export async function discoverCatalog(slug: string) {
  const r = await fetch(`${BASE}/holocron/catalog/${slug}`, {
    headers: getHeaders(),
  });
  if (!r.ok) throw new Error(`catalog ${slug} failed: ${r.status}`);
  return r.json();
}

export async function submitWireTask(action_id: string, params: object) {
  const r = await fetch(`${BASE}/holocron/task`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ action_id, params }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`wire submit failed: ${r.status} - ${text}`);
  }
  return r.json() as Promise<{ job_id: string }>;
}

export async function pollWireTask(job_id: string) {
  const delays = [0, 500, 1000, 1500, 2000, 3000, 5000, 8000];
  for (const d of delays) {
    if (d > 0) await new Promise((resolve) => setTimeout(resolve, d));
    const r = await fetch(`${BASE}/holocron/jobs/${job_id}`, {
      headers: getHeaders(),
    });
    const j = await r.json();
    if (j.status === 'completed') return j.data ?? j;
    if (j.status === 'failed') throw new Error('wire job failed');
  }
  throw new Error('wire poll timed out');
}

export async function submitAgenticSearch(prompt: string) {
  const r = await fetch(`${BASE}/agentic-search`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prompt }),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`agentic search submit failed: ${r.status} - ${text}`);
  }
  return r.json() as Promise<{ job_id: string }>;
}

export async function pollAgenticSearch(job_id: string) {
  const delays = [0, 3000, 5000, 8000, 10000, 15000, 20000, 30000, 30000];
  for (const d of delays) {
    if (d > 0) await new Promise((resolve) => setTimeout(resolve, d));
    const r = await fetch(`${BASE}/agentic-search/${job_id}`, {
      headers: getHeaders(),
    });
    const j = await r.json();
    if (j.status === 'completed') return j;
    if (j.status === 'failed') throw new Error(j.error || 'agentic search failed');
  }
  throw new Error('agentic search timed out (>2min)');
}
