import { Router } from 'express';
import http from '../../lib/http.js';

const router = Router();

const BASE_URL = 'https://www.rizky.web.id';
const API_ENDPOINT = `${BASE_URL}/api/api.js`;

const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'Referer': `${BASE_URL}/`,
    'Accept': 'application/json, text/plain, */*'
};

async function requestApi(action: string, params: any = {}): Promise<any> {
    const query = new URLSearchParams(params);
    query.set('action', action);
    const url = `${API_ENDPOINT}?${query.toString()}`;
    const { data: json } = await http.get(url, { headers: DEFAULT_HEADERS });
    if (!json || !json.ok) {
        throw new Error(json?.error || 'Failed to retrieve data from API');
    }
    return json.data;
}

async function getHome() {
    return await requestApi('home');
}

async function getExplore() {
    return await requestApi('explore');
}

async function getCharts() {
    return await requestApi('charts');
}

async function getSuggestions(q: string) {
    if (!q) return [];
    return await requestApi('suggestions', { q });
}

async function search(query: string, filter: string = 'songs'): Promise<any> {
    if (!query) throw new Error('Search query is required.');
    const items: any = await requestApi('search', { q: query, filter });
    return items.map((item: any) => ({
        type: item.type || 'Song',
        videoId: item.videoId || null,
        browseId: item.browseId || null,
        title: item.title,
        artist: item.artist || null,
        artistId: item.artistId || null,
        album: item.album || null,
        plays: item.plays || null,
        thumbnail: item.thumbnail || null,
        youtubeUrl: item.videoId ? `https://www.youtube.com/watch?v=${item.videoId}` : null
    }));
}

async function getTrackDetail(videoId: string) {
    if (!videoId) throw new Error('Video ID is required.');
    const detail = await requestApi('detail', { id: videoId });
    return { ...detail, youtubeUrl: `https://www.youtube.com/watch?v=${videoId}` };
}

async function getRelated(videoId: string) {
    if (!videoId) throw new Error('Video ID is required.');
    return await requestApi('related', { id: videoId });
}

async function getLyrics(browseId: string) {
    if (!browseId) throw new Error('Lyrics browseId is required.');
    return await requestApi('lyrics', { browseId });
}

async function getSyncedLyrics(title: string, artist: string = '', durationSec: number = 0) {
    if (!title) throw new Error('Title is required.');
    return await requestApi('synced', { title, artist, dur: Math.round(durationSec) });
}

async function getArtist(browseId: string) {
    if (!browseId) throw new Error('Artist browseId is required.');
    return await requestApi('artist', { browseId });
}

async function getAlbum(browseId: string) {
    if (!browseId) throw new Error('Album browseId is required.');
    return await requestApi('album', { browseId });
}

async function getPlaylist(browseId: string) {
    if (!browseId) throw new Error('Playlist browseId is required.');
    return await requestApi('playlist', { browseId });
}

router.get('/', async (req, res) => {
    try {
        const action = (req.query.action as string) || 'search';
        const q = (req.query.q as string) || '';
        const id = (req.query.id as string) || '';
        const browseId = (req.query.browseId as string) || '';
        const filter = (req.query.filter as string) || 'songs';
        const title = (req.query.title as string) || '';
        const artist = (req.query.artist as string) || '';
        const dur = Number(req.query.dur) || 0;

        let result;

        switch (action) {
            case 'home':
                result = await getHome();
                break;
            case 'explore':
                result = await getExplore();
                break;
            case 'charts':
                result = await getCharts();
                break;
            case 'suggestions':
                result = await getSuggestions(q);
                break;
            case 'search':
                result = await search(q, filter);
                break;
            case 'detail':
                result = await getTrackDetail(id || q);
                break;
            case 'related':
                result = await getRelated(id || q);
                break;
            case 'lyrics':
                result = await getLyrics(browseId || q);
                break;
            case 'synced':
                result = await getSyncedLyrics(title || q, artist, dur);
                break;
            case 'artist':
                result = await getArtist(browseId || q);
                break;
            case 'album':
                result = await getAlbum(browseId || q);
                break;
            case 'playlist':
                result = await getPlaylist(browseId || q);
                break;
            default:
                return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        return res.json({ success: true, action, data: result });
    } catch (err: any) {
        return res.status(400).json({ success: false, error: err.message || 'Failed to fetch' });
    }
});

export default router;