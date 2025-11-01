// editors.js - (ПОЛНЫЙ ОБНОВЛЁННЫЙ КОД v19.2)
// --- ИЗМЕНЕНИЯ: (Шаг 4) Все функции теперь используют 'dictType' из state
// --- ИСПРАВЛЕНИЕ: (Шаг 8) Исправлена ошибка в importDictionary, которая импортировала
// ---            ключи "words"/"phrases" вместо их содержимого.

import { normalizeString } from './utils.js';
import { // Импортируем только API для словарей и историй
    updateDictionaryWordApi, addDictionaryWordApi, deleteDictionaryWordsApi,
    importDictionaryApi, uploadStoryApi,
    deleteStoryApi
    // API для тем больше не импортируем
} from './api.js';

// --- Общие функции редактора ---

export function setEditorState(appInstance, key, value) {
    // (ДОБАВЛЕНО) Сброс выделения и поиска при смене вкладки (Слова/Фразы)
    if (key === 'dictType' || key === 'level') {
        appInstance.state.editor.selectedItems = [];
        appInstance.state.editor.searchTerm = '';
        appInstance.state.editor.focusOnWord = null;
    }
    appInstance.state.editor[key] = value;
    appInstance.render();
}

export function applySearch(appInstance) {
    appInstance.playSoundClick();
    const inputElement = document.getElementById('dict-filter-input');
    if (inputElement) {
         appInstance.state.editor.searchTerm = inputElement.value;
    }
    appInstance.render();
}

export function toggleSearchField(appInstance, field) {
    appInstance.state.editor.searchFields[field] = !appInstance.state.editor.searchFields[field];
    const checkbox = document.getElementById(`search-field-${field}`);
    if(checkbox) checkbox.checked = appInstance.state.editor.searchFields[field];
}

// --- Редактор словарей ---

export function toggleDictItemSelection(appInstance, ru, category) {
    appInstance.playSoundClick();
    const key = `${ru}||${category}`;
    const selected = appInstance.state.editor.selectedItems;
    const index = selected.indexOf(key);
    if (index > -1) selected.splice(index, 1);
    else selected.push(key);
    appInstance.render(); 
}

export function toggleSelectAll(appInstance, visibleKeys) {
    appInstance.playSoundClick();
    const { selectedItems } = appInstance.state.editor;
    const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every(key => selectedItems.includes(key));

    if (allVisibleSelected) {
        appInstance.state.editor.selectedItems = selectedItems.filter(key => !visibleKeys.includes(key));
    } else {
        const newItems = visibleKeys.filter(key => !selectedItems.includes(key));
        appInstance.state.editor.selectedItems.push(...newItems);
    }
    appInstance.render();
}

