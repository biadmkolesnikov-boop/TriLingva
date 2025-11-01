// frontend/public/modules/app_utils.js (v20.28)
// --- ИЗМЕНЕНИЕ: showEasterEgg теперь читает размер из настроек ---
// --- ИЗМЕНЕНИЕ (v21.2): Исправлена логика initMatrix и добавлена stopMatrix ---

/**
 * Инициализирует AudioContext.
 * @param {App} appInstance
 */
export function initAudio(appInstance) {
    if (!appInstance.audioCtx) {
        try {
            appInstance.audioCtx = new(window.AudioContext || window.webkitAudioContext)();
            if (appInstance.audioCtx.state === 'suspended') {
                const resume = () => {
                    appInstance.audioCtx.resume().then(() => {
                        console.log('AudioContext resumed!');
                        document.removeEventListener('click', resume);
                        document.removeEventListener('touchstart', resume);
                    });
                };
                document.addEventListener('click', resume, { once: true });
                document.addEventListener('touchstart', resume, { once: true });
             }
        }
        catch (e) { console.error("Web Audio API is not supported in this browser"); }
    }
}

/**
 * Воспроизводит звук.
 * @param {App} appInstance
 * @param {object} options
 */
export function playSound(appInstance, { frequency = 440, duration = 0.1, type = 'sine', volume = 0.2, attack = 0.01 }) {
    // Используем getSetting через appInstance
    if (!appInstance.getSetting('soundsEnabled') || !appInstance.audioCtx || appInstance.audioCtx.state === 'suspended') return;
    try {
        const oscillator = appInstance.audioCtx.createOscillator();
        const gainNode = appInstance.audioCtx.createGain();
        const now = appInstance.audioCtx.currentTime;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gainNode);
        gainNode.connect(appInstance.audioCtx.destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
    } catch (e) { console.error("Ошибка воспроизведения звука:", e); }
}

export function playSoundClick(appInstance) { initAudio(appInstance); playSound(appInstance, { frequency: 600, duration: 0.08, type: 'sine', volume: 0.15 }); }
export function playSoundFlip(appInstance) { initAudio(appInstance); playSound(appInstance, { frequency: 440, duration: 0.1, type: 'sine', volume: 0.2 }); }
export function playSoundError(appInstance) {
    initAudio(appInstance);
    if (!appInstance.getSetting('soundsEnabled') || !appInstance.audioCtx) return;
    playSound(appInstance, { frequency: 220, duration: 0.15, type: 'sine', volume: 0.25 });
    setTimeout(() => playSound(appInstance, { frequency: 180, duration: 0.15, type: 'sine', volume: 0.25 }), 80);
}
export function playSoundCorrect(appInstance) {
    initAudio(appInstance);
    if (!appInstance.getSetting('soundsEnabled') || !appInstance.audioCtx) return;
    playSound(appInstance, { frequency: 523.25, duration: 0.1, type: 'sine', volume: 0.2 });
    setTimeout(() => playSound(appInstance, { frequency: 783.99, duration: 0.1, type: 'sine', volume: 0.2 }), 100);
}

/**
 * Показывает пасхалку-эмодзи.
 * @param {App} appInstance - <<< ПЕРЕДАЕМ ЭКЗЕМПЛЯР App >>>
 * @param {string} char
 */
export function showEasterEgg(appInstance, char) { // <<< ПРИНИМАЕМ appInstance >>>
    const el = document.getElementById('easter-egg'); if (!el) return;
    // <<< ПОЛУЧАЕМ РАЗМЕР ИЗ НАСТРОЕК >>>
    const fontSize = appInstance.getSetting('easterEggFontSize') || '80px'; // Используем getSetting
    el.style.fontSize = fontSize; // Применяем размер
    el.textContent = char;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 1500);
}

/**
 * Инициализирует матричную анимацию (если еще не запущена).
 * @param {App} appInstance
 */
export function initMatrix(appInstance) {
    // --- ИЗМЕНЕНИЕ (v21.2): Проверяем флаг matrixInitialized ---
    if (appInstance.matrixInterval || appInstance.matrixInitialized) {
        console.log("Matrix already initialized or running.");
        return; // Не запускаем заново
    }
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) { console.warn("Matrix canvas not found."); return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { console.warn("Failed to get 2D context for matrix canvas."); return; }

    console.log("Initializing Matrix animation...");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}';
    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    const draw = () => {
        // --- ДОБАВЛЕНО (v21.2): Проверка, нужно ли еще рисовать ---
        if (!appInstance.matrixInterval) return; // Останавливаемся, если интервал очищен

        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0F0';
        ctx.font = `${fontSize}px arial`;
        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            // Используем getSetting через appInstance
            if (drops[i] * fontSize > canvas.height && Math.random() > (appInstance.getSetting('futuristicView') ? 0.975 : 0.99)) drops[i] = 0;
            drops[i]++;
        }
    };

    appInstance.matrixInterval = setInterval(draw, 40);
    // --- ДОБАВЛЕНО (v21.2): Устанавливаем флаг ---
    appInstance.matrixInitialized = true;

    // Оставляем обработчик resize, он не мешает
    window.onresize = () => {
        // Используем getSetting через appInstance
        if (!appInstance.getSetting('futuristicView') || !appInstance.matrixInterval) return; // Добавили проверку matrixInterval
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drops.length = Math.floor(canvas.width / fontSize);
        if (drops.fill) drops.fill(1);
    };
    console.log("Matrix animation started.");
}

