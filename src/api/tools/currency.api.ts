import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CODE_RE = /^[A-Za-z]{3}$/;

interface RateData {
    base: string;
    rates: Record<string, number>;
    updatedAt: string;
}

async function fetchRates(base: string): Promise<RateData> {
    const { data } = await axios.get(`https://open.er-api.com/v6/latest/${base}`, {
        timeout: 30000,
        headers: { 'User-Agent': UA, 'Accept': 'application/json' }
    });
    if (data?.result !== 'success' || !data?.rates) throw new Error('Failed to fetch exchange rates.');
    return {
        base: String(data.base_code || base),
        rates: data.rates as Record<string, number>,
        updatedAt: String(data.time_last_update_utc || '')
    };
}

router.get('/', async (req, res) => {
    try {
        const from = (req.query.from as string || 'USD').trim().toUpperCase();
        const to = (req.query.to as string || 'IDR').trim().toUpperCase();
        const amountRaw = req.query.amount as string | undefined;
        const amount = amountRaw === undefined ? 1 : Number(amountRaw);
        if (!CODE_RE.test(from)) return res.status(400).json({ success: false, error: 'from must be a 3-letter currency code' });
        if (!CODE_RE.test(to)) return res.status(400).json({ success: false, error: 'to must be a 3-letter currency code' });
        if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ success: false, error: 'amount must be a non-negative number' });
        const { base, rates, updatedAt } = await fetchRates(from);
        const rate = rates[to];
        if (rate === undefined) return res.status(404).json({ success: false, error: `Unknown currency code: ${to}` });
        return res.json({
            success: true,
            data: {
                from: base,
                to,
                amount,
                rate,
                result: Number((amount * rate).toFixed(6)),
                updatedAt
            }
        });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to convert currency' });
    }
});

export default router;