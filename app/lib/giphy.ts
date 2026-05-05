const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';
const GIPHY_SEARCH_URL = 'https://api.giphy.com/v1/gifs/search';

export interface GiphyGif {
  id: string;
  title: string;
  url: string; // fixed-height URL for display
  previewUrl: string; // small preview for picker
}

export async function searchGiphy(query: string, limit = 8): Promise<GiphyGif[]> {
  if (!GIPHY_API_KEY) {
    throw new Error('Giphy API key not configured.');
  }

  const params = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    q: query,
    limit: String(limit),
    rating: 'pg',
    lang: 'en',
  });

  const res = await fetch(`${GIPHY_SEARCH_URL}?${params}`);
  if (!res.ok) {
    throw new Error('Failed to search Giphy.');
  }

  const json = await res.json();
  return (json.data || []).map((gif: any) => ({
    id: gif.id,
    title: gif.title || '',
    url: gif.images?.fixed_height?.url || '',
    previewUrl: gif.images?.fixed_height_small?.url || gif.images?.preview_gif?.url || '',
  }));
}
