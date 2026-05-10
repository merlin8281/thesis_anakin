import { NextRequest, NextResponse } from 'next/server';
import { SOURCES } from '@/lib/sources';
import {
  submitWireTask,
  pollWireTask,
  submitAgenticSearch,
  pollAgenticSearch,
} from '@/lib/anakin';

const ACTION_IDS: Record<string, string> = {
  hackernews: 'hn_search',
  reddit: 'rt_search',
  polymarket: 'pm_search_markets',
  google_news: 'gn_search',
  arxiv: 'ax_search_papers',
  github_public: 'gh_search_repos',
};

function normalizeItems(
  slug: string,
  raw: unknown
): Array<{
  title: string;
  url: string | null;
  snippet: string;
  extra: string | number | null;
  timestamp: string | null;
}> {
  const data = raw as Record<string, unknown>;
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(data?.hits)
      ? data.hits
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.posts)
              ? data.posts
              : Array.isArray(data?.repositories)
                ? data.repositories
                : Array.isArray(data?.papers)
                  ? data.papers
                  : Array.isArray(data?.events)
                    ? data.events
                    : Array.isArray(data?.markets)
                      ? data.markets
                      : [];

  return arr.slice(0, 5).map((it: Record<string, unknown>) => ({
    title: String(
      it.title ?? it.name ?? it.headline ?? it.question ?? it.full_name ?? '(untitled)'
    ),
    url: (it.url ?? it.hn_url ?? it.link ?? it.permalink ?? it.html_url ?? it.abs_url ?? it.pdf_url ?? null) as string | null,
    snippet: String(
      it.snippet ??
        it.description ??
        it.summary ??
        it.abstract ??
        it.selftext ??
        it.story_text ??
        it.outcome ??
        (typeof it.body === 'string' ? it.body.slice(0, 200) : '') ??
        ''
    ).slice(0, 200),
    extra: (it.points ?? it.score ?? it.probability ?? it.upvotes ?? it.ups ?? it.stargazers_count ?? it.stars ?? null) as
      | string
      | number
      | null,
    timestamp: (it.timestamp ?? it.published_at ?? it.created_at ?? it.created_utc ?? null) as
      | string
      | null,
  }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = body?.topic;

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({ error: 'topic required' }, { status: 400 });
    }

    const truncatedTopic = topic.slice(0, 200);

    const wirePromises = SOURCES.map(async (s) => {
      try {
        const action_id = ACTION_IDS[s.slug];
        if (!action_id) throw new Error('no action available');
        const { job_id } = await submitWireTask(action_id, {
          [s.paramKey]: truncatedTopic,
        });
        const result = await pollWireTask(job_id);
        const items = normalizeItems(s.slug, result);
        return {
          slug: s.slug,
          label: s.label,
          status: 'ok' as const,
          items,
        };
      } catch (e) {
        return {
          slug: s.slug,
          label: s.label,
          status: 'error' as const,
          error: String(e instanceof Error ? e.message : e),
        };
      }
    });

    const synthesisPromise = (async () => {
      try {
        const prompt = `Brief research summary on "${truncatedTopic}". Include: what it is, recent developments, key players, and why it matters. Keep it under 300 words.`;
        const { job_id } = await submitAgenticSearch(prompt);
        const result = await pollAgenticSearch(job_id);
        const generated = result?.generatedJson as Record<string, unknown>;
        return {
          status: 'ok' as const,
          summary: String(generated?.summary ?? ''),
          citations: (generated?.citations ?? []) as Array<{
            url: string;
            title?: string;
          }>,
        };
      } catch (e) {
        return {
          status: 'error' as const,
          error: String(e instanceof Error ? e.message : e),
        };
      }
    })();

    // Return Wire results immediately - don't wait for slow Agentic Search
    const wire = await Promise.all(wirePromises);

    // Race: either synthesis completes in 5s or we return without it
    const synthesisWithTimeout = Promise.race([
      synthesisPromise,
      new Promise<{ status: 'loading' }>((resolve) =>
        setTimeout(() => resolve({ status: 'loading' as const }), 5000)
      ),
    ]);

    const synthesis = await synthesisWithTimeout;

    return NextResponse.json({ topic: truncatedTopic, wire, synthesis });
  } catch (e) {
    console.error('Research route error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
