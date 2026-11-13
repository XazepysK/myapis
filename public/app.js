const $ = (sel, root = document) => root.querySelector(sel);

function h(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (value == null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
        else if (value === true) node.setAttribute(key, '');
        else node.setAttribute(key, String(value));
    }
    for (const child of children.flat(Infinity)) {
        if (child == null || child === false) continue;
        node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
}

const ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v11h14V10"/></svg>',
    terminal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.73.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.26 5.66.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>'
};

function icon(name, cls = 'icon') {
    const node = h('span', { class: cls, 'aria-hidden': 'true' });
    node.innerHTML = ICONS[name] || ICONS.box;
    return node;
}

const state = {
    meta: null,
    query: '',
    docsQuery: '',
    pg: { category: null, endpoint: null },
    objectUrl: null
};

const VIEW_LABELS = { home: 'Home', playground: 'Playground', docs: 'Documentation', contributors: 'Contributors' };
const NAV_ICONS = { home: 'home', playground: 'terminal', docs: 'book', contributors: 'users' };

const ROUTE_PATHS = { home: '/', playground: '/playground', docs: '/docs', contributors: '/contributors' };
const SEO_DESCRIPTIONS = {
    home: 'thesync-api is a free REST API with an interactive playground: social media downloader, music and video search, AI chat, image and text tools, live info feeds, and random anime images. No key required.',
    playground: 'Try every thesync-api endpoint live in the playground. Send requests, inspect JSON and image responses, and copy ready-to-use curl commands.',
    docs: 'Browse the thesync-api documentation by category: downloader, search, AI, tools, info, and random. Parameters, methods, and response types for every endpoint.',
    contributors: 'Meet the contributors behind thesync-api and support the project to keep the free REST API online.'
};

function parseRoute() {
    const raw = location.hash ? location.hash.slice(1) : location.pathname + location.search;
    const [path, qs] = raw.split('?');
    const name = path.split('/')[1] || 'home';
    return {
        view: Object.hasOwn(VIEW_LABELS, name) ? name : 'home',
        params: new URLSearchParams(qs || '')
    };
}

function routeUrl(view, params) {
    const qs = params ? params.toString().replace(/%2F/gi, '/') : '';
    return ROUTE_PATHS[view] + (qs ? '?' + qs : '');
}

function navigate(url) {
    history.pushState(null, '', url);
    render();
}

function normalizeUrl() {
    if (!location.hash) return;
    const { view, params } = parseRoute();
    history.replaceState(null, '', routeUrl(view, params));
}

function allEndpoints() {
    return state.meta.categories.flatMap(c => c.endpoints.map(e => ({ category: c, endpoint: e })));
}

function endpointPath(category, endpoint) {
    return `/api/v1/${category.name}/${endpoint.name}`;
}

function titleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function safeLink(url) {
    return /^https?:\/\//i.test(url || '') ? url : '';
}

function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('show'), 1800);
}

function emptyState(iconName, message, action) {
    return h('div', { class: 'empty' }, icon(iconName), h('span', { text: message }), action);
}

function methodChip(method) {
    return h('span', { class: `method-chip method-${method}`, text: method });
}

function endpointCard(category, endpoint) {
    return h('button', {
        class: 'ep-card',
        type: 'button',
        onclick: () => { navigate(`/playground?ep=${category.name}/${endpoint.name}`); }
    },
        h('span', { class: 'ep-thumb' }, icon(category.icon)),
        h('span', { class: 'grow' },
            h('span', { class: 't', text: titleCase(endpoint.name) }),
            h('br'),
            h('span', { class: 's', text: category.label })
        ),
        methodChip(endpoint.method)
    );
}

function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function matchEndpoint(category, endpoint, query) {
    const haystack = [
        endpoint.name, endpoint.description, endpoint.method,
        category.name, category.label, category.description,
        ...endpoint.params.map(p => p.name)
    ].join(' ').toLowerCase();
    return query.toLowerCase().split(/\s+/).every(term => haystack.includes(term));
}

