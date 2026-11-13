import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function npmInfo(packageName: string): Promise<any> {
    const { data } = await axios.get(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
        timeout: 30000,
        headers: { 'User-Agent': UA }
    });
    const versions = data.versions || {};
    const allver = Object.keys(versions);
    if (!allver.length) throw new Error('No published versions found.');
    const verLatest = data['dist-tags']?.latest || allver[allver.length - 1];
    const verPublish = allver[0];
    const packageLatest = versions[verLatest] || {};
    return {
        name: data.name || packageName,
        description: data.description || '',
        versionLatest: verLatest,
        versionPublish: verPublish,
        versionUpdate: allver.length,
        latestDependencies: Object.keys(packageLatest.dependencies || {}).length,
        publishDependencies: Object.keys(versions[verPublish]?.dependencies || {}).length,
        publishTime: data.time?.created || null,
        latestPublishTime: data.time?.[verLatest] || null,
        homepage: data.homepage || null,
        license: data.license || null
    };
}

router.get('/', async (req, res) => {
    try {
        const packageName = (req.query.packageName as string || req.query.name as string || '').trim();
        if (!packageName) return res.status(400).json({ success: false, error: 'Query ?packageName= is required' });
        if (packageName.length > 255) return res.status(400).json({ success: false, error: 'packageName must be 255 characters or fewer' });
        const data = await npmInfo(packageName);
        return res.json({ success: true, data });
    } catch (err: any) {
        if (err.response?.status === 404) return res.status(404).json({ success: false, error: 'Package not found' });
        return res.status(502).json({ success: false, error: err.message || 'Failed to fetch npm package info' });
    }
});

export default router;