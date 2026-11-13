import fs from 'node:fs';
import crypto from 'node:crypto';
import { Router } from 'express';
import http from '../../lib/http.js';
const router = Router();

const SITE_URL = 'https://www.snapgram.io/';
const API_BASE = 'https://api.sssgram.com';
const SOLVER_ENDPOINT = 'https://insartis.insjay.biz.id/v1/solve';
const TURNSTILE_SITEKEY = '0x4AAAAAAFIiskADhxSmiNXx';
const TURNSTILE_ACTION = 'media_download';
const DEFAULT_API_KEY = 'ins_live_nGUjfvYRKPbjnPWDr6LOrkcCgF-5p-RjhpikpHud';
const RSA_PUBLIC_KEY =
   '-----BEGIN PUBLIC KEY-----\n' +
   'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDCAdf/EyIbLBxjGqmh7qLU6/CP\n' +
   'Czru+75+82OSPZ+nf4BFvg88drpZ6KigNW0J8TNgxe6Yms1irCZNVDyu+RXsl4y/\n' +
   '7c2KOHc4OGTzHB5fUMiMasFUvcEs2P70e6yA/sKHZfBLG1XPhlb84Ibs3nhD3W5e\n' +
   '2SuC+4EuVkaqzN08LQIDAQAB\n' +
   '-----END PUBLIC KEY-----';
const USER_AGENTS: any = {
   android:
      'Mozilla/5.0 (Linux; Android 12; CPH2043) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
   desktop:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
   macos:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
   ios:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
};
const DEFAULT_USER_AGENT = USER_AGENTS.android;
function getClientHints(ua: string = DEFAULT_USER_AGENT) {
   const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
   const hints: any = {
      'sec-ch-ua-mobile': isMobile ? '?1' : '?0'
   };

   if (/Android/i.test(ua)) {
      hints['sec-ch-ua-platform'] = '"Android"';
      const match = ua.match(/Chrome\/(\d+)/i);
      const ver = match ? match[1] : '112';
      hints['sec-ch-ua'] = `"Not:A-Brand";v="99", "Chromium";v="${ver}"`;
   } else if (/Windows/i.test(ua)) {
      hints['sec-ch-ua-platform'] = '"Windows"';
      const match = ua.match(/Chrome\/(\d+)/i);
      const ver = match ? match[1] : '130';
      hints['sec-ch-ua'] = `"Chromium";v="${ver}", "Google Chrome";v="${ver}", "Not?A_Brand";v="99"`;
   } else if (/Macintosh|Mac OS X/i.test(ua)) {
      hints['sec-ch-ua-platform'] = '"macOS"';
      if (/Chrome/i.test(ua)) {
         const match = ua.match(/Chrome\/(\d+)/i);
         const ver = match ? match[1] : '130';
         hints['sec-ch-ua'] = `"Chromium";v="${ver}", "Google Chrome";v="${ver}", "Not?A_Brand";v="99"`;
      }
   } else if (/Linux/i.test(ua)) {
      hints['sec-ch-ua-platform'] = '"Linux"';
      const match = ua.match(/Chrome\/(\d+)/i);
      const ver = match ? match[1] : '130';
      hints['sec-ch-ua'] = `"Chromium";v="${ver}", "Google Chrome";v="${ver}", "Not?A_Brand";v="99"`;
   }

   return hints;
}

