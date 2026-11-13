import { Router } from 'express';
import axios from '../../lib/http.js';
import * as cheerio from 'cheerio';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function animeQuotes(): Promise<any[]> {
    const page = Math.floor(Math.random() * 184);
    const { data } = await axios.get(`https://otakotaku.com/quote/feed/${page}`, { timeout: 30000, headers: { 'User-Agent': UA } });
    const $ = cheerio.load(data);
    const results: any[] = [];
    $('div.kotodama-list').each((_, element) => {
        results.push({
            link: $(element).find('a').attr('href') || null,
            image: $(element).find('img').attr('data-src') || null,
            character: $(element).find('div.char-name').text().trim(),
            anime: $(element).find('div.anime-title').text().trim(),
            episode: $(element).find('div.meta').text().trim(),
            quotes: $(element).find('div.quote').text().trim()
        });
    });
    if (!results.length) throw new Error('No quotes found.');
    return results;
}

router.get('/', async (req, res) => {
    try {
        const data = await animeQuotes();
        return res.json({ success: true, data });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to fetch anime quotes' });
    }
});

export default router;