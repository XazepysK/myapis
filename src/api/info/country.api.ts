import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const COORDS_URL = 'https://raw.githubusercontent.com/CoderPopCat/Country-Searcher/refs/heads/master/src/constants/country-coords.json';
const COUNTRIES_URL = 'https://raw.githubusercontent.com/CoderPopCat/Country-Searcher/refs/heads/master/src/constants/countries.json';
const CONTINENTS: Record<string, string> = {
    as: 'Asia',
    eu: 'Europe',
    af: 'Africa',
    na: 'North America',
    sa: 'South America',
    oc: 'Oceania',
    an: 'Antarctica'
};

function similarity(a: string, b: string): number {
    const s1 = a.toLowerCase().replace(/\s+/g, '');
    const s2 = b.toLowerCase().replace(/\s+/g, '');
    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;
    if (s2.includes(s1) || s1.includes(s2)) return 0.9;
    const maxLen = Math.max(s1.length, s2.length);
    let matches = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
        if (s1[i] === s2[i]) matches++;
    }
    const prefix = s1.startsWith(s2.slice(0, 3)) || s2.startsWith(s1.slice(0, 3)) ? 0.2 : 0;
    return matches / maxLen + prefix;
}

async function countryInfo(name: string): Promise<any> {
    const [coordsRes, countriesRes] = await Promise.all([
        axios.get(COORDS_URL, { timeout: 30000 }),
        axios.get(COUNTRIES_URL, { timeout: 30000 })
    ]);
    const coords = coordsRes.data;
    const countries = countriesRes.data;
    const search = name.toLowerCase().trim();
    const ranked = countries
        .map((country: any) => ({ country, score: similarity(search, country.country) }))
        .sort((a: any, b: any) => b.score - a.score);
    const best = ranked[0];
    if (!best || best.score < 0.4) {
        const err: any = new Error('Country not found');
        err.status = 404;
        err.suggestions = ranked.slice(0, 5).map((r: any) => ({ country: r.country.country, similarity: r.score }));
        throw err;
    }
    const info = best.country;
    const coord = coords.find((c: any) => c.name.toLowerCase() === info.country.toLowerCase());
    const neighbors = (info.neighbors || [])
        .map((code: string) => {
            const n = coords.find((c: any) => c.country.toLowerCase() === code.toLowerCase());
            return n ? { name: n.name, flag: n.icon, coordinates: { latitude: n.latitude, longitude: n.longitude } } : null;
        })
        .filter((n: any) => n !== null);
    return {
        searchMetadata: { originalQuery: name, matchedCountry: info.country, similarity: best.score },
        data: {
            name: info.country,
            capital: info.capital,
            flag: info.flag,
            phoneCode: info.phone_code,
            googleMapsLink: `https://www.google.com/maps/place/$$${info.country}/@${coord?.latitude || 0},${coord?.longitude || 0},6z`,
            continent: { code: info.continent, name: CONTINENTS[info.continent] || 'Unknown' },
            coordinates: { latitude: coord?.latitude ?? null, longitude: coord?.longitude ?? null },
            area: { squareKilometers: info.area?.km2, squareMiles: info.area?.mi2 },
            landlocked: info.is_landlocked,
            languages: { native: info.native_language, codes: info.language_codes },
            famousFor: info.famous_for,
            constitutionalForm: info.constitutional_form,
            neighbors,
            currency: info.currency,
            drivingSide: info.drive_direction,
            alcoholProhibition: info.alcohol_prohibition,
            internetTLD: info.tld,
            isoCode: { numeric: info.iso?.numeric, alpha2: info.iso?.alpha_2, alpha3: info.iso?.alpha_3 }
        }
    };
}

router.get('/', async (req, res) => {
    try {
        const name = (req.query.name as string || req.query.q as string || '').trim();
        if (!name) return res.status(400).json({ success: false, error: 'Query ?name= is required' });
        if (name.length > 100) return res.status(400).json({ success: false, error: 'name must be 100 characters or fewer' });
        const result = await countryInfo(name);
        return res.json({ success: true, data: result.data, searchMetadata: result.searchMetadata });
    } catch (err: any) {
        if (err.status === 404) return res.status(404).json({ success: false, error: err.message, suggestions: err.suggestions });
        return res.status(502).json({ success: false, error: err.message || 'Failed to fetch country info' });
    }
});

export default router;