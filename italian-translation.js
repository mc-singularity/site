// Italian translation easter egg for pitrmatti
const originalTexts = new Map();

// Translation API configuration
const TRANSLATION_API = {
    // LibreTranslate API (free, open-source, no key required)
    baseUrl: 'https://libretranslate.com/translate',
    sourceLang: 'ru',
    targetLang: 'it',
    // Optional: Add your API key if using a paid instance
    apiKey: null // Will be loaded from environment variable if available
};

// Load API key from environment variable (for GitHub Secrets)
if (typeof process !== 'undefined' && process.env.TRANSLATION_API_KEY) {
    TRANSLATION_API.apiKey = process.env.TRANSLATION_API_KEY;
}

// Cache for translations to avoid repeated API calls
const translationCache = new Map();

async function translateText(text) {
    // Check cache first
    if (translationCache.has(text)) {
        return translationCache.get(text);
    }
    
    // Skip if text doesn't contain Russian
    if (!/[а-яА-ЯЁё]/.test(text)) {
        return text;
    }
    
    // Skip if text is too short or contains only special characters
    if (text.trim().length < 2) {
        return text;
    }
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add API key if available
        if (TRANSLATION_API.apiKey) {
            headers['Authorization'] = `Bearer ${TRANSLATION_API.apiKey}`;
        }
        
        const response = await fetch(TRANSLATION_API.baseUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                q: text,
                source: TRANSLATION_API.sourceLang,
                target: TRANSLATION_API.targetLang,
                format: 'text'
            })
        });
        
        const data = await response.json();
        
        if (data.translatedText) {
            const translatedText = data.translatedText;
            translationCache.set(text, translatedText);
            return translatedText;
        } else {
            console.warn('Translation API error:', data);
            return text; // Return original if translation fails
        }
    } catch (error) {
        console.error('Translation API error:', error);
        return text; // Return original if API call fails
    }
}

async function switchToItalian() {
    console.log('Switching to Italian...');
    
    // Translate all text nodes
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let node;
    let translatedCount = 0;
    const nodesToTranslate = [];
    
    // First pass: collect all nodes that need translation
    while (node = walker.nextNode()) {
        const originalText = node.textContent;
        if (originalText.trim() && 
            !originalText.includes('http') && 
            !originalText.includes('data:') && 
            !originalText.includes('data:image') &&
            /[а-яА-ЯЁё]/.test(originalText) &&
            originalText.trim().length >= 2) {
            nodesToTranslate.push({ node, originalText });
        }
    }
    
    console.log(`Found ${nodesToTranslate.length} nodes to translate`);
    
    // Show loading indicator
    alert(`Перевод ${nodesToTranslate.length} элементов... Пожалуйста, подождите.`);
    
    // Second pass: translate nodes
    for (const { node, originalText } of nodesToTranslate) {
        const translatedText = await translateText(originalText);
        
        if (translatedText !== originalText) {
            originalTexts.set(node, originalText);
            node.textContent = translatedText;
            translatedCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`Translated ${translatedCount} text nodes`);
    alert(`Переведено ${translatedCount} элементов на итальянский!`);
    
    // Show restore button
    document.getElementById('italianRestoreBtn').style.display = 'block';
}

function restoreRussian() {
    // Restore original texts
    originalTexts.forEach((originalText, node) => {
        node.textContent = originalText;
    });

    // Clear the map
    originalTexts.clear();

    // Clear cache
    translationCache.clear();

    // Hide restore button
    document.getElementById('italianRestoreBtn').style.display = 'none';
}