function homeResults() {
    const query = state.query.trim();
    if (!query) {
        return h('div', {},
            h('h2', { class: 'section-title', text: 'Ready to try' }),
            h('div', { class: 'card-grid' }, allEndpoints().map(({ category, endpoint }) => endpointCard(category, endpoint))),
            h('h2', { class: 'section-title', text: 'Popular categories' }),
            h('div', { class: 'cat-row' }, state.meta.categories.map(category =>
                h('button', {
                    class: 'cat-tile',
                    type: 'button',
                    onclick: () => { navigate(`/docs?cat=${category.name}`); }
                },
                    h('span', { class: 'cat-circle' }, icon(category.icon)),
                    h('span', { class: 'label', text: category.label }),
                    h('span', { class: 'count', text: `${category.endpoints.length} endpoint${category.endpoints.length === 1 ? '' : 's'}` })
                )
            ))
        );
    }
    const hits = allEndpoints().filter(({ category, endpoint }) => matchEndpoint(category, endpoint, query));
    if (!hits.length) {
        return emptyState('search', `No results for "${query}".`, h('button', {
            class: 'btn btn-small',
            type: 'button',
            text: 'Reset search',
            onclick: () => {
                state.query = '';
                $('#home-search').value = '';
                $('#home-results').replaceChildren(homeResults());
            }
        }));
    }
    return h('div', {},
        h('h2', { class: 'section-title', text: `${hits.length} result${hits.length === 1 ? '' : 's'} for "${query}"` }),
        h('div', { class: 'card-grid' }, hits.map(({ category, endpoint }) => endpointCard(category, endpoint)))
    );
}

function viewHome() {
    const search = h('input', {
        id: 'home-search',
        type: 'search',
        placeholder: 'Search endpoints, categories, or methods...',
        'aria-label': 'Search endpoints or categories',
        value: state.query,
        oninput: (event) => {
            state.query = event.target.value;
            $('#home-results').replaceChildren(homeResults());
        }
    });
    return h('div', {},
        h('section', { class: 'hero' },
            h('h1', {}, greeting(), h('span', { class: 'dot' })),
            h('p', { text: state.meta.site.tagline })
        ),
        h('div', { class: 'searchbar' }, icon('search'), search),
        h('div', { id: 'home-results' }, homeResults())
    );
}

function paramField(param) {
    const id = `param-${param.name}`;
    const label = h('label', { class: 'field-label', for: id },
        h('span', { text: param.name }),
        param.required ? h('span', { class: 'req', text: '*' }) : null,
        h('span', { class: 'in-chip', text: param.in })
    );
    let input;
    if (param.type === 'enum') {
        input = h('select', { id, name: param.name },
            (param.options || []).map(option => h('option', { value: option, text: option }))
        );
        input.value = param.default || (param.options || [])[0] || '';
    } else {
        input = h('input', {
            id,
            name: param.name,
            type: param.type === 'number' ? 'number' : 'text',
            placeholder: param.placeholder || '',
            value: param.default || ''
        });
    }
    return h('div', { class: 'field' },
        label,
        input,
        param.description ? h('div', { class: 'field-help', text: param.description }) : null
    );
}

function collectParams(endpoint, form) {
    const query = new URLSearchParams();
    const body = {};
    for (const param of endpoint.params) {
        const input = form.elements.namedItem(param.name);
        const value = input ? input.value.trim() : '';
        if (!value) continue;
        if (param.in === 'body') body[param.name] = value;
        else query.set(param.name, value);
    }
    return { query, body };
}

function curlCommand(category, endpoint, query, body) {
    const url = location.origin + endpointPath(category, endpoint) + (query.toString() ? `?${query}` : '');
    const parts = ['curl', '-X', endpoint.method, `'${url}'`];
    if (endpoint.method !== 'GET' && Object.keys(body).length) {
        parts.push("-H 'Content-Type: application/json'", `-d '${JSON.stringify(body)}'`);
    }
    return parts.join(' ');
}

function exampleValues(endpoint) {
    const query = new URLSearchParams();
    const body = {};
    for (const param of endpoint.params) {
        const value = param.placeholder || param.default || (param.options && param.options[0]) || (param.type === 'number' ? '1' : 'example');
        if (param.in === 'body') body[param.name] = value;
        else query.set(param.name, value);
    }
    return { query, body };
}

