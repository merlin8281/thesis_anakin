import { readFileSync } from 'fs';
import { resolve } from 'path';

const envContent = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
for (const line of envContent.split('\n')) {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
}

async function main() {
  const { selectSources } = await import('../lib/source-selector');

  const queries = [
    'i want macbook pro m4',
    'MacBook Pro M4 specs price review',
    'macbook pro m4 price',
  ];

  for (const q of queries) {
    console.log(`\n=== "${q}" ===`);
    const result = await selectSources(q, 8);
    console.log(result.map((s: any) => `${s.slug} (${s.category})`).join(', '));
  }
}

main().catch(console.error);
