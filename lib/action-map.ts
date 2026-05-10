export const ACTION_MAP: Record<string, string> = {
  'google_trends': 'gt_interest_over_time',
  'goodreads': 'gr_search_books',
  'medium': 'md_search',
  'substack': 'sb_search',
  'github_public': 'gh_search_repos',
  'stackoverflow': 'so_search_questions',
  // 'producthunt': no general search action exists in Anakin — only trending/details/user. Skipped.
  'npm': 'np_search',
  'pypi': 'pp_search',
  'devto': 'dt_search',
  'yahoo_finance': 'yf_search',
  'coingecko': 'cg_search',
  'finviz': 'fv_screener',
  'nasdaq': 'na_search',
  'investing_com': 'inv_search',
  'stocktwits': 'st_search_symbols',
  'fred_stlouisfed': 'fr_search_series',
  'trading_economics': 'te_search',
  'sec_edgar': 'se_full_text_search',
  'fear_greed': 'fg_cnn_fear_greed',
  'polymarket': 'pm_search_markets',
  'kalshi': 'kl_search',
  'manifold': 'mm_search_markets',
  'google_news': 'gn_search',
  'hackernews': 'hn_search',
  'techcrunch': 'tc_search',
  'reuters': 're_search',
  'bbc': 'bb_search',
  'cnbc': 'cn_search',
  'apnews': 'ap_search',
  'aljazeera': 'aj_search',
  'guardian': 'gu_search',
  'scmp': 'sm_search',
  'nikkei_asia': 'nk_search',
  'economic_times': 'et_search',
  'arxiv': 'ax_search_papers',
  'pubmed': 'pm_search_articles',
  'semantic_scholar': 'ss_paper_search',
  'reddit': 'rt_search',
  'youtube': 'yt_search',
  'wikipedia': 'wp_search',
  'indeed': 'in_search_jobs',
  'remoteok': 'ro_jobs',
  'weworkremotely': 'ww_jobs',
  'amazon': 'am_search_products',
  'ebay': 'eb_search_listings',
  'airbnb': 'ab_search_stays',
  'google_flights': 'gf_search_flights',
  'booking': 'bk_search',
  'skyscanner': 'sc_search_flights',
  'ycombinator': 'yc_search_companies',
  'zillow': 'zl_search_listings',
  'imdb': 'im_search',
  'steam': 'st_search',
  'trustpilot': 'tp_search_companies',
  'meetup': 'mu_search_events',
  'luma': 'lu_discover_events',
  'drugs_com': 'dc_search_drugs',
};

// Get the right action for a source, with fallback discovery
export async function getActionId(slug: string, apiKey: string): Promise<string | null> {
  // Try mapped action first
  const mapped = ACTION_MAP[slug];
  if (mapped) return mapped;

  // Fallback: discover from catalog
  try {
    const res = await fetch(`https://api.anakin.io/v1/holocron/catalog/${slug}`, {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    const actions = data.actions || [];

    // Find search action
    const searchAction = actions.find((a: any) =>
      a.action_id?.toLowerCase().includes('search')
    );
    if (searchAction) return searchAction.action_id;

    // Find any non-auth action
    const publicAction = actions.find((a: any) => !a.auth_required);
    if (publicAction) return publicAction.action_id;

    return actions[0]?.action_id || null;
  } catch {
    return null;
  }
}
