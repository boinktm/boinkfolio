/**
 * SoundCloud RSS Feed Fetcher
 * Fetches your public SoundCloud uploads at Astro build time
 * via the SoundCloud RSS feed (no API key required).
 */
import { XMLParser } from 'fast-xml-parser';

export interface Track {
  title: string;
  badge: string;
  subtitle: string;
  href: string;
  artwork: string;
  duration: string;
  streamUrl: string;
}

/** Fallback data shown when the feed is unavailable */
const FALLBACK_TRACKS: Track[] = [
  { title: 'Something Bout Pimpin (69Fast)', badge: 'NEW', subtitle: 'Oct 2024', href: 'https://soundcloud.com/boinkedup/something-bout-pimpin-69fast', artwork: '', duration: '2:47', streamUrl: 'https://feeds.soundcloud.com/stream/1928910017-boinkedup-something-bout-pimpin-69fast.mp3' },
  { title: 'Switch -E1', badge: '', subtitle: 'Aug 2024', href: 'https://soundcloud.com/boinkedup/ominous-mastered', artwork: '', duration: '3:15', streamUrl: 'https://feeds.soundcloud.com/stream/1905136772-boinkedup-ominous-mastered.mp3' },
  { title: 'Progressive (FINAL)', badge: '', subtitle: 'Aug 2024', href: 'https://soundcloud.com/boinkedup/progressive-final', artwork: '', duration: '2:57', streamUrl: 'https://feeds.soundcloud.com/stream/1903960574-boinkedup-progressive-final.mp3' },
];

/**
 * Format an ISO duration string like "00:02:47" to "2:47"
 */
function formatDuration(raw: string): string {
  if (!raw) return '';
  const parts = raw.split(':').map(Number);
  // parts = [hours, minutes, seconds]
  if (parts.length === 3) {
    const [h, m, s] = parts;
    const sec = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  }
  return raw;
}

/**
 * Format a date string like "Fri, 04 Oct 2024 16:23:49 +0000" to "Oct 2024"
 */
function formatDate(raw: string): string {
  try {
    const d = new Date(raw);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return raw;
  }
}

/**
 * Fetch SoundCloud tracks from the RSS feed.
 * @param userId - Your numeric SoundCloud user ID
 * @param limit  - Max tracks to return (default: 10)
 */
export async function fetchSoundCloudTracks(
  userId: string,
  limit: number = 10,
): Promise<Track[]> {
  const feedUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${userId}/sounds.rss`;

  try {
    const res = await fetch(feedUrl, {
      headers: { 'User-Agent': 'AstroBuild/1.0' },
    });

    if (!res.ok) {
      console.warn(`[SoundCloud] RSS feed returned ${res.status}, using fallback`);
      return FALLBACK_TRACKS;
    }

    const xml = await res.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const feed = parser.parse(xml);

    const channel = feed?.rss?.channel;
    if (!channel) {
      console.warn('[SoundCloud] Unexpected feed structure, using fallback');
      return FALLBACK_TRACKS;
    }

    // Normalise items — single item comes as object, multiple as array
    let items = channel.item;
    if (!items) {
      console.warn('[SoundCloud] No items in feed, using fallback');
      return FALLBACK_TRACKS;
    }
    if (!Array.isArray(items)) items = [items];

    const tracks: Track[] = items.slice(0, limit).map((item: any, index: number) => ({
      title: item.title ?? 'Untitled',
      badge: index === 0 ? 'NEW' : '',
      subtitle: formatDate(item.pubDate),
      href: item.link ?? '#',
      artwork: item['itunes:image']?.['@_href'] ?? '',
      duration: formatDuration(item['itunes:duration'] ?? ''),
      streamUrl: item.enclosure?.['@_url'] ?? '',
    }));

    return tracks;
  } catch (err) {
    console.warn('[SoundCloud] Failed to fetch RSS feed:', err);
    return FALLBACK_TRACKS;
  }
}
