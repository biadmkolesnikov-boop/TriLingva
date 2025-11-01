// training.js - (ПОЛНЫЙ ОБНОВЛЁННЫЙ КОД v23.0)
// --- ИЗМЕНЕНИЕ: Исправлена startNewSession для полного сброса сессии ---
// --- РЕФАКТОРИНГ: Функции выбора слов (selectWord и др.) вынесены в modules/word_selection.js ---
// --- РЕФАКТОРИНГ: Функции Этапа 1 (startTraining и др.) вынесены в modules/training_stage1.js ---
// --- РЕФАКТОРИНГ: Функции Этапа 2 (startStage2 и др.) вынесены в modules/training_stage2.js ---

import { normalizeString } from './utils.js';

// --- Этап 1: Изучение слов ---

export function startNewSession(appInstance) {
    // Начинает новую сессию обучения для текущего языка и профиля
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const lang = profile.language;

    // --- ИЗМЕНЕНИЕ: Полностью перезаписываем объект сессии ---
    // Сначала очищаем localStorage для текущего профиля, чтобы старая сессия не мешала
    appInstance.clearActiveSessionsFromLocalStorage();

    // Сбрасываем прогресс этапов (1, 2, 3) для текущего языка в state
    if (profile.progress[lang]) {
        profile.progress[lang] = {
            ...profile.progress[lang], // Сохраняем очки correct/error
            stage1Complete: false, stage2Complete: false, stage2Failed: false,
            stage3Complete: false, stage3Failed: false, learnedWords: [] // Очищаем выученные слова
        };
    } else {
        // Если прогресса для языка еще не было, инициализируем его с очками
        profile.progress[lang] = {
             correctLetters: 0, errorLetters: 0,
             stage1Complete: false, stage2Complete: false, stage2Failed: false,
             stage3Complete: false, stage3Failed: false, learnedWords: []
        };
    }

    // Создаем ПОЛНОСТЬЮ НОВУЮ структуру сессии, перезаписывая старую
    profile.sessions[lang] = {
        screen: 'wordSelection', // Начинаем с выбора слов
        selectedWords: [],       // Массив выбранных слов (русские)
        wordsInTraining: [],     // Массив слов для текущей тренировки (перемешанный)
        currentWordIndex: 0,     // Индекс текущего слова в wordsInTraining
        hiddenLettersCount: {},  // { слово: количество_скрытых_букв }
        usedHints: new Set(),    // Слова, для которых использовалась подсказка
        heartsLeft: 7,           // Количество сердечек (подсказок)
        autoAdvance: true,       // Включено ли автоперелистывание
        seenWords: new Set(),    // Слова, которые уже показывались (для анимации)
        autoAdvanceTimerId: null,// ID таймера для автоперелистывания
        selectionTab: 'words'    // Активная вкладка на экране выбора
    };
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

    // Сохраняем НОВУЮ (пустую) сессию в localStorage
    appInstance.saveActiveSessionsToLocalStorage();

    appInstance.navigateTo('wordSelection'); // Переходим на экран выбора слов
}


export function continueSession(appInstance) {
    // Продолжает прерванную сессию обучения
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (s && s.screen) {
        appInstance.navigateTo(s.screen); // Переходим на сохраненный экран сессии
    }
    // Если сессии нет, ничего не делаем (остаемся на дашборде)
}

/*
// --- Функции selectWord, selectAllWords, deselectAllWords, selectCategory ---
// --- Перенесены в modules/word_selection.js ---
*/

/*
// --- Функции Этапа 1: startTraining, handleLetterInput, checkWord, showHint, buyHeart ---
// --- Перенесены в modules/training_stage1.js ---
*/


// --- Этап 2: Супер-игра ---

/*
// --- Функции Этапа 2 (startStage2, checkStage2, showHintStage2) ---
// --- Перенесены в modules/training_stage2.js ---

export function startStage2(appInstance) {
    // ...
}

export function checkStage2(appInstance) {
    // ...
}

export function showHintStage2(appInstance) {
    // ...
}
*/

// --- Этап 3: Практика в контексте ---

