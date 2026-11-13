import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const text = (req.query.text as string || '').trim();
        if (!text) return res.status(400).json({ success: false, error: 'Query ?text= is required' });
        if (text.length > 10000) return res.status(400).json({ success: false, error: 'text must be 10000 characters or fewer' });
        const base64 = Buffer.from(text, 'utf-8').toString('base64');
        return res.json({ success: true, data: { text, base64 } });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to encode text' });
    }
});

export default router;