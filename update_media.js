const fs = require('fs');
const path = require('path');

// Переменные окружения для API ключей
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';

// Количество запрашиваемых видео с каждого канала за запуск
const MAX_RESULTS_PER_CHANNEL = 15;

// Кэш для логинов и ID каналов
const channelIdCache = {};
let twitchAccessToken = null;

/**
 * Получение App Access Token для Twitch Helix API
 */
async function getTwitchAccessToken() {
    if (twitchAccessToken) return twitchAccessToken;
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
        console.error('Предупреждение: TWITCH_CLIENT_ID или TWITCH_CLIENT_SECRET не заданы!');
        return null;
    }

    try {
        const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
            method: 'POST'
        });
        if (res.ok) {
            const data = await res.json();
            twitchAccessToken = data.access_token;
            return twitchAccessToken;
        } else {
            console.error('Ошибка авторизации Twitch:', res.statusText);
        }
    } catch (e) {
        console.error('Ошибка при запросе токена Twitch:', e.message);
    }
    return null;
}

/**
 * Парсер ISO 8601 продолжительности роликов YouTube
 */
function parseISO8601Duration(durationString) {
    if (!durationString) return 0;
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = durationString.match(regex);
    if (!matches) return 0;
    const hours = parseInt(matches[1] || 0, 10);
    const minutes = parseInt(matches[2] || 0, 10);
    const seconds = parseInt(matches[3] || 0, 10);
    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Извлечение никнейма Twitch из ссылки или строки
 */
function extractTwitchUsername(url) {
    if (!url) return null;
    const trimmed = url.trim();
    const match = trimmed.match(/(?:twitch\.tv\/)?([a-zA-Z0-9_]+)\/?$/i);
    return match ? match[1].toLowerCase() : null;
}

/**
 * Форматирование обложки Twitch
 */
function formatTwitchThumbnail(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return 'https://static-cdn.jtvnw.net/ttv-static/404_preview-1280x720.jpg';
    }
    return url
        .replace(/%?\{?width\}?%?/gi, '1280')
        .replace(/%?\{?height\}?%?/gi, '720');
}

/**
 * Надежное получение статичной обложки YouTube без 404
 */
function getYouTubeThumbnail(snippet, videoId) {
    if (snippet && snippet.thumbnails) {
        if (snippet.thumbnails.maxres?.url) return snippet.thumbnails.maxres.url;
        if (snippet.thumbnails.high?.url) return snippet.thumbnails.high.url;
        if (snippet.thumbnails.standard?.url) return snippet.thumbnails.standard.url;
        if (snippet.thumbnails.medium?.url) return snippet.thumbnails.medium.url;
        if (snippet.thumbnails.default?.url) return snippet.thumbnails.default.url;
    }
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Получение анимированного превью при наведении для YouTube
 */
function getYouTubeAnimatedPreview(videoId) {
    return `https://i.ytimg.com/an_webp/${videoId}/mqdefault_60fps.webp`;
}

/**
 * Получить YouTube Channel ID из URL или хэндла (@username)
 */
async function resolveYouTubeChannelId(youtubeUrl, authorName) {
    if (!youtubeUrl) return null;

    const trimmedUrl = youtubeUrl.trim();

    const directChannelMatch = trimmedUrl.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (directChannelMatch) return directChannelMatch[1];

    if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmedUrl)) return trimmedUrl;

    let handle = null;
    const handleMatch = trimmedUrl.match(/@([a-zA-Z0-9_.-]+)/);
    if (handleMatch) {
        handle = handleMatch[1];
    } else {
        const parts = trimmedUrl.replace(/\/$/, '').split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && !lastPart.includes('.')) {
            handle = lastPart.replace(/^@/, '');
        }
    }

    if (!handle) return null;
    if (channelIdCache[handle]) return channelIdCache[handle];

    try {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                const channelId = data.items[0].id;
                channelIdCache[handle] = channelId;
                return channelId;
            }
        }
    } catch (e) {
        console.error(`Ошибка при поиске YouTube ID для @${handle}:`, e.message);
    }

    try {
        const searchQuery = authorName || handle;
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(searchUrl);
        if (res.ok) {
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                const channelId = data.items[0].id?.channelId;
                if (channelId) {
                    channelIdCache[handle] = channelId;
                    return channelId;
                }
            }
        }
    } catch (e) {
        console.error(`Резервный поиск YouTube не удался для ${handle}:`, e.message);
    }

    return null;
}

/**
 * Всеядная функция загрузки списков каналов из team.json
 */