function exampleSnippets(category, endpoint) {
    const { query, body } = exampleValues(endpoint);
    const base = seoOrigin() + endpointPath(category, endpoint);
    const qs = query.toString();
    const url = base + (qs ? '?' + qs : '');
    const hasBody = endpoint.method !== 'GET' && Object.keys(body).length;
    const bodyJson = JSON.stringify(body, null, 2);
    const read = endpoint.response === 'binary' ? 'blob' : 'json';
    const pyRead = endpoint.response === 'binary' ? 'content' : 'json()';

    const curl = ['curl', '-X', endpoint.method, `'${url}'`];
    if (hasBody) curl.push("-H 'Content-Type: application/json'", `-d '${JSON.stringify(body)}'`);

    const javascript = hasBody
        ? `const res = await fetch('${base}', {\n  method: '${endpoint.method}',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${bodyJson})\n});\nconst data = await res.${read}();`
        : `const res = await fetch('${url}');\nconst data = await res.${read}();`;

    const node = hasBody
        ? `const res = await fetch('${base}', {\n  method: '${endpoint.method}',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify(${bodyJson})\n});\nconsole.log(await res.${read}());`
        : `const res = await fetch('${url}');\nconsole.log(await res.${read}());`;

    const python = hasBody
        ? `import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}('${base}', json=${JSON.stringify(body)})\ndata = response.${pyRead}`
        : `import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}('${url}')\ndata = response.${pyRead}`;

    return { curl: curl.join(' '), javascript, node, python };
}

function exampleCode(category, endpoint) {
    const snippets = exampleSnippets(category, endpoint);
    const langs = Object.keys(snippets);
    let active = langs[0];
    const pre = h('pre', { class: 'code-block', text: snippets[active] });
    const copyBtn = h('button', {
        class: 'btn btn-small code-copy',
        type: 'button',
        onclick: async () => {
            try {
                await navigator.clipboard.writeText(pre.textContent);
                toast('Example code copied.');
            } catch {
                toast('Clipboard unavailable.');
            }
        }
    }, icon('copy'), 'Copy');
    const tabs = h('div', { class: 'code-tabs' }, langs.map(lang => h('button', {
        class: `code-tab${lang === active ? ' active' : ''}`,
        type: 'button',
        text: lang,
        onclick: (event) => {
            active = lang;
            pre.textContent = snippets[lang];
            for (const btn of tabs.querySelectorAll('.code-tab')) btn.classList.toggle('active', btn === event.currentTarget);
        }
    })));
    return h('div', { class: 'code-example' },
        h('div', { class: 'code-head' }, h('span', { class: 'code-title', text: 'Example code' }), copyBtn),
        tabs,
        pre
    );
}

function responsePanel() {
    return h('div', { class: 'resp', id: 'pg-resp' },
        h('h2', { class: 'section-title', text: 'Response' }),
        h('div', { id: 'pg-resp-body' }, emptyState('terminal', 'Run a request to see the response here.'))
    );
}

function showJson(payload, ok, status, ms, size) {
    const body = $('#pg-resp-body');
    let text;
    try { text = JSON.stringify(JSON.parse(payload), null, 2); }
    catch { text = payload; }
    body.replaceChildren(
        h('div', { class: 'resp-meta' },
            h('span', { class: `status-chip ${ok ? 'status-ok' : 'status-err'}`, text: String(status) }),
            h('span', { class: 'resp-stat', text: `${ms} ms` }),
            h('span', { class: 'resp-stat', text: size })
        ),
        h('pre', { class: 'json', text })
    );
}

function showBinary(blob, contentType, ok, status, ms, disposition) {
    const body = $('#pg-resp-body');
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = URL.createObjectURL(blob);
    const size = `${(blob.size / 1024).toFixed(1)} KB`;
    const meta = h('div', { class: 'resp-meta' },
        h('span', { class: `status-chip ${ok ? 'status-ok' : 'status-err'}`, text: String(status) }),
        h('span', { class: 'resp-stat', text: `${ms} ms` }),
        h('span', { class: 'resp-stat', text: size }),
        h('span', { class: 'resp-stat', text: contentType })
    );
    if (contentType.startsWith('image/')) {
        body.replaceChildren(meta, h('img', { class: 'resp-img', src: state.objectUrl, alt: 'Image response preview' }));
        return;
    }
    const match = /filename="([^"]+)"/.exec(disposition || '');
    const ext = { 'video/mp4': '.mp4', 'audio/mpeg': '.mp3', 'image/png': '.png', 'image/jpeg': '.jpg' }[contentType] || '.bin';
    const filename = match ? match[1] : 'response' + ext;
    body.replaceChildren(meta, emptyState('box', `File ready to download: ${filename}`, h('a', {
        class: 'btn btn-primary btn-small',
        href: state.objectUrl,
        download: filename
    }, icon('download'), 'Download file')));
}

