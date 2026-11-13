import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const TYPES: Record<string, number> = {
    A: 1, AAAA: 28, CNAME: 5, MX: 15, NS: 2, TXT: 16, SOA: 6, CAA: 257, PTR: 12, SRV: 33
};
const TYPE_NAMES: Record<number, string> = Object.fromEntries(
    Object.entries(TYPES).map(([name, code]) => [code, name])
);

interface DnsRecord {
    name: string;
    type: string;
    ttl: number;
    data: string;
}

async function resolveDns(domain: string, type: string): Promise<{ status: number; records: DnsRecord[] }> {
    const { data } = await axios.get('https://dns.google/resolve', {
        params: { name: domain, type: TYPES[type] },
        timeout: 30000,
        headers: { 'User-Agent': UA, 'Accept': 'application/dns-json' }
    });
    const answers = Array.isArray(data?.Answer) ? data.Answer : [];
    const records: DnsRecord[] = answers.map((entry: any) => ({
        name: String(entry.name || '').replace(/\.$/, ''),
        type: TYPE_NAMES[entry.type] || String(entry.type),
        ttl: Number(entry.TTL) || 0,
        data: String(entry.data || '')
    }));
    return { status: Number(data?.Status) || 0, records };
}

router.get('/', async (req, res) => {
    try {
        const domain = (req.query.domain as string || '').trim().toLowerCase();
        const type = (req.query.type as string || 'A').trim().toUpperCase();
        if (!domain) return res.status(400).json({ success: false, error: 'Query ?domain= is required' });
        if (!DOMAIN_RE.test(domain)) return res.status(400).json({ success: false, error: 'Invalid domain format' });
        if (!TYPES[type]) return res.status(400).json({ success: false, error: `type must be one of: ${Object.keys(TYPES).join(', ')}` });
        const { status, records } = await resolveDns(domain, type);
        if (status === 3) return res.status(404).json({ success: false, error: 'Domain does not exist (NXDOMAIN)' });
        if (!records.length) return res.status(404).json({ success: false, error: `No ${type} records found for ${domain}` });
        return res.json({ success: true, data: { domain, type, records } });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to resolve DNS records' });
    }
});

export default router;