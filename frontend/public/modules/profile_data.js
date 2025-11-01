// frontend/public/modules/profile_data.js
// Этот модуль содержит логику для выбора активного профиля,
// загрузки его учебных материалов и подготовки внутренних словарей (кэшей).

/**
 * Получает текущий активный профиль из state, инициализируя его при необходимости.
 * @param {App} appInstance
 * @returns {object|null}
 */
export function getActiveProfile(appInstance) {
    const profileId = appInstance.state.activeProfileId;
    if (!profileId) return null;
    if (!appInstance.state.progress) appInstance.state.progress = {};
    
    // Если прогресса для профиля нет, инициализируем его дефолтным состоянием
    if (!appInstance.state.progress[profileId]) {
        console.log(`Initializing default profile state for ${profileId}`);
        // Используем глубокую копию дефолтного состояния
        appInstance.state.progress[profileId] = JSON.parse(JSON.stringify(appInstance.defaultProfileState));
    }
    
     const savedLang = sessionStorage.getItem('dashboardLanguage');
     // Восстанавливаем сохраненный язык дашборда
     if (savedLang && appInstance.state.progress[profileId]) {
         appInstance.state.progress[profileId].language = savedLang;
     }
    return appInstance.state.progress[profileId];
}

/**
 * Устанавливает активный профиль и запускает процесс его загрузки.
 * @param {App} appInstance
 * @param {string} profileId
 */
export function setActiveProfile(appInstance, profileId) {
    appInstance.playSoundClick();
    appInstance.state.activeProfileId = profileId;
    sessionStorage.setItem('activeProfileId', profileId);
    appInstance.categoryOpenState = {}; // Сброс состояния открытых категорий

    loadActiveProfileData(appInstance);
    
    // ВАЖНО: Загружаем прогресс (включая сессии с сервера) ПЕРЕД загрузкой из localStorage
    appInstance.loadUserProgress().then(() => {
        appInstance.loadActiveSessionsFromLocalStorage(); // Объединяем с локальными, если есть
        appInstance.navigateTo('profileDashboard');
    });
}

/**
 * Загружает словари и тексты для активного профиля и кэширует их.
 * @param {App} appInstance
 */
export function loadActiveProfileData(appInstance) {
    const profileId = appInstance.state.activeProfileId;
    if (!profileId) return;

    const [type, ...idParts] = profileId.split('.');
    const id = idParts.join('.');
    const dataStore = type === 'levels' ? appInstance.state.userDictionaries : appInstance.state.customStories;

    // Проверка, что данные для профиля существуют
    if (!dataStore || !dataStore[id]){
        console.warn("Данные для профиля", profileId, "еще не загружены или не существуют.");
        
        // Перенаправляем, если находимся на экране, требующем данных профиля
        if (!['start', 'userSettings', 'about', 'dictionaryEditor', 'storyEditor', 'login', 'profileSelection'].includes(appInstance.state.screen)) {
             console.warn("Перенаправление на 'profileSelection', так как данные профиля отсутствуют.");
             appInstance.state.activeProfileId = null;
             sessionStorage.removeItem('activeProfileId');
             appInstance.navigateTo('profileSelection');
        }
        return;
    }

    const data = dataStore[id];
    appInstance.activeData = data;
    
    // Извлечение и безопасное категорирование данных
    const czechData = data.czech || {};
    const englishData = data.english || {};
    const safeEnsureCategorized = (dictData) => dictData ? appInstance.ensureCategorized(dictData) : {};
    
    appInstance.categorizedCzechWords = safeEnsureCategorized(czechData.words);
    appInstance.categorizedCzechPhrases = safeEnsureCategorized(czechData.phrases);
    appInstance.categorizedEnglishWords = safeEnsureCategorized(englishData.words);
    appInstance.categorizedEnglishPhrases = safeEnsureCategorized(englishData.phrases);
    
    // Создание плоских словарей (ru -> foreign)
    const flatten = (dict) => Object.values(dict || {}).reduce((acc, val) => ({ ...acc, ...val }), {});
    appInstance.ruCzechDict = { ...flatten(appInstance.categorizedCzechWords), ...flatten(appInstance.categorizedCzechPhrases) };
    appInstance.ruEnglishDict = { ...flatten(appInstance.categorizedEnglishWords), ...flatten(appInstance.categorizedEnglishPhrases) };
    
    // Создание инвертированного словаря (foreign -> ru) для поиска в историях
    appInstance.invertedDictionary = {
        ...Object.entries(appInstance.ruCzechDict).reduce((a, [ru, cz]) => ({ ...a, [String(cz).toLowerCase()]: ru }), {}),
        ...Object.entries(appInstance.ruEnglishDict).reduce((a, [ru, en]) => ({ ...a, [String(en).toLowerCase()]: ru }), {})
    };
}
