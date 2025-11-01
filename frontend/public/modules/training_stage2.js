// frontend/public/modules/training_stage2.js
// (НОВЫЙ ФАЙЛ)
// Содержит логику для ЭТАПА 2 (Супер-игра)

import { normalizeString } from '../utils.js';

export function startStage2(appInstance) {
    // Начинает Этап 2 (супер-игру)
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const lang = profile.language;
    const learnedWords = profile.progress[lang]?.learnedWords; // Берем слова, выученные на Этапе 1
    if (!learnedWords || learnedWords.length < 1) {
        return alert("Сначала нужно выучить слова на Этапе 1!");
    }

    let taskList = []; // Массив заданий для супер-игры
    // Генерируем задания в зависимости от языкового режима
    if (lang === 'bilingual') {
        learnedWords.forEach(ru => {
            const cz = appInstance.ruCzechDict[ru];
            const en = appInstance.ruEnglishDict[ru];
            // Задание: дан чешский, ввести английский (русский для справки)
            if (cz && en) taskList.push({ type: 'cz_to_others', ru: ru, cz: cz, en: en });
            // Задание: дан английский, ввести чешский (русский для справки)
            if (cz && en) taskList.push({ type: 'en_to_others', ru: ru, cz: cz, en: en });
        });
    } else { // Для 'czech' или 'english'
        learnedWords.forEach(ru => {
            // (ИЗМЕНЕНО) Используем объединенные словари
            const dict = lang === 'czech' ? appInstance.ruCzechDict : appInstance.ruEnglishDict;
            const foreign = dict[ru];
            if (foreign) {
                // Задание: дан русский, ввести перевод
                taskList.push({ type: 'forward', ru: ru });
                // Задание: дан перевод, ввести русский
                taskList.push({ type: 'reverse', foreign: foreign, ru: ru });
            }
        });
    }

    // Обновляем или создаем сессию для Этапа 2
    profile.sessions[lang] = {
         ...profile.sessions[lang], // Сохраняем данные предыдущей сессии (если были)
         screen: 'stage2', // Текущий экран
         tasks: taskList.sort(() => 0.5 - Math.random()), // Перемешанный список заданий
         currentTaskIndex: 0, // Начинаем с первого задания
         feedback: null, // Для возможной обратной связи (пока не используется)
         heartsLeft: 7, // Начинаем с 7 сердечками
         failedDueToNoHearts: false // Флаг провала из-за отсутствия сердечек
    };

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    appInstance.navigateTo('stage2'); // Переходим на экран Этапа 2
}

export function checkStage2(appInstance) {
    // Проверяет ответ пользователя на Этапе 2
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const lang = profile.language;
    const s = profile.sessions[lang];
    if (!s || !s.tasks) return; // Нет сессии или заданий
    const task = s.tasks[s.currentTaskIndex];
    if (!task) return; // Задания кончились (не должно происходить здесь)

    let isCorrect = false;
    let inputValue = '';

    // Проверяем ответ в зависимости от типа задания
    switch (task.type) {
        case 'cz_to_others':
            inputValue = document.getElementById('super-game-input-en')?.value || '';
            isCorrect = normalizeString(task.en) === normalizeString(inputValue);
            break;
        case 'en_to_others':
            inputValue = document.getElementById('super-game-input-cz')?.value || '';
            isCorrect = normalizeString(task.cz) === normalizeString(inputValue);
            break;
        case 'forward':
            // (ИЗМЕНЕНО) Используем объединенные словари
            const dictFwd = lang === 'czech' ? appInstance.ruCzechDict : appInstance.ruEnglishDict;
            inputValue = document.getElementById('super-game-input')?.value || '';
            isCorrect = normalizeString(dictFwd[task.ru]) === normalizeString(inputValue);
            break;
        case 'reverse':
            inputValue = document.getElementById('super-game-input')?.value || '';
            isCorrect = normalizeString(task.ru) === normalizeString(inputValue);
            break;
    }

    if (isCorrect) { // Если ответ правильный
        appInstance.playSoundCorrect(); // Звук успеха
        s.feedback = { correct: true, task: task }; // Сохраняем фидбек (пока не используется)
        s.currentTaskIndex++; // Переходим к следующему заданию

        // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
        appInstance.saveActiveSessionsToLocalStorage(); // Сохраняем новый currentTaskIndex
        // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

        if (s.currentTaskIndex >= s.tasks.length) { // Если это было последнее задание
            appInstance.completeStage2(); // Завершаем этап
            return; // Выходим, т.к. completeStage2 сделает navigateTo
        }
        appInstance.render(); // Перерисовываем для следующего задания
    } else { // Если ответ неправильный
        appInstance.playSoundError(); // Звук ошибки
        // Анимация дрожания для поля ввода
        const inputEl = document.querySelector('.super-game-input:not([readonly])');
        if (inputEl) {
            inputEl.classList.add('incorrect'); // Добавляем класс для подсветки/анимации
            setTimeout(() => inputEl.classList.remove('incorrect'), 400); // Убираем через 400мс
        }
        // Анимация дрожания для всей карточки
        document.querySelector('.card-training')?.classList.add('error-animation');
        setTimeout(() => document.querySelector('.card-training')?.classList.remove('error-animation'), 600);
        // Не переходим к следующему заданию, даем исправить
    }
}

