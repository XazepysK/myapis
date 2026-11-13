import { Router } from 'express';
import axios from '../../lib/http.js';

const router = Router();
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function githubUser(user: string): Promise<any> {
    const { data } = await axios.get(`https://api.github.com/users/${encodeURIComponent(user)}`, {
        timeout: 30000,
        headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' }
    });
    return {
        username: data.login || null,
        nickname: data.name || null,
        bio: data.bio || null,
        id: data.id || null,
        profilePic: data.avatar_url || null,
        url: data.html_url || null,
        type: data.type || null,
        company: data.company || null,
        blog: data.blog || null,
        location: data.location || null,
        email: data.email || null,
        publicRepos: data.public_repos || 0,
        publicGists: data.public_gists || 0,
        followers: data.followers || 0,
        following: data.following || 0,
        createdAt: data.created_at || null,
        updatedAt: data.updated_at || null
    };
}

router.get('/', async (req, res) => {
    try {
        const user = (req.query.user as string || req.query.username as string || '').trim();
        if (!user) return res.status(400).json({ success: false, error: 'Query ?user= is required' });
        if (user.length > 255) return res.status(400).json({ success: false, error: 'user must be 255 characters or fewer' });
        const data = await githubUser(user);
        return res.json({ success: true, data });
    } catch (err: any) {
        if (err.response?.status === 404) return res.status(404).json({ success: false, error: 'User not found' });
        return res.status(502).json({ success: false, error: err.message || 'Failed to fetch GitHub user' });
    }
});

export default router;