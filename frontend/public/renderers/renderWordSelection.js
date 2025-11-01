// frontend/public/renderers/renderWordSelection.js
// (Этот файл содержит функцию рендеринга для экрана выбора слов/фраз Этапа 1)

export function renderWordSelection(appInstance, state) {
     // Рендерит экран выбора слов для Этапа 1
     const profile = appInstance.getActiveProfile();
     const s = profile?.sessions?.[profile.language];
     if (!profile || !s) {
         appInstance.navigateTo('profileSelection');
         return `<h1>Загрузка...</h1>`;
     }

     const lang = profile.language;
     const isLevelProfile = state.activeProfileId.startsWith('levels.');

     // (ДОБАВЛЕНО) Определяем активную вкладку (words или phrases)
     // Нам нужно сохранить это в сессии, чтобы выбор сохранялся при переключении языков
     if (!s.selectionTab) {
        s.selectionTab = 'words'; // По умолчанию 'words'
     }
     const activeTab = s.selectionTab;

     let contentHTML = '';

     if (isLevelProfile) {
         // (ИЗМЕНЕНО) Выбираем нужный словарь (words или phrases) на основе activeTab
         let dict, ruCzDict, ruEnDict;

         if (lang === 'bilingual') {
             // В билингвальном режиме объединяем СЛОВА или ФРАЗЫ
             dict = (activeTab === 'words')
                ? appInstance.mergeDictionariesCategorized(appInstance.categorizedCzechWords, appInstance.categorizedEnglishWords)
                : appInstance.mergeDictionariesCategorized(appInstance.categorizedCzechPhrases, appInstance.categorizedEnglishPhrases);

             // ru*Dict нам нужны оба (слова+фразы) для показа перевода
             ruCzDict = appInstance.ruCzechDict;
             ruEnDict = appInstance.ruEnglishDict;
         } else {
             // В моно-языковом режиме
             ruCzDict = (lang === 'czech') ? appInstance.ruCzechDict : {};
             ruEnDict = (lang === 'english') ? appInstance.ruEnglishDict : {};

             if (lang === 'czech') {
                dict = (activeTab === 'words') ? appInstance.categorizedCzechWords : appInstance.categorizedCzechPhrases;
             } else { // english
                dict = (activeTab === 'words') ? appInstance.categorizedEnglishWords : appInstance.categorizedEnglishPhrases;
             }
         }

         const foreignGetter = (ru) => {
            if (lang === 'czech') return ruCzDict[ru] || '';
            if (lang === 'english') return ruEnDict[ru] || '';
            // ruCzechDict и ruEnglishDict уже содержат ВСЕ (слова+фразы)
            return `${appInstance.ruCzechDict[ru] || '?'} / ${appInstance.ruEnglishDict[ru] || '?'}`;
         };

         const categories = Object.keys(dict).sort((a, b) => a.localeCompare(b, 'ru'));

         contentHTML = categories
            .filter(category => dict[category] && typeof dict[category] === 'object' && Object.keys(dict[category]).length > 0)
            .map(category => {
                 const wordsInCategory = Object.keys(dict[category]);
                 const isFullySelected = wordsInCategory.length > 0 && wordsInCategory.every(word => s.selectedWords.includes(word));
                 // (ИЗМЕНЕНО) Передаем activeTab в selectCategory
                 return `<details class="word-category" ${appInstance.categoryOpenState[category] ? 'open' : ''} ontoggle="app.categoryOpenState['${category.replace(/'/g, "\\'")}'] = this.open">
                            <summary class="${isFullySelected ? 'category-fully-selected' : ''}">${category} (${wordsInCategory.length})
                                <span class="category-select-btn" onclick="event.preventDefault(); event.stopPropagation(); app.selectCategory('${category.replace(/'/g, "\\'")}', true, '${activeTab}')">[Выбрать все]</span>
                                <span class="category-select-btn" onclick="event.preventDefault(); event.stopPropagation(); app.selectCategory('${category.replace(/'/g, "\\'")}', false, '${activeTab}')">[Снять все]</span>
                            </summary>
                            <ul>${Object.keys(dict[category]).sort((a, b) => a.localeCompare(b, 'ru')).map(ru =>
                                `<li class="${s.selectedWords.includes(ru) ? 'selected' : ''}" onclick="app.selectWord(event, '${ru.replace(/'/g, "\\'")}')">
                                    <input type="checkbox" ${s.selectedWords.includes(ru) ? 'checked' : ''} readonly>
                                    <label>${ru} &ndash; ${foreignGetter(ru)}</label>
                                </li>`
                            ).join('')}</ul>
                        </details>`;
             }).join('');

        if (contentHTML.length === 0) {
            contentHTML = `<p style="text-align: center; margin-top: 30px; opacity: 0.7;">Для этого типа (${activeTab}) в данном профиле нет данных.</p>`;
        }

     } else {
         // Для Историй (custom profile)

         // --- ИСПРАВЛЕНИЕ (19.0): 'flatten' объявлена до использования ---
         const flatten = (dict) => Object.values(dict || {}).reduce((acc, val) => ({ ...acc, ...val }), {});

         const russianText = appInstance.activeData.text_ru;

         // (ИЗМЕНЕНО) Выбираем, какой словарь (words/phrases) использовать для подсветки
         const ruCzDictTab = (activeTab === 'words') ? flatten(appInstance.categorizedCzechWords) : flatten(appInstance.categorizedCzechPhrases);
         const ruEnDictTab = (activeTab === 'words') ? flatten(appInstance.categorizedEnglishWords) : flatten(appInstance.categorizedEnglishPhrases);

         // Создаем инвертированный словарь ТОЛЬКО для активной вкладки
         const invertedDictionaryTab = {
            ...Object.entries(ruCzDictTab).reduce((a, [ru, cz]) => ({ ...a, [String(cz).toLowerCase()]: ru }), {}),
            ...Object.entries(ruEnDictTab).reduce((a, [ru, en]) => ({ ...a, [String(en).toLowerCase()]: ru }), {})
         };

         // (ИЗМЕНЕНО) Объединенный словарь (слова+фразы) нужен для тултипа
         const ruAllDictKeys = Object.keys(appInstance.ruCzechDict).concat(Object.keys(appInstance.ruEnglishDict));

         const createText = (text, dictionary) => {
             const wordRegex = new RegExp(`(${Object.keys(dictionary).sort((a, b) => b.length - a.length).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
             return text.replace(wordRegex, matchedWord => {
                 const ruWord = dictionary[matchedWord.toLowerCase()];
                 // (ИЗМЕНЕНО) Проверяем, что найденное слово (ruWord) есть в ОБЩЕМ словаре (ruAllDictKeys)
                 if (!ruWord || !ruAllDictKeys.includes(ruWord)) {
                      return matchedWord;
                 }
                 const russianContext = appInstance.findContext(ruWord, russianText);
                 return `<span class="selectable-word ${s.selectedWords.includes(ruWord) ? 'selected' : ''}"
                               onclick="app.selectWord(event, '${ruWord.replace(/'/g, "\\'")}')"
                               onmouseenter="app.showTooltip(event, '${ruWord.replace(/'/g, "\\'")}', '${matchedWord.replace(/'/g, "\\'")}', '${appInstance.escapeTooltip(russianContext)}')"
                               onmouseleave="app.hideTooltip()">
                             ${matchedWord}
                         </span>`;
             });
         };
         let textToDisplay = '';
         if (lang === 'bilingual') {
             textToDisplay = `<h3>Чешский</h3><div class="scrollable-text-panel">${createText(appInstance.activeData.text_cz, invertedDictionaryTab)}</div>
                              <hr style="margin: 15px 0;">
                              <h3>Английский</h3><div class="scrollable-text-panel">${createText(appInstance.activeData.text_en, invertedDictionaryTab)}</div>`;
         } else {
             const currentSourceText = lang === 'czech' ? appInstance.activeData.text_cz : appInstance.activeData.text_en;
             textToDisplay = `<div class="scrollable-text-panel">${createText(currentSourceText, invertedDictionaryTab)}</div>`;
         }
         contentHTML = `<div class="text-display">${textToDisplay}</div>
                        <details><summary>Показать/скрыть русский контекст</summary><p>${russianText}</p></details>`;
     }

     // (ДОБАВЛЕНО) Вкладки "Слова" / "Фразы"
     const tabsHTML = `
        <div class="settings-tabs" style="margin-top: 10px;">
            <button class="button ${activeTab === 'words' ? '' : 'secondary'}" onclick="app.setSessionState('selectionTab', 'words')">Слова</button>
            <button class="button ${activeTab === 'phrases' ? '' : 'secondary'}" onclick="app.setSessionState('selectionTab', 'phrases')">Фразы</button>
        </div>
     `;

     const controlButtons = isLevelProfile ? `<div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 15px;"><button class="button small secondary" onclick="app.toggleAllCategories(true)">Развернуть все</button><button class="button small secondary" onclick="app.toggleAllCategories(false)">Свернуть все</button></div>` : '';

     // (ИЗМЕНЕНО) Считаем общее кол-во в зависимости от вкладки
     const getTotalCountForTab = (tab) => {
         let czDict = (tab === 'words') ? appInstance.categorizedCzechWords : appInstance.categorizedCzechPhrases;
         let enDict = (tab === 'words') ? appInstance.categorizedEnglishWords : appInstance.categorizedEnglishPhrases;

         // --- ИСПРАВЛЕНИЕ (19.0): 'flatten' здесь тоже нужна локально ---
         const flatten = (dict) => Object.values(dict || {}).reduce((acc, val) => ({ ...acc, ...val }), {});

         if (lang === 'bilingual') {
            return Object.keys({...flatten(czDict), ...flatten(enDict)}).length;
         } else if (lang === 'czech') {
            return Object.keys(flatten(czDict)).length;
         } else { // english
            return Object.keys(flatten(enDict)).length;
         }
     };

     const totalWordsCount = getTotalCountForTab(activeTab);
     // (ИЗМЕНЕНО) 'Выбрать все' теперь зависит от вкладки
     const allSelected = s.selectedWords.length > 0 && totalWordsCount > 0 && getTotalCountForTab('words') === 0 && getTotalCountForTab('phrases') === 0; // Логику selectAllWords/deselectAllWords нужно будет обновить в training.js

     const minWords = appInstance.getSetting('minWords') || 1;

     return `<h1>Выберите слова для изучения</h1>
             ${tabsHTML}
             ${controlButtons}
             <div class="dictionary-view-container" id="word-selection-content">
                ${contentHTML}
             </div>
             <div style="text-align: center; margin-top: 20px;">
                 <p>Выбрано: ${s.selectedWords.length} (минимум ${minWords})</p>
                 <button class="button" onclick="app.selectAllWords('${activeTab}')">Выбрать все (на вкладке)</button>
                 <button class="button" onclick="app.deselectAllWords()">Снять выбор (всего)</button>
                 <button class="button" onclick="app.startTraining()" ${s.selectedWords.length < minWords ? 'disabled' : ''}>Начать Этап 1</button>
                 <button class="button secondary" onclick="app.navigateTo('profileDashboard')">В меню профиля</button>
             </div>`;
}