// (ИЗМЕНЕНО) Использует dictType
export async function updateDictionaryWord(appInstance, oldRu, oldCategory, index) {
    appInstance.playSoundClick();
    // (ИЗМЕНЕНО) Получаем level и dictType из state
    const { level, dictType } = appInstance.state.editor;
    
    const newRuElement = document.getElementById(`ru-${index}`);
    const newCzElement = document.getElementById(`cz-${index}`);
    const newEnElement = document.getElementById(`en-${index}`);
    const newCatElement = document.getElementById(`cat-${index}`);

    if (!newRuElement || !newCzElement || !newEnElement || !newCatElement) {
         console.error("Не найдены элементы ввода для обновления слова. Индекс:", index);
         return alert('Произошла ошибка интерфейса. Не удалось найти поля для обновления.');
    }

    const newRu = newRuElement.value.trim();
    const newCz = newCzElement.value.trim();
    const newEn = newEnElement.value.trim();
    const newCategory = newCatElement.value.trim() || 'Общее';

    if (!newRu) return alert('Поле "Русский" не может быть пустым.');
    if (!newCz && !newEn) return alert('Хотя бы один перевод (Чешский или Английский) должен быть заполнен.');


    try {
        // (ИЗМЕНЕНО) Передаем dictType в API
        await updateDictionaryWordApi(appInstance.state.token, level, dictType, { oldRu, oldCategory, newRu, newCz, newEn, newCategory });

        // (ИЗМЕНЕНО) Обновляем локальные данные, используя dictType
        const dicts = appInstance.state.userDictionaries[level];
        if (!dicts.czech) dicts.czech = { words: {}, phrases: {} };
        if (!dicts.czech[dictType]) dicts.czech[dictType] = {};
        if (!dicts.english) dicts.english = { words: {}, phrases: {} };
        if (!dicts.english[dictType]) dicts.english[dictType] = {};
        
        if(dicts.czech[dictType][oldCategory]) delete dicts.czech[dictType][oldCategory][oldRu];
        if(dicts.english[dictType][oldCategory]) delete dicts.english[dictType][oldCategory][oldRu];
        if (dicts.czech[dictType][oldCategory] && Object.keys(dicts.czech[dictType][oldCategory]).length === 0) delete dicts.czech[dictType][oldCategory];
        if (dicts.english[dictType][oldCategory] && Object.keys(dicts.english[dictType][oldCategory]).length === 0) delete dicts.english[dictType][oldCategory];

        if (!dicts.czech[dictType][newCategory]) dicts.czech[dictType][newCategory] = {};
        if (!dicts.english[dictType][newCategory]) dicts.english[dictType][newCategory] = {};
        
        dicts.czech[dictType][newCategory][newRu] = newCz;
        dicts.english[dictType][newCategory][newRu] = newEn;

        alert(`Запись "${newRu}" успешно сохранена.`);

        if (oldRu !== newRu || appInstance.state.editor.sortBy !== 'ru' || oldCategory !== newCategory) {
             appInstance.state.editor.focusOnWord = newRu;
        } else {
             appInstance.state.editor.focusOnWord = null;
             const row = newRuElement.closest('tr'); 
             if(row) row.classList.add('row-highlight');
        }
        appInstance.render();
    } catch (error) {
        alert(`Ошибка сохранения: ${error.message}`);
    }
}

// (ИЗМЕНЕНО) Использует dictType
export async function addDictionaryWord(appInstance) {
    appInstance.playSoundClick();
    // (ИЗМЕНЕНО) Получаем level и dictType из state
    const { level, dictType } = appInstance.state.editor;
    
    const ruElement = document.getElementById('new-ru');
    const czElement = document.getElementById('new-cz');
    const enElement = document.getElementById('new-en');
    const catElement = document.getElementById('new-cat');

    if (!ruElement || !czElement || !enElement || !catElement) {
         console.error("Не найдены элементы ввода для добавления слова.");
         return alert('Произошла ошибка интерфейса. Не удалось найти поля для добавления.');
    }

    const ru = ruElement.value.trim();
    const cz = czElement.value.trim();
    const en = enElement.value.trim();
    const category = catElement.value.trim() || 'Общее';

    if (!ru) return alert('Поле "Русский" не может быть пустым.');
    if (!cz && !en) return alert('Хотя бы один перевод (Чешский или Английский) должен быть заполнен.');

    // (ИЗМЕНЕНО) Обновляем локальные данные, используя dictType
    const dicts = appInstance.state.userDictionaries[level];
    if (!dicts.czech) dicts.czech = { words: {}, phrases: {} };
    if (!dicts.czech[dictType]) dicts.czech[dictType] = {};
    if (!dicts.english) dicts.english = { words: {}, phrases: {} };
    if (!dicts.english[dictType]) dicts.english[dictType] = {};
    
    if (dicts.czech[dictType][category]?.[ru] || dicts.english[dictType][category]?.[ru]) {
        if (!confirm(`Запись "${ru}" уже существует в категории "${category}". Заменить её?`)) {
             return;
        }
    }

    try {
         // (ИЗМЕНЕНО) Передаем dictType в API
         await addDictionaryWordApi(appInstance.state.token, level, dictType, { ru, cz, en, category });

        if (!dicts.czech[dictType][category]) dicts.czech[dictType][category] = {};
        if (!dicts.english[dictType][category]) dicts.english[dictType][category] = {};
        dicts.czech[dictType][category][ru] = cz;
        dicts.english[dictType][category][ru] = en;

        alert(`Запись "${ru}" успешно добавлена/обновлена.`);
        ruElement.value = '';
        czElement.value = '';
        enElement.value = '';
        catElement.value = '';

        appInstance.state.editor.focusOnWord = ru;
        appInstance.render();

    } catch (error) {
         alert(`Ошибка добавления: ${error.message}`);
    }
}

