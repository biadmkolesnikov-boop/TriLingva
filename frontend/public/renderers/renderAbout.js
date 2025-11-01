// frontend/public/renderers/renderAbout.js
// --- ИЗМЕНЕНИЕ: Заменено на описание проекта ---

export function renderAbout(appInstance, state) {
     // Рендерит экран "О проекте"
     return `<h1>О проекте "Контекстный тренажёр языка"</h1>
             <div class="card-training" style="text-align: left; line-height: 1.6;">
                 <p>Этот тренажёр создан для эффективного изучения иностранных слов и фраз в контексте.</p>
                 <p><strong>Ключевые особенности:</strong></p>
                 <ul>
                     <li><strong>Билингвальный режим:</strong> Возможность одновременно видеть и тренировать слова на двух языках (например, чешский и английский).</li>
                     <li><strong>Контекстное обучение:</strong> Изучение слов не изолированно, а внутри предложений или целых историй.</li>
                     <li><strong>Постепенное усложнение:</strong> Тренажёр сначала помогает запомнить слово по буквам (Этап 1), затем проверяет знание перевода (Этап 2) и, наконец, предлагает использовать слово в контексте (Этап 3).</li>
                     <li><strong>Гибкость:</strong> Возможность изучать как готовые словари по уровням (A1-C2), так и загружать собственные тексты/истории для проработки лексики.</li>
                     <li><strong>Адаптация:</strong> Настройки позволяют регулировать количество повторений, минимальное число слов для старта и другие параметры.</li>
                 </ul>
                 <p style="margin-top: 15px;">Следите за разработкой и обновлениями в Telegram-канале: <a href="https://t.me/studuju_cesky_sam" target="_blank" rel="noopener noreferrer">SaNSeY</a>.</p>
                 <p>Проект является частью экспериментов <a href="https://filedn.eu/l6axGKfRu0l4BOtFAordyaf/" target="_blank" rel="noopener noreferrer">Творческой Лаборатории</a>.</p>
             </div>
             <div style="margin-top: 20px;">
                <button class="button" onclick="app.state.token ? app.navigateTo('start') : app.navigateTo('login')">Назад</button>
             </div>
             `;
}

