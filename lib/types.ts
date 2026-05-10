export interface SourceItem {
  title: string;
  url: string | null;
  snippet: string;
  extra: string | number | null;
  timestamp: string | null;
}

export interface SourceResult {
  slug: string;
  label: string;
  status: 'loading' | 'ok' | 'error';
  items?: SourceItem[];
  error?: string;
}

export interface SynthesisResult {
  status: 'loading' | 'ok' | 'error';
  summary?: string;
  citations?: { url: string; title?: string }[];
  error?: string;
}

export interface ResearchResponse {
  topic: string;
  wire: SourceResult[];
  synthesis: SynthesisResult;
}