// (ИЗМЕНЕНО) Использует dictType
export async function deleteSelected(appInstance) {
    // (ИЗМЕНЕНО) Получаем level и dictType из state
    const { selectedItems, level, dictType } = appInstance.state.editor;
    if (selectedItems.length === 0) return alert('Нет выделенных элементов.');
    if (!confirm(`Удалить ${selectedItems.length} выделенных элементов? Это действие необратимо.`)) return;

    appInstance.playSoundClick();

    const itemsToDelete = selectedItems.map(key => {
        const [ru, category] = key.split('||');
        return { ru, category };
    });

    try {
        // (ИЗМЕНЕНО) Передаем dictType в API
        await deleteDictionaryWordsApi(appInstance.state.token, level, dictType, itemsToDelete);

        // (ИЗМЕНЕНО) Обновляем локальные данные, используя dictType
        const dicts = appInstance.state.userDictionaries[level];
        itemsToDelete.forEach(({ ru, category }) => {
            if (dicts.czech?.[dictType]?.[category]) {
                 delete dicts.czech[dictType][category][ru];
                 if (Object.keys(dicts.czech[dictType][category]).length === 0) { delete dicts.czech[dictType][category]; }
            }
            if (dicts.english?.[dictType]?.[category]) { 
                 delete dicts.english[dictType][category][ru];
                 if (Object.keys(dicts.english[dictType][category]).length === 0) { delete dicts.english[dictType][category]; }
            }
        });

        appInstance.state.editor.selectedItems = [];
        alert('Выбранные элементы удалены.');
        appInstance.render(); 

    } catch (error) {
        alert(`Ошибка удаления: ${error.message}`);
    }
}

