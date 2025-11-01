// frontend/public/renderers/renderStoryEditor.js
// (Этот файл содержит функцию рендеринга для Редактора историй)

import { renderStart } from './renderStart.js'; // Нужен для редиректа, если не админ

export function renderStoryEditor(appInstance, state) {
     // Рендерит редактор историй (список или форму редактирования)
     // (ПОКА НЕ ОБНОВЛЯЕМ ДЛЯ РЕДАКТИРОВАНИЯ СЛОВ/ФРАЗ ИСТОРИИ)
     if (!appInstance.isAdmin()) return renderStart(appInstance, state);
     const storyId = state.editor.activeStoryId;

     if (!storyId) {
         const storiesHTML = Object.keys(state.customStories)
             .sort((a,b) => state.customStories[a].name.localeCompare(state.customStories[b].name))
             .map(id =>
                 `<div class="user-list-item">
                     <span>${state.customStories[id].name}</span>
                     <div>
                         <button class="button small secondary" onclick="app.navigateTo('storyEditor', { storyId: '${id}' })" title="Редактировать">📝</button>
                         <button class="button small" style="background:var(--danger-color)" onclick="app.deleteCustomStory('${id}')" title="Удалить">🗑️</button>
                     </div>
                 </div>`
             ).join('');

         return `<h1>Редактор историй</h1>
                 <div class="card-training">${storiesHTML.length > 0 ? storiesHTML : '<p>Нет загруженных историй.</p>'}</div>
                 <button class="button secondary" style="margin-top:20px;" onclick="app.navigateTo('start')">На главный экран</button>`;

     } else {
         const story = state.customStories[storyId];
         if (!story) return `<h1>История не найдена</h1><button class="button" onclick="app.navigateTo('storyEditor', { storyId: null })">Назад к списку</button>`;

         return `<h1>Редактирование: ${story.name}</h1>
                 <div class="card-training" style="text-align: left;">
                     <label for="story-name"><b>Название истории</b></label>
                     <input type="text" id="story-name" class="story-editor-input" value="${story.name}">
                     <label for="story-text-ru"><b>Текст на русском</b></label>
                     <textarea id="story-text-ru" class="story-editor-textarea">${story.text_ru || ''}</textarea>
                     <label for="story-text-cz"><b>Текст на чешском</b></label>
                     <textarea id="story-text-cz" class="story-editor-textarea">${story.text_cz || ''}</textarea>
                     <label for="story-text-en"><b>Текст на английском</b></label>
                     <textarea id="story-text-en" class="story-editor-textarea">${story.text_en || ''}</textarea>
                     <p style="font-size: 0.9em; opacity: 0.7; margin: 10px 0;">(Редактирование словаря для историй пока не реализовано. Используйте Редактор словарей для уровней или пересоздайте историю)</p>
                     <button class="button" onclick="app.saveStory('${storyId}')">Сохранить изменения (тексты)</button>
                     <button class="button secondary" onclick="app.navigateTo('storyEditor', { storyId: null })">Назад к списку</button>
                 </div>`;
     }
}
