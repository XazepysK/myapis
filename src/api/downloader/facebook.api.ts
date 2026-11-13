import { Router } from 'express';
import axios from '../../lib/http.js';
import * as cheerio from 'cheerio';

const router = Router();
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36';
const FB_URL_RE = /(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/;

interface FacebookMedia {
    url: string;
    resolution: string;
    format: string;
}

async function scrapeFacebook(url: string): Promise<any> {
    if (!FB_URL_RE.test(url)) throw new Error('Invalid Facebook URL provided.');

    const formData = `url=${encodeURIComponent(url)}&lang=en&type=redirect`;
    const { data } = await axios.post('https://getvidfb.com/', formData, {
        timeout: 30000,
        headers: {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/x-www-form-urlencoded',
            'origin': 'https://getvidfb.com',
            'referer': 'https://getvidfb.com/',
            'user-agent': UA
        }
    });

    const $ = cheerio.load(data);
    const container = $('#snaptik-video');
    if (!container.length) throw new Error('Video container not found.');

    const thumbnail = container.find('.snaptik-left img').attr('src') || '';
    const title = container.find('.snaptik-middle h3').text().trim() || 'Facebook Video';
    const media: FacebookMedia[] = [];

    container.find('.abuttons a').each((_, el) => {
        const link = $(el).attr('href');
        const label = $(el).find('.span-icon span').last().text().trim();
        if (!link || !label || !link.startsWith('http')) return;

        let resolution = 'Unknown';
        let format = 'Unknown';
        if (label.includes('HD')) { resolution = 'HD'; format = 'mp4'; }
        else if (label.includes('SD')) { resolution = 'SD'; format = 'mp4'; }
        else if (label.includes('Mp3') || label.includes('Audio')) { resolution = 'Audio'; format = 'mp3'; }
        else if (label.includes('Photo') || label.includes('Jpg')) { resolution = 'Photo'; format = 'jpg'; }

        media.push({ url: link, resolution, format });
    });

    if (!media.length) throw new Error('No download links found for the provided URL.');
    return { thumbnail, title, data: media };
}

router.get('/', async (req, res) => {
    try {
        const url = (req.query.url as string || '').trim();
        if (!url) return res.status(400).json({ success: false, error: 'Query ?url= is required' });
        const result = await scrapeFacebook(url);
        return res.json({ success: true, data: result });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to scrape Facebook video' });
    }
});

export default router;