// (ИЗМЕНЕНО) Использует dictType
export function exportDictionary(appInstance) {
    appInstance.playSoundClick();
    // (ИЗМЕНЕНО) Получаем level и dictType из state
    const { level, dictType } = appInstance.state.editor;
    if (!level) return;

    const dictData = appInstance.state.userDictionaries[level];
    if (!dictData) {
         console.error("Данные словаря для уровня", level, "не найдены.");
         return alert(`Ошибка: Данные для уровня ${level} не загружены.`);
    }
    
    // (ИЗМЕНЕНО) Экспортируем только czech[dictType] и english[dictType]
    // (ИСПРАВЛЕНИЕ 19.2) Экспортируем *полную* структуру, чтобы импорт работал
    const exportObj = {
        czech: {
            [dictType]: dictData.czech?.[dictType] || {}
        },
        english: {
             [dictType]: dictData.english?.[dictType] || {}
        }
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    // (ИЗМЕНЕНО) Добавляем dictType в имя файла
    a.download = `${level}_${dictType}_dictionary.json`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
}

// --- (ИСПРАВЛЕНИЕ v19.2) ---
// --- Полностью переписана функция importDictionary ---
export function importDictionary(appInstance) {
    appInstance.playSoundClick();
    // 1. Получаем level и dictType (например, 'A1', 'words')
    const { level, dictType } = appInstance.state.editor;
    if (!level) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            try {
                const importedData = JSON.parse(readerEvent.target.result);
                
                // 2. Проверяем, что в файле есть нужная структура 
                // (например, importedData.czech.words)
                const czechToImport = importedData.czech?.[dictType];
                const englishToImport = importedData.english?.[dictType];

                if (!czechToImport || !englishToImport) {
                    throw new Error(`Файл не содержит ожидаемую структуру. 
                    Убедитесь, что в файле есть ключи "czech.${dictType}" и "english.${dictType}".
                    (Например, "czech.words" и "english.words")`);
                }

                // 3. Получаем ТЕКУЩИЙ словарь для этой вкладки
                const currentDicts = appInstance.state.userDictionaries[level];
                if (!currentDicts) throw new Error("Текущие словари не загружены."); 

                const currentCzechDict = currentDicts.czech?.[dictType] || {};
                const currentEnglishDict = currentDicts.english?.[dictType] || {};

                // 4. Проверяем конфликты, итерируя 'czechToImport' (т.е. czech.words)
                const conflicts = [];
                for (const category in czechToImport) { // 'category' = "Места"
                    if (typeof czechToImport[category] !== 'object') continue;
                    for (const ruWord in czechToImport[category]) { // 'ruWord' = "дом"
                        if (currentCzechDict[category]?.[ruWord] !== undefined) {
                            if (!conflicts.includes(ruWord)) { conflicts.push(ruWord); }
                        }
                    }
                }

                let proceed = true;
                if (conflicts.length > 0) {
                    proceed = confirm(`Найдены конфликты (${conflicts.length} шт.):\n${conflicts.slice(0, 10).join(', ')}...\n\nСуществующие записи будут ЗАМЕНЕНЫ. Продолжить?`);
                }

                if (proceed) {
                    // 5. Создаем копии ТЕКУЩИХ словарей
                    const newCzechDict = JSON.parse(JSON.stringify(currentCzechDict));
                    const newEnglishDict = JSON.parse(JSON.stringify(currentEnglishDict));

                    // 6. Сливаем импортируемые данные (czechToImport)
                    Object.keys(czechToImport).forEach(cat => {
                        if (!newCzechDict[cat]) newCzechDict[cat] = {};
                        Object.assign(newCzechDict[cat], czechToImport[cat]);
                    });
                     Object.keys(englishToImport).forEach(cat => {
                        if (!newEnglishDict[cat]) newEnglishDict[cat] = {};
                        Object.assign(newEnglishDict[cat], englishToImport[cat]);
                    });

                    // 7. Отправляем в API ТОЛЬКО обновленные словари для этого типа
                    await importDictionaryApi(appInstance.state.token, level, dictType, { 
                        czech: newCzechDict, 
                        english: newEnglishDict 
                    });

                    // 8. Сохраняем в локальный state в нужный dictType
                    if (!appInstance.state.userDictionaries[level].czech) appInstance.state.userDictionaries[level].czech = {};
                    if (!appInstance.state.userDictionaries[level].english) appInstance.state.userDictionaries[level].english = {};
                    
                    appInstance.state.userDictionaries[level].czech[dictType] = newCzechDict;
                    appInstance.state.userDictionaries[level].english[dictType] = newEnglishDict;

                    alert(`Словарь для "${dictType}" успешно импортирован и сохранён!`);
                    appInstance.render();
                }
            } catch (err) {
                console.error("Ошибка импорта:", err);
                alert(`Ошибка импорта: ${err.message}`);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
// --- (КОНЕЦ ИСПРАВЛЕНИЯ v19.2) ---


// --- Редактор историй (БЕЗ ИЗМЕНЕНИЙ) ---

export async function loadCustomStory(appInstance) {
    if (!appInstance.isAdmin()) return;
    appInstance.playSoundClick();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            try {
                const customData = JSON.parse(readerEvent.target.result);
                // (ИЗМЕНЕНО) Проверка на .dictionary (для миграции на бэке)
                // (ИСПРАВЛЕНИЕ 19.2) Проверяем и .dictionary (старый) и .words (новый)
                if (!customData.name || !customData.text_ru || (!customData.czech?.dictionary && !customData.czech?.words)) { 
                    throw new Error('Файл имеет неверную структуру (ожидается .czech.words или .czech.dictionary).');
                }
                const result = await uploadStoryApi(appInstance.state.token, customData);
                const newStoryId = result.profile_key.substring(result.profile_key.indexOf('.') + 1);
                
                // (ИЗМЕНЕНО) Локальная миграция для немедленного отображения
                if (customData.czech.dictionary) {
                    customData.czech.words = customData.czech.dictionary;
                    customData.czech.phrases = {};
                    delete customData.czech.dictionary;
                }
                 if (customData.english && customData.english.dictionary) {
                    customData.english.words = customData.english.dictionary;
                    customData.english.phrases = {};
                    delete customData.english.dictionary;
                } else if (!customData.english) {
                    customData.english = { words: {}, phrases: {} };
                }
                // (ДОБАВЛЕНО) Гарантируем наличие .words/.phrases, если их нет
                if (!customData.czech.words) customData.czech.words = {};
                if (!customData.czech.phrases) customData.czech.phrases = {};
                if (!customData.english.words) customData.english.words = {};
                if (!customData.english.phrases) customData.english.phrases = {};


                appInstance.state.customStories[newStoryId] = customData;
                alert(result.message);
                appInstance.render();
            } catch (err) {
                console.error(err);
                alert(`Ошибка загрузки истории: ${err.message}`);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

export async function saveStory(appInstance, storyId) {
    // !!! API для сохранения историй пока не реализован на бэкенде !!!
    if (!appInstance.isAdmin()) return;
    const storyKey = storyId; 
    const story = appInstance.state.customStories[storyKey];
    if (!story) return;

    const nameElement = document.getElementById('story-name');
    const ruElement = document.getElementById('story-text-ru');
    const czElement = document.getElementById('story-text-cz');
    const enElement = document.getElementById('story-text-en');

    if (!nameElement || !ruElement || !czElement || !enElement) {
         console.error("Не найдены элементы ввода для сохранения истории.");
         return alert('Произошла ошибка интерфейса. Не удалось найти поля для сохранения.');
    }

    story.name = nameElement.value;
    story.text_ru = ruElement.value;
    story.text_cz = czElement.value;
    story.text_en = enElement.value;

    alert(`История "${story.name}" сохранена (пока только локально)!`);
    appInstance.playSoundClick();
    appInstance.navigateTo('storyEditor', { storyId: null }); 
}

export async function deleteCustomStory(appInstance, storyId) { // Добавили async
    if (!appInstance.isAdmin()) return;
    
    const storyKey = storyId; // Используем storyId напрямую
    const storyName = appInstance.state.customStories[storyKey]?.name;
    if (!storyName) return; 

    // --- ИЗМЕНЕНО: Запрос подтверждения ---
    if(!confirm(`Вы уверены, что хотите УДАЛИТЬ историю "${storyName}" ИЗ БАЗЫ ДАННЫХ? Это действие необратимо.`)) {
        return; // Если пользователь отменил
    }
    
    appInstance.playSoundClick(); // Звук клика

    try {
        // --- ДОБАВЛЕНО: Вызов API ---
        const result = await deleteStoryApi(appInstance.state.token, storyKey); 
        
        // --- Удаление из локального состояния ---
        delete appInstance.state.customStories[storyKey];
        if(appInstance.state.activeProfileId === `custom.${storyKey}`) {
            appInstance.state.activeProfileId = null;
            sessionStorage.removeItem('activeProfileId'); // Очищаем sessionStorage
        }
        
        // --- ИЗМЕНЕНО: Сообщение ---
        alert(result.message || 'История успешно удалена.'); // Показываем сообщение от сервера
        
        // Если мы были на экране редактирования этой истории, переходим к списку
        if(appInstance.state.screen === 'storyEditor' && appInstance.state.editor.activeStoryId === storyKey) {
            appInstance.navigateTo('storyEditor', { storyId: null });
        } else {
             appInstance.render(); // Просто перерисовываем текущий экран (например, список историй)
        }

    } catch (error) {
         // --- ДОБАВЛЕНО: Обработка ошибки API ---
         console.error("Ошибка удаления истории через API:", error);
         alert(`Не удалось удалить историю: ${error.message}`);
    }
}