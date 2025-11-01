// frontend/public/modules/training_stage1.js
// (НОВЫЙ ФАЙЛ)
// Содержит логику для ЭТАПА 1 (тренировка с вводом букв)

import { normalizeString } from '../utils.js';

export function startTraining(appInstance) {
    // Начинает Этап 1 (тренировку) с выбранными словами
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return; // Сессии нет
    const minWords = appInstance.getSetting('minWords') || 1; // Берем настройку минимума слов
    if (s.selectedWords.length < minWords) {
        return alert(`Выберите как минимум ${minWords} слов/фраз для начала.`);
    }
    // Создаем перемешанный список слов для тренировки
    s.wordsInTraining = [...s.selectedWords].sort(() => 0.5 - Math.random());
    s.currentWordIndex = 0; // Начинаем с первого слова
    s.usedHints = new Set(); // Сбрасываем использованные подсказки
    s.heartsLeft = 7; // Начинаем с 7 сердечек
    s.hiddenLettersCount = {}; // Сбрасываем счетчик скрытых букв
    s.selectedWords.forEach(w => { s.hiddenLettersCount[w] = 1; }); // Инициализируем счетчик для всех слов = 1
    if (typeof s.autoAdvance === 'undefined') s.autoAdvance = true; // Включаем автопереход по умолчанию
    s.autoAdvanceTimerId = null; // Сбрасываем таймер
    s.seenWords = new Set(); // Сбрасываем виденные слова (для анимации)
    s.screen = 'training'; // Устанавливаем экран сессии

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    appInstance.navigateTo('training'); // Переходим на экран тренировки
}

// <<< НАЧАЛО ИЗМЕНЕНИЙ (вся функция handleLetterInput заменена) >>>
export function handleLetterInput(appInstance, e, isHint = false) {
    // Обрабатывает ввод буквы в поле на Этапе 1
    appInstance.easterEggCounter = 0; // Сбрасываем счетчик пасхалки при любом вводе
    const inputElement = e.target;
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const lang = profile.language;
    const session = profile.sessions[lang];
    if(!session) return; // Сессии нет

    // Инициализируем прогресс для языка, если его еще нет
    if (!profile.progress[lang]) profile.progress[lang] = { correctLetters: 0, errorLetters: 0 };

    if (!inputElement.value) { // Если поле очистили
        inputElement.classList.remove('correct', 'incorrect');
        return;
    }

    // Сравниваем введенную букву с ожидаемой (нормализуем для учета регистра и диакритики)
    if (normalizeString(inputElement.value) === normalizeString(inputElement.dataset.expected)) {
        // Правильный ввод
        if (!isHint) { // Если это не подсказка
            appInstance.playSoundCorrect(); // Звук успеха
            // Увеличиваем счетчик правильных букв
            profile.progress[lang].correctLetters = (profile.progress[lang].correctLetters || 0) + 1;
        }
        inputElement.classList.add('correct'); // Зеленый фон
        inputElement.classList.remove('incorrect');
        inputElement.disabled = true; // Блокируем поле


        // --- (ИЗМЕНЕНИЕ v20.1: Умный фокус для билингвального режима) ---

        // 1. Ищем родительский блок
        const currentBlock = inputElement.closest('.bilingual-training-block');
        let nextInputElement = null;

        if (currentBlock) {
            // 2. Сначала ищем следующий инпут ВНУТРИ этого блока
            nextInputElement = currentBlock.querySelector('.letter-input:not(:disabled)');
        }

        if (!nextInputElement) {
            // 3. Если в этом блоке инпутов не осталось, ищем В ЛЮБОМ ДРУГОМ блоке
            // (Это сработает и для моно-режима, и для перехода ко второму языку в билингвальном)
            nextInputElement = document.querySelector('.letter-input:not(:disabled)');
        }

        // 4. Логика фокусировки
        if (nextInputElement) {
            nextInputElement.focus(); // Переводим фокус на следующий инпут
        } else {
            // 5. Если инпутов не осталось ВООБЩЕ
            document.querySelector('#next-word-btn')?.focus(); // Фокус на кнопку "Далее"
            // Запускаем таймер автоперехода, если он включен
            if (session.autoAdvance) {
                if (session.autoAdvanceTimerId) { clearTimeout(session.autoAdvanceTimerId); } // Сбрасываем старый таймер
                // Получаем задержку из настроек
                const delaySeconds = appInstance.getSetting('autoAdvanceDelay') || 1;
                session.autoAdvanceTimerId = setTimeout(() => checkWord(appInstance, true), delaySeconds * 1000);
            }
        }
        // --- (КОНЕЦ ИЗМЕНЕНИЯ v20.1) ---

    } else {
        // Неправильный ввод
        appInstance.playSoundError(); // Звук ошибки
        // Увеличиваем счетчик ошибок
        profile.progress[lang].errorLetters = (profile.progress[lang].errorLetters || 0) + 1;
        inputElement.classList.add('incorrect'); // Красный фон
        // Очищаем поле и убираем красный фон через полсекунды
        setTimeout(() => {
            inputElement.value = '';
            inputElement.classList.remove('incorrect');
            inputElement.focus(); // Возвращаем фокус
        }, 500);
    }
    appInstance.renderScores(); // Обновляем отображение очков на экране

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    // Мы сохраняем сессию в localStorage здесь, потому что checkWord()
    // не будет вызван немедленно.
    // (profile.progress с очками не является частью сессии, но мы все равно сохраняем
    // на случай, если checkWord() вызовется по таймеру)
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>
}
// <<< КОНЕЦ ИЗМЕНЕНИЙ >>>


