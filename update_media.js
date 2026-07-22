const fs = require('fs');
const path = require('path');

// Ключ берётся из секретов GitHub Actions (или локального окружения)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';

// Список YouTube Channel ID участников или проекта
// Для добавления новых каналов укажите их Channel ID и имя автора
const CHANNELS = [
    { channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw', authorName: 'Singularity' }
    // Пример добавления других каналов:
    // { channelId: 'UCXXXXXXXXXXXXXXXXXXXXXX', authorName: 'ИмяИгрока' }
];

const MAX_RESULTS_PER_CHANNEL = 5;

/**
 * Запрос к YouTube Data API v3
 */
async function fetchYouTubeMedia(channelId, authorName) {
    if (!YOUTUBE_API_KEY) {
        console.error('Ошибка: API Ключ YOUTUBE_API_KEY не передан в окружение!');
        return [];
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${MAX_RESULTS_PER_CHANNEL}&order=date&type=video&key=${YOUTUBE_API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`Ошибка API YouTube (${response.status}): ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.items) return [];

        return data.items.map(item => {
            const videoId = item.id?.videoId;
            const snippet = item.snippet;

            if (!videoId || !snippet) return null;

            const isLive = snippet.liveBroadcastContent === 'live';
            const mediaType = isLive ? 'stream' : 'video';

            // Выбираем превью наивысшего качества
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
                rawDate: dateObj.getTime()
            };
        }).filter(Boolean);
    } catch (error) {
        console.error(`Ошибка при получении данных с канала ${channelId}:`, error.message);
        return [];
    }
}
