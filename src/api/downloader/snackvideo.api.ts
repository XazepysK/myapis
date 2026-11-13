import { Router } from 'express';
import axios from '../../lib/http.js';
import * as cheerio from 'cheerio';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
const SNACK_URL_RE = /^https?:\/\/(www\.|s\.)?snackvideo\.com\//;

function unescapeUrl(value: string): string {
    return value.replace(/\\u002F/g, '/').replace(/\\\//g, '/');
}

async function scrapeSnackVideo(url: string): Promise<any> {
    const response = await axios.get(url, {
        timeout: 30000,
        validateStatus: (status) => status < 400,
        headers: {
            'User-Agent': UA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        }
    });

    const html = String(response.data);
    const contentMatch = /contentUrl:"([^"]+)"/.exec(html);
    if (!contentMatch) throw new Error('Video data not found in the page.');

    const $ = cheerio.load(html);
    const dateMatch = /uploadDate:"([^"]+)"/.exec(html);
    const title = $('meta[property="og:title"]').attr('content')
        || $('title').text().replace(/\s*\|\s*SnackVideo\s*$/, '').trim();

    return {
        url: response.request?.res?.responseUrl || url,
        title,
        description: $('meta[property="og:description"]').attr('content') || '',
        thumbnail: $('meta[property="og:image"]').attr('content') || '',
        uploadDate: dateMatch ? dateMatch[1].split('T')[0] : '',
        videoUrl: unescapeUrl(contentMatch[1])
    };
}

router.get('/', async (req, res) => {
    try {
        const url = (req.query.url as string || '').trim();
        if (!url) return res.status(400).json({ success: false, error: 'Query ?url= is required' });
        if (!SNACK_URL_RE.test(url)) return res.status(400).json({ success: false, error: 'Invalid Snack Video URL format' });
        const result = await scrapeSnackVideo(url);
        return res.json({ success: true, data: result });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to scrape Snack Video' });
    }
});

export default router;