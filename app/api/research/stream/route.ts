import { selectSources } from '@/lib/source-selector';
import { CATEGORY_ICONS } from '@/lib/all-sources';
import { getActionId } from '@/lib/action-map';
import {
  submitWireTask,
  pollWireTask,
  submitAgenticSearch,
  pollAgenticSearch,
} from '@/lib/anakin';

function normalizeItems(raw: unknown): Array<{
  title: string;
  url: string | null;
  snippet: string;
  extra: string | number | null;
  timestamp: string | null;
}> {
  const data = raw as Record<string, unknown>;
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray(data?.hits) ? data.hits
    : Array.isArray(data?.items) ? data.items
    : Array.isArray(data?.results) ? data.results
    : Array.isArray(data?.data) ? data.data
    : Array.isArray(data?.posts) ? data.posts
    : Array.isArray(data?.repositories) ? data.repositories
    : Array.isArray(data?.papers) ? data.papers
    : Array.isArray(data?.events) ? data.events
    : Array.isArray(data?.markets) ? data.markets
    : Array.isArray(data?.articles) ? data.articles
    : Array.isArray(data?.books) ? data.books
    : Array.isArray(data?.jobs) ? data.jobs
    : Array.isArray(data?.listings) ? data.listings
    : Array.isArray(data?.videos) ? data.videos
    : Array.isArray(data?.questions) ? data.questions
    : Array.isArray(data?.packages) ? data.packages
    : Array.isArray(data?.companies) ? data.companies
    : [];

  return arr.slice(0, 5).map((it: Record<string, unknown>) => ({
    title: String(
      it.title ?? it.name ?? it.headline ?? it.question ?? it.full_name ?? it.text ?? '(untitled)'
    ),
    url: (it.url ?? it.hn_url ?? it.link ?? it.permalink ?? it.html_url ?? it.abs_url ?? it.pdf_url ?? it.website ?? null) as string | null,
    snippet: String(
      it.snippet ?? it.description ?? it.summary ?? it.abstract ?? it.selftext ??
      it.story_text ?? it.outcome ?? it.body ?? it.content ?? ''
    ).slice(0, 200),
    extra: (it.points ?? it.score ?? it.probability ?? it.upvotes ?? it.ups ??
      it.stargazers_count ?? it.stars ?? it.rating ?? it.views ?? null) as string | number | null,
    timestamp: (it.timestamp ?? it.published_at ?? it.created_at ?? it.created_utc ?? it.date ?? null) as string | null,
  }));
}

export async function POST(req: Request) {
  const { topic } = await req.json();
  if (!topic) {
    return new Response('topic required', { status: 400 });
  }

  const apiKey = process.env.ANAKIN_API_KEY!;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Select best sources for this query
      const selectedSources = await selectSources(topic, 8);

      // Send selected sources info
      send({
        type: 'sources_selected',
        sources: selectedSources.map(s => ({
          slug: s.slug,
          name: s.name,
          category: s.category,
          icon: CATEGORY_ICONS[s.category] || '🔍',
        })),
      });

      // Search all selected sources in parallel
      const wirePromises = selectedSources.map(async (source) => {
        try {
          const actionId = await getActionId(source.slug, apiKey);
          if (!actionId) throw new Error('no action');

          const { job_id } = await submitWireTask(actionId, { query: topic });
          const result = await pollWireTask(job_id);
          const items = normalizeItems(result);

          send({
            type: 'source',
            slug: source.slug,
            name: source.name,
            category: source.category,
            icon: CATEGORY_ICONS[source.category] || '🔍',
            status: 'ok',
            items,
          });
        } catch (e) {
          send({
            type: 'source',
            slug: source.slug,
            name: source.name,
            category: source.category,
            icon: CATEGORY_ICONS[source.category] || '🔍',
            status: 'error',
            error: String(e instanceof Error ? e.message : e),
          });
        }
      });

      // ALWAYS fetch YouTube videos for the topic (in parallel)
      const videosPromise = (async () => {
        try {
          const { job_id } = await submitWireTask('yt_search', { query: topic });
          const result = await pollWireTask(job_id);
          const root = result as Record<string, unknown>;
          const videos = (Array.isArray(root?.data) ? root.data
            : Array.isArray(root?.videos) ? root.videos
            : Array.isArray(root?.items) ? root.items
            : Array.isArray(root?.results) ? root.results
            : Array.isArray(root) ? root
            : []) as Array<Record<string, unknown>>;

          const extracted = videos.slice(0, 6).map((v) => {
            const url = String(v.url ?? v.link ?? v.video_url ?? '');
            const idMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
            return {
              id: String(v.video_id ?? v.id ?? idMatch?.[1] ?? ''),
              title: String(v.title ?? v.name ?? '(untitled)'),
              channel: String(v.channel ?? v.author ?? v.channel_name ?? ''),
              thumbnail: String(v.thumbnail ?? v.thumbnail_url ?? ''),
            };
          }).filter(v => v.id && v.id.length === 11);

          send({ type: 'videos', videos: extracted });
        } catch (e) {
          send({ type: 'videos', videos: [], error: String(e instanceof Error ? e.message : e) });
        }
      })();

      // Start synthesis in parallel
      const synthesisPromise = (async () => {
        try {
          const sourceNames = selectedSources.map(s => s.name).join(', ');
          const prompt = `Research summary on "${topic}". Sources being checked: ${sourceNames}. Provide a brief 2-3 sentence synthesis of what this topic is about, recent developments, and why it matters.`;

          const { job_id } = await submitAgenticSearch(prompt);
          const result = await pollAgenticSearch(job_id);
          const generated = result?.generatedJson as Record<string, unknown>;

          send({
            type: 'synthesis',
            status: 'ok',
            summary: String(generated?.summary ?? ''),
          });
        } catch (e) {
          send({
            type: 'synthesis',
            status: 'error',
            error: String(e instanceof Error ? e.message : e),
          });
        }
      })();

      // Wait for all to complete
      await Promise.all([...wirePromises, synthesisPromise, videosPromise]);

      send({ type: 'done' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
