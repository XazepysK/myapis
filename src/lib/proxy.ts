import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

export interface ProxyEntry {
    url: string;
    fails: number;
    cooldownUntil: number;
    lastOk: number;
}

const LIST_SOURCES = [
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
    'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt'
];
const CHECK_URL = 'https://api.ipify.org?format=json';
const CHECK_TIMEOUT = 6000;
const SAMPLE_SIZE = 60;
const MAX_POOL = 25;
const CONCURRENCY = 20;
const REFRESH_MS = 8 * 60 * 1000;
const REFRESH_GUARD_MS = 30000;
const COOLDOWN_MS = 90 * 1000;
const MAX_FAILS = 3;
const IP_RE = /^\d{1,3}(?:\.\d{1,3}){3}:\d{2,5}$/;

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

class ProxyPool {
    private working: ProxyEntry[] = [];
    private refreshing = false;
    private started = false;
    private cursor = 0;

    start(): void {
        if (this.started) return;
        this.started = true;
        void this.refresh();
        const timer = setInterval(() => void this.refresh(), REFRESH_MS);
        timer.unref?.();
    }

    private async fetchList(): Promise<string[]> {
        for (const source of LIST_SOURCES) {
            try {
                const { data } = await axios.get(source, {
                    timeout: 15000,
                    responseType: 'text',
                    transformResponse: [(value) => value]
                });
                const lines = String(data).split('\n').map((l) => l.trim()).filter((l) => IP_RE.test(l));
                if (lines.length) return lines;
            } catch {
                continue;
            }
        }
        return [];
    }

    private async check(proxyUrl: string): Promise<boolean> {
        const agent = new HttpsProxyAgent(proxyUrl);
        try {
            const res = await axios.get(CHECK_URL, {
                httpsAgent: agent,
                proxy: false,
                timeout: CHECK_TIMEOUT,
                signal: AbortSignal.timeout(CHECK_TIMEOUT + 500),
                responseType: 'text',
                transformResponse: [(value) => value]
            });
            return res.status === 200;
        } catch {
            return false;
        } finally {
            agent.destroy();
        }
    }

    async refresh(): Promise<void> {
        if (this.refreshing) return;
        this.refreshing = true;
        try {
            const list = await this.fetchList();
            if (!list.length) return;
            const queue = shuffle(list).slice(0, SAMPLE_SIZE);
            const found: ProxyEntry[] = [];
            const workers = Array.from({ length: CONCURRENCY }, async () => {
                while (queue.length && found.length < MAX_POOL) {
                    const raw = queue.shift();
                    if (!raw) break;
                    const url = 'http://' + raw;
                    if (await this.check(url)) {
                        found.push({ url, fails: 0, cooldownUntil: 0, lastOk: Date.now() });
                    }
                }
            });
            await Promise.race([
                Promise.all(workers),
                new Promise((resolve) => setTimeout(resolve, REFRESH_GUARD_MS))
            ]);
            if (found.length) {
                this.working = found;
                this.cursor = 0;
                console.log(`[proxy] ${found.length} working proxies loaded`);
            }
        } finally {
            this.refreshing = false;
        }
    }

    next(exclude: Set<string> = new Set()): string | null {
        const now = Date.now();
        const usable = this.working.filter((p) => p.cooldownUntil <= now && !exclude.has(p.url));
        if (!usable.length) return null;
        usable.sort((a, b) => a.fails - b.fails || b.lastOk - a.lastOk);
        const pick = usable[this.cursor % usable.length];
        this.cursor++;
        return pick.url;
    }

    markOk(url: string): void {
        const p = this.working.find((x) => x.url === url);
        if (p) {
            p.fails = 0;
            p.lastOk = Date.now();
            p.cooldownUntil = 0;
        }
    }

    markFail(url: string): void {
        const p = this.working.find((x) => x.url === url);
        if (!p) return;
        p.fails++;
        p.cooldownUntil = Date.now() + COOLDOWN_MS;
        if (p.fails >= MAX_FAILS) this.working = this.working.filter((x) => x.url !== url);
    }

    stats(): { total: number; available: number } {
        const now = Date.now();
        return {
            total: this.working.length,
            available: this.working.filter((p) => p.cooldownUntil <= now).length
        };
    }
}

export const proxyPool = new ProxyPool();