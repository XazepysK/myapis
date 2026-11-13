import { Router } from 'express';
import axios, { createClient } from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
const PIN_PATTERNS = [
    /^https?:\/\/(?:[\w-]+\.)?pinterest\.[\w.]+\/pin\/[\w.-]+/,
    /^https?:\/\/pin\.it\/[\w.-]+/,
    /^https?:\/\/(?:[\w-]+\.)?pinterest\.[\w.]+\/pin\/[\d]+(?:\/)?/
];

class Pinterest {
    private client: any;
    private cookies = '';

    constructor() {
        this.client = createClient({
            baseURL: 'https://www.pinterest.com',
            headers: {
                'accept': 'application/json, text/javascript, */*, q=0.01',
                'referer': 'https://www.pinterest.com/',
                'user-agent': UA,
                'x-app-version': 'f1222d7',
                'x-pinterest-appstate': 'active',
                'x-pinterest-pws-handler': 'www/[username]/[slug].js',
                'x-pinterest-source-url': '/search/pins/?rs=typed&q=xxx/',
                'x-requested-with': 'XMLHttpRequest'
            }
        });
        this.client.interceptors.response.use((response: any) => {
            const setCookie = response.headers['set-cookie'];
            if (setCookie) {
                this.cookies = setCookie.map((c: string) => c.split(';')[0].trim()).join('; ');
                this.client.defaults.headers.cookie = this.cookies;
            }
            return response;
        }, (error: any) => Promise.reject(error));
    }

    isUrl(value: string): boolean {
        try { new URL(value); return true; } catch { return false; }
    }

    private isPin(url: string): boolean {
        const clean = url.trim().toLowerCase();
        return PIN_PATTERNS.some(pattern => pattern.test(clean));
    }

    private async followRedirects(url: string, maxRedirects = 2): Promise<string> {
        let current = url;
        for (let i = 0; i < maxRedirects; i++) {
            try {
                const response = await axios.head(current, {
                    maxRedirects: 0,
                    validateStatus: (status: number) => status < 400,
                    timeout: 10000
                });
                if (response.status >= 300 && response.headers.location) {
                    const location = response.headers.location;
                    current = location.startsWith('http') ? location : new URL(location, new URL(url).origin).href;
                } else break;
            } catch (error: any) {
                const location = error.response?.headers?.location;
                if (location) current = location;
                break;
            }
        }
        return current;
    }

    private async initCookies(): Promise<boolean> {
        try { await this.client.get('/'); return true; } catch { return false; }
    }

    async download(pinUrl: string): Promise<any> {
        const finalUrl = await this.followRedirects(pinUrl, 2);
        if (!this.isPin(finalUrl)) throw new Error('This is not a valid Pinterest link.');

        const pinId = finalUrl.split('/pin/')[1]?.split('/')[0]?.split('?')[0];
        if (!pinId) throw new Error('Could not extract pin ID from URL.');

        if (!this.cookies && !(await this.initCookies())) throw new Error('Failed to retrieve cookies.');

        const { data } = await this.client.get('/resource/PinResource/get/', {
            params: {
                source_url: `/pin/${pinId}/`,
                data: JSON.stringify({ options: { field_set_key: 'detailed', id: pinId }, context: {} }),
                _: Date.now()
            }
        });

        const pd = data?.resource_response?.data;
        if (!pd) throw new Error('Pin not found.');

        const media: any[] = [];
        if (pd.videos?.video_list) {
            const key = Object.keys(pd.videos.video_list)[0];
            const video = pd.videos.video_list[key];
            let videoUrl = video?.url;
            if (videoUrl && key.includes('HLS') && videoUrl.includes('m3u8')) {
                videoUrl = videoUrl.replace('hls', '720p').replace('m3u8', 'mp4');
            }
            media.push({
                type: 'video',
                quality: `${video.width}x${video.height}`,
                width: video.width,
                height: video.height,
                duration: pd.videos.duration || null,
                url: videoUrl,
                file_size: video.file_size || null,
                thumbnail: video.thumbnail || pd.images?.orig?.url
            });
        }

        if (pd.embed?.type === 'gif' && pd.embed?.src) {
            media.push({
                type: 'gif',
                quality: 'original',
                width: pd.embed.width || pd.images?.orig?.width,
                height: pd.embed.height || pd.images?.orig?.height,
                url: pd.embed.src,
                file_size: null,
                thumbnail: pd.images?.orig?.url
            });
        }

        if (pd.images) {
            const variants: Record<string, any> = {
                original: pd.images.orig,
                large: pd.images['736x'],
                medium: pd.images['474x'],
                small: pd.images['236x'],
                thumbnail: pd.images['170x']
            };
            for (const [quality, image] of Object.entries(variants)) {
                if (image) media.push({ type: 'image', quality, width: image.width, height: image.height, url: image.url, size: `${image.width}x${image.height}` });
            }
        }

        if (!media.length) throw new Error('No media found for this pin.');
        return {
            id: pd.id,
            title: pd.title || pd.grid_title || '',
            description: pd.description || '',
            created_at: pd.created_at,
            original_url: pinUrl,
            final_url: finalUrl,
            media_urls: media
        };
    }
}

const pinterest = new Pinterest();

router.get('/', async (req, res) => {
    try {
        const url = (req.query.url as string || '').trim();
        if (!url) return res.status(400).json({ success: false, error: 'Query ?url= is required' });
        if (!pinterest.isUrl(url)) return res.status(400).json({ success: false, error: 'This is not a valid URL.' });
        const result = await pinterest.download(url);
        return res.json({ success: true, data: result });
    } catch (err: any) {
        return res.status(502).json({ success: false, error: err.message || 'Failed to scrape Pinterest media' });
    }
});

export default router;