export function showHintStage2(appInstance) {
    // Показывает подсказку (одну букву) на Этапе 2
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s || s.heartsLeft <= 0 || !s.tasks) return; // Проверки

    s.heartsLeft--; // Уменьшаем сердечки
    if (s.heartsLeft === 0) {
        s.failedDueToNoHearts = true; // Отмечаем, что сердечки кончились (для завершения этапа)
    }

    const task = s.tasks[s.currentTaskIndex];
    // Функция для добавления одной буквы в поле
    const fillByLetter = (inputEl, correctText) => {
        if (inputEl && correctText && inputEl.value.length < correctText.length) {
            inputEl.value = correctText.slice(0, inputEl.value.length + 1); // Добавляем следующую букву
            return true;
        }
        return false;
    };

    let inputElement; // Поле, в которое нужно добавить букву
    let correctAnswer = ''; // Правильный ответ для этого поля

    // Определяем поле и правильный ответ
    switch (task.type) {
        case 'cz_to_others':
            inputElement = document.getElementById('super-game-input-en');
            correctAnswer = task.en;
            break;
        case 'en_to_others':
            inputElement = document.getElementById('super-game-input-cz');
            correctAnswer = task.cz;
            break;
        case 'forward':
            // (ИЗМЕНЕНО) Используем объединенные словари
            const dictFwd = profile.language === 'czech' ? appInstance.ruCzechDict : appInstance.ruEnglishDict;
            inputElement = document.getElementById('super-game-input');
            correctAnswer = dictFwd[task.ru];
            break;
        case 'reverse':
            inputElement = document.getElementById('super-game-input');
            correctAnswer = task.ru;
            break;
    }

    fillByLetter(inputElement, correctAnswer); // Добавляем букву

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    appInstance.saveActiveSessionsToLocalStorage(); // Сохраняем heartsLeft и failedDueToNoHearts
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    // Обновляем UI сердечек без полного ререндера
    const heartsEl = document.querySelector('.hearts-container');
    if (heartsEl) {
        let content = s.heartsLeft > 0 ? '♥'.repeat(s.heartsLeft) : '<div class="hearts-out-message">Сердечки кончились!</div>';
        if (s.heartsLeft <= 0) {
            // Добавляем кнопку "Начать снова", если сердечки кончились
            content += `<button class="button secondary small" style="margin-top:10px;" onclick="app.startStage2()">Начать снова</button>`;
        }
        heartsEl.innerHTML = content;
    }
    // Блокируем кнопку подсказки, если сердечки кончились
    const hintButton = Array.from(document.querySelectorAll('button.secondary')).find(b => b.textContent === 'Подсказка');
    if (hintButton && s.heartsLeft === 0) {
        hintButton.disabled = true;
    }
    // Обновляем состояние кнопки покупки сердечка
    const buyButton = Array.from(document.querySelectorAll('.buy-heart-container .button')).find(b => b.textContent.includes('❤️'));
    if (buyButton) { buyButton.disabled = s.heartsLeft >= 7 || appInstance.calculateTotalScore() < 2; }
}
