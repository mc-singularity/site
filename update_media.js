const fs = require('fs');
const path = require('path');

// Ключ из секретов GitHub Actions или переменной окружения
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

const MAX_RESULTS_PER_CHANNEL = 5;

// Кэш для преобразования ссылок/хэндлов в channelId
const channelIdCache = {};

/**
 * Парсер ISO 8601 продолжительности роликов (напр. PT1M45S -> 105 сек)
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
 * Получить Channel ID из YouTube URL или хэндла (@username)
 */
async function resolveChannelId(youtubeUrl, authorName) {
    if (!youtubeUrl) return null;

    const trimmedUrl = youtubeUrl.trim();

    // 1. Прямая ссылка вида youtube.com/channel/UC...
    const directChannelMatch = trimmedUrl.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (directChannelMatch) {
        return directChannelMatch[1];
    }

    // 2. Если введена строка вида UC...
    if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmedUrl)) {
        return trimmedUrl;
    }

    // 3. Извлечение @хэндла или имя пользователя
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

    // Запрос 1: Поиск ID через API по handle
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
        console.error(`Ошибка при поиске ID для @${handle}:`, e.message);
    }

    // Запрос 2: Поиск канала по имени
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
        console.error(`Резервный поиск не удался для ${handle}:`, e.message);
    }

    return null;
}

/**
 * Загрузить список участников из team.json
 */
function loadChannelsFromTeamJson() {
    const channels = [];

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
        return [
            { channelUrl: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', authorName: 'Singularity' }
        ];
    }

    const members = Array.isArray(teamData) ? teamData : (teamData.members || teamData.team || teamData.teamMembers || []);

    for (const member of members) {
        const authorName = member.name || member.username || member.nickname || 'Участник';
        let ytUrl = null;

        if (member.socials && Array.isArray(member.socials)) {
            const ytSocial = member.socials.find(s => s.platform && (s.platform.toLowerCase() === 'youtube' || s.platform.toLowerCase() === 'yt'));
            if (ytSocial) ytUrl = ytSocial.url;
        } else if (member.socials && (member.socials.youtube || member.socials.yt)) {
            ytUrl = member.socials.youtube || member.socials.yt;
        } else if (member.youtube) {
            ytUrl = member.youtube;
        }

        if (ytUrl) {
            channels.push({ channelUrl: ytUrl, authorName });
        }
    }

    return channels;
}

/**
 * Запрос видео по Channel ID с точным определением формата (Видео, Стрим, Shorts)
 */
async function fetchYouTubeMedia(channelId, authorName) {
    if (!YOUTUBE_API_KEY) {
        console.error('Ошибка: API Ключ YOUTUBE_API_KEY не передан!');
        return [];
    }

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${MAX_RESULTS_PER_CHANNEL}&order=date&type=video&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(searchUrl);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Ошибка API YouTube (${response.status}): ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) return [];

        // Собираем видео ID для деталей
        const videoIds = data.items.map(item => item.id?.videoId).filter(Boolean);
        if (videoIds.length === 0) return [];

        // Запрос детальнее: получение длительности роликов (contentDetails)
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = detailsRes.ok ? await detailsRes.json() : { items: [] };

        const detailsMap = {};
        if (detailsData.items) {
            detailsData.items.forEach(v => {
                detailsMap[v.id] = v;
            });
        }

        return data.items.map(item => {
            const videoId = item.id?.videoId;
            const snippet = item.snippet;

            if (!videoId || !snippet) return null;

            const detailItem = detailsMap[videoId];
            const durationSec = detailItem ? parseISO8601Duration(detailItem.contentDetails?.duration) : 0;

            const isLive = snippet.liveBroadcastContent === 'live' || snippet.liveBroadcastContent === 'upcoming';
            const isShort = !isLive && (durationSec > 0 && durationSec <= 60) || snippet.title.toLowerCase().includes('#shorts');

            let mediaType = 'video';
            if (isLive) {
                mediaType = 'stream';
            } else if (isShort) {
                mediaType = 'short';
            }

            const thumbnail = snippet.thumbnails?.maxres?.url ||
                              snippet.thumbnails?.high?.url ||
                              snippet.thumbnails?.medium?.url ||
                              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            const dateObj = new Date(snippet.publishedAt);
            const formattedDate = dateObj.toISOString().split('T')[0];

            return {
                title: snippet.title,
                author: authorName || snippet.channelTitle,
                type: mediaType,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: thumbnail,
                date: formattedDate,
                rawDate: dateObj.getTime(),
                videoId: videoId
            };
        }).filter(Boolean);
    } catch (error) {
        console.error(`Ошибка при запросе к каналу ${channelId}:`, error.message);
        return [];
    }
}

/**
 * Главная функция
 */
async function updateMediaJson() {
    console.log('Чтение состава из team.json...');
    const channelList = loadChannelsFromTeamJson();
    console.log(`Найдено каналов для обработки: ${channelList.length}`);

    let allMedia = [];
    const processedVideoIds = new Set();

    for (const ch of channelList) {
        const channelId = await resolveChannelId(ch.channelUrl, ch.authorName);
        if (!channelId) {
            console.log(`Не удалось определить Channel ID для: ${ch.channelUrl} (${ch.authorName})`);
            continue;
        }

        console.log(`Загрузка видео для ${ch.authorName} (ID: ${channelId})...`);
        const items = await fetchYouTubeMedia(channelId, ch.authorName);

        for (const item of items) {
            if (!processedVideoIds.has(item.videoId)) {
                processedVideoIds.add(item.videoId);
                allMedia.push(item);
            }
        }
    }

    // Сортировка свежих материалов сверху
    allMedia.sort((a, b) => b.rawDate - a.rawDate);

    // Очистка от внутренних технических свойств
    const cleanedMedia = allMedia.map(({ rawDate, videoId, ...item }) => item);

    const resultPayload = {
        media: cleanedMedia
    };

    const outputPath = path.join(__dirname, 'media.json');
    fs.writeFileSync(outputPath, JSON.stringify(resultPayload, null, 2), 'utf-8');
    console.log(`Успешно обновлено! Сохранено ${cleanedMedia.length} видео/стримов/shorts в media.json.`);
}

updateMediaJson();