export function startStage3(appInstance) {
    // Начинает Этап 3 (практика в контексте)
    appInstance.playSoundClick();
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const lang = profile.language;
    const p = profile.progress[lang] || {};
    const learnedWords = p.learnedWords; // Берем слова, выученные на Этапе 1
    if (!learnedWords || learnedWords.length === 0) {
        return alert("Сначала нужно выучить слова на Этапе 1!");
    }

    const isLevelProfile = appInstance.state.activeProfileId.startsWith('levels.');
    let contextText = null;

    if (isLevelProfile) { // Для уровней - просто соединяем слова
        contextText = learnedWords.join('. ') + '.';
    } else { // Для историй - берем русский текст истории
        contextText = appInstance.activeData?.text_ru; // Используем активные данные профиля
        if (!contextText) {
             console.error("Не найден текст для контекста для профиля:", appInstance.state.activeProfileId);
             return alert("Ошибка: Не найден текст для контекстной практики.");
        }
    }

    p.stage3Failed = false; // Сбрасываем флаг провала при старте
    profile.progress[lang] = p; // Обновляем прогресс

    // Создаем сессию для Этапа 3
    profile.sessions[lang] = {
        ...profile.sessions[lang], // Сохраняем данные предыдущей сессии
        screen: 'stage3', // Текущий экран
        language: lang, // Язык тренировки
        words: learnedWords, // Слова, которые нужно будет ввести
        contextText: contextText, // Текст, в котором ищем слова
        // Прогресс по каждому слову: статус, попытка ввода, активный язык (для bilingual)
        progress: learnedWords.reduce((acc, word) => {
            acc[word] = { status: 'pending', attempt: '', activeLang: 'cz' }; // Начинаем с чешского в bilingual
            return acc;
        }, {})
    };

    // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
    appInstance.saveActiveSessionsToLocalStorage();
    // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

    appInstance.navigateTo('stage3'); // Переходим на экран Этапа 3
}

export function handleStage3Input(appInstance, e, ruWord) {
    // Обрабатывает ввод в поле на Этапе 3 (срабатывает при потере фокуса - onchange)
    const profile = appInstance.getActiveProfile();
    if (!profile) return;
    const s = profile.sessions[profile.language];
    if (!s || !s.progress) return; // Нет сессии или прогресса
    const wordProgress = s.progress[ruWord];
    if (!wordProgress || wordProgress.status === 'correct') return; // Слово уже угадано или нет прогресса

    const inputElement = e.target;
    let langToTest; // Язык, который сейчас проверяем ('cz' или 'en')
    let dictionary; // Соответствующий словарь (ruCzechDict или ruEnglishDict)

    // Определяем язык и словарь
    if (s.language === 'bilingual') {
        langToTest = wordProgress.activeLang; // Берем активный язык для этого слова
        // (ИЗМЕНЕНО) Используем объединенные словари
        dictionary = langToTest === 'cz' ? appInstance.ruCzechDict : appInstance.ruEnglishDict;
    } else { // Моноязычный режим
        langToTest = s.language === 'czech' ? 'cz' : 'en';
        // (ИЗМЕНЕНО) Используем объединенные словари
        dictionary = s.language === 'czech' ? appInstance.ruCzechDict : appInstance.ruEnglishDict;
    }

    wordProgress.attempt = inputElement.value; // Сохраняем введенное значение

    // Проверяем правильность ввода (с нормализацией)
    if (normalizeString(inputElement.value) === normalizeString(dictionary[ruWord])) {
        // Правильный ввод
        appInstance.playSoundCorrect();
        if (s.language === 'bilingual' && wordProgress.activeLang === 'cz') {
            // Если билингвальный режим и это был чешский, переключаемся на английский
            wordProgress.activeLang = 'en';
            wordProgress.attempt = ''; // Очищаем поле для ввода английского
            // Фокус вернется автоматически после ререндера
        } else {
            // Если моноязычный режим или это был английский в билингвальном
            wordProgress.status = 'correct'; // Отмечаем слово как полностью угаданное
            inputElement.disabled = true; // Блокируем поле
        }

        // <<< --- ДОБАВЛЕНО (ПЛАН 4) --- >>>
        appInstance.saveActiveSessionsToLocalStorage(); // Сохраняем измененный s.progress[ruWord]
        // <<< --- КОНЕЦ ДОБАВЛЕНИЯ --- >>>

        appInstance.render(); // Перерисовываем (поле очистится или станет зеленым/заблокированным)
        appInstance.focusNextStage3Input(); // Переводим фокус на следующее поле
    } else {
        // Неправильный ввод
        appInstance.playSoundError();
        inputElement.classList.add('incorrect'); // Подсветка красным
        // Убираем подсветку через короткое время
        setTimeout(() => inputElement.classList.remove('incorrect'), 400);
        setTimeout(() => inputElement.focus(), 10); // Возвращаем фокус на это же поле
        // Не перерисовываем, чтобы пользователь мог исправить
    }
}