function showError(message, status, ms) {
    $('#pg-resp-body').replaceChildren(
        h('div', { class: 'resp-meta' },
            h('span', { class: 'status-chip status-err', text: status ? String(status) : 'Failed' }),
            ms != null ? h('span', { class: 'resp-stat', text: `${ms} ms` }) : null
        ),
        h('pre', { class: 'json', text: message })
    );
}

async function runRequest(category, endpoint, form, runBtn) {
    for (const param of endpoint.params) {
        const input = form.elements.namedItem(param.name);
        if (param.required && input && !input.value.trim()) {
            input.classList.add('invalid');
            input.focus();
            toast(`Parameter ${param.name} is required.`);
            return;
        }
        if (input) input.classList.remove('invalid');
    }
    const { query, body } = collectParams(endpoint, form);
    const url = endpointPath(category, endpoint) + (query.toString() ? `?${query}` : '');
    runBtn.disabled = true;
    const started = performance.now();
    try {
        const res = await fetch(url, {
            method: endpoint.method,
            headers: endpoint.method !== 'GET' && Object.keys(body).length ? { 'Content-Type': 'application/json' } : undefined,
            body: endpoint.method !== 'GET' && Object.keys(body).length ? JSON.stringify(body) : undefined
        });
        const ms = Math.round(performance.now() - started);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const text = await res.text();
            showJson(text, res.ok, res.status, ms, `${new Blob([text]).size} B`);
        } else {
            const blob = await res.blob();
            showBinary(blob, contentType, res.ok, res.status, ms, res.headers.get('content-disposition'));
        }
    } catch (err) {
        showError(err.message || 'Request failed.', null, Math.round(performance.now() - started));
    } finally {
        runBtn.disabled = false;
    }
}

function viewPlayground(params) {
    const entries = allEndpoints();
    const wanted = params.get('ep');
    if (wanted) {
        const found = entries.find(({ category, endpoint }) => `${category.name}/${endpoint.name}` === wanted);
        if (found) state.pg = { category: found.category.name, endpoint: found.endpoint.name };
    }
    if (!state.pg.category || !entries.some(({ category, endpoint }) => category.name === state.pg.category && endpoint.name === state.pg.endpoint)) {
        state.pg = { category: entries[0].category.name, endpoint: entries[0].endpoint.name };
    }
    const current = entries.find(({ category, endpoint }) => category.name === state.pg.category && endpoint.name === state.pg.endpoint);
    const { category, endpoint } = current;

    const side = h('aside', { class: 'pg-side' },
        h('h2', { text: 'Endpoints' }),
        state.meta.categories.map(cat => h('div', {},
            h('div', { class: 'pg-cat-label', text: cat.label }),
            cat.endpoints.map(ep => h('button', {
                class: `pg-ep-btn${cat.name === category.name && ep.name === endpoint.name ? ' active' : ''}`,
                type: 'button',
                onclick: () => {
                    state.pg = { category: cat.name, endpoint: ep.name };
                    render();
                }
            }, methodChip(ep.method), h('span', { text: ep.name })))
        ))
    );

    const form = h('form', { id: 'pg-form', onsubmit: (event) => { event.preventDefault(); runRequest(category, endpoint, form, runBtn); } },
        endpoint.params.map(paramField)
    );
    const runBtn = h('button', { class: 'btn btn-primary', type: 'submit', form: 'pg-form' }, icon('play'), 'Run');
    const copyBtn = h('button', {
        class: 'btn',
        type: 'button',
        onclick: async () => {
            const { query, body } = collectParams(endpoint, form);
            try {
                await navigator.clipboard.writeText(curlCommand(category, endpoint, query, body));
                toast('curl command copied.');
            } catch {
                toast('Clipboard unavailable.');
            }
        }
    }, icon('copy'), 'Copy curl');

    const main = h('section', { class: 'pg-main' },
        h('div', { class: 'pg-head' },
            methodChip(endpoint.method),
            h('code', { class: 'path', text: endpointPath(category, endpoint) }),
            h('span', { class: 'resp-chip', text: endpoint.response === 'binary' ? 'file / binary' : 'application/json' })
        ),
        h('p', { class: 'pg-desc', text: endpoint.description }),
        form,
        h('div', { class: 'pg-actions' }, runBtn, copyBtn),
        exampleCode(category, endpoint),
        exampleResponseBlock(endpoint),
        responsePanel()
    );

    return h('div', { class: 'pg-grid' }, side, main);
}

