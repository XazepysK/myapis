import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const LANG_RE = /^[a-z]{2,3}(-[a-z]{2,8})?$/;

async function fetchSummary(query: string, lang: string): Promise<any> {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}?redirect=true`;
    const { data } = await axios.get(url, { timeout: 30000, headers: { 'User-Agent': UA } });
    if (!data?.extract) throw new Error('Article not found or has no description.');
    return {
        title: data.title || query,
        description: data.description || '',
        wiki: data.extract,
        thumb: data.thumbnail?.source || '',
        url: data.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(query)}`
    };
}

router.get('/', async (req, res) => {
    try {
        const query = (req.query.query as string || req.query.q as string || '').trim();
        const lang = (req.query.lang as string || 'en').trim().toLowerCase();
        if (!query) return res.status(400).json({ success: false, error: 'Query ?query= is required' });
        if (query.length > 200) return res.status(400).json({ success: false, error: 'query must be 200 characters or fewer' });
        if (!LANG_RE.test(lang)) return res.status(400).json({ success: false, error: 'lang must be a valid Wikipedia language code' });
        const result = await fetchSummary(query, lang);
        return res.json({ success: true, data: result });
    } catch (err: any) {
        const status = err.response?.status === 404 ? 404 : 502;
        return res.status(status).json({ success: false, error: err.response?.status === 404 ? 'Article not found.' : (err.message || 'Failed to fetch Wikipedia data') });
    }
});

export default router;