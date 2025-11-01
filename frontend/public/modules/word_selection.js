// frontend/public/modules/word_selection.js
// (НОВЫЙ ФАЙЛ)
// Этот модуль содержит логику для экрана выбора слов (Этап 1)

export function selectWord(appInstance, event, russianWord) {
    // Обрабатывает клик по слову на экране выбора слов
    appInstance.playSoundClick();
    event.stopPropagation(); // Предотвращаем всплытие события (например, для категорий)
    // Сохраняем позицию скролла перед ререндером
    appInstance.scrollPosition = document.querySelector('.dictionary-view-container')?.scrollTop ?? 0;
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return; // Сессии нет
    const index = s.selectedWords.indexOf(russianWord);
    if (index > -1) {
        s.selectedWords.splice(index, 1); // Убираем слово из выбранных
    } else {
        s.selectedWords.push(russianWord); // Добавляем слово в выбранные
    }

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    appInstance.render(); // Перерисовываем экран выбора слов
}

// (ИЗМЕНЕНО) Добавлен 'activeTab'
export function selectAllWords(appInstance, activeTab = 'words') {
    // Выбирает все доступные слова/фразы для текущего профиля, языка И АКТИВНОЙ ВКЛАДКИ
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return;
    const lang = profile.language;

    // (ИЗМЕНЕНО) Определяем нужный словарь (words/phrases)
    let dict;
    if (lang === 'bilingual') {
        const czDict = (activeTab === 'words') ? appInstance.categorizedCzechWords : appInstance.categorizedCzechPhrases;
        const enDict = (activeTab === 'words') ? appInstance.categorizedEnglishWords : appInstance.categorizedEnglishPhrases;
        // Объединяем ключи из обоих языков для текущего типа (words/phrases)
        const combined = {};
        Object.values(czDict).forEach(cat => Object.assign(combined, cat));
        Object.values(enDict).forEach(cat => Object.assign(combined, cat));
        dict = combined;
    } else if (lang === 'czech') {
        const czDict = (activeTab === 'words') ? appInstance.categorizedCzechWords : appInstance.categorizedCzechPhrases;
        dict = Object.values(czDict).reduce((acc, cat) => ({...acc, ...cat}), {});
    } else { // english
        const enDict = (activeTab === 'words') ? appInstance.categorizedEnglishWords : appInstance.categorizedEnglishPhrases;
        dict = Object.values(enDict).reduce((acc, cat) => ({...acc, ...cat}), {});
    }

    const dictKeys = Object.keys(dict);

    // (ИЗМЕНЕНО) Добавляем только те слова/фразы, которых еще нет в selectedWords
    const wordsToAdd = dictKeys.filter(word => !s.selectedWords.includes(word));
    s.selectedWords.push(...wordsToAdd);

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    appInstance.render();
}


export function deselectAllWords(appInstance) {
    // Снимает выбор со всех слов (не зависит от вкладки)
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return;
    s.selectedWords = []; // Очищаем массив выбранных

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    appInstance.render();
}

// (ИЗМЕНЕНО) Добавлен 'activeTab'
export function selectCategory(appInstance, categoryName, select, activeTab = 'words') {
    // Выбирает или снимает выбор со всех слов/фраз в указанной категории И АКТИВНОЙ ВКЛАДКЕ
    appInstance.playSoundClick();
    // Сохраняем скролл
    appInstance.scrollPosition = document.querySelector('.dictionary-view-container')?.scrollTop ?? 0;
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return;
    const lang = profile.language;

    // (ИЗМЕНЕНО) Определяем нужный категоризированный словарь (words/phrases)
    let dict;
    if (lang === 'bilingual') {
        // В билингвальном режиме нам нужны словари обоих языков для текущего типа (words/phrases)
        const czDict = (activeTab === 'words') ? appInstance.categorizedCzechWords : appInstance.categorizedCzechPhrases;
        const enDict = (activeTab === 'words') ? appInstance.categorizedEnglishWords : appInstance.categorizedEnglishPhrases;
        // Берем категорию из обоих, если она есть
        const wordsCz = czDict[categoryName] ? Object.keys(czDict[categoryName]) : [];
        const wordsEn = enDict[categoryName] ? Object.keys(enDict[categoryName]) : [];
        // Объединяем уникальные слова/фразы из этой категории для обоих языков
        dict = [...new Set([...wordsCz, ...wordsEn])];
    } else if (lang === 'czech') {
        const czDict = (activeTab === 'words') ? appInstance.categorizedCzechWords : appInstance.categorizedCzechPhrases;
        dict = czDict[categoryName] ? Object.keys(czDict[categoryName]) : [];
    } else { // english
        const enDict = (activeTab === 'words') ? appInstance.categorizedEnglishWords : appInstance.categorizedEnglishPhrases;
        dict = enDict[categoryName] ? Object.keys(enDict[categoryName]) : [];
    }

    if (!dict || (Array.isArray(dict) && dict.length === 0)) return; // Категории нет или она пуста для этого типа

    const wordsInCategory = Array.isArray(dict) ? dict : []; // Убедимся, что это массив

    if (select) { // Если нужно выбрать
        // Добавляем только те слова/фразы, которых еще нет в selectedWords
        const wordsToAdd = wordsInCategory.filter(word => !s.selectedWords.includes(word));
        s.selectedWords.push(...wordsToAdd);
    } else { // Если нужно снять выбор
        // Оставляем только те слова/фразы, которых НЕТ в этой категории ИЛИ они не относятся к этому типу
        s.selectedWords = s.selectedWords.filter(word => !wordsInCategory.includes(word));
    }

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    appInstance.render();
}

