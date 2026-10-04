// ============================================================
// tools/generate-seo.js
// 
// Автогенератор SEO-блока в index.html.
// Читает team.json и organizations.json, генерирует скрытый HTML-блок
// для поисковых роботов и заменяет его в index.html.
//
// Запуск: node tools/generate-seo.js
// 
// Скрипт ищет в index.html маркер "SEO-БЛОК ДЛЯ ПОИСКОВЫХ РОБОТОВ"
// и заменяет содержимое <div id="seo-block">...</div> на актуальное.
// ============================================================

const fs = require('fs');
const path = require('path');

// Корень репозитория — на уровень выше папки tools/
const ROOT = path.join(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');
const TEAM_PATH = path.join(ROOT, 'team.json');
const ORGS_PATH = path.join(ROOT, 'organizations.json');

// ---------- Утилиты ----------
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
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Файл не найден: ${filePath}`);
        process.exit(1);
    }
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.error(`❌ Ошибка парсинга ${label}:`, e.message);
        process.exit(1);
    }
}

// ---------- Генерация секций ----------
function buildTeamList(team) {
    const members = team.teamMembers || [];
    if (members.length === 0) {
        return '        <li>Состав пока не заполнен.</li>';
    }

    return members.map(m => {
        const role = m.role ? ` — ${escapeHTML(m.role)}` : '';
        const real = m.realName ? ` (реальное имя: ${escapeHTML(m.realName)})` : '';
        return `        <li>${escapeHTML(m.name)}${role}${real}</li>`;
    }).join('\n');
}

function buildOrgsSection(orgs) {
    const list = orgs.organizations || [];
    if (list.length === 0) {
        return '    <p>Организации пока не заполнены.</p>';
    }

    return list.map(org => {
        const rolesHTML = (org.roles || []).map(r => {
            const members = (r.members || []).join(', ');
            return `        <p>${escapeHTML(r.name)}: ${escapeHTML(members)}.</p>`;
        }).join('\n');

        const former = (org.formerNames && org.formerNames.length > 0)
            ? `        <p>Прошлые названия: ${escapeHTML(org.formerNames.join(', '))}.</p>\n`
            : '';

        const tagline = org.tagline
            ? `        <p>Слоган: ${escapeHTML(org.tagline)}</p>\n`
            : '';

        return `    <h3>${escapeHTML(org.name)}</h3>
    <p>${escapeHTML(org.description || '')}</p>
${tagline}${former}${rolesHTML}`;
    }).join('\n\n');
}

// ---------- Полный SEO-блок ----------
function buildSEOBlock(team, orgs) {
    const teamListHTML = buildTeamList(team);
    const orgsHTML = buildOrgsSection(orgs);
    const timestamp = new Date().toISOString();
    const teamCount = (team.teamMembers || []).length;
    const orgsCount = (orgs.organizations || []).length;

    return `<!-- ============================================================
     SEO-БЛОК ДЛЯ ПОИСКОВЫХ РОБОТОВ
     Снимок важных данных: состав, организации, требования.
     Сгенерирован автоматически: tools/generate-seo.js
     Дата генерации: ${timestamp}
     Игроков: ${teamCount} | Организаций: ${orgsCount}
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
    <h1>Singularity — Приватный Minecraft-сервер для контент-мейкеров</h1>
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
        <li>Адекватное и дружелюбное сообщество</li>
    </ul>

    <h2>Требования для вступления в Singularity</h2>
    <ul>
        <li>Наличие лицензионной версии Minecraft</li>
        <li>Возраст от 15 лет</li>
        <li>Готовность создавать контент (видео, стримы, Shorts)</li>
        <li>Текстовая или видео-заявка в Discord</li>
        <li>Адекватность и уважение к другим участникам</li>
    </ul>

    <h2>Состав команды Singularity (${teamCount} игроков)</h2>
    <ul>
${teamListHTML}
    </ul>

    <h2>Организации на сервере Singularity (${orgsCount})</h2>

${orgsHTML}

    <h2>Как попасть на сервер Singularity</h2>
    <ol>
        <li>Подать заявку через Discord-сервер Singularity</li>
        <li>Дождаться одобрения от администрации</li>
        <li>Получить IP и инструкции в Telegram-группе участников</li>
        <li>Войти в игру после добавления в вайтлист</li>
    </ol>

    <h2>Контакты и ссылки Singularity</h2>
    <p>
        Discord: https://discord.gg/fnzjSWf88p<br>
        Telegram: https://t.me/singularity_sl<br>
        YouTube: https://www.youtube.com/@Singularity_Mine
    </p>

    <p>
        Singularity — приватный сервер Minecraft для контент-мейкеров, сезон 1, 2026 год.
        Проект создан и поддерживается Суньхуньсяй Inc в коллаборации с CloverS_Kid.
    </p>
</div>`;
}

// ---------- Обновление index.html ----------
function updateIndexHTML(newBlock) {
    let html = fs.readFileSync(INDEX_PATH, 'utf8');

    // Ищем открывающий комментарий существующего SEO-блока
    const startPattern = /<!-- ={10,}[\s\S]*?SEO-БЛОК ДЛЯ ПОИСКОВЫХ РОБОТОВ[\s\S]*?-->\s*<div id="seo-block"/;
    const match = html.match(startPattern);

    if (!match) {
        console.error('❌ Не найден существующий SEO-блок в index.html');
        console.error('   Убедитесь, что в файле есть комментарий "SEO-БЛОК ДЛЯ ПОИСКОВЫХ РОБОТОВ"');
        console.error('   и следующий за ним <div id="seo-block">...</div>');
        process.exit(1);
    }

    const startIdx = match.index;

    // Ищем закрывающий </div> блока — идём от начала, считая вложенность
    let depth = 0;
    let i = html.indexOf('<div', startIdx);
    let endIdx = -1;

    // Простой парсер: ищем открывающие <div и закрывающие </div> в этом блоке
    // (внутри seo-block нет вложенных <div>, поэтому достаточно найти первый </div> после старта)
    const firstDivOpen = html.indexOf('<div', startIdx);
    const firstDivClose = html.indexOf('</div>', firstDivOpen);

    if (firstDivClose === -1) {
        console.error('❌ Не найден закрывающий </div> SEO-блока');
        process.exit(1);
    }

    endIdx = firstDivClose + '</div>'.length;

    const before = html.slice(0, startIdx);
    const after = html.slice(endIdx);
    const newHTML = before + newBlock + after;

    fs.writeFileSync(INDEX_PATH, newHTML, 'utf8');
}

// ---------- Точка входа ----------
function main() {
    console.log('🔧 Генератор SEO-блока запущен...');

    const team = readJSON(TEAM_PATH, 'team.json');
    const orgs = readJSON(ORGS_PATH, 'organizations.json');

    console.log(`   team.json: ${(team.teamMembers || []).length} игроков`);
    console.log(`   organizations.json: ${(orgs.organizations || []).length} организаций`);

    const newBlock = buildSEOBlock(team, orgs);

    updateIndexHTML(newBlock);

    console.log('✅ SEO-блок обновлён в index.html');
    console.log(`   Размер блока: ${(newBlock.length / 1024).toFixed(2)} КБ`);
    console.log('');
    console.log('📌 Не забудьте закоммитить index.html в git.');
}

main();
