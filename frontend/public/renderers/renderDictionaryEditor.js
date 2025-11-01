// frontend/public/renderers/renderDictionaryEditor.js
// (Этот файл содержит функцию рендеринга для Редактора словарей)

import { normalizeString } from '../utils.js';
import { renderStart } from './renderStart.js'; // Нужен для редиректа, если не админ

export function renderDictionaryEditor(appInstance, state) {
     // Рендерит редактор словарей (только для админа)
     if (!appInstance.isAdmin()) return renderStart(appInstance, state);

     // (ИЗМЕНЕНО) Получаем dictType из state
     const { level, searchTerm, sortBy, searchFields, selectedItems, dictType } = state.editor;

     if(!state.userDictionaries[level]) {
         appInstance.state.editor.level = 'A1';
         return `<h1>Загрузка словаря...</h1>`;
     }

     // (ИЗМЕНЕНО) Выбираем нужный словарь (words или phrases)
     const czechDict = state.userDictionaries[level].czech?.[dictType] || {};
     const englishDict = state.userDictionaries[level].english?.[dictType] || {};

     const mergedKeys = {};
     for (const category in czechDict) {
         if (!mergedKeys[category]) mergedKeys[category] = {};
         for (const ru in czechDict[category]) { mergedKeys[category][ru] = true; }
     }
     for (const category in englishDict) {
         if (!mergedKeys[category]) mergedKeys[category] = {};
         for (const ru in englishDict[category]) { mergedKeys[category][ru] = true; }
     }

     let flatList = [];
     for (const category in mergedKeys) {
         for (const ru in mergedKeys[category]) {
             flatList.push({
                 ru, category,
                 cz: czechDict[category]?.[ru] || '',
                 en: englishDict[category]?.[ru] || ''
             });
         }
     }

     const normalizedSearch = normalizeString(searchTerm);
     if (normalizedSearch) {
        flatList = flatList.filter(item =>
            (searchFields.ru && normalizeString(item.ru).includes(normalizedSearch)) ||
            (searchFields.cz && normalizeString(item.cz).includes(normalizedSearch)) ||
            (searchFields.en && normalizeString(item.en).includes(normalizedSearch)) ||
            (searchFields.cat && normalizeString(item.category).includes(normalizedSearch))
        );
     }

     if (sortBy === 'ru') flatList.sort((a, b) => a.ru.localeCompare(b.ru, 'ru'));
     else if (sortBy === 'cz') flatList.sort((a, b) => (a.cz || '').localeCompare(b.cz || '', 'cs'));
     else if (sortBy === 'en') flatList.sort((a, b) => (a.en || '').localeCompare(b.en || '', 'en'));
     else if (sortBy === 'cat') flatList.sort((a, b) => a.category.localeCompare(b.category, 'ru') || a.ru.localeCompare(b.ru, 'ru'));

     const tableRows = flatList.map((item, index) => {
         const key = `${item.ru}||${item.category}`;
         const highlightClass = state.editor.focusOnWord === item.ru ? 'row-highlight' : '';
         return `<tr class="${highlightClass}">
                     <td><input type="checkbox" onchange="app.toggleDictItemSelection('${item.ru.replace(/'/g, "\\'")}', '${item.category.replace(/'/g, "\\'")}')" ${selectedItems.includes(key) ? 'checked' : ''}></td>
                     <td><input type="text" id="ru-${index}" class="dict-editor-input" value="${item.ru}"></td>
                     <td><input type="text" id="cz-${index}" class="dict-editor-input" value="${item.cz}"></td>
                     <td><input type="text" id="en-${index}" class="dict-editor-input" value="${item.en}"></td>
                     <td><input type="text" id="cat-${index}" class="dict-editor-input" value="${item.category}"></td>
                     <td class="dict-editor-actions">
                         <button onclick="app.updateDictionaryWord('${item.ru.replace(/'/g, "\\'")}', '${item.category.replace(/'/g, "\\'")}', ${index})" title="Сохранить изменения">💾</button>
                     </td>
                 </tr>`;
     }).join('');

     const addRow = `<tr><td>➕</td><td><input type="text" id="new-ru" placeholder="Новое слово/фраза" class="dict-editor-input"></td><td><input type="text" id="new-cz" placeholder="Перевод на чешский" class="dict-editor-input"></td><td><input type="text" id="new-en" placeholder="Перевод на английский" class="dict-editor-input"></td><td><input type="text" id="new-cat" placeholder="Категория (по умолч. Общее)" class="dict-editor-input"></td><td class="dict-editor-actions"><button onclick="app.addDictionaryWord()" title="Добавить новое слово">💾</button></td></tr>`;

     const levelOptions = Object.keys(state.userDictionaries)
        .sort((a, b) => a.localeCompare(b))
        .map(id => `<option value="${id}" ${level === id ? 'selected' : ''}>${state.userDictionaries[id].name}</option>`)
        .join('');

     const searchFieldsHTML = Object.keys(searchFields).map(f => `<label><input type="checkbox" id="search-field-${f}" onchange="app.toggleSearchField('${f}')" ${searchFields[f] ? 'checked' : ''}> ${f.toUpperCase()}</label>`).join('');
     const filterControls = `<div class="filter-group"><input type="text" id="dict-filter-input" placeholder="Фильтр..." value="${searchTerm || ''}" onkeypress="if(event.key==='Enter') app.applySearch()"><button onclick="app.applySearch()">🔍</button></div><div class="dict-editor-filter-options">${searchFieldsHTML}</div>`;
     const importExportButtons = `<div class="button-group"><button class="button secondary small" onclick="app.exportDictionary()">Экспорт JSON</button><button class="button secondary small" onclick="app.importDictionary()">Импорт JSON</button></div>`;

     const allVisibleKeys = flatList.map(item => `${item.ru}||${item.category}`);
     const allVisibleSelected = allVisibleKeys.length > 0 && allVisibleKeys.every(key => selectedItems.includes(key));

     // (ДОБАВЛЕНО) Вкладки "Слова" / "Фразы"
     const tabsHTML = `
        <div class="settings-tabs" style="margin-top: 10px;">
            <button class="button ${dictType === 'words' ? '' : 'secondary'}" onclick="app.setEditorState('dictType', 'words')">Слова</button>
            <button class="button ${dictType === 'phrases' ? '' : 'secondary'}" onclick="app.setEditorState('dictType', 'phrases')">Фразы</button>
        </div>
     `;

     // --- ИЗМЕНЕНИЕ (v21.0): Увеличена высота таблицы ---
     return `<h1>Редактор словарей</h1>
             <div class="card-training">
                 <div class="dict-editor-controls">
                     <select onchange="app.setEditorState('level', this.value)">${levelOptions}</select>
                     <select onchange="app.setEditorState('sortBy', this.value)">
                         <option value="ru" ${sortBy==='ru'?'selected':''}>Сорт.: По-русски (А-Я)</option>
                         <option value="cz" ${sortBy==='cz'?'selected':''}>Сорт.: По-чешски (A-Z)</option>
                         <option value="en" ${sortBy==='en'?'selected':''}>Сорт.: По-английски (A-Z)</option>
                         <option value="cat" ${sortBy==='cat'?'selected':''}>Сорт.: По категории</option>
                     </select>
                     ${importExportButtons}
                 </div>
                 <div class="dict-editor-controls">${filterControls}</div>

                 ${tabsHTML}

                 <div style="max-height: 75vh; overflow-y: auto;">
                     <table class="dict-editor-table">
                         <thead><tr><th><input type="checkbox" title="Выбрать/Снять все видимые" onchange='app.toggleSelectAll(${JSON.stringify(allVisibleKeys)})' ${allVisibleSelected?'checked':''}></th><th>Русский</th><th>Чешский</th><th>Английский</th><th>Категория</th><th>Действ.</th></tr></thead>
                         <tbody>${addRow}${tableRows}</tbody>
                     </table>
                 </div>
                 <div style="margin-top:20px; display:flex; gap: 10px; justify-content: center;">
                     <button class="button small secondary" onclick="app.deleteSelected()" ${selectedItems.length===0?'disabled':''}>Удалить выделенное (${selectedItems.length})</button>
                     <button class="button small secondary" onclick="app.setEditorState('selectedItems', [])" ${selectedItems.length===0?'disabled':''}>Снять выделение</button>
                 </div>
             </div>
             <div style="margin-top:20px;"><button class="button" onclick="app.navigateTo('start')">На главный экран</button></div>`;
}
