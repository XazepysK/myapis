import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface YouTubeResult {
    type: string;
    videoId: string;
    title: string;
    url: string;
    thumbnail: string;
    duration: string;
    views: string;
    published: string;
    channel: string;
    channelUrl: string;
    description: string;
}

function textOf(node: any): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (node.simpleText) return node.simpleText;
    if (Array.isArray(node.runs)) return node.runs.map((run: any) => run.text).join('');
    return '';
}

function extractInitialData(html: string): any {
    const patterns = [
        /var ytInitialData\s*=\s*(\{.+?\})\s*;\s*<\/script>/s,
        /ytInitialData\s*=\s*(\{.+?\})\s*;/s
    ];
    for (const pattern of patterns) {
        const match = pattern.exec(html);
        if (match) return JSON.parse(match[1]);
    }
    throw new Error('Could not parse YouTube results.');
}

function collectVideoRenderers(node: any, out: any[]): void {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const child of node) collectVideoRenderers(child, out);
        return;
    }
    if (node.videoRenderer) { out.push(node.videoRenderer); return; }
    for (const value of Object.values(node)) collectVideoRenderers(value, out);
}

async function searchYouTube(query: string): Promise<YouTubeResult[]> {
    const { data: html } = await axios.get('https://www.youtube.com/results', {
        params: { search_query: query },
        timeout: 30000,
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' }
    });

    const renderers: any[] = [];
    collectVideoRenderers(extractInitialData(html), renderers);

    const seen = new Set<string>();
    const results: YouTubeResult[] = [];
    for (const video of renderers) {
        const videoId = video.videoId;
        if (!videoId || seen.has(videoId)) continue;
        seen.add(videoId);
        const thumbs = video.thumbnail?.thumbnails || [];
        const basePath = video.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl;
        results.push({
            type: 'video',
            videoId,
            title: textOf(video.title),
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: thumbs.length ? thumbs[thumbs.length - 1].url : '',
            duration: textOf(video.lengthText),
            views: textOf(video.viewCountText),
            published: textOf(video.publishedTimeText),
            channel: textOf(video.ownerText),
            channelUrl: basePath ? `https://www.youtube.com${basePath}` : '',
            description: textOf(video.descriptionSnippet)
        });
    }

    if (!results.length) throw new Error('No results found for the given query.');
    return results;
}

router.get('/', async (req, res) => {
    try {
        const query = (req.query.query as string || req.query.q as string || '').trim();
        if (!query) return res.status(400).json({ success: false, error: 'Query ?query= is required' });
        if (query.length > 500) return res.status(400).json({ success: false, error: 'query must be 500 characters or fewer' });
        const results = await searchYouTube(query);
        return res.json({ success: true, data: results });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to search YouTube' });
    }
});

export default router;