function exampleResponseBlock(endpoint) {
    const sample = endpoint.exampleResponse;
    if (!sample) return null;
    if (endpoint.response === 'binary') {
        return h('div', { class: 'code-example' },
            h('div', { class: 'code-head' },
                h('span', { class: 'code-title', text: 'Example response' }),
                h('span', { class: 'resp-chip', text: sample.contentType || 'application/octet-stream' })
            ),
            h('p', { class: 'field-help', text: sample.note || 'Binary body returned as the response.' })
        );
    }
    const text = JSON.stringify(sample, null, 2);
    const copyBtn = h('button', {
        class: 'btn btn-small code-copy',
        type: 'button',
        onclick: async () => {
            try {
                await navigator.clipboard.writeText(text);
                toast('Example response copied.');
            } catch {
                toast('Clipboard unavailable.');
            }
        }
    }, icon('copy'), 'Copy');
    return h('div', { class: 'code-example' },
        h('div', { class: 'code-head' }, h('span', { class: 'code-title', text: 'Example response' }), copyBtn),
        h('pre', { class: 'code-block', text })
    );
}

function paramsTable(endpoint) {
    if (!endpoint.params.length) return null;
    return h('div', { class: 'table-wrap' },
        h('table', { class: 'params' },
            h('thead', {}, h('tr', {},
                h('th', { text: 'Name' }), h('th', { text: 'Type' }), h('th', { text: 'Required' }), h('th', { text: 'Description' })
            )),
            h('tbody', {}, endpoint.params.map(param => h('tr', {},
                h('td', {}, h('code', { text: param.name })),
                h('td', { text: param.type + (param.in === 'body' ? ' (body)' : ' (query)') }),
                h('td', { text: param.required ? 'yes' : 'no' }),
                h('td', { text: [param.description, param.default ? `Default: ${param.default}.` : '', param.options ? `Options: ${param.options.join(', ')}.` : ''].filter(Boolean).join(' ') })
            )))
        )
    );
}

function categoriesFor(catFilter, query) {
    return state.meta.categories
        .filter(category => !catFilter || category.name === catFilter)
        .map(category => ({
            category,
            endpoints: category.endpoints.filter(endpoint => !query || matchEndpoint(category, endpoint, query))
        }))
        .filter(group => group.endpoints.length);
}

function docsSections(groups) {
    if (!groups.length) return [emptyState('search', 'No matching endpoints.')];
    return groups.map(({ category, endpoints }) => h('section', { class: 'doc-cat' },
        h('div', { class: 'doc-cat-head' },
            h('span', { class: 'cat-circle' }, icon(category.icon)),
            h('div', {},
                h('h2', { text: category.label }),
                h('p', { text: category.description })
            )
        ),
        endpoints.map(endpoint => h('article', { class: 'doc-endpoint' },
            h('div', { class: 'doc-endpoint-head' },
                methodChip(endpoint.method),
                h('code', { class: 'path', text: endpointPath(category, endpoint) }),
                h('span', { class: 'resp-chip', text: endpoint.response === 'binary' ? 'file / binary' : 'application/json' }),
                h('button', {
                    class: 'btn btn-small',
                    type: 'button',
                    text: 'Try',
                    onclick: () => { navigate(`/playground?ep=${category.name}/${endpoint.name}`); }
                })
            ),
            h('p', { text: endpoint.description }),
            paramsTable(endpoint),
            exampleCode(category, endpoint),
            exampleResponseBlock(endpoint)
        ))
    ));
}

function viewDocs(params) {
    const catFilter = params.get('cat');
    const groups = categoriesFor(catFilter, state.docsQuery.trim().toLowerCase());

    const search = h('div', { class: 'searchbar' }, icon('search'), h('input', {
        type: 'search',
        placeholder: 'Filter documentation endpoints...',
        'aria-label': 'Filter documentation',
        value: state.docsQuery,
        oninput: (event) => {
            state.docsQuery = event.target.value;
            $('#docs-list').replaceChildren(...docsSections(categoriesFor(catFilter, state.docsQuery.trim().toLowerCase())));
        }
    }));

    return h('div', {},
        h('h1', { class: 'section-title', text: 'Documentation' }),
        catFilter ? h('button', {
            class: 'btn btn-small',
            type: 'button',
            text: 'See all categories',
            onclick: () => { navigate('/docs'); }
        }) : null,
        search,
        h('div', { id: 'docs-list' }, docsSections(groups))
    );
}

