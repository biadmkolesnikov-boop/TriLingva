// frontend/public/renderers/renderTraining.js
// (Этот файл содержит функцию рендеринга для Этапа 1 тренировки)

export function renderTraining(appInstance, state) {
     // Рендерит экран Этапа 1 (тренировка с вводом букв)
     const profile = appInstance.getActiveProfile();
     const s = profile?.sessions?.[profile.language];
     if (!s || !s.wordsInTraining || s.wordsInTraining.length === 0) {
        return appInstance.completeStage1();
     }

     // --- ДОБАВЛЕНА ПРОВЕРКА v20.27 ---
     if (!(s.seenWords instanceof Set)) {
         console.warn("renderTraining: s.seenWords is not a Set. Initializing.");
         s.seenWords = new Set();
         // Опционально: сохранить исправленное состояние в localStorage?
         // appInstance.saveActiveSessionsToLocalStorage();
     }
     // --- КОНЕЦ ПРОВЕРКИ ---

     const currentWord = s.wordsInTraining[s.currentWordIndex];
     const lang = profile.language; // <<< Получаем язык
     const scores = profile.progress[lang] || {correctLetters: 0, errorLetters: 0};
     const scoreDisplay = `<div class="training-score-display"><span>Правильно: ${scores.correctLetters || 0}</span> | <span>Ошибок: ${scores.errorLetters || 0}</span></div>`;

     const isNewWord = !s.seenWords.has(currentWord); // Теперь .has() будет работать
     if (isNewWord) s.seenWords.add(currentWord);

     const repetitions = appInstance.getSetting('repetitions') || 5;
     const progressIndicator = appInstance.getEmojiProgress(s.hiddenLettersCount[currentWord], repetitions);

     const blocks = [];

     const generateInputBlock = (dictionary, langId) => {
         const translation = dictionary[currentWord] || '';
         if (!translation) {
            console.warn(`Перевод для "${currentWord}" (langId: ${langId}) не найден!`);
            return {html: '<span>Ошибка: перевод не найден</span>', hasInputs: false};
         }

         const hiddenCount = s.hiddenLettersCount[currentWord] || 1;
         const letterIndices = Array.from(Array(translation.length).keys()).filter(i => !/(\s|[.,!?;:"'()`’‘“”—])/.test(translation[i]));
         let indicesToHide = new Set();

         if (!(letterIndices.length > 5 && hiddenCount > repetitions)) {
             const availableIndices = [...letterIndices];
             while (indicesToHide.size < Math.min(hiddenCount, availableIndices.length)) {
                 indicesToHide.add(availableIndices[Math.floor(Math.random() * availableIndices.length)]);
             }
         }

         let html = '';
         let hasInputs = false;
         for (let i = 0; i < translation.length; i++) {
             const char = translation[i];
             if (char === ' ') {html += '<div class="space-char"></div>'; continue;}
             if (/[.,!?;:"'()`’‘“”—]/.test(char)) {html += `<span>${char}</span>`; continue;}
             if (indicesToHide.has(i)) {
                 html += `<input type="text" maxlength="1" class="letter-input" data-lang="${langId}" data-expected="${char}" oninput="app.handleLetterInput(event)">`;
                 hasInputs = true;
             } else {
                 html += `<span>${char}</span>`;
             }
         }
         return {html, hasInputs};
     };

     if (lang === 'czech' || lang === 'bilingual') {
         const {html: czHtml, hasInputs: czHasInputs} = generateInputBlock(appInstance.ruCzechDict, 'czech');
         blocks.push(`<div class="bilingual-training-block"><h3>Чешский</h3><div class="letter-inputs">${czHtml}</div><button class="button secondary small" onclick="app.showHint('czech')" ${s.heartsLeft === 0 || !czHasInputs ? 'disabled' : ''}>Подсказка</button></div>`);
     }
     if (lang === 'english' || lang === 'bilingual') {
         const {html: enHtml, hasInputs: enHasInputs} = generateInputBlock(appInstance.ruEnglishDict, 'english');
         blocks.push(`<div class="bilingual-training-block"><h3>Английский</h3><div class="letter-inputs">${enHtml}</div><button class="button secondary small" onclick="app.showHint('english')" ${s.heartsLeft === 0 || !enHasInputs ? 'disabled' : ''}>Подсказка</button></div>`);
     }

     let heartsDisplay = s.heartsLeft > 0 ? '♥'.repeat(s.heartsLeft) : `<div class="hearts-out-message">Подсказки кончились!</div><button class="button secondary small" style="margin-top:10px;" onclick="app.startNewSession()">Начать снова</button>`;
     const autoAdvanceChecked = s.autoAdvance ? 'checked' : '';
     const canBuyHeart = s.heartsLeft < 7 && appInstance.calculateTotalScore() >= 2;

     // <<< ДОБАВЛЕНО: Определяем класс режима >>>
     const modeClass = lang === 'bilingual' ? 'mode-bilingual' : 'mode-single';

     return `<h1>Этап 1: Тренировка</h1>
             <div class="progress-indicator">${progressIndicator}</div>
             ${scoreDisplay}

             <div class="card-training training-layout ${modeClass}">

                 <div class="training-layout-static-header">
                     <div class="hearts-container">${heartsDisplay}</div>
                     <div class="buy-heart-container">
                         <span>Общий счёт: ${appInstance.calculateTotalScore()}</span>
                         <button class="button small" onclick="app.buyHeart()" ${!canBuyHeart ? 'disabled' : ''}>Купить ❤️ (2 очка)</button>
                     </div>
                 </div>

                 <div class="training-layout-dynamic-content">
                     <div class="russian-word ${isNewWord ? 'new-word-animation' : ''}">${currentWord}</div>
                     ${blocks.join('')}
                     <div class="auto-advance-toggle">
                         <label for="auto-advance">Перелистывать автоматически</label>
                         <input type="checkbox" id="auto-advance" ${autoAdvanceChecked} onchange="app.toggleAutoAdvance()">
                     </div>
                 </div>

                 <div class="training-layout-buttons">
                     <button id="next-word-btn" class="button" onclick="app.checkWord()">Далее (Enter)</button>
                     <button class="button secondary" onclick="app.navigateTo('profileDashboard')">В меню профиля</button>
                 </div>

             </div>`;
}