export function checkWord(appInstance, isAutoAdvance = false) {
    // Проверяет, заполнены ли все поля, и переходит к следующему слову
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return; // Сессия уже завершена

    // Очищаем таймер автоперехода, если он был
    if (s.autoAdvanceTimerId) {
        clearTimeout(s.autoAdvanceTimerId);
        s.autoAdvanceTimerId = null;
    }

    // Находим все незаполненные поля ввода
    const emptyInputs = [...document.querySelectorAll('.letter-input:not(:disabled)')];

    // Если нажали "Далее" вручную, а поля не заполнены
    if (!isAutoAdvance && emptyInputs.length > 0) {
        const card = document.querySelector('.card-training');
        appInstance.playSoundError(); // Звук ошибки

        // --- ИЗМЕНЕНО (v18.2): Логика пасхалки с использованием настроек ---
        appInstance.easterEggCounter++; // Увеличиваем счетчик кликов по "Далее" при ошибке
        // Получаем настройки пасхалки
        const trigger1 = appInstance.getSetting('easterEggTrigger1') || 6;
        const trigger2 = appInstance.getSetting('easterEggTrigger2') || 7;
        const emoji1 = appInstance.getSetting('easterEggEmoji1') || '😈';
        const emoji2 = appInstance.getSetting('easterEggEmoji2') || '😇';
        const multiEmoji1 = appInstance.getSetting('easterEggMultiEmoji1') || '😈😈😈';
        const multiEmoji2 = appInstance.getSetting('easterEggMultiEmoji2') || '😇😇😇😇😇😇😇';
        const cycleLength = appInstance.getSetting('easterEggCycleLength') || 3;
        // Определяем, показывать ли множественный эмодзи (зависит от цикла)
        const showMulti1 = appInstance.easterEggCycle === (cycleLength - 1);

        if (appInstance.easterEggCounter === trigger1) { // Если достигли первого триггера
            appInstance.showEasterEgg(showMulti1 ? multiEmoji1 : emoji1);
        } else if (appInstance.easterEggCounter >= trigger2) { // Если достигли второго триггера
            appInstance.showEasterEgg(showMulti1 ? multiEmoji2 : emoji2);
            appInstance.easterEggCounter = 0; // Сбрасываем счетчик кликов
            appInstance.easterEggCycle = (appInstance.easterEggCycle + 1) % cycleLength; // Переходим к следующему циклу
        }
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        // Анимация дрожания карточки
        card?.classList.add('error-animation');
        setTimeout(() => card?.classList.remove('error-animation'), 600);
        return; // Прерываем переход к следующему слову
    }

    // Если переход успешен (все поля заполнены или автопереход)
    appInstance.easterEggCounter = 0; // Сбрасываем счетчик пасхалки
    appInstance.playSoundFlip(); // Звук перелистывания

    const currentWord = s.wordsInTraining[s.currentWordIndex];
    // Проверка на случай, если слово почему-то не найдено
    if (!currentWord || s.hiddenLettersCount[currentWord] === undefined) {
         console.warn("Проблема с текущим словом или счетчиком скрытых букв. Сброс индекса.");
         s.currentWordIndex = 0; // Возвращаемся к началу списка
         if(s.wordsInTraining.length === 0) return setTimeout(() => appInstance.completeStage1(), 200); // Если список пуст, завершаем этап

         // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
         appInstance.saveActiveSessionsToLocalStorage();
         // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

         appInstance.render();
         return;
    }

    // Увеличиваем количество скрытых букв для этого слова
    s.hiddenLettersCount[currentWord]++;
    const repetitions = appInstance.getSetting('repetitions') || 5; // Получаем настройку повторений
    const isLearned = (h) => h > repetitions; // Функция проверки, выучено ли слово

    if (isLearned(s.hiddenLettersCount[currentWord])) {
        // Если слово выучено, удаляем его из текущей тренировки
        s.wordsInTraining.splice(s.currentWordIndex, 1);
        // Индекс НЕ увеличиваем, т.к. следующий элемент сместился на текущую позицию
    } else {
        // Если слово не выучено, просто переходим к следующему по индексу
        s.currentWordIndex++;
    }

    // Если слов в тренировке больше не осталось, завершаем этап
    if (s.wordsInTraining.length === 0) {
        // Используем setTimeout, чтобы успел проиграться звук
        // completeStage1() сам очистит localStorage
        return setTimeout(() => appInstance.completeStage1(), 200);
    }
    // Если дошли до конца списка, возвращаемся к началу
    if (s.currentWordIndex >= s.wordsInTraining.length) {
        s.currentWordIndex = 0;
    }

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    // Сохраняем сессию, т.к. изменился currentWordIndex, hiddenLettersCount или wordsInTraining
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    appInstance.render(); // Перерисовываем интерфейс с новым словом/состоянием
}