// --- ДОБАВЛЕНО (v21.2): Функция для остановки Матрицы ---
/**
 * Останавливает матричную анимацию.
 * @param {App} appInstance
 */
export function stopMatrix(appInstance) {
    if (appInstance.matrixInterval) {
        console.log("Stopping Matrix animation...");
        clearInterval(appInstance.matrixInterval);
        appInstance.matrixInterval = null;
        appInstance.matrixInitialized = false; // Сбрасываем флаг
        window.onresize = null; // Убираем обработчик
        const canvas = document.getElementById('matrix-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем канвас
        }
        console.log("Matrix animation stopped.");
    } else {
        console.log("Matrix animation not running.");
    }
}
// --- КОНЕЦ ДОБАВЛЕНИЯ ---


/**
 * Устанавливает фокус на следующее поле ввода Этапа 3.
 */
export function focusNextStage3Input() {
    setTimeout(() => { document.querySelector('.context-input:not([disabled])')?.focus(); }, 100);
}

/**
 * Проверяет, является ли словарь некатегоризированным, и оборачивает его в категорию 'Общее'.
 * @param {object} d
 * @returns {object}
 */
export function ensureCategorized(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return {'Общее': {}};
    const firstKey = Object.keys(d)[0];
    if (firstKey !== undefined && typeof d[firstKey] === 'string') {
        return {'Общее': d};
    }
    return d;
}

/**
 * Объединяет два категоризированных словаря (чешский и английский) для билингвального режима.
 * @param {object} cz
 * @param {object} en
 * @returns {object}
 */
export function mergeDictionariesCategorized(cz, en) {
    const merged = {};
    const processDict = (dict) => {
         if (!dict || typeof dict !== 'object') return;
        for (const category in dict) {
            if (!merged[category]) merged[category] = {};
            if (dict[category] && typeof dict[category] === 'object') {
                 for (const word in dict[category]) {
                      if (typeof word === 'string') {
                          merged[category][word] = true;
                      }
                 }
            }
        }
    };
    processDict(cz); processDict(en);
    const final = {};
    for (const category in merged) {
        final[category] = {};
        for (const word in merged[category]) { final[category][word] = '...'; }
    }
    return final;
}

/**
 * Раскрывает/сворачивает все категории слов.
 * @param {App} appInstance
 * @param {boolean} open
 */
export function toggleAllCategories(appInstance, open) {
    appInstance.playSoundClick();
    document.querySelectorAll('.word-category').forEach(details => {
        details.open = open;
         const summaryText = details.querySelector('summary')?.textContent?.split(' (')[0];
         if (summaryText) { appInstance.categoryOpenState[summaryText] = open; }
    });
}

/**
 * Показывает тултип.
 * @param {App} appInstance
 * @param {Event} e
 * @param {...string} a
 */
export function showTooltip(appInstance, e, ...a) {
    const tooltip = document.getElementById('tooltip'); if(!tooltip) return;
    let content = '';
    if (a.length === 1) {
        content = escapeTooltip(a[0]);
    } else if (a.length === 3) {
        const [ru, foreign, russianContext] = a.map(s => escapeTooltip(s));
        const highlightedContext = russianContext.replace(new RegExp(`(${ru.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<strong>$1</strong>');
        content = `<div class="word">РУС: ${ru}</div><div class="context foreign">ИНО: <strong>${foreign}</strong></div><div class="context">${highlightedContext}</div>`;
    }
    tooltip.innerHTML = content;

    const tooltipRect = tooltip.getBoundingClientRect();
    let left = e.pageX + 15;
    let top = e.pageY + 15;
    if (left + tooltipRect.width > window.innerWidth - 10) { left = window.innerWidth - tooltipRect.width - 15; }
    if (top + tooltipRect.height > window.innerHeight - 10) { top = e.pageY - tooltipRect.height - 15; }
     if (left < 10) { left = 10; }
     if (top < 10) { top = 10; }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';
}

/**
 * Скрывает тултип.
 */
export function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if(tooltip) { tooltip.style.visibility = 'hidden'; tooltip.style.opacity = '0'; }
}

/**
 * Экранирует HTML-спецсимволы.
 * @param {string} s
 * @returns {string}
 */
export function escapeTooltip(s) {
    if(typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

/**
 * Находит предложение, содержащее искомый текст.
 * @param {string} searchText
 * @param {string} fullText
 * @returns {string}
 */
export function findContext(searchText, fullText) {
    if (!fullText || typeof fullText !== 'string') return searchText;
    const sentences = fullText.match(/[^.!?…«»\n\r]+[.!?…»]+[\s\n\r]*|[^.!?…«»\n\r]+$/g) || [fullText];
    const lowerSearchText = searchText.toLowerCase();
    for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(lowerSearchText)) {
            return sentence.trim();
        }
    }
    return searchText;
}

/**
 * Генерирует индикатор прогресса (эмодзи).
 * @param {number} current
 * @param {number} total
 * @returns {string}
 */
export function getEmojiProgress(current, total) {
    const filled = '🔵'; const empty = '⚪️'; const extra = '✨';
    const safeCurrent = Math.max(0, current || 0);
    const safeTotal = Math.max(1, total || 1);
    if (safeCurrent > safeTotal) return filled.repeat(safeTotal) + extra.repeat(safeCurrent - safeTotal);
    const emptyCount = Math.max(1, safeTotal - safeCurrent);
    return filled.repeat(safeCurrent) + empty.repeat(emptyCount);
}
