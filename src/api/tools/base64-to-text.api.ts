import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const base64 = (req.query.base64 as string || '').trim();
        if (!base64) return res.status(400).json({ success: false, error: 'Query ?base64= is required' });
        if (base64.length > 20000) return res.status(400).json({ success: false, error: 'base64 must be 20000 characters or fewer' });
        const text = Buffer.from(base64, 'base64').toString('utf-8');
        return res.json({ success: true, data: { base64, text } });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to decode base64' });
    }
});

export default router;