function loadChannelsFromTeamJson() {
    const youtubeChannels = [];
    const twitchChannels = [];

    const possiblePaths = [
        path.join(__dirname, 'team.json'),
        path.join(__dirname, 'data', 'team.json'),
        path.join(__dirname, 'js', 'team.json')
    ];

    let teamData = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            try {
                const raw = fs.readFileSync(p, 'utf-8');
                teamData = JSON.parse(raw);
                console.log(`Файл team.json найден по пути: ${p}`);
                break;
            } catch (e) {
                console.error(`Ошибка чтения ${p}:`, e.message);
            }
        }
    }

    if (!teamData) {
        console.log('Файл team.json не найден.');
        return { youtubeChannels, twitchChannels };
    }

    const members = Array.isArray(teamData) ? teamData : (teamData.members || teamData.team || teamData.teamMembers || []);

    for (const member of members) {
        const authorName = member.name || member.username || member.nickname || member.author || 'Участник';
        let ytUrl = null;
        let twitchUrl = null;

        const checkUrl = (urlStr) => {
            if (!urlStr || typeof urlStr !== 'string') return;
            const lower = urlStr.toLowerCase();
            if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.startsWith('uc')) {
                if (!ytUrl) ytUrl = urlStr;
            } else if (lower.includes('twitch.tv')) {
                if (!twitchUrl) twitchUrl = urlStr;
            }
        };

        // 1. Поиск в свойствах участника
        for (const key of Object.keys(member)) {
            const kLower = key.toLowerCase();
            if (kLower === 'youtube' || kLower === 'yt') {
                if (typeof member[key] === 'string') ytUrl = member[key];
            }
            if (kLower === 'twitch' || kLower === 'tw') {
                if (typeof member[key] === 'string') twitchUrl = member[key];
            }
        }

        // 2. Поиск в объекте или массиве socials
        if (member.socials) {
            if (Array.isArray(member.socials)) {
                for (const item of member.socials) {
                    if (typeof item === 'string') {
                        checkUrl(item);
                    } else if (item && typeof item === 'object') {
                        const platform = (item.platform || item.type || item.name || item.service || '').toLowerCase();
                        const url = item.url || item.link || item.href || '';
                        if (platform === 'youtube' || platform === 'yt') {
                            if (url) ytUrl = url;
                        } else if (platform === 'twitch' || platform === 'tw') {
                            if (url) twitchUrl = url;
                        } else {
                            checkUrl(url);
                        }
                    }
                }
            } else if (typeof member.socials === 'object') {
                for (const key of Object.keys(member.socials)) {
                    const kLower = key.toLowerCase();
                    const val = member.socials[key];
                    if (typeof val === 'string') {
                        if (kLower === 'youtube' || kLower === 'yt') ytUrl = val;
                        else if (kLower === 'twitch' || kLower === 'tw') twitchUrl = val;
                        else checkUrl(val);
                    }
                }
            }
        }

        if (ytUrl) youtubeChannels.push({ channelUrl: ytUrl, authorName });
        if (twitchUrl) twitchChannels.push({ channelUrl: twitchUrl, authorName });
    }

    return { youtubeChannels, twitchChannels };
}

/**
 * Запрос контента из YouTube API (используем playlistItems для 100x экономии квоты)
 */
async function fetchYouTubeMedia(channelId, authorName) {
    if (!YOUTUBE_API_KEY) return [];

    // Преобразуем Channel ID (UC...) в Uploads Playlist ID (UU...)
    const playlistId = channelId.startsWith('UC') ? 'UU' + channelId.slice(2) : channelId;
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${MAX_RESULTS_PER_CHANNEL}&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(playlistUrl);
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error(`Ошибка YouTube API (${response.status}):`, errData.error?.message || response.statusText);
            return [];
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) return [];

        const videoIds = data.items
            .map(item => item.snippet?.resourceId?.videoId)
            .filter(Boolean);

        if (videoIds.length === 0) return [];

        // Запрос деталей для определения длительности и стримов
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,liveStreamingDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] };

        const detailsMap = {};
        if (detailsData.items) {
            detailsData.items.forEach(v => { detailsMap[v.id] = v; });
        }

        return data.items.map(item => {
            const videoId = item.snippet?.resourceId?.videoId;
            const snippet = item.snippet;
            if (!videoId || !snippet) return null;

            const detailItem = detailsMap[videoId];
            const durationSec = detailItem ? parseISO8601Duration(detailItem.contentDetails?.duration) : 0;

            const isStream = Boolean(
                detailItem?.liveStreamingDetails ||
                snippet.liveBroadcastContent === 'live' ||
                snippet.liveBroadcastContent === 'upcoming'
            );

            const isShort = !isStream && ((durationSec > 0 && durationSec <= 60) || snippet.title.toLowerCase().includes('#shorts'));

            let mediaType = 'video';
            if (isStream) mediaType = 'stream';
            else if (isShort) mediaType = 'short';

            const thumbnail = getYouTubeThumbnail(detailItem?.snippet || snippet, videoId);
            const animatedPreview = getYouTubeAnimatedPreview(videoId);
            const publishedAt = snippet.publishedAt || snippet.addedToPlaylist;
            const dateObj = new Date(publishedAt);

            return {
                title: snippet.title,
                author: authorName || snippet.channelTitle,
                platform: 'youtube',
                type: mediaType,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: thumbnail,
                preview: animatedPreview,
                date: dateObj.toISOString().split('T')[0],
                rawDate: dateObj.getTime(),
                videoId: videoId
            };
        }).filter(Boolean);
    } catch (error) {
        console.error(`Ошибка при запросе YouTube (channelId: ${channelId}):`, error.message);
        return [];
    }
}

/**
 * Запрос медиафайлов Twitch (онлайн-стримы и VOD видео)
 */
async function fetchTwitchMedia(username, authorName) {
    const token = await getTwitchAccessToken();
    if (!token) return [];

    const headers = {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
    };

    try {
        const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, { headers });
        if (!userRes.ok) return [];
        const userData = await userRes.json();
        if (!userData.data || userData.data.length === 0) return [];

        const userId = userData.data[0].id;
        const mediaList = [];

        // 1. Онлайн-стрим
        const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, { headers });
        if (streamRes.ok) {
            const streamData = await streamRes.json();
            if (streamData.data && streamData.data.length > 0) {
                const stream = streamData.data[0];
                const dateObj = new Date(stream.started_at);
                const thumb = formatTwitchThumbnail(stream.thumbnail_url);

                mediaList.push({
                    title: stream.title,
                    author: authorName || stream.user_name,
                    platform: 'twitch',
                    type: 'stream',
                    url: `https://www.twitch.tv/${stream.user_login}`,
                    thumbnail: thumb,
                    preview: thumb,
                    date: dateObj.toISOString().split('T')[0],
                    rawDate: dateObj.getTime(),
                    videoId: `stream_${stream.id}`
                });
            }
        }

        // 2. VOD Записи
        const videosRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&first=${MAX_RESULTS_PER_CHANNEL}`, { headers });
        if (videosRes.ok) {
            const videosData = await videosRes.json();
            if (videosData.data && videosData.data.length > 0) {
                for (const v of videosData.data) {
                    const dateObj = new Date(v.created_at);
                    const thumb = formatTwitchThumbnail(v.thumbnail_url);

                    mediaList.push({
                        title: v.title,
                        author: authorName || v.user_name,
                        platform: 'twitch',
                        type: v.type === 'archive' ? 'stream' : 'video',
                        url: v.url,
                        thumbnail: thumb,
                        preview: thumb,
                        date: dateObj.toISOString().split('T')[0],
                        rawDate: dateObj.getTime(),
                        videoId: `vod_${v.id}`
                    });
                }
            }
        }

        return mediaList;
    } catch (e) {
        console.error(`Ошибка при запросе Twitch для ${username}:`, e.message);
        return [];
    }
}

/**
 * Главная функция
 */
async function updateMediaJson() {
    console.log('Чтение состава из team.json...');
    const { youtubeChannels, twitchChannels } = loadChannelsFromTeamJson();
    console.log(`Найдено каналов: YouTube (${youtubeChannels.length}), Twitch (${twitchChannels.length})`);

    let allMedia = [];
    const processedVideoIds = new Set();

    // Обработка YouTube
    for (const ch of youtubeChannels) {
        const channelId = await resolveYouTubeChannelId(ch.channelUrl, ch.authorName);
        if (!channelId) {
            console.log(`Не удалось определить YouTube Channel ID для: ${ch.channelUrl} (${ch.authorName})`);
            continue;
        }

        console.log(`Загрузка YouTube для ${ch.authorName} (ID: ${channelId})...`);
        const items = await fetchYouTubeMedia(channelId, ch.authorName);

        for (const item of items) {
            if (!processedVideoIds.has(item.videoId)) {
                processedVideoIds.add(item.videoId);
                allMedia.push(item);
            }
        }
    }

    // Обработка Twitch
    for (const ch of twitchChannels) {
        const username = extractTwitchUsername(ch.channelUrl);
        if (!username) {
            console.log(`Не удалось распарсить Twitch никнейм из: ${ch.channelUrl} (${ch.authorName})`);
            continue;
        }

        console.log(`Загрузка Twitch для ${ch.authorName} (@${username})...`);
        const items = await fetchTwitchMedia(username, ch.authorName);

        for (const item of items) {
            if (!processedVideoIds.has(item.videoId)) {
                processedVideoIds.add(item.videoId);
                allMedia.push(item);
            }
        }
    }

    // Сортировка материалов от самых новых к старым
    allMedia.sort((a, b) => b.rawDate - a.rawDate);

    // Удаляем внутренние служебные поля
    const cleanedMedia = allMedia.map(({ rawDate, videoId, ...item }) => item);

    const resultPayload = {
        media: cleanedMedia
    };

    const outputPath = path.join(__dirname, 'media.json');
    fs.writeFileSync(outputPath, JSON.stringify(resultPayload, null, 2), 'utf-8');
    console.log(`Успешно обновлено! Сохранено ${cleanedMedia.length} элементов в media.json.`);
}

updateMediaJson();
