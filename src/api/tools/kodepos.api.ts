import { Router } from 'express';
import axios from '../../lib/http.js';
import * as cheerio from 'cheerio';

const router = Router();
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

interface KodeposResult {
    kodepos: string;
    desa: string;
    kecamatan: string;
    kota: string;
    provinsi: string;
}

async function scrapeKodepos(query: string): Promise<KodeposResult[]> {
    const { data: html } = await axios.post(
        'https://kodepos.posindonesia.co.id/CariKodepos',
        new URLSearchParams({ kodepos: query }).toString(),
        {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Origin': 'https://kodepos.posindonesia.co.id',
                'Referer': 'https://kodepos.posindonesia.co.id/',
                'User-Agent': UA
            }
        }
    );

    const $ = cheerio.load(String(html));
    const results: KodeposResult[] = [];
    $('tbody > tr').each((_, el) => {
        const td = $(el).find('td');
        const kodepos = td.eq(1).text().trim();
        if (!kodepos) return;
        results.push({
            kodepos,
            desa: td.eq(2).text().trim(),
            kecamatan: td.eq(3).text().trim(),
            kota: td.eq(4).text().trim(),
            provinsi: td.eq(5).text().trim()
        });
    });
    return results;
}

router.get('/', async (req, res) => {
    try {
        const query = (req.query.q as string || req.query.form as string || '').trim();
        if (!query) return res.status(400).json({ success: false, error: 'Query ?q= is required' });
        if (query.length > 100) return res.status(400).json({ success: false, error: 'q must be 100 characters or fewer' });
        const results = await scrapeKodepos(query);
        if (!results.length) return res.status(404).json({ success: false, error: 'No postal code found for the given location' });
        return res.json({ success: true, data: results });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to search postal code' });
    }
});

export default router;