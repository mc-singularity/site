// ============================================================
// tools/generate-seo.js
// 
// Автогенератор SEO-блока в index.html.
// Читает ВСЕ .json файлы в корне репозитория и формирует
// скрытый HTML-блок для поисковых роботов.
//
// Запуск: node tools/generate-seo.js
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');

// Файлы, которые НЕ нужно включать в SEO-блок
const EXCLUDE_FILES = [
    'package.json',
    'package-lock.json',
    'manifest.json',      // PWA-манифест, не для SEO
    'tsconfig.json',
    '.eslintrc.json',
    'vercel.json',
    'netlify.json'
];

// ============================================================
// УТИЛИТЫ
// ============================================================

function escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function readJSON(filePath, label) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.warn(`⚠️  Ошибка парсинга ${label}: ${e.message} — пропускаю`);
        return null;
    }
}

function truncate(str, max = 300) {
    const s = String(str || '').trim();
    if (s.length <= max) return s;
    return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

// ============================================================
// РЕНДЕР РАЗНЫХ ТИПОВ JSON
// ============================================================

// --- team.json / archive.json: { teamMembers: [...] } / { archiveMembers: [...] }
function renderMembersList(members, title) {
    if (!Array.isArray(members) || members.length === 0) return '';
    const items = members.map(m => {
        const role = m.role ? ` — ${escapeHTML(m.role)}` : '';
        const real = m.realName ? ` (${escapeHTML(m.realName)})` : '';
        return `        <li>${escapeHTML(m.name)}${role}${real}</li>`;
    }).join('\n');
    return `    <h2>${escapeHTML(title)} (${members.length})</h2>\n    <ul>\n${items}\n    </ul>\n`;
}

// --- organizations.json: { organizations: [...] }
function renderOrganizations(orgs) {
    if (!Array.isArray(orgs) || orgs.length === 0) return '';
    const blocks = orgs.map(org => {
        const roles = (org.roles || []).map(r => {
            const members = (r.members || []).join(', ');
            return `        <p><strong>${escapeHTML(r.name)}:</strong> ${escapeHTML(members)}.</p>`;
        }).join('\n');

        const former = (org.formerNames && org.formerNames.length > 0)
            ? `        <p>Прошлые названия: ${escapeHTML(org.formerNames.join(', '))}.</p>\n`
            : '';

        const tagline = org.tagline
            ? `        <p>Слоган: ${escapeHTML(org.tagline)}</p>\n`
            : '';

        const socials = (org.socials || []).length > 0
            ? `        <p>Ссылки: ${org.socials.map(s => escapeHTML(s.url)).join(', ')}</p>\n`
            : '';

        return `    <h3>${escapeHTML(org.name)}</h3>
    <p>${escapeHTML(org.description || '')}</p>
${tagline}${former}${roles}${socials}`;
    }).join('\n\n');

    return `    <h2>Организации (${orgs.length})</h2>\n\n${blocks}\n`;
}

// --- news.json / discord_news.json: { news: [...] } или [...]
function renderNews(messages, title) {
    const list = Array.isArray(messages) ? messages : (messages.news || []);
    if (list.length === 0) return '';

    // Берём только последние 15 новостей, чтобы не раздувать SEO-блок
    const recent = list.slice(0, 15);

    const items = recent.map(item => {
        const date = item.date || (item.timestamp ? new Date(item.timestamp).toLocaleDateString('ru-RU') : '');
        const text = item.text || item.content || item.description || '';
        const cleanText = String(text).replace(/<[^>]*>/g, '').replace(/[*_~`]/g, '').trim();
        const preview = truncate(cleanText, 250);
        return `        <li><strong>${escapeHTML(date)}</strong>: ${escapeHTML(preview)}</li>`;
    }).join('\n');

    return `    <h2>${escapeHTML(title)} (${recent.length} из ${list.length})</h2>\n    <ul>\n${items}\n    </ul>\n`;
}

// --- lore.json: { seasons: [...] }
function renderLore(seasons) {
    if (!Array.isArray(seasons) || seasons.length === 0) return '';
    const blocks = seasons.map(s => {
        const paragraphs = (s.paragraphs || []).map(p =>
            `        <p>${escapeHTML(truncate(String(p).replace(/<[^>]*>/g, ''), 200))}</p>`
        ).join('\n');
        return `    <h3>${escapeHTML(s.title || 'Сезон')}</h3>\n${paragraphs}`;
    }).join('\n');

    return `    <h2>Лор и сезоны (${seasons.length})</h2>\n\n${blocks}\n`;
}

// --- events.json: { events: [...] }
function renderEvents(events) {
    if (!Array.isArray(events) || events.length === 0) return '';
    const items = events.map(e => {
        const date = e.date ? `${escapeHTML(e.date)} — ` : '';
        const title = escapeHTML(e.title || '');
        const text = escapeHTML(truncate(String(e.text || '').replace(/<[^>]*>/g, ''), 200));
        return `        <li>${date}<strong>${title}</strong>: ${text}</li>`;
    }).join('\n');
    return `    <h2>События (${events.length})</h2>\n    <ul>\n${items}\n    </ul>\n`;
}

// --- requirements.json
function renderRequirements(data) {
    if (!data || (!data.items && !data.intro)) return '';
    const items = (data.items || []).map(i => `        <li>${escapeHTML(i)}</li>`).join('\n');
    const afterword = data.afterword ? `    <p>${escapeHTML(data.afterword)}</p>\n` : '';
    return `    <h2>Требования к заявке</h2>
    <p>${escapeHTML(data.intro || '')}</p>
    <ul>
${items}
    </ul>
${afterword}`;
}

// --- media.json: { media: [...] }
function renderMedia(media) {
    if (!Array.isArray(media) || media.length === 0) return '';
    const byAuthor = {};
    media.forEach(m => {
        const a = m.author || 'Без автора';
        if (!byAuthor[a]) byAuthor[a] = [];
        byAuthor[a].push(m);
    });

    const items = Object.entries(byAuthor).map(([author, list]) => {
        const titles = list.slice(0, 10).map(m => {
            const type = m.type === 'stream' ? 'стрим' : m.type === 'short' ? 'shorts' : 'видео';
            return `${escapeHTML(m.title || '')} (${type})`;
        }).join('; ');
        return `        <li><strong>${escapeHTML(author)}</strong>: ${titles}</li>`;
    }).join('\n');

    return `    <h2>Медиа участников (${media.length} записей)</h2>\n    <ul>\n${items}\n    </ul>\n`;
}

// --- info.json: { playerInfos: [...] }
function renderPlayerInfos(infos) {
    if (!Array.isArray(infos) || infos.length === 0) return '';
    const items = infos.map(i => {
        const parts = [];
        if (i.role) parts.push(i.role);
        if (i.realName) parts.push(i.realName);
        if (i.seasonsPeriod) parts.push(`Сезоны: ${i.seasonsPeriod}`);
        return `        <li><strong>${escapeHTML(i.name)}</strong>: ${escapeHTML(parts.join(' · '))}</li>`;
    }).join('\n');
    return `    <h2>Дополнительная информация об игроках (${infos.length})</h2>\n    <ul>\n${items}\n    </ul>\n`;
}

// --- splashes.json: { splashes: [...] }
function renderSplashes(splashes) {
    if (!Array.isArray(splashes) || splashes.length === 0) return '';
    const texts = splashes.slice(0, 20).map(s => escapeHTML(s.text || s)).join(' · ');
    return `    <h2>Слоганы проекта</h2>\n    <p>${texts}</p>\n`;
}

// --- loader.json: { statuses: [...] }
function renderLoader(data) {
    if (!data || !Array.isArray(data.statuses)) return '';
    return `    <h2>Статусы загрузки</h2>\n    <p>${data.statuses.map(s => escapeHTML(s)).join(' · ')}</p>\n`;
}

// ============================================================
// АВТООПРЕДЕЛЕНИЕ ТИПА JSON
// ============================================================

function renderAnyJSON(filename, data) {
    if (!data) return '';

    // По имени файла
    if (filename === 'team.json' && data.teamMembers) {
        return renderMembersList(data.teamMembers, 'Состав команды Singularity');
    }
    if (filename === 'archive.json' && data.archiveMembers) {
        return renderMembersList(data.archiveMembers, 'Архив ушедших игроков');
    }
    if (filename === 'organizations.json' && data.organizations) {
        return renderOrganizations(data.organizations);
    }
    if (filename === 'news.json') {
        return renderNews(data, 'Новости проекта');
    }
    if (filename === 'discord_news.json') {
        return renderNews(data, 'Новости из Discord');
    }
    if (filename === 'lore.json' && data.seasons) {
        return renderLore(data.seasons);
    }
    if (filename === 'events.json' && data.events) {
        return renderEvents(data.events);
    }
    if (filename === 'requirements.json') {
        return renderRequirements(data);
    }
    if (filename === 'media.json' && data.media) {
        return renderMedia(data.media);
    }
    if (filename === 'info.json' && data.playerInfos) {
        return renderPlayerInfos(data.playerInfos);
    }
    if (filename === 'splashes.json' && data.splashes) {
        return renderSplashes(data.splashes);
    }
    if (filename === 'loader.json') {
        return renderLoader(data);
    }

    // Универсальная обработка: если массив — перечислим элементы, если объект — ключи
    if (Array.isArray(data)) {
        const preview = data.slice(0, 10).map(item => {
            if (typeof item === 'string') return escapeHTML(item);
            if (item && item.name) return escapeHTML(item.name);
            if (item && item.title) return escapeHTML(item.title);
            return '';
        }).filter(Boolean).join('; ');
        if (preview) {
            return `    <h2>${escapeHTML(filename)} (${data.length})</h2>\n    <p>${preview}</p>\n`;
        }
    }
    if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length > 0) {
            return `    <h2>${escapeHTML(filename)}</h2>\n    <p>Ключи: ${keys.map(k => escapeHTML(k)).join(', ')}</p>\n`;
        }
    }
    return '';
}

// ============================================================
// СБОРКА SEO-БЛОКА
// ============================================================

function collectAllJSON() {
    const allFiles = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.json'))
        .filter(f => !EXCLUDE_FILES.includes(f))
        .sort();

    console.log(`📂 Найдено JSON-файлов: ${allFiles.length}`);
    allFiles.forEach(f => console.log(`   • ${f}`));

    return allFiles.map(filename => {
        const filePath = path.join(ROOT, filename);
        const data = readJSON(filePath, filename);
        return { filename, data };
    });
}

function buildSEOBlock(jsonEntries) {
    const timestamp = new Date().toISOString();
    const parts = [];

    // Базовая секция — всегда
    parts.push(`    <h1>Singularity — Приватный Minecraft-сервер для контент-мейкеров</h1>
    <p>
        Singularity — приватный игровой сервер Minecraft, созданный для контент-мейкеров (КМ):
        стримеров, ютуберов и авторов коротких видео. Проект работает по принципу закрытого
        сообщества с вайтлистом. IP-адрес и инструкции по подключению выдаются участникам
        в Telegram-группе после одобрения заявки.
    </p>

    <h2>Что есть на сервере Singularity</h2>
    <ul>
        <li>Активное сообщество контент-мейкеров и коллаборации</li>
        <li>Собственный лор и сезонная система развития мира</li>
        <li>Организации и фракции внутри сервера</li>
        <li>Медиа-раздел с видео, стримами и Shorts участников</li>
        <li>Регулярные события и ивенты</li>
    </ul>

    <h2>Как попасть на сервер Singularity</h2>
    <ol>
        <li>Подать заявку через Discord-сервер Singularity</li>
        <li>Дождаться одобрения от администрации</li>
        <li>Получить IP и инструкции в Telegram-группе участников</li>
        <li>Войти в игру после добавления в вайтлист</li>
    </ol>
`);

    // Динамические секции из JSON
    let rendered = 0;
    for (const { filename, data } of jsonEntries) {
        const html = renderAnyJSON(filename, data);
        if (html) {
            parts.push(html);
            rendered++;
        }
    }

    // Контакты — всегда
    parts.push(`    <h2>Контакты и ссылки Singularity</h2>
    <p>
        Discord: https://discord.gg/fnzjSWf88p<br>
        Telegram: https://t.me/singularity_sl<br>
        YouTube: https://www.youtube.com/@Singularity_Mine
    </p>

    <p>
        Singularity — приватный сервер Minecraft для контент-мейкеров, сезон 1, 2026 год.
        Проект создан и поддерживается Суньхуньсяй Inc в коллаборации с CloverS_Kid.
    </p>`);

    const contentHTML = parts.join('\n\n');

    return {
        html: `<!-- ============================================================
     SEO-БЛОК ДЛЯ ПОИСКОВЫХ РОБОТОВ
     Сгенерирован автоматически: tools/generate-seo.js
     Дата: ${timestamp}
     JSON-файлов обработано: ${rendered}
     ============================================================ -->
<div id="seo-block" aria-hidden="true" style="
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
">
${contentHTML}
</div>`,
        renderedCount: rendered
    };
}

// ============================================================
// ОБНОВЛЕНИЕ index.html
// ============================================================

function updateIndexHTML(newBlock) {
    let html = fs.readFileSync(INDEX_PATH, 'utf8');

    const startPattern = /<!-- ={10,}[\s\S]*?SEO-БЛОК ДЛЯ ПОИСКОВЫХ РОБОТОВ[\s\S]*?-->\s*<div id="seo-block"/;
    const match = html.match(startPattern);

    if (!match) {
        console.error('❌ Не найден SEO-блок в index.html');
        console.error('   Убедитесь, что там есть комментарий "SEO-БЛОК ДЛЯ ПОИСКОВЫХ РОБОТОВ"');
        process.exit(1);
    }

    const startIdx = match.index;
    const firstDivOpen = html.indexOf('<div', startIdx);
    const firstDivClose = html.indexOf('</div>', firstDivOpen);

    if (firstDivClose === -1) {
        console.error('❌ Не найден закрывающий </div> SEO-блока');
        process.exit(1);
    }

    const endIdx = firstDivClose + '</div>'.length;
    const before = html.slice(0, startIdx);
    const after = html.slice(endIdx);

    fs.writeFileSync(INDEX_PATH, before + newBlock + after, 'utf8');
}

// ============================================================
// ГЛАВНАЯ
// ============================================================

function main() {
    console.log('🔧 Генератор SEO-блока запущен...\n');

    const entries = collectAllJSON();
    if (entries.length === 0) {
        console.error('❌ Не найдено ни одного JSON-файла в корне репозитория');
        process.exit(1);
    }

    console.log('');
    const { html, renderedCount } = buildSEOBlock(entries);
    updateIndexHTML(html);

    console.log('✅ SEO-блок обновлён в index.html');
    console.log(`   JSON обработано: ${renderedCount} из ${entries.length}`);
    console.log(`   Размер блока: ${(html.length / 1024).toFixed(2)} КБ\n`);
    console.log('📌 Не забудьте закоммитить index.html в git.');
}

main();