function supportCard(iconName, title, description, link, linkLabel) {
    return h('div', { class: 'support-card' },
        h('span', { class: 'icon-wrap' }, icon(iconName)),
        h('h3', { text: title }),
        h('p', { text: description }),
        link
            ? h('a', { class: 'btn btn-small', href: link, target: '_blank', rel: 'noreferrer' }, linkLabel, icon('external'))
            : h('p', { class: 'field-help', text: 'Not configured yet. Set the link in config.json under site.' })
    );
}

function viewContributors() {
    const site = state.meta.site;
    const initials = (name) => name.split(/\s+/).map(part => part.charAt(0)).join('').slice(0, 2).toUpperCase();
    const total = allEndpoints().length;
    return h('div', {},
        h('h1', { class: 'section-title', text: 'Contributors' }),
        h('div', { class: 'people-grid' }, site.contributors.map(person => h('div', { class: 'person-card' },
            h('span', { class: 'person-avatar', text: initials(person.name) }),
            h('div', {},
                h('div', { class: 't', text: person.name }),
                h('div', { class: 's', text: person.role })
            ),
            safeLink(person.url) ? h('a', { class: 'btn btn-small', href: safeLink(person.url), target: '_blank', rel: 'noreferrer', 'aria-label': `${person.name} profile` }, icon('external')) : null
        ))),
        h('h2', { class: 'section-title', text: 'Support the project' }),
        h('div', { class: 'card-grid' },
            supportCard('heart', 'Donate', 'Support server costs and new endpoint development.', safeLink(site.donate), 'Donate now'),
            supportCard('alert', 'Report issues', 'Found a bug or a dead endpoint? Report it through issues.', 'https://t.me/ZanLugner', 'Open issues')
        ),
        h('h2', { class: 'section-title', text: 'About' }),
        h('div', { class: 'stats-row' },
            h('div', { class: 'stat-card' }, h('div', { class: 'stat-value', text: site.version }), h('div', { class: 'stat-label', text: 'API version' })),
            h('div', { class: 'stat-card' }, h('div', { class: 'stat-value', text: String(total) }), h('div', { class: 'stat-label', text: 'Endpoints' })),
            h('div', { class: 'stat-card' }, h('div', { class: 'stat-value', text: String(state.meta.categories.length) }), h('div', { class: 'stat-label', text: 'Categories' }))
        ),
        h('p', { class: 'pg-desc', text: `${site.name} runs on Express. Every category, endpoint, method, and parameter is configured through config.json without touching the frontend code.` })
    );
}

function viewSkeleton() {
    return h('div', {},
        h('div', { class: 'skel skel-hero' }),
        h('div', { class: 'skel skel-line' }),
        h('div', { class: 'skel skel-search' }),
        h('div', { class: 'card-grid' }, [0, 1, 2, 3].map(() => h('div', { class: 'skel skel-card' })))
    );
}

function viewMetaError(message) {
    return emptyState('alert', `Failed to load API meta: ${message}`, h('button', {
        class: 'btn btn-primary btn-small',
        type: 'button',
        text: 'Retry',
        onclick: loadMeta
    }));
}

function seoOrigin() {
    return String(state.meta.site.url || location.origin).replace(/\/+$/, '');
}

function seoKeywords(view, params) {
    const list = [...(state.meta.site.tags || [])];
    if (view === 'playground') {
        const [catName, epName] = (params.get('ep') || '').split('/');
        const category = state.meta.categories.find(c => c.name === catName);
        const endpoint = category && category.endpoints.find(e => e.name === epName);
        if (endpoint) list.push(endpoint.name, ...(endpoint.tags || []));
    } else if (view === 'docs') {
        const category = state.meta.categories.find(c => c.name === params.get('cat'));
        if (category) {
            list.push(category.label, ...(category.tags || []));
            for (const endpoint of category.endpoints) list.push(...(endpoint.tags || []));
        }
    }
    return [...new Set(list)].join(', ');
}

function setMeta(attr, key, content) {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', content);
}

