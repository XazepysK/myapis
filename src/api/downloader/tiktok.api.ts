import { Router } from 'express';
import fs from 'node:fs';
import FormData from 'form-data';
import http from '../../lib/http.js';

const router = Router();
const BASE_URL = 'https://ssstiktok.me';
const ENDPOINT = `${BASE_URL}/api/download`;

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': `${BASE_URL}/`,
    'Origin': BASE_URL,
    'Accept': 'application/json, text/plain, */*'
};

interface DownloadItem {
    url: string;
    filename: string;
}

interface ScrapeResult {
    success: boolean;
    type: string;
    title: string;
    uploader: string;
    thumbnail: string;
    stats: { views: number; likes: number; comments: number };
    hdDetails: { resolution: number; codec: string; sizeBytes: number } | null;
    downloads: {
        videoHd: DownloadItem;
        videoCdn: DownloadItem;
        audioMp3: DownloadItem;
        images: DownloadItem[];
    };
}

async function scrapeSSSTikTok(url: string): Promise<ScrapeResult> {
    if (!url || typeof url !== 'string') {
        throw new Error('A valid TikTok URL must be supplied.');
    }

    const form = new FormData();
    form.append('url', url.trim());

    const { data: payload } = await http.post(ENDPOINT, form, {
        headers: { ...DEFAULT_HEADERS, ...form.getHeaders() }
    });

    if (!payload?.success || !payload?.data) {
        const errorMsg = payload?.error || 'Upstream returned an error';
        throw new Error(errorMsg);
    }

    const data = payload.data;
    const downloadId = data.download_id;
    const safeTitle = (data.uploader || 'video').replace(/[^a-zA-Z0-9_-]/g, '_');
    const baseFilename = `SSSTikTok-${safeTitle}-${downloadId || Date.now()}`;

    const images: DownloadItem[] = [];
    if (Array.isArray(data.images)) {
        data.images.forEach((imgUrl: string, idx: number) => {
            images.push({
                url: imgUrl,
                filename: `${baseFilename}-img${idx + 1}.jpg`
            });
        });
    }

    return {
        success: true,
        type: data.type || 'video',
        title: data.title || '',
        uploader: data.uploader || '',
        thumbnail: data.thumbnail || '',
        stats: {
            views: data.views || 0,
            likes: data.likes || 0,
            comments: data.comments || 0
        },
        hdDetails: data.hd_choice ? {
            resolution: data.hd_choice.res || 0,
            codec: data.hd_choice.codec || '',
            sizeBytes: data.hd_choice.size || 0
        } : null,
        downloads: {
            videoHd: {
                url: `${BASE_URL}/download-file?type=mp4hd&id=${downloadId}`,
                filename: `${baseFilename}-HD.mp4`
            },
            videoCdn: data.cdn_mp4 ? {
                url: data.cdn_mp4,
                filename: `${baseFilename}.mp4`
            } : {
                url: `${BASE_URL}/download-file?type=mp4&id=${downloadId}`,
                filename: `${baseFilename}.mp4`
            },
            audioMp3: {
                url: `${BASE_URL}/download-file?type=mp3&id=${downloadId}`,
                filename: `${baseFilename}.mp3`
            },
            images
        }
    };
}

async function downloadMedia(mediaUrl: string, outputPath: string): Promise<string> {
    const { data } = await http.get(mediaUrl, { headers: DEFAULT_HEADERS, responseType: 'arraybuffer' });
    await fs.promises.writeFile(outputPath, Buffer.from(data));
    return outputPath;
}

async function downloadBuffer(mediaUrl: string): Promise<Buffer> {
    const { data } = await http.get(mediaUrl, { headers: DEFAULT_HEADERS, responseType: 'arraybuffer' });
    return Buffer.from(data);
}

router.get('/', async (req, res) => {
    try {
        const url = req.query.url as string;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Query ?url= is required'
            });
        }

        const info = await scrapeSSSTikTok(url);
        return res.json(info);
    } catch (err: any) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to scrape'
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const url = req.query.url as string;
        const type = (req.query.type as string) || 'mp4';

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'url is required'
            });
        }

        const info = await scrapeSSSTikTok(url);

        let target = info.downloads.videoCdn;
        let contentType = 'video/mp4';

        if (type === 'hd') {
            target = info.downloads.videoHd;
        } else if (type === 'mp3') {
            target = info.downloads.audioMp3;
            contentType = 'audio/mpeg';
        }

        const buffer = await downloadBuffer(target.url);

        res.setHeader('Content-Disposition', `attachment; filename="${target.filename}"`);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', String(buffer.length));
        return res.send(buffer);
    } catch (err: any) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to download'
        });
    }
});

export { scrapeSSSTikTok, downloadMedia };
export default router;