import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE_SHAKEMAP_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/';
const SOURCES = {
    auto: `${BASE_SHAKEMAP_URL}autogempa.json`,
    terkini: `${BASE_SHAKEMAP_URL}gempaterkini.json`,
    dirasakan: `${BASE_SHAKEMAP_URL}gempadirasakan.json`
};

async function fetchJson(url: string): Promise<any> {
    const { data } = await axios.get(url, {
        timeout: 30000,
        responseType: 'text',
        transformResponse: [(value) => value],
        headers: { 'User-Agent': UA }
    });
    const clean = String(data).replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    return JSON.parse(clean);
}

function addShakemap(gempa: any): any {
    if (!gempa || !gempa.Shakemap) return gempa;
    return { ...gempa, downloadShakemap: `${BASE_SHAKEMAP_URL}${gempa.Shakemap}` };
}

function withShakemap(data: any): any {
    const gempa = data?.Infogempa?.gempa;
    if (!gempa) return data;
    const mapped = Array.isArray(gempa) ? gempa.map(addShakemap) : addShakemap(gempa);
    return { ...data, Infogempa: { ...data.Infogempa, gempa: mapped } };
}

async function scrapeBMKG(): Promise<any> {
    const [auto, terkini, dirasakan] = await Promise.all([
        fetchJson(SOURCES.auto),
        fetchJson(SOURCES.terkini),
        fetchJson(SOURCES.dirasakan)
    ]);
    return { auto: withShakemap(auto), terkini: withShakemap(terkini), dirasakan: withShakemap(dirasakan) };
}

router.get('/', async (req, res) => {
    try {
        const data = await scrapeBMKG();
        return res.json({ success: true, data });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to fetch BMKG earthquake data' });
    }
});

export default router;