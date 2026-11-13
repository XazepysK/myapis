import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { proxyPool } from './proxy.js';

const MAX_PROXY_TRIES = 3;
const PROXY_TIMEOUT_CAP = 12000;
const RETRY_STATUS = new Set([403, 407, 429, 502, 503]);

proxyPool.start();

function attachProxy(config: any, proxyUrl: string): void {
    if (config.__origTimeout === undefined) config.__origTimeout = config.timeout;
    config.__proxy = proxyUrl;
    config.__usedProxy = true;
    config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    config.httpAgent = new HttpProxyAgent(proxyUrl);
    config.proxy = false;
    config.timeout = Math.min(config.__origTimeout || 30000, PROXY_TIMEOUT_CAP);
}

function clearProxy(config: any): void {
    config.__proxy = null;
    config.__direct = true;
    delete config.httpsAgent;
    delete config.httpAgent;
    config.proxy = false;
    config.timeout = config.__origTimeout || 30000;
}

function wire(instance: AxiosInstance): AxiosInstance {
    instance.interceptors.request.use((config: any) => {
        config.proxy = false;
        if (config.__direct) return config;
        if (!config.httpsAgent && !config.httpAgent) {
            const proxy = proxyPool.next();
            if (proxy) attachProxy(config, proxy);
        }
        return config;
    });

    instance.interceptors.response.use(
        (response) => {
            const proxy = (response.config as any).__proxy;
            if (proxy) proxyPool.markOk(proxy);
            return response;
        },
        async (error: any) => {
            const config: any = error.config;
            if (!config) throw error;
            const status = error.response?.status;
            const retryable = !error.response || (status !== undefined && RETRY_STATUS.has(status));
            const proxy = config.__proxy;
            config.__tried = config.__tried || new Set();
            if (proxy) {
                proxyPool.markFail(proxy);
                config.__tried.add(proxy);
            }
            if (!retryable || !config.__usedProxy || config.__direct) throw error;
            config.__proxyAttempts = (config.__proxyAttempts || 0) + 1;
            if (config.__proxyAttempts < MAX_PROXY_TRIES) {
                const next = proxyPool.next(config.__tried);
                if (next) {
                    attachProxy(config, next);
                    return instance.request(config);
                }
            }
            clearProxy(config);
            return instance.request(config);
        }
    );

    return instance;
}

const http = wire(axios.create({ timeout: 30000 }));

export function createClient(config: AxiosRequestConfig = {}): AxiosInstance {
    return wire(axios.create(config));
}

export { proxyPool };
export default http;