export function showHint(appInstance, langId) {
    // Показывает подсказку (заполняет одну букву) на Этапе 1
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s || s.heartsLeft === 0) return; // Нет сессии или сердечек

    // Находим первое незаполненное поле для нужного языка (чешский/английский)
    const inputToFill = document.querySelector(`.letter-input[data-lang="${langId}"]:not(:disabled)`);
    if (!inputToFill) return; // Все поля для этого языка уже заполнены

    s.heartsLeft--; // Уменьшаем количество сердечек

    // --- ДОБАВЛЕНА ПРОВЕРКА ---
    // Убедимся, что s.usedHints это Set перед использованием .add()
    if (!(s.usedHints instanceof Set)) {
        console.warn("showHint: s.usedHints was not a Set. Re-initializing.");
        s.usedHints = new Set();
    }
    // --- КОНЕЦ ПРОВЕРКИ ---

    // Запоминаем, что для этого слова использовалась подсказка
    s.usedHints.add(s.wordsInTraining[s.currentWordIndex]);

    inputToFill.value = inputToFill.dataset.expected; // Вставляем правильную букву

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    // Сохраняем сессию, т.к. изменились heartsLeft и usedHints
    // handleLetterInput() вызовет свое сохранение следом
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    // Вызываем обработчик ввода с флагом isHint = true, чтобы:
    // 1. Проверить букву и заблокировать поле.
    // 2. Перейти к следующему полю или кнопке "Далее".
    // 3. НЕ начислять очки за эту букву.
    handleLetterInput(appInstance, { target: inputToFill }, true);
}

export function buyHeart(appInstance) {
    // Покупка сердечка за очки на Этапе 1 или 2
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s) return; // Сессии нет

    if (s.heartsLeft >= 7) { alert('У вас уже максимум сердечек!'); return; }
    if (appInstance.calculateTotalScore() < 2) { alert('Недостаточно очков для покупки! (нужно 2)'); return; }

    // Уменьшаем общий счет, добавляя 2 "ошибки"
    if (!profile.progress[profile.language]) profile.progress[profile.language] = { errorLetters: 0 };
    profile.progress[profile.language].errorLetters = (profile.progress[profile.language].errorLetters || 0) + 2;

    s.heartsLeft++; // Добавляем сердечко

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    // Сохраняем сессию, т.к. изменились heartsLeft
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    // Обновляем UI без полного ререндера для оптимизации
    const heartsEl = document.querySelector('.hearts-container');
    if(heartsEl) heartsEl.innerHTML = '♥'.repeat(s.heartsLeft);
    const scoreEl = document.querySelector('.buy-heart-container span');
    if(scoreEl) scoreEl.textContent = `Общий счёт: ${appInstance.calculateTotalScore()}`;
    // Разблокируем кнопки подсказок, если нужно
    document.querySelectorAll('button.secondary.small').forEach(btn => {
        if (btn.textContent === 'Подсказка') btn.disabled = s.heartsLeft === 0;
    });
    // Обновляем состояние кнопки покупки
    const buyButton = Array.from(document.querySelectorAll('.buy-heart-container .button')).find(b => b.textContent.includes('❤️'));
    if (buyButton) { buyButton.disabled = s.heartsLeft >= 7 || appInstance.calculateTotalScore() < 2; }
}