function updateJsonLd(view, url) {
    const site = state.meta.site;
    const origin = seoOrigin();
    const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' }];
    if (view !== 'home') crumbs.push({ '@type': 'ListItem', position: 2, name: VIEW_LABELS[view], item: url });
    const graph = [
        {
            '@type': 'WebSite',
            '@id': origin + '/#website',
            name: site.name,
            url: origin + '/',
            description: SEO_DESCRIPTIONS.home,
            inLanguage: 'en',
            publisher: { '@type': 'Organization', name: site.name, logo: origin + '/assets/icon.png' }
        },
        {
            '@type': 'WebAPI',
            '@id': origin + '/#api',
            name: site.name,
            description: site.tagline,
            keywords: (site.tags || []).join(', '),
            url: origin + '/',
            documentation: origin + '/docs',
            provider: { '@type': 'Organization', name: site.name }
        },
        { '@type': 'BreadcrumbList', itemListElement: crumbs }
    ];
    document.getElementById('seo-jsonld').textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function applySeo(view, params) {
    const site = state.meta.site;
    const origin = seoOrigin();
    const url = origin + routeUrl(view, params);
    const title = view === 'home'
        ? `${site.name} - Free REST API Playground, Downloader, Search, AI and Tools`
        : `${VIEW_LABELS[view]} - ${site.name}`;
    const desc = SEO_DESCRIPTIONS[view] || site.tagline;
    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('name', 'keywords', seoKeywords(view, params));
    document.head.querySelector('link[rel="canonical"]').setAttribute('href', url);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', origin + '/assets/icon.png');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', origin + '/assets/icon.png');
    updateJsonLd(view, url);
}

function render() {
    if (!state.meta) return;
    const { view, params } = parseRoute();
    $('#crumb').textContent = VIEW_LABELS[view];
    for (const item of document.querySelectorAll('.nav-item')) {
        item.classList.toggle('active', item.dataset.nav === view);
    }
    document.body.classList.remove('drawer-open');
    const content = view === 'home' ? viewHome()
        : view === 'playground' ? viewPlayground(params)
        : view === 'docs' ? viewDocs(params)
        : viewContributors();
    $('#view').replaceChildren(h('div', { class: 'view-enter' }, content));
    applySeo(view, params);
}

function buildDrawer() {
    const drawer = $('#drawer');
    drawer.replaceChildren(
        h('h3', { text: 'Navigation' }),
        ...Object.entries(VIEW_LABELS).map(([key, label]) => h('a', {
            href: ROUTE_PATHS[key],
            onclick: () => document.body.classList.remove('drawer-open')
        }, icon(NAV_ICONS[key]), label)),
        h('h3', { text: 'Categories' }),
        ...state.meta.categories.map(category => h('a', {
            href: `/docs?cat=${category.name}`,
            onclick: () => document.body.classList.remove('drawer-open')
        }, icon(category.icon), category.label))
    );
}

function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('thesync-theme', theme);
    const btn = $('#theme-btn');
    btn.replaceChildren(icon(theme === 'dark' ? 'sun' : 'moon'));
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

async function loadMeta() {
    $('#view').replaceChildren(h('div', { class: 'view-enter' }, viewSkeleton()));
    try {
        const res = await fetch('/api/v1/meta');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        state.meta = await res.json();
        $('#brand-name').textContent = state.meta.site.name;
        buildDrawer();
        normalizeUrl();
        render();
    } catch (err) {
        $('#view').replaceChildren(h('div', { class: 'view-enter' }, viewMetaError(err.message)));
    }
}

for (const item of document.querySelectorAll('.nav-item')) {
    item.prepend(icon(NAV_ICONS[item.dataset.nav]));
}
$('#menu-btn').append(icon('menu'));
$('#support-btn').append(icon('heart'));
$('#menu-btn').addEventListener('click', () => document.body.classList.toggle('drawer-open'));
$('#drawer-overlay').addEventListener('click', () => document.body.classList.remove('drawer-open'));
$('#theme-btn').addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});
window.addEventListener('hashchange', () => { normalizeUrl(); render(); });
window.addEventListener('popstate', render);
document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a');
    if (!anchor || anchor.target === '_blank') return;
    const href = anchor.getAttribute('href') || '';
    if (!href.startsWith('/') || href.startsWith('//')) return;
    event.preventDefault();
    navigate(href);
});

applyTheme(localStorage.getItem('thesync-theme') || 'dark');
loadMeta();