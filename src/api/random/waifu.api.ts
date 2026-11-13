import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'thesync-api/1.0';

async function fetchWaifu(): Promise<{ buffer: Buffer; contentType: string }> {
    const { data } = await axios.get('https://nekos.best/api/v2/waifu', { timeout: 30000, headers: { 'User-Agent': UA } });
    const imageUrl = data?.results?.[0]?.url;
    if (!imageUrl) throw new Error('Image URL not found in response.');
    const image = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000, headers: { 'User-Agent': UA } });
    return { buffer: Buffer.from(image.data), contentType: String(image.headers['content-type'] || 'image/png') };
}

router.get('/', async (req, res) => {
    try {
        const { buffer, contentType } = await fetchWaifu();
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(buffer);
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to fetch random waifu image' });
    }
});

export default router;