function encryptSecureMessage(timestamp: number | string): string {
   return crypto.publicEncrypt(
      {
         key: RSA_PUBLIC_KEY,
         padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(String(timestamp), 'utf8')
   ).toString('base64');
}

function generateSessionID(timestamp: number): string {
   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   let rand = '';
   for (let i = 0; i < 10; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
   }
   return `common_${rand}_${timestamp}`;
}

async function solveTurnstile(apiKey: string = DEFAULT_API_KEY, options: any = {}): Promise<string> {
   const params = new URLSearchParams({
      gate: 'turnstile',
      sitekey: options.sitekey || TURNSTILE_SITEKEY,
      url: options.siteUrl || SITE_URL,
      action: options.action || TURNSTILE_ACTION
   });

   const ua = options.userAgent || DEFAULT_USER_AGENT;

   const { data: json } = await http.post(SOLVER_ENDPOINT, params.toString(), {
      headers: {
         'Authorization': `Bearer ${apiKey}`,
         'Content-Type': 'application/x-www-form-urlencoded',
         'User-Agent': ua
      }
   });
   const token = json.token || json.result || json.data?.token || json.data?.result;

   if (!token) {
      throw new Error(json.message || 'Turnstile solver returned empty token.');
   }

   return token;
}

function resolveMediaUrl(uri: string): string {
   if (!uri) return '';
   if (/^https?:\/\//i.test(uri)) return uri;
   return `${API_BASE}/st-tik/token/${uri}`;
}

async function scrapeSnapgram(instagramUrl: string, options: any = {}): Promise<any> {
   if (!instagramUrl || typeof instagramUrl !== 'string') {
      throw new Error('A valid Instagram URL must be provided.');
   }

   const cleanUrl = instagramUrl.trim();
   const apiKey = options.apiKey || DEFAULT_API_KEY;
   const maxRetries = options.maxRetries || 3;

   const ua =
      options.userAgent ||
      (options.preset && USER_AGENTS[options.preset.toLowerCase()]) ||
      DEFAULT_USER_AGENT;
   const clientHints = getClientHints(ua);

   const isProfile = !/instagram\.com\/(p|tv|reel(s?)|stories|s)\//i.test(cleanUrl);
   const endpoint = isProfile
      ? `${API_BASE}/st-tik/ins/dlprofile`
      : `${API_BASE}/st-tik/ins/dl`;

   let lastError = null;

   for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
         const captchaToken = await solveTurnstile(apiKey, { userAgent: ua });

         const now = Date.now();
         const secureMessage = encryptSecureMessage(now);
         const sessionId = generateSessionID(now);

         const queryParams = new URLSearchParams({
            url: cleanUrl,
            sessionid: sessionId,
            hostname: 'www.snapgram.io'
         });

         const { data: payload } = await http.get(`${endpoint}?${queryParams.toString()}`, {
            headers: {
               'User-Agent': ua,
               'Accept': 'application/json, text/plain, */*',
               'Origin': 'https://www.snapgram.io',
               'Referer': 'https://www.snapgram.io/',
               'sec-fetch-dest': 'empty',
               'sec-fetch-mode': 'cors',
               'sec-fetch-site': 'cross-site',
               ...clientHints,
               'X-Secure-Message': secureMessage,
               's-time': String(now),
               'CF-Turnstile-Token': captchaToken
            }
         });

         if (payload.code === 400 && String(payload.msg).toLowerCase().includes('turnstile')) {
            lastError = new Error(`Attempt ${attempt}: Turnstile token rejected by upstream.`);
            continue;
         }

         if (payload.code !== 200 || !payload.result) {
            throw new Error(payload.msg || 'Snapgram API request failed.');
         }

         const result = payload.result;
         const mediaList = [];

         if (Array.isArray(result.insBos)) {
            for (const item of result.insBos) {
               const directCdn = item.originalUrl || item.originalThumb || '';
               const proxyUrl = resolveMediaUrl(item.url || item.sourceUri);
               const thumbUrl = item.originalCover || item.originalThumb || resolveMediaUrl(item.cover || item.thumbnail || item.thumb);

               mediaList.push({
                  id: item.id || item.pk || '',
                  type: item.type === 'mp4' || item.videoUrl || item.isVideo ? 'video' : 'image',
                  caption: item.desc || '',
                  thumbnail: thumbUrl,
                  downloadUrl: directCdn || proxyUrl,
                  proxyUrl
               });
            }
         }

         return {
            success: true,
            type: isProfile ? 'profile' : 'media',
            media: mediaList,
            raw: result
         };
      } catch (err) {
         lastError = err;
      }
   }

   throw lastError || new Error('Failed to scrape media after retries.');
}

async function downloadMedia(mediaUrl: string, outputPath: string, options: any = {}) {
   const ua = options.userAgent || DEFAULT_USER_AGENT;
   const clientHints = getClientHints(ua);

   const { data } = await http.get(mediaUrl, {
      responseType: 'arraybuffer',
      headers: {
         'User-Agent': ua,
         'Referer': 'https://www.snapgram.io/',
         ...clientHints
      }
   });

   await fs.promises.writeFile(outputPath, Buffer.from(data));
   return outputPath;
}

export {
   scrapeSnapgram,
   solveTurnstile,
   encryptSecureMessage,
   generateSessionID,
   downloadMedia,
   getClientHints,
   USER_AGENTS,
   DEFAULT_USER_AGENT
};

router.get('/', async (req, res) => {
    try {
        const url = req.query.url as string || req.body?.url as string;
        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'Query ?url= is required'
            });
        }
        const info: any = await scrapeSnapgram(url);
        const item = info.media?.[0];
        if (!item) {
            return res.status(404).json({
                success: false,
                error: 'Media not found'
            });
        }
        const mediaUrl = item.downloadUrl || item.proxyUrl;
        const { data: fileData } = await http.get(mediaUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(fileData);
        const ext = item.type === 'video' ? 'mp4' : 'jpg';
        const filename = `snapgram-${item.id || Date.now()}.${ext}`;
        const contentType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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

export default router;