import {
  Newspaper,
  MessageSquare,
  TrendingUp,
  Globe,
  FlaskConical,
  Code2,
  type LucideIcon,
} from 'lucide-react';

export interface SourceConfig {
  slug: string;
  label: string;
  intent: string;
  paramKey: string;
  icon: LucideIcon;
}

export const SOURCES: SourceConfig[] = [
  {
    slug: 'hackernews',
    label: 'Hacker News',
    intent: 'search',
    paramKey: 'query',
    icon: Newspaper,
  },
  {
    slug: 'reddit',
    label: 'Reddit',
    intent: 'search',
    paramKey: 'query',
    icon: MessageSquare,
  },
  {
    slug: 'polymarket',
    label: 'Polymarket',
    intent: 'search',
    paramKey: 'query',
    icon: TrendingUp,
  },
  {
    slug: 'google_news',
    label: 'Google News',
    intent: 'search',
    paramKey: 'query',
    icon: Globe,
  },
  {
    slug: 'arxiv',
    label: 'arXiv',
    intent: 'search',
    paramKey: 'query',
    icon: FlaskConical,
  },
  {
    slug: 'github_public',
    label: 'GitHub',
    intent: 'search',
    paramKey: 'query',
    icon: Code2,
  },
];
