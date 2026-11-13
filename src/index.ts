import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import 'dotenv/config';
import { loadConfig, publicMeta } from './config.js';
import { securityHeaders, errorHandler } from './security.js';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const config = loadConfig(path.join(rootDir, 'config.json'));

function requestOrigin(req: express.Request): string {
    const host = String(req.get('host') || '');
    const safeHost = /^[a-zA-Z0-9.-]+(?::\d{1,5})?$/.test(host) ? host : 'localhost:' + PORT;
    const proto = req.protocol === 'https' ? 'https' : 'http';
    return `${proto}://${safeHost}`;
}

function escapeXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function seoOrigin(req: express.Request): string {
    const configured = String(config.site.url || '').replace(/\/+$/, '');
    return configured || requestOrigin(req);
}

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(rootDir, 'public')));

app.get('/api/v1/meta', (req, res) => {
    res.json(publicMeta(config));
});

app.get('/robots.txt', (req, res) => {
    const origin = seoOrigin(req);
    res.type('text/plain').send([
        'User-agent: *',
        'Allow: /',
        'Disallow: /api/',
        '',
        `Sitemap: ${origin}/sitemap.xml`
    ].join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
    const origin = seoOrigin(req);
    const lastmod = new Date().toISOString().split('T')[0];
    const urls = [
        { loc: '/', priority: '1.0', changefreq: 'daily' },
        { loc: '/playground', priority: '0.9', changefreq: 'daily' },
        { loc: '/docs', priority: '0.9', changefreq: 'daily' },
        { loc: '/contributors', priority: '0.5', changefreq: 'monthly' }
    ];
    for (const category of config.categories) {
        urls.push({ loc: `/docs?cat=${category.name}`, priority: '0.8', changefreq: 'weekly' });
        for (const endpoint of category.endpoints) {
            urls.push({ loc: `/playground?ep=${category.name}/${endpoint.name}`, priority: '0.7', changefreq: 'weekly' });
        }
    }
    const body = urls.map((u) =>
        `  <url><loc>${escapeXml(origin + u.loc)}</loc><lastmod>${lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    ).join('\n');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
});

for (const category of config.categories) {
    for (const endpoint of category.endpoints) {
        const base = path.join(__dirname, 'api', category.name, endpoint.name + '.api');
        const file = fs.existsSync(base + '.ts') ? base + '.ts' : base + '.js';
        const mod = await import(pathToFileURL(file).href);
        const guard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
            const allowed = req.method === endpoint.method || (endpoint.method === 'GET' && req.method === 'HEAD');
            if (!allowed) return res.status(405).json({ success: false, error: 'Method not allowed, use ' + endpoint.method });
            next();
        };
        app.use(`/api/v1/${category.name}/${endpoint.name}`, guard, mod.default);
    }
}

app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.use((req, res) => {
    if (req.method === 'GET' && req.accepts('html')) {
        return res.sendFile(path.join(rootDir, 'public', 'index.html'));
    }
    res.status(404).json({ success: false, error: 'Not found' });
});

app.use(errorHandler);

app.listen(PORT);
console.log('Runned at localhost:' + PORT);