// frontend/public/renderers/renderProfileSelection.js
// (Этот файл содержит функцию рендеринга для экрана выбора профиля)

export function renderProfileSelection(appInstance, state) {
     // Рендерит экран выбора профиля обучения (уровни и истории)
     const levelIcons = {A1: '👶', A2: '🚶‍♂️', B1: '👨‍🎓', B2: '👨‍🏫', C1: '🧙‍♂️', C2: '👑', custom_dict: '🕵️‍♂️'};

     // (ИЗМЕНЕНО) Функция теперь считает слова в dict.words или dict.phrases
     const getTotalWordCount = (dict) => {
        if (!dict || typeof dict !== 'object') return 0;
        return Object.values(dict).reduce((sum, category) => {
            if (category && typeof category === 'object') {
                return sum + Object.keys(category).length;
            }
            return sum;
        }, 0);
     };

     const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']; // Определяем порядок уровней

     // Карточки для стандартных уровней
     let levelsHTML = levelOrder
         .filter(id => state.userDictionaries[id]) // Показываем только существующие уровни
         .map(id => {
             const dictData = state.userDictionaries[id];
             // (ИЗМЕНЕНО) Считаем отдельно слова и фразы (по чешскому словарю как основному)
             const wordCount = getTotalWordCount(dictData.czech?.words);
             const phraseCount = getTotalWordCount(dictData.czech?.phrases);

             return `<div class="profile-card level-${id.toLowerCase()}" onclick="app.setActiveProfile('levels.${id}')">
                 <div class="profile-card-icon">${levelIcons[id] || '🌟'}</div>
                 <h2>${dictData.name}</h2>
                 <p class="profile-card-count">Слова: ${wordCount} / Фразы: ${phraseCount}</p>
             </div>`;
         }).join('');


// <<< НАЧАЛО ДОБАВЛЕННОГО КОДА >>>
     // Добавляем карточку для "Своего словаря", если он существует
     if (state.userDictionaries['custom_dict']) {
         const id = 'custom_dict';
         const dictData = state.userDictionaries[id];
         const wordCount = getTotalWordCount(dictData.czech?.words);
         const phraseCount = getTotalWordCount(dictData.czech?.phrases);

         levelsHTML += `<div class="profile-card level-${id.toLowerCase()}" onclick="app.setActiveProfile('levels.${id}')">
             <div class="profile-card-icon">${levelIcons[id] || '🕵️‍♂️'}</div>
             <h2>${dictData.name || 'Свой словарь'}</h2>
             <p class="profile-card-count">Слова: ${wordCount} / Фразы: ${phraseCount}</p>
         </div>`;
     }
     // <<< КОНЕЦ ДОБАВЛЕННОГО КОДА >>>




     // Карточки для пользовательских историй
     let customHTML = Object.keys(state.customStories).map(id => {
         const story = state.customStories[id];
         // (ИЗМЕНЕНО) Считаем отдельно слова и фразы
         const wordCount = getTotalWordCount(story.czech?.words);
         const phraseCount = getTotalWordCount(story.czech?.phrases);
         const profileKey = `custom.${id}`; // Полный ключ профиля

         return `<div class="profile-card level-custom" onclick="app.setActiveProfile('${profileKey}')">
             ${appInstance.isAdmin() ? `<button class="delete-btn" onclick="event.stopPropagation(); app.deleteCustomStory('${id}')">🗑️</button>` : ''}
             <div class="profile-card-icon">✍️</div>
             <h2>${story.name}</h2>
             <p class="profile-card-count">Слова: ${wordCount} / Фразы: ${phraseCount}</p>
         </div>`;
     }).join('');

     // --- (ИЗМЕНЕНИЕ v19.5) ---
     // Кнопка загрузки истории для админа + Инструкция
     const adminInstructions = `
        <details style="max-width: 600px; margin: 15px auto 0 auto; text-align: left; background: var(--paper-color); padding: 10px 15px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--text-color) 15%, transparent);">
            <summary style="cursor: pointer; font-weight: bold; color: var(--accent-color);">Как создать свой .json файл истории?</summary>

            <div style="padding-top: 15px; line-height: 1.6;">
                <p>Есть два способа создать файл: вручную или с помощью ИИ (рекомендуется).</p>

                <h4 style="margin-top: 15px; margin-bottom: 5px; color: var(--accent-hover);">Способ 1: С помощью Нейросети (Рекомендуемый)</h4>
                <p>Это самый быстрый способ. Нейросеть сама переведет текст и заполнит словари.</p>
                <ol style="margin-left: 20px; margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
                    <li>Возьмите текст на русском языке (до 1500 символов), который хотите изучать.</li>
                    <li>Скопируйте приведенный ниже "Промпт для ИИ".</li>
                    <li>Вставьте свой русский текст в промпт в указанное место.</li>
                    <li>Отправьте этот промпт любой современной нейросети (ChatGPT, Claude, Gemini и т.д.).</li>
                    <li>ИИ вернет вам <strong>готовый JSON-код</strong>. Скопируйте его, вставьте в текстовый редактор (например, VS Code или Блокнот) и сохраните файл с расширением <code>.json</code> (например, <code>my_story.json</code>) в кодировке <strong>UTF-8</strong>.</li>
                </ol>

                <p style="margin-top: 15px;"><strong>Промпт (шаблон) для ИИ:</strong></p>
                <pre style="background: var(--bg-color); padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 0.9em; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word;">
<code>Ты — ассистент, который помогает создавать JSON-файлы для языкового приложения.

Моя задача — взять русский текст, перевести его на чешский и английский, выделить из него ключевые слова и фразы, и упаковать всё это в JSON.

Вот мой русский текст:
"--- ВСТАВЬ СЮДА СВОЙ РУССКИЙ ТЕКСТ ---"

Пожалуйста, выполни следующие шаги:
1.  Возьми этот русский текст и придумай для него короткое "Название истории" на русском.
2.  Переведи русский текст на чешский.
3.  Переведи русский текст на английский.
4.  Выбери из русского текста 10-15 ключевых СЛОВ и 10-15 ключевых ФРАЗ.
5.  Для каждого русского слова/фразы найди точный перевод в сгенерированных тобой чешском и английском текстах.
6.  Сформируй JSON-объект по этой СТРОГОЙ структуре (ключи словарей — русский, значения — перевод):

{
  "name": "[Вставь Название истории]",
  "text_ru": "[Вставь ПОЛНЫЙ русский текст]",
  "text_cz": "[Вставь ПОЛНЫЙ чешский перевод]",
  "text_en": "[Вставь ПОЛНЫЙ английский перевод]",
  "czech": {
    "words": {
      "Общее": {
        "русское_слово_1": "český_překlad_1",
        "русское_слово_2": "český_překlad_2"
      }
    },
    "phrases": {
      "Общее": {
        "русская фраза 1": "česká fráze 1",
        "русская фраза 2": "česká fráze 2"
      }
    }
  },
  "english": {
    "words": {
      "Общее": {
        "русское_слово_1": "english_translation_1",
        "русское_слово_2": "english_translation_2"
      }
    },
    "phrases": {
      "Общее": {
        "русская фраза 1": "english phrase 1",
        "русская фраза 2": "english phrase 2"
      }
    }
  }
}

Важно: верни ТОЛЬКО чистый JSON-код, без каких-либо объяснений до или после него.</code>
                </pre>

                <h4 style="margin-top: 15px; margin-bottom: 5px; color: var(--accent-hover);">Способ 2: Вручную</h4>
                <p>Вы можете собрать файл самостоятельно, строго следуя структуре, описанной в промпте выше. Все поля (<code>name</code>, <code>text_ru</code>, <code>text_cz</code>, <code>text_en</code>, <code>czech</code>, <code>english</code>, <code>words</code>, <code>phrases</code>) обязательны.</p>
            </div>

        </details>
    `;

     const adminButtons = appInstance.isAdmin() ? `
        <div style="text-align: center; margin: 20px 0;">
            <button class="button secondary" onclick="app.loadCustomStory()">Загрузить свою историю (.json)</button>
            ${adminInstructions}
        </div>` : '';
     // --- (КОНЕЦ ИЗМЕНЕНИЯ v19.5) ---


     return `<div style="text-align: center; margin-bottom: 20px;">
                 <button class="button" style="width: auto;" onclick="app.navigateTo('start')">На главный экран</button>
             </div>
             <h1>Выберите профиль обучения</h1>
             <h2>Стандартные уровни</h2>
             <div class="profile-cards">${levelsHTML}</div>
             <h2>Дополнительные истории</h2>
             ${Object.keys(state.customStories).length > 0 ? `<div class="profile-cards">${customHTML}</div>` : '<p style="text-align:center; opacity: 0.7; margin-bottom: 20px;">Пока нет загруженных историй.</p>'}
             ${adminButtons}`;
}
