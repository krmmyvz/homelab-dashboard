// --- src/constants/appConstants.js ---

// Arama motorları için sabitler
export const searchEngines = { 
    google: 'https://www.google.com/search?q=', 
    duckduckgo: 'https://duckduckgo.com/?q=', 
    bing: 'https://www.bing.com/search?q=',
    brave: 'https://search.brave.com/search?q=',
    ecosia: 'https://www.ecosia.org/search?q=',
    startpage: 'https://www.startpage.com/do/search?q=',
    yahoo: 'https://search.yahoo.com/search?p=',
    yandex: 'https://yandex.com/search/?text=',
    custom: '' // Kullanıcı özel URL girebilir
};

// Sürükle-bırak işlemleri için tipler
export const DND_TYPES = {
    CATEGORY: 'category',
    GROUP: 'group',
    SERVER: 'server'
};

// Modal pencerelerinin tipleri
export const MODAL_TYPES = {
    SERVER: 'server',
    CATEGORY: 'category',
    GROUP: 'group',
    CONFIRM: 'confirm',
    TAGS: 'tags'
};

// YENİ: Kenar çubuğu ve ana içerikteki görünüm tipleri
export const VIEW_TYPES = {
    CATEGORY: 'category',
    GROUP: 'group',
    FAVORITES: 'favorites',
    SETTINGS: 'settings'
};