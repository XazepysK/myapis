import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const CLIENT_ID = 'KKzJxmw11tYpCs6T24P4uUYhqmjalG6M';
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36';

function cleanFilename(filename: string): string {
    return (filename || '').replace(/[<>:"/\\|?*]/g, '_').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

async function searchSoundCloud(query: string): Promise<any[]> {
    const { data } = await axios.get('https://api-mobi.soundcloud.com/search', {
        params: { q: query, client_id: CLIENT_ID, stage: '' },
        timeout: 30000,
        headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.1',
            'User-Agent': UA,
            'Referer': `https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`
        }
    });

    const collection = data?.collection;
    if (!Array.isArray(collection)) throw new Error('No results returned from SoundCloud.');

    return collection.map((item: any) => ({
        title: item.title,
        genre: item.genre,
        created_at: item.created_at,
        duration: item.duration,
        permalink: cleanFilename(item.permalink),
        comment_count: item.comment_count,
        artwork_url: item.artwork_url,
        permalink_url: item.permalink_url,
        playback_count: item.playback_count
    }));
}

router.get('/', async (req, res) => {
    try {
        const query = (req.query.query as string || req.query.q as string || '').trim();
        if (!query) return res.status(400).json({ success: false, error: 'Query ?query= is required' });
        if (query.length > 200) return res.status(400).json({ success: false, error: 'query must be 200 characters or fewer' });
        const results = await searchSoundCloud(query);
        return res.json({ success: true, data: results });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to search SoundCloud' });
    }
});

export default router;