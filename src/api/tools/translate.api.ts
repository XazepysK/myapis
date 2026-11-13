import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const LANG_RE = /^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i;

async function translateText(text: string, source: string, target: string): Promise<any> {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&q=${encodeURIComponent(text)}`;
    const { data } = await axios.get(url, { timeout: 30000, headers: { 'User-Agent': UA } });
    const translatedText = data?.[0]?.[0];
    if (!translatedText) throw new Error('Translation not found.');
    return { translatedText, detectedSource: data?.[0]?.[1] || source };
}

router.get('/', async (req, res) => {
    try {
        const text = (req.query.text as string || '').trim();
        const source = (req.query.source as string || 'auto').trim();
        const target = (req.query.target as string || 'en').trim();
        if (!text) return res.status(400).json({ success: false, error: 'Query ?text= is required' });
        if (text.length > 5000) return res.status(400).json({ success: false, error: 'text must be 5000 characters or fewer' });
        if (source !== 'auto' && !LANG_RE.test(source)) return res.status(400).json({ success: false, error: 'source must be a valid language code or auto' });
        if (!LANG_RE.test(target)) return res.status(400).json({ success: false, error: 'target must be a valid language code' });
        const result = await translateText(text, source, target);
        return res.json({ success: true, data: { text, source, target, translatedText: result.translatedText, detectedSource: result.detectedSource } });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to translate text' });
    }
});

export default router;