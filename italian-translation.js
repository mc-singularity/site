// Italian translation easter egg for pitrmatti
const originalTexts = new Map();
const italianTranslations = {
    'НОВОСТИ': 'NOTIZIE',
    '×': '×',

    'Конец первого сезона': 'Fine della prima stagione',
    'Набор': 'Reclutamento',
    'Старт первого сезона': 'Inizio della prima stagione',
    'Сервер принимает участие в королевской битве составом : Лайн, Эндер, Озди, Тии':
        'Il server partecipa alla battaglia reale con la squadra: Lain, Ender, Ozdi, Tii',
    'Конец стартового сезона': 'Fine della stagione iniziale',

    'В одной из пещер игроком MR0zdi был обнаружен парящий кристалл аметиста!':
        'In una delle grotte il giocatore MR0zdi ha trovato un cristallo di ametista fluttuante!',

    'Что было замечено?':
        'Cosa è stato osservato?',

    'Аметист был окружен какой-то аметистовой "пылью";':
        'L\'ametista era circondata da una sorta di "polvere" di ametista;',

    'Аметист разряжает энергию в существ при приближении;':
        'L\'ametista scarica energia negli esseri viventi quando si avvicinano;',

    'Рядом с аметистом находились усиленные существа, покрытые кристаллами аметиста.':
        'Vicino all\'ametista c\'erano creature potenziate ricoperte di cristalli di ametista.',

    'Можно ли его как-то использовать?':
        'È possibile utilizzarlo in qualche modo?',

    'В ТГК посты так же отправлены':
        'I post sono stati inviati anche nel canale Telegram',

    'Незаметное напоминание про существование ТГК':
        'Un piccolo promemoria sull\'esistenza del canale Telegram',

    'И так же Я, Кловер, хочу извиниться за то, что не вёл ТГК сервера и дискорд так, как стоило бы, спихнув надежду на состав. Впредь буду стараться постить все новости в обе сети хотя бы не раз в пол года :emoji_6: ( сарказм )':
        'Inoltre io, Clover, voglio scusarmi per non aver gestito il canale Telegram del server e Discord come avrei dovuto, affidandomi troppo alla squadra. D\'ora in poi cercherò di pubblicare tutte le notizie su entrambe le piattaforme almeno una volta ogni sei mesi :emoji_6: ( sarcasmo )',

    'Краткая сводка всего, что происходило на 1 сезоне за всё время!':
        'Breve riassunto di tutto ciò che è successo durante la prima stagione!',

    '( К объяснениям будут прилагаться скрины и ссылки на посты )':
        '(Alle spiegazioni saranno allegati screenshot e link ai post)',


    'Глобальное':
        'Globale',

    'Был обнаружен странный росток.':
        'È stato scoperto uno strano germoglio.',

    'И что самое ужасное - он растёт, его нельзя разрушить, и вместе с этим иссушает всё вокруг!':
        'E la cosa peggiore è che cresce, non può essere distrutto e nel frattempo prosciuga tutto ciò che lo circonda!',

    'В мире возникли неизвестные столбы из красной магмы(?).':
        'Nel mondo sono comparsi misteriosi pilastri di magma rosso(?).',

    'И вскоре после этого на спавн упал метеорит с непонятным сообщением! ( ссылка на пост в тг ).':
        'Poco dopo, un meteorite è caduto allo spawn con un messaggio incomprensibile! (link al post Telegram).',

    'С тех пор с ними ничего не происходило, но кто знает, надолго ли это?':
        'Da allora non è successo più nulla, ma chissà quanto durerà?',

    'Около дерева, на его корнях и в глуби пещеры были найдены обрывки записок.':
        'Vicino all\'albero, sulle sue radici e nelle profondità della grotta sono stati trovati frammenti di appunti.',

    'Похоже, в них объясняется, что это за дерево... Но это всё равно ничего не объясняет!':
        'Sembra che spieghino cosa sia questo albero... Ma in realtà non spiegano ancora nulla!',

    'А теперь к более мирским событиям:':
        'Ora passiamo agli eventi più comuni:',

    'Странствующие торговцы начали продавать рецепты алкоголя!':
        'I mercanti erranti hanno iniziato a vendere ricette per l\'alcol!',

    'К первой покупке прилагается книжка, в которой объясняется, как его варить и как сделать бочку для брожения.':
        'Al primo acquisto viene allegato un libro che spiega come prepararlo e come creare una botte per la fermentazione.',

    'На сервере прошёл суд над игроком LainBerg.':
        'Sul server si è tenuto un processo contro il giocatore LainBerg.',

    'Несколько игроков подали на него иск за его "злодеяния", за которые его обязали выплатить компенсацию, что он и сделал, после чего дело было закрыто.':
        'Diversi giocatori hanno presentato una denuncia contro di lui per le sue "malefatte". È stato obbligato a pagare un risarcimento, cosa che ha fatto, e il caso è stato chiuso.',

    'ЛОР':
        'LORE',

    'СОБЫТИЯ':
        'EVENTI',

    'Пусто':
        'Vuoto',

    'Пустовато..':
        'Abbastanza vuoto..',

    'Скоро..':
        'Presto..',

    '[ ЗАВЕРШЕН ]':
        '[ COMPLETATO ]',

    'СЛЕДУЮЩИЙ СЕЗОН':
        'PROSSIMA STAGIONE',

        'СИНГУЛЯРИТИ - ЗАПУСК (0 сезон)': 'SINGOLARITÀ - AVVIO (Stagione 0)',

    'На сервере обнаружена гравитационная аномалия. Игроки, не посещавшие Энд, прыгают на 1 блок. После посещения Энда прыжок увеличивается до 9,5 блоков без утяжелённого шлема, и сокращается до 1,5 блоков с ним. Такие игроки также влияют на мобов, увеличивая их прыжок.':
    'Sul server è stata scoperta un’anomalia gravitazionale. I giocatori che non hanno visitato l\'End saltano di 1 blocco. Dopo aver visitato l\'End, il salto aumenta fino a 9,5 blocchi senza un elmo pesante e si riduce a 1,5 blocchi con esso. Questi giocatori influenzano anche i mob, aumentando la loro capacità di salto.',

    'Для исследований построили стеклянный купол. Во время экспериментов появились частицы из Энда. Обнаружены два типа аномальных зон: притяжение и отталкивание от поверхности.':
    'Per la ricerca è stata costruita una cupola di vetro. Durante gli esperimenti sono apparse particelle provenienti dall\'End. Sono stati scoperti due tipi di zone anomale: attrazione e repulsione dalla superficie.',

    'Изучено свойство облучения — игрок теряет нормальную гравитацию и не может передавать энергию другим. Ситуация прогрессирует.':
    'È stata studiata la proprietà dell\'esposizione: il giocatore perde la gravità normale e non può trasferire energia agli altri. La situazione peggiora.',

    'Лайн и Азурп разрушили портал в Энд, подозревая через него аномалии. Основана исследовательская компания ГИК и построена лаборатория с тремя этажами для разных уровней знаний.':
    'Lain e Azurp hanno distrutto il portale dell\'End sospettando che fosse collegato alle anomalie. È stata fondata la società di ricerca GIK ed è stato costruito un laboratorio con tre piani per diversi livelli di conoscenza.',

    'Лайн собирает экспедицию в Энд. Там после странной аномалии с эндерманами ростом в 30 блоков они обнаруживают, что шалкеры стали сильнее.':
    'Lain organizza una spedizione nell\'End. Dopo una strana anomalia con enderman alti 30 blocchi, scoprono che gli shulker sono diventati più potenti.',

    'Шалкеры теперь накладывают эффект отравления, наносящий урон. Урон от нескольких шалкеров складывается, даже игрок в полной заритовой броне получает много урона.':
    'Gli shulker ora applicano un effetto veleno che infligge danni. Il danno di più shulker si accumula e persino un giocatore con un\'armatura completa in netherite subisce molti danni.',

    'Воздействие Энда вызывает фиолетовые частицы, более мощную левитацию и эффект тьмы.':
    'L\'influenza dell\'End provoca particelle viola, una levitazione più potente e l\'effetto oscurità.',

    'Азурп нашёл чёрную парящую дыру на базе Эша, которая затянула его. После того как дыра исчезла, из неё вылетела корона Эша и упала в лаву, но не сгорела, а осталась плавать на поверхности.':
    'Azurp ha trovato un buco nero fluttuante nella base di Ash che lo ha risucchiato. Dopo che il buco è scomparso, la corona di Ash è uscita da esso ed è caduta nella lava, ma non è bruciata ed è rimasta a galleggiare sulla superficie.',

    'Азурп после взаимодействия с чёрной дырой избавился от всех видов излучения и заражения, и у него восстановилась нормальная гравитация, как у обычного игрока.':
    'Dopo l\'interazione con il buco nero, Azurp si è liberato da ogni tipo di radiazione e contaminazione e ha riottenuto la gravità normale, come un giocatore comune.',

    'Найдена таинственная записка. Группа игроков (автор, Озди, Эндер, Козинак, Ти и Кловер) отправляется к месту, указанному в записке с координатами, и находит огромную лестницу, ведущую в бездну. Спустившись, они оказываются в бункере.':
    'È stato trovato un misterioso messaggio. Un gruppo di giocatori (autore, Ozdi, Ender, Kozinak, Tii e Clover) si dirige verso il luogo indicato nelle coordinate e trova un’enorme scala che conduce nell’abisso. Scendendo, arrivano in un bunker.',

    'В бункере найдены пять новых предметов: резервуар для антифрм, ловушка для шалкеров, колба для инъекторов, инъектор с лфрм, инъектор с антифрм.':
    'Nel bunker vengono trovati cinque nuovi oggetti: un serbatoio per antifrm, una trappola per shulker, una fiasca per iniettori, un iniettore con lfr m e un iniettore con antifrm.',

    'Ловушка для шалкеров нужна, чтобы отлавливать шалкеров и создавать антифоре. С помощью колбы можно наполнить инъектор антифреймом и излечиться от заражения лфрм.':
    'La trappola per shulker serve per catturare gli shulker e creare antifore. Con la fiasca è possibile riempire un iniettore con antifrm e curare l’infezione da lfrm.',

    'Порядок использования: поймать шалкеров с помощью ловушки, переработать их в специальном оборудовании, передать вещество в колбу, с помощью одной колбы создать восемь инъекторов для излечения. Также колбы можно использовать для питания реактора антифреймом.':
    'Procedura d’uso: catturare gli shulker con la trappola, elaborarli tramite apparecchiature speciali, trasferire la sostanza nella fiasca e creare otto iniettori curativi con una sola fiasca. Le fiasche possono anche essere utilizzate per alimentare il reattore con antifrm.',

    'В досье описывается левит-фермент (лфрм) — аномальный фермент, присутствующий в атмосфере края. Шалкеры накапливают этот фермент и могут выпускать его в концентрированном виде. При контакте с ферментом организм мгновенно заряжается и становится переносчиком. Есть первичные и вторичные симптомы заражения.':
    'Nel dossier viene descritto l’enzima levitante (lfrm): un enzima anomalo presente nell’atmosfera dell’End. Gli shulker accumulano questo enzima e possono rilasciarlo in forma concentrata. Al contatto con l’enzima, l’organismo viene immediatamente caricato e diventa un portatore. Esistono sintomi primari e secondari dell’infezione.',

    'Сезон заканчивается тем, что всех засасывает в некую чёрную дыру.':
    'La stagione termina quando tutti vengono risucchiati da un misterioso buco nero.',

        'СИНГУЛЯРИТИ - 1': 'SINGOLARITÀ - 1',

    'В мире начинают происходить первые аномалии: появляются странные столбы из красной магмы, а на спавн падает метеорит с непонятным сообщением.':
    'Nel mondo iniziano a verificarsi le prime anomalie: compaiono strani pilastri di magma rosso e un meteorite cade allo spawn con un messaggio misterioso.',

    'Вскоре игроки обнаруживают загадочный маленький росток, который абсолютно неуязвим к разрушению и иссушает всё вокруг себя, а рядом с ним также находят магмовые столбы.':
    'Presto i giocatori scoprono un misterioso piccolo germoglio, completamente indistruttibile e capace di prosciugare tutto ciò che lo circonda. Vicino ad esso vengono trovati anche pilastri di magma.',

    'При дальнейшем исследовании в разрастающихся корнях этого растения обнаруживают первые записки, описывающие историю дерева и его способность высасывать жизнь из рек, лесов и морей.':
    'Durante ulteriori ricerche, nelle radici in crescita della pianta vengono trovati i primi appunti che descrivono la storia dell’albero e la sua capacità di assorbire la vita da fiumi, foreste e mari.',

    'Параллельно с этим Эндер находит другие зашифрованные книги — на особом языке, шифром Цезаря и числовым кодом, которые рассказывают о природных аномалиях, кошмарах, потере памяти и жутких существах с фиолетовыми глазами.':
    'Nel frattempo Ender trova altri libri criptati: scritti in una lingua speciale, con il cifrario di Cesare e un codice numerico, che raccontano di anomalie naturali, incubi, perdita di memoria e creature inquietanti dagli occhi viola.',

    'В это же время Озди спускается в шахты и находит пещеру с летающим аметистовым кристаллом, который бьет энергией во всё живое, а также логово неизвестного существа, предупреждающего о надвигающейся тьме.':
    'Nello stesso periodo Ozdi scende nelle miniere e trova una grotta con un cristallo di ametista fluttuante che rilascia energia contro ogni essere vivente, oltre al nido di una creatura sconosciuta che avverte dell’arrivo dell’oscurità.',

    'Дальше события начинают развиваться стремительно: дерево, которое раньше было небольшим, теперь стало совсем огромным и превысило предел высоты самой игры.':
    'Da quel momento gli eventi accelerano: l’albero, che prima era piccolo, diventa enorme e supera persino il limite di altezza del gioco.',

    'Вдобавок заражение теперь распространяется прямо на глазах и уже успело охватить все базы игроков, даже самые дальние.':
    'Inoltre, l’infezione ora si diffonde davanti agli occhi dei giocatori e ha già raggiunto tutte le basi, anche quelle più lontane.',

    'Из древа прямо на поверхности выбрались корни; один из таких корней разрушил одну из адских башен, на месте которой теперь образовалась часть адского измерения.':
    'Dall’albero sono emerse radici direttamente sulla superficie; una di queste ha distrutto una delle torri infernali, lasciando al suo posto una parte della dimensione infernale.',

    'Сущности выбираются из этого измерения и сразу зомбифицируются.':
    'Le entità escono da questa dimensione e vengono immediatamente zombificate.',

    'В конце концов все завершилось тем,что люди нашли лабораторию(Наверное?),и активировали портал,который перенес их в пустоту.':
    'Alla fine tutto si conclude quando le persone trovano un laboratorio (forse?) e attivano un portale che li trasporta nel vuoto.',

        'СИНГУЛЯРИТИ - 2 (СЛЕДУЮЩИЙ СЕЗОН)': 'SINGOLARITÀ - 2 (PROSSIMA STAGIONE)',
    'Следующий сезон': 'Prossima stagione',

    'Скоро..': 'Presto..',

    'В воздухе витает блеск аметиста':
    'Nell’aria fluttua il bagliore dell’ametista',

    'Приватный сервер КМ(Контент Мэйкеров)':
    'Server Privato CM (Content Creator)',

    'Сервер онлайн':
    'Server online',

    'Нет игроков онлайн':
    'Nessun giocatore online',

    'ССЫЛКИ':
    'LINK',

    'НАШ СОСТАВ':
    'IL NOSTRO TEAM',

    'АРХИВ УШЕДШИХ ИГРОКОВ':
    'ARCHIVIO DEI GIOCATORI USCITI',

    'МЕДИА':
    'MEDIA',

    'ВСЕ':
    'TUTTO',

    'ВИДЕО':
    'VIDEO',

    'СТРИМЫ':
    'STREAM',

    'ЮТУБ':
    'YOUTUBE',

    'ЮТУБ СТРИМ':
    'YOUTUBE STREAM',

    'ЮТУБ Shorts':
    'YOUTUBE Shorts',

    'СМОТРЕТЬ':
    'GUARDARE',

    'Финальные титры':
    'Titoli finali',

    'информация':
    'informazioni',

        'Аметистовый дождь начинаеться..':
        'La pioggia di ametiste sta iniziando..',

    'Обновить':
        'Aggiorna',

    'Скрыть состав':
        'Nascondi squadra',

    'А-Я':
        'A-Z',

    'Я-А':
        'Z-A',

    'Информация':
        'Informazioni',

    'Ссылка на пост в тг':
        'Link al post Telegram',

    'VIDEO':
        'VIDEO',


    // Пропущенные события

    'В мире начинают происходить первые аномалии: появляются странные столбы из красной магмы, а на спавн падает метеорит с непонятным сообщением. Вскоре игроки обнаруживают загадочный маленький росток, который абсолютно неуязвим к разрушению и иссушает всё вокруг себя, а рядом с ним также находят магмовые столбы.':
        'Nel mondo iniziano a verificarsi le prime anomalie: compaiono strani pilastri di magma rosso e un meteorite cade allo spawn con un messaggio misterioso. Poco dopo i giocatori scoprono un misterioso piccolo germoglio completamente indistruttibile, che prosciuga tutto ciò che lo circonda, e vicino ad esso vengono trovati anche pilastri di magma.',

    'Дальше события начинают развиваться стремительно: дерево, которое раньше было небольшим, теперь стало совсем огромным и превысило предел высоты самой игры. Вдобавок заражение теперь распространяется прямо на глазах и уже успело охватить все базы игроков, даже самые дальние.':
        'Successivamente gli eventi iniziano ad accelerare: l’albero, che prima era piccolo, diventa enorme e supera il limite massimo di altezza del gioco. Inoltre l’infezione si diffonde davanti agli occhi dei giocatori e ha già raggiunto tutte le basi, anche quelle più lontane.',

    'Из древа прямо на поверхности выбрались корни; один из таких корней разрушил одну из адских башен, на месте которой теперь образовалась часть адского измерения.':
        'Dall’albero sono emerse radici direttamente sulla superficie; una di esse ha distrutto una torre del Nether, lasciando al suo posto una parte della dimensione infernale.',

    'Сущности выбираются из этого измерения и сразу зомбифицируются.':
        'Le entità escono da questa dimensione e vengono immediatamente zombificate.',


    // Сезон 2

    'Аметистовый дождь':
        'Pioggia di ametiste',

    'Аметистовый дождь начинаеться..':
        'La pioggia di ametiste sta iniziando..',


    // Медиа

    'информация Singularity| что будет на новом сезоне сервера?':
        'Informazioni Singularity | cosa ci sarà nella nuova stagione del server?',

    'Финальные титры':
        'Titoli finali',

    'Смотреть':
        'Guarda',

    'СМОТРЕТЬ':
        'GUARDA',

    'ЮТУБ':
        'YOUTUBE',

    'ЮТУБ СТРИМ':
        'YOUTUBE STREAM',

    'ЮТУБ SHORTS':
        'YOUTUBE SHORTS',


    // Названия видео

    'Смотрю в стену':
        'Guardo il muro',

    'Затроллил какого-то чувака Сервера SINGULARITY':
        'Ho trollato un tizio del server SINGULARITY',

    'SL 1 - ИГРАЕМ НА СИНГУЛЯРИТИ В ВР':
        'SL 1 - GIOCHIAMO A SINGOLARITÀ IN VR',

    'SL 1 - ИГРАЕМ НА СИНГУЛЯРИТИ В ВР - продолжение':
        'SL 1 - GIOCHIAMO A SINGOLARITÀ IN VR - continuazione',

    'УНГА БУНГА 🍌':
        'UNGA BUNGA 🍌',

    'Начало 2 сезона FineWorld|Minecraft':
        'Inizio stagione 2 FineWorld | Minecraft',

    'Набор на сервер FineWorld | Minecraft':
        'Reclutamento per il server FineWorld | Minecraft',

    'заявка на Singularity':
        'Candidatura per Singularity',

    'заявка на SINGULARITY':
        'Candidatura per SINGULARITY',

    'Тест':
        'Test',

    'test':
        'test',

    'Это изменит твой Minecraft навсегда #майнкрафт #моды':
        'Questo cambierà Minecraft per sempre #minecraft #mod',

    'Набор В Команду| Kappyr-team':
        'Reclutamento nel team | Kappyr-team',

    'КАК МЫ УЗНАЛИ О ВЕЛИКОМ ЗАРАЖЕНИИ ДЕРЕВА В МАЙНКРАФТЕ SINGULARITY':
        'COME ABBIAMO SCOPERTO LA GRANDE INFEZIONE DELL’ALBERO IN MINECRAFT SINGULARITY',

    'МОНСТР СРЕДИ НАС В МАЙНКРАФТЕ':
        'UN MOSTRO TRA NOI IN MINECRAFT',

    '2000 алмазов долга: не повторяйте моих ошибок':
        '2000 diamanti di debito: non ripetete i miei errori',

    'Я УМЕР и ПОТЕРЯЛ ВСЁ на сервере Minecraft! 😱':
        'SONO MORTO e HO PERSO TUTTO sul server Minecraft! 😱',

    'MINECRAFT ИНТЕРВЬЮ НА ПРИВАТНОМ СЕРВЕРЕ':
        'INTERVISTA MINECRAFT SU UN SERVER PRIVATO',

    'Месть за убийства | Minecraft':
        'Vendetta per gli omicidi | Minecraft',

    'КОГДА У ДРУГА БОЛЬШОЙ ПИНГ':
        'QUANDO UN AMICO HA UN PING ALTO',

    'МАЙНКРАФТ СКИНЫ':
        'SKIN DI MINECRAFT',

    'ГОЛОСОВАНИЕ':
        'VOTAZIONE',

    'Сингулярити старт первого сезона!':
        'Inizio della prima stagione di Singolarità!',

    'Minecraft Stream,но я просто выживаю...':
        'Minecraft Stream, ma sto solo sopravvivendo...',

    'Майкрафт стрим ,но я играю с версии с которой я начал играть в майкрафт!!!':
        'Minecraft stream, ma gioco alla versione con cui ho iniziato a giocare a Minecraft!!!',

    'Пишу головного ассистента - Целеста #jarvis #voiceassistant':
        'Creo l’assistente principale - Celesta #jarvis #voiceassistant',

    'Создаем магазин в supermarket togheter! -- ft Themday, Sanya':
        'Creiamo un negozio in Supermarket Together! -- ft Themday, Sanya',

    'Отрывок моей анимации':
        'Estratto della mia animazione',

    'Singularity новый сервере по ВАНИЛЕ':
        'Singularity nuovo server vanilla',

};

// Гарантируем, что кнопка скрыта при загрузке страницы, даже если что-то пошло не так
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('italianRestoreBtn');
    if (btn) {
        btn.style.display = 'none';
    }
});

function switchToItalian() {
    console.log('Switching to Italian...');
    
    // Sort translations by length (longest first) to prevent partial replacements
    const sortedTranslations = Object.entries(italianTranslations)
        .sort((a, b) => b[0].length - a[0].length);
    
    // Translate all text nodes directly without storing
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    let translatedCount = 0;
    
    while (node = walker.nextNode()) {
        const originalText = node.textContent;
        if (originalText.trim() && !originalText.includes('http') && !originalText.includes('data:') && !originalText.includes('data:image')) {
            // Check if text contains Russian characters
            if (/[а-яА-ЯЁё]/.test(originalText)) {
                let translatedText = originalText;
                
                for (const [russian, italian] of sortedTranslations) {
                    // Try exact match first
                    if (translatedText === russian) {
                        translatedText = italian;
                        break;
                    }
                    // Then try word boundary replacement (whole words only)
                    const escapedRussian = russian.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const wordBoundaryPattern = new RegExp(`\\b${escapedRussian}\\b`, 'gi');
                    translatedText = translatedText.replace(wordBoundaryPattern, italian);
                }
                
                if (translatedText !== originalText) {
                    originalTexts.set(node, originalText);
                    node.textContent = translatedText;
                    translatedCount++;
                }
            }
        }
    }
    
    console.log(`Translated ${translatedCount} text nodes`);
    
    // Show restore button
    const btn = document.getElementById('italianRestoreBtn');
    if (btn) {
        btn.style.display = 'block';
    }
}

function restoreRussian() {
    // Restore original texts
    originalTexts.forEach((originalText, node) => {
        node.textContent = originalText;
    });

    // Clear the map
    originalTexts.clear();

    // Hide restore button
    const btn = document.getElementById('italianRestoreBtn');
    if (btn) {
        btn.style.display = 'none';
    }
}
