import { Router } from 'express';
import axios from '../../lib/http.js';
import * as cheerio from 'cheerio';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';

async function scrapeTwitter(videoUrl: string): Promise<any> {
    const { data: html } = await axios.get('https://snaptwitter.com/', {
        timeout: 30000,
        headers: { 'User-Agent': UA }
    });
    const $tok = cheerio.load(html);
    const token = $tok('input[name="token"]').attr('value') || '';

    const form = new URLSearchParams();
    form.append('url', videoUrl);
    form.append('token', token);

    const { data } = await axios.post('https://snaptwitter.com/action.php', form, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA }
    });

    const markup = data?.data;
    if (typeof markup !== 'string') throw new Error('Unexpected response from SnapTwitter.');

    const $ = cheerio.load(markup);
    const downloadLink = $('.abuttons a').attr('href') || '';
    if (!downloadLink) throw new Error('No download link found for the provided URL.');

    return {
        title: $('.videotikmate-middle h1').text().trim(),
        description: $('.videotikmate-middle p span').text().trim(),
        thumbnail: $('.videotikmate-left img').attr('src') || '',
        downloadLink
    };
}

router.get('/', async (req, res) => {
    try {
        const url = (req.query.url as string || '').trim();
        if (!url) return res.status(400).json({ success: false, error: 'Query ?url= is required' });
        const result = await scrapeTwitter(url);
        return res.json({ success: true, data: result });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to scrape Twitter video' });
    }
});

export default router;