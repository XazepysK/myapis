import axios from '../../lib/http.js';
import { Router } from 'express';
import FormData from 'form-data';

const router = Router();
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36';

router.post('/', async (req, res) => {
  try {
    const image = req.body?.image || req.query?.image;
    if (!image) return res.status(400).json({ message: 'image is required' });

    const { data } = await axios.get(image, { responseType: 'arraybuffer', headers: { 'user-agent': UA }, timeout: 30000 });
    const buf = Buffer.from(data);
    const mime = buf[0] === 0x89 ? 'image/png' : 'image/jpeg';

    const { data: out } = await axios.post('https://background-remover.com/removeImageBackground', {
      encodedImage: `data:${mime};base64,${buf.toString('base64')}`,
      mimeType: mime,
      title: 'image.jpg',
    }, { headers: { origin: 'https://background-remover.com', referer: 'https://background-remover.com/upload', 'user-agent': UA }, timeout: 60000 });

    if (!out?.encodedImageWithoutBackground) throw new Error('failed to remove background');

    const b64 = out.encodedImageWithoutBackground.split(',')[1] || out.encodedImageWithoutBackground;
    const nobgBuf = Buffer.from(b64, 'base64');

    const form = new FormData();
    form.append('file', nobgBuf, { filename: 'nobg.png', contentType: 'image/png' });
    const { data: zass } = await axios.post('https://cdn.zass.in/upload', form, { headers: form.getHeaders(), timeout: 30000 });
    if (!zass?.url) throw new Error('upload failed');

    const { data: final, headers: h } = await axios.get(zass.url, { responseType: 'arraybuffer', headers: { 'user-agent': UA } });
    const contentType = (h as any)['content-type'] || 'image/png';
    res.set('Content-Type', contentType);
    res.send(Buffer.from(final));
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'error' });
  }
});

export default router;