import { Router } from 'express';
import axios from '../../lib/http.js';
import * as cheerio from 'cheerio';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const REGION_RE = /^[a-z]{2}$/;

async function searchAppleMusic(query: string, region: string): Promise<any[]> {
    const { data } = await axios.get(`https://music.apple.com/${region}/search?term=${encodeURIComponent(query)}`, {
        timeout: 30000,
        headers: { 'User-Agent': UA }
    });
    const $ = cheerio.load(data);
    const results: any[] = [];
    $('.top-search-lockup').each((_, element) => {
        const title = $(element).find('.top-search-lockup__primary__title').text().trim();
        const artist = $(element).find('.top-search-lockup__secondary').text().trim();
        const link = $(element).find('.click-action').attr('href');
        const image = $(element).find('picture source').attr('srcset')?.split(' ')[0];
        if (title && artist && link) {
            results.push({
                title,
                artist,
                link: link.startsWith('http') ? link : `https://music.apple.com${link}`,
                image: image || null
            });
        }
    });
    return results;
}

router.get('/', async (req, res) => {
    try {
        const query = (req.query.query as string || req.query.q as string || '').trim();
        const region = (req.query.region as string || 'us').trim().toLowerCase();
        if (!query) return res.status(400).json({ success: false, error: 'Query ?query= is required' });
        if (query.length > 255) return res.status(400).json({ success: false, error: 'query must be 255 characters or fewer' });
        if (!REGION_RE.test(region)) return res.status(400).json({ success: false, error: 'region must be a two-letter country code, for example us or id' });
        const data = await searchAppleMusic(query, region);
        return res.json({ success: true, data });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to search Apple Music' });
    }
});

export default router;