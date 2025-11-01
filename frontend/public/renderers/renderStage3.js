// frontend/public/renderers/renderStage3.js
// (Этот файл содержит функцию рендеринга для Этапа 3 - Практика в контексте)

export function renderStage3(appInstance, state) {
     // Рендерит экран Этапа 3 (практика в контексте)
     const profile = appInstance.getActiveProfile();
     const s = profile?.sessions?.[profile.language];
     if (!profile || !s || !s.contextText) {
        console.warn("Нет сессии или контекста в renderStage3");
        return `<h1>Этап 3: Практика в контексте</h1>
                <div class="card-training">
                    <p>Нет данных для начала этапа. Возможно, нужно пройти Этап 2 или для этого профиля не задан текст.</p>
                    <button class="button" onclick="app.navigateTo('profileDashboard')">В меню профиля</button>
                </div>`;
     }

     const textForContext = s.contextText;
     const wordsToTest = s.words;

     const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
     const sortedWords = wordsToTest.slice().sort((a, b) => b.length - a.length);
     const allWordsRegex = new RegExp(`(${sortedWords.map(escapeRegExp).join('|')})`, 'gi');

     const parts = textForContext.split(allWordsRegex).filter(part => part);

     const textHTML = parts.map(part => {
         const ruWord = sortedWords.find(w => w.toLowerCase() === part.toLowerCase());
         if (!ruWord) { return part; }

         const wordProgress = s.progress[ruWord];
         if (!wordProgress) {
              console.warn("Нет прогресса для слова:", ruWord);
              return part;
         }

         if (wordProgress.status === 'correct') {
             return `<span class="context-word-correct">${part}</span>`;
         } else {
             // (ИЗМЕНЕНО) Используем объединенные словари
             const cz = appInstance.ruCzechDict[ruWord] || '';
             const en = appInstance.ruEnglishDict[ruWord] || '';
             const maxLength = Math.max(ruWord.length, cz.length, en.length);
             const inputWidth = maxLength * 9 + 25;
             let tooltipText;
             if (s.language === 'czech') tooltipText = 'Введите на чешском';
             else if (s.language === 'english') tooltipText = 'Введите на английском';
             else tooltipText = wordProgress.activeLang === 'cz' ? 'Сначала на чешском' : 'Теперь на английском';
             return `<span class="context-input-wrapper">
                         <input type="text" class="context-input" style="width:${inputWidth}px"
                                placeholder="${ruWord}" value="${wordProgress.attempt}"
                                oninput="event.target.classList.remove('incorrect')"
                                onchange="app.handleStage3Input(event,'${ruWord}')" ${wordProgress.status === 'correct' ? 'disabled' : ''}>
                         <span class="tooltip-trigger" onmouseenter="app.showTooltip(event, '${tooltipText}')" onmouseleave="app.hideTooltip()">?</span>
                     </span>`;
         }
     }).join('');

     const allDone = Object.values(s.progress).every(p => p.status === 'correct');
     const getInstruction = () => {
         switch (s.language) {
             case 'czech': return 'Введите пропущенные слова на чешском языке.';
             case 'english': return 'Введите пропущенные слова на английском языке.';
             case 'bilingual': return 'Введите слова на чешском, затем нажмите Enter или кликните вне поля, чтобы ввести английский вариант.';
             default: return '';
         }
     };

     return `<h1>Этап 3: Практика в контексте</h1>
             <h3 class="instructions">${getInstruction()}</h3>
             <div class="scrollable-text-panel" style="text-align: left;">
                 <div class="text-display context-text">${textHTML}</div>
             </div>
             <div style="text-align:center;margin-top:20px;">
                 <button id="finish-stage3-btn" class="button" onclick="app.finishStage3()" ${!allDone ? 'disabled' : ''}>Завершить</button>
                 <button class="button secondary" onclick="app.navigateTo('profileDashboard')">В меню профиля</button>
             </div>`;
}
