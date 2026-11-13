import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'thesync-api/1.0';

async function generateQr(text: string, size: number): Promise<{ buffer: Buffer; contentType: string }> {
    const { data, headers } = await axios.get('https://api.qrserver.com/v1/create-qr-code/', {
        params: { size: `${size}x${size}`, data: text, format: 'png', margin: 2, ecc: 'H' },
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: { 'User-Agent': UA }
    });
    return { buffer: Buffer.from(data), contentType: String(headers['content-type'] || 'image/png') };
}

router.get('/', async (req, res) => {
    try {
        const text = (req.query.text as string || '').trim();
        if (!text) return res.status(400).json({ success: false, error: 'Query ?text= is required' });
        if (text.length > 2000) return res.status(400).json({ success: false, error: 'text must be 2000 characters or fewer' });
        const sizeRaw = req.query.size as string | undefined;
        const size = sizeRaw ? Number(sizeRaw) : 300;
        if (!Number.isInteger(size) || size < 100 || size > 1000) return res.status(400).json({ success: false, error: 'size must be an integer between 100 and 1000' });
        const { buffer, contentType } = await generateQr(text, size);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(buffer);
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to generate QR code' });
    }
});

export default router;