import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const WILAYAH_URL = 'https://raw.githubusercontent.com/kodewilayah/permendagri-72-2019/main/dist/base.csv';
const BMKG_URL = 'https://api.bmkg.go.id/publik/prakiraan-cuaca';

function bmkgUrl(code: string): string {
    const dots = (code.match(/\./g) || []).length;
    return `${BMKG_URL}?adm${dots + 1}=${code}`;
}

function similarity(query: string, target: string): number {
    const queryWords = query.toLowerCase().split(' ').filter((w) => w.length > 0);
    const targetWords = target.toLowerCase().split(' ').filter((w) => w.length > 0);
    if (!queryWords.length || !targetWords.length) return 0;
    let wordScore = 0;
    let exactBonus = 0;
    for (const queryWord of queryWords) {
        let best = 0;
        for (const targetWord of targetWords) {
            if (queryWord === targetWord) {
                best = 1;
                exactBonus += 0.2;
                break;
            }
            if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) {
                const partial = Math.min(queryWord.length, targetWord.length) / Math.max(queryWord.length, targetWord.length);
                best = Math.max(best, partial);
            }
        }
        wordScore += best;
    }
    return wordScore / queryWords.length + exactBonus;
}

async function searchWilayah(query: string): Promise<any[]> {
    const { data } = await axios.get(WILAYAH_URL, {
        timeout: 30000,
        responseType: 'text',
        transformResponse: [(value) => value],
        headers: { 'User-Agent': UA }
    });
    const rows = String(data).split('\n');
    const results: any[] = [];
    const threshold = query.length <= 4 ? 0.4 : 0.3;
    for (const row of rows) {
        if (!row.trim()) continue;
        const [kode, nama] = row.split(',');
        if (!kode || !nama) continue;
        const score = similarity(query, nama);
        if (score > threshold) results.push({ kode, nama, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 10);
}

async function getWeather(code: string): Promise<any> {
    const { data } = await axios.get(bmkgUrl(code), { timeout: 30000, headers: { 'User-Agent': UA } });
    return data?.data ?? data;
}

router.get('/', async (req, res) => {
    try {
        const q = (req.query.q as string || req.query.query as string || '').trim();
        if (!q) return res.status(400).json({ success: false, error: 'Query ?q= is required' });
        if (q.length > 100) return res.status(400).json({ success: false, error: 'q must be 100 characters or fewer' });
        const matches = await searchWilayah(q);
        if (!matches.length) return res.status(404).json({ success: false, error: 'No matching region found' });
        const wilayah = matches[0];
        const weather = await getWeather(wilayah.kode);
        return res.json({ success: true, data: { wilayah, matches, weather } });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to fetch weather data' });
    }
});

export default router;