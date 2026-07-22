const fs = require('fs');
const path = require('path');

// Переменные окружения для API ключей
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || '';
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || '';

const MAX_RESULTS_PER_CHANNEL = 5;

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
 * Загрузить список каналов YouTube и Twitch из team.json
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
        const authorName = member.name || member.username || member.nickname || 'Участник';
        let ytUrl = null;
        let twitchUrl = null;

        if (member.socials && Array.isArray(member.socials)) {
            const ytSocial = member.socials.find(s => s.platform && (s.platform.toLowerCase() === 'youtube' || s.platform.toLowerCase() === 'yt'));
            if (ytSocial) ytUrl = ytSocial.url;

            const twSocial = member.socials.find(s => s.platform && (s.platform.toLowerCase() === 'twitch' || s.platform.toLowerCase() === 'tw'));
            if (twSocial) twitchUrl = twSocial.url;
        } else if (member.socials) {
            ytUrl = member.socials.youtube || member.socials.yt;
            twitchUrl = member.socials.twitch || member.socials.tw;
        }

        if (member.youtube) ytUrl = member.youtube;
        if (member.twitch) twitchUrl = member.twitch;

        if (ytUrl) youtubeChannels.push({ channelUrl: ytUrl, authorName });
        if (twitchUrl) twitchChannels.push({ channelUrl: twitchUrl, authorName });
    }

    return { youtubeChannels, twitchChannels };
}

/**
 * Декодирование HTML сущностей
 */
function decodeHTMLEntities(text) {
    if (!text) return '';
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

/**
 * Запрос контента из YouTube API
 */
async function fetchYouTubeMedia(channelId, authorName) {
    if (!YOUTUBE_API_KEY) return [];

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${MAX_RESULTS_PER_CHANNEL}&order=date&type=video&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(searchUrl);
        if (!response.ok) return [];

        const data = await response.json();
        if (!data.items || data.items.length === 0) return [];

        const videoIds = data.items.map(item => item.id?.videoId).filter(Boolean);
        if (videoIds.length === 0) return [];

        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,liveStreamingDetails&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] };

        const detailsMap = {};
        if (detailsData.items) {
            detailsData.items.forEach(v => { detailsMap[v.id] = v; });
        }

        return data.items.map(item => {
            const videoId = item.id?.videoId;
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

            const thumbnail = snippet.thumbnails?.maxres?.url ||
                              snippet.thumbnails?.high?.url ||
                              snippet.thumbnails?.medium?.url ||
                              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            const dateObj = new Date(snippet.publishedAt);

            return {
                title: decodeHTMLEntities(snippet.title),
                author: authorName || snippet.channelTitle,
                platform: 'youtube',
                type: mediaType,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                videoUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`,
                thumbnail: thumbnail,
                date: dateObj.toISOString().split('T')[0],
                rawDate: dateObj.getTime(),
                uniqueId: `yt_${videoId}`
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

        // Онлайн-стрим
        const streamRes = await fetch(`https://api.twitch.tv/helix/streams?user_id=${userId}`, { headers });
        if (streamRes.ok) {
            const streamData = await streamRes.json();
            if (streamData.data && streamData.data.length > 0) {
                const stream = streamData.data[0];
                const dateObj = new Date(stream.started_at);
                const thumb = stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720');

                mediaList.push({
                    title: stream.title,
                    author: authorName || stream.user_name,
                    platform: 'twitch',
                    type: 'stream',
                    url: `https://www.twitch.tv/${stream.user_login}`,
                    videoUrl: null,
                    thumbnail: thumb,
                    date: dateObj.toISOString().split('T')[0],
                    rawDate: dateObj.getTime(),
                    uniqueId: `tw_live_${stream.id}`
                });
            }
        }

        // Сохраненные VOD
        const videosRes = await fetch(`https://api.twitch.tv/helix/videos?user_id=${userId}&first=${MAX_RESULTS_PER_CHANNEL}`, { headers });
        if (videosRes.ok) {
            const videosData = await videosRes.json();
            if (videosData.data && videosData.data.length > 0) {
                for (const v of videosData.data) {
                    const dateObj = new Date(v.created_at);
                    let thumb = v.thumbnail_url
                        ? v.thumbnail_url.replace('%width%', '1280').replace('%height%', '720')
                        : `https://static-cdn.jtvnw.net/ttv-static/404_preview-1280x720.jpg`;

                    mediaList.push({
                        title: v.title,
                        author: authorName || v.user_name,
                        platform: 'twitch',
                        type: v.type === 'archive' ? 'stream' : 'video',
                        url: v.url,
                        videoUrl: null,
                        thumbnail: thumb,
                        date: dateObj.toISOString().split('T')[0],
                        rawDate: dateObj.getTime(),
                        uniqueId: `tw_vod_${v.id}`
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
    const processedIds = new Set();

    // Обработка YouTube
    for (const ch of youtubeChannels) {
        const channelId = await resolveYouTubeChannelId(ch.channelUrl, ch.authorName);
        if (!channelId) {
            console.log(`Не удалось определить YouTube Channel ID для: ${ch.channelUrl}`);
            continue;
        }

        console.log(`Загрузка YouTube для ${ch.authorName}...`);
        const items = await fetchYouTubeMedia(channelId, ch.authorName);

        for (const item of items) {
            if (!processedIds.has(item.uniqueId)) {
                processedIds.add(item.uniqueId);
                allMedia.push(item);
            }
        }
    }

    // Обработка Twitch
    for (const ch of twitchChannels) {
        const username = extractTwitchUsername(ch.channelUrl);
        if (!username) {
            console.log(`Не удалось распарсить Twitch никнейм из: ${ch.channelUrl}`);
            continue;
        }

        console.log(`Загрузка Twitch для ${ch.authorName} (@${username})...`);
        const items = await fetchTwitchMedia(username, ch.authorName);

        for (const item of items) {
            if (!processedIds.has(item.uniqueId)) {
                processedIds.add(item.uniqueId);
                allMedia.push(item);
            }
        }
    }

    // Сортировка материалов от самых новых к старым
    allMedia.sort((a, b) => b.rawDate - a.rawDate);

    // Удаляем служебные поля перед сохранением
    const cleanedMedia = allMedia.map(({ rawDate, uniqueId, ...item }) => item);

    const resultPayload = {
        media: cleanedMedia
    };

    const outputPath = path.join(__dirname, 'media.json');
    fs.writeFileSync(outputPath, JSON.stringify(resultPayload, null, 2), 'utf-8');
    console.log(`Успешно обновлено! Сохранено ${cleanedMedia.length} элементов в media.json.`);
}

updateMediaJson();
