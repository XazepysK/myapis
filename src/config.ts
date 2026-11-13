import fs from 'node:fs';

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export interface Param {
    name: string;
    in: 'query' | 'body';
    type: string;
    required?: boolean;
    default?: string;
    options?: string[];
    placeholder?: string;
    description?: string;
}

export interface Endpoint {
    name: string;
    method: string;
    description: string;
    response: 'json' | 'binary';
    tags?: string[];
    exampleResponse?: unknown;
    params: Param[];
}

export interface Category {
    name: string;
    label: string;
    description: string;
    icon: string;
    tags?: string[];
    endpoints: Endpoint[];
}

export interface Contributor {
    name: string;
    role: string;
    url: string;
}

export interface Config {
    site: {
        name: string;
        tagline: string;
        version: string;
        url: string;
        tags: string[];
        repo: string;
        donate: string;
        contributors: Contributor[];
    };
    categories: Category[];
}

export function loadConfig(file: string): Config {
    const config = JSON.parse(fs.readFileSync(file, 'utf8')) as Config;
    for (const category of config.categories) {
        if (!NAME_RE.test(category.name)) throw new Error('Invalid category name: ' + category.name);
        for (const endpoint of category.endpoints) {
            if (!NAME_RE.test(endpoint.name)) throw new Error('Invalid endpoint name: ' + endpoint.name);
            if (!METHODS.includes(endpoint.method)) throw new Error('Invalid method: ' + endpoint.method);
        }
    }
    return config;
}

export function publicMeta(config: Config) {
    return {
        site: {
            name: config.site.name,
            tagline: config.site.tagline,
            version: config.site.version,
            url: config.site.url,
            tags: config.site.tags || [],
            repo: config.site.repo,
            donate: config.site.donate,
            contributors: config.site.contributors.map(c => ({ name: c.name, role: c.role, url: c.url }))
        },
        categories: config.categories.map(c => ({
            name: c.name,
            label: c.label,
            description: c.description,
            icon: c.icon,
            tags: c.tags || [],
            endpoints: c.endpoints.map(e => ({
                name: e.name,
                method: e.method,
                description: e.description,
                response: e.response,
                tags: e.tags || [],
                exampleResponse: e.exampleResponse,
                params: e.params.map(p => ({
                    name: p.name,
                    in: p.in,
                    type: p.type,
                    required: !!p.required,
                    default: p.default,
                    options: p.options,
                    placeholder: p.placeholder,
                    description: p.description
                }))
            }))
        }))
    };
}