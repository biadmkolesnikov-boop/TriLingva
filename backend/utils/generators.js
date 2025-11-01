// backend/utils/generators.js

// Списки слов для генерации
const ADJECTIVES = [
    "Быстрый", "Смелый", "Хитрый", "Мудрый", "Веселый", "Спокойный", "Ловкий", "Резиновый",
    "Дикий", "Разъяренный", "Косолапый", "Забавный", "Умный", "Красный", "Синий", "Зеленый",
    "Яркий", "Тихий", "Громкий", "Маленький", "Большой", "Старый", "Молодой", "Добрый"
];

const ANIMALS = [
    "Лис", "Волк", "Медведь", "Заяц", "Бобер", "Олень", "Енот", "Барсук",
    "Коала", "Буйвол", "Макак", "Тигр", "Лев", "Слон", "Жираф", "Кенгуру",
    "Панда", "Ёж", "Сурикат", "Лемур", "Опоссум", "Хомяк", "Крот", "Выдра"
    // Добавьте больше животных по желанию
];

/**
 * Генерирует случайный никнейм в формате "Прилагательное Животное".
 * @returns {string} Случайный никнейм.
 */
function generateNickname() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    return `${adj} ${animal}`;
}

/**
 * Обрабатывает display_name: генерирует, если пусто, или дополняет, если неполное.
 * @param {string | null | undefined} displayName Введенное пользователем имя/фамилия.
 * @param {string} generatedNickname Сгенерированный никнейм для дополнения.
 * @returns {string} Обработанное Имя Фамилия.
 */
function processDisplayName(displayName, generatedNickname) {
    // 1. Если display_name не предоставлен или пустой после обрезки пробелов
    if (!displayName || !displayName.trim()) {
        console.log("Display name is empty, using generated nickname:", generatedNickname);
        return generatedNickname; // Используем сгенерированный ник как Имя Фамилия
    }

    const trimmedDisplayName = displayName.trim();
    const parts = trimmedDisplayName.split(/\s+/); // Разделяем по пробелам

    // 2. Если введено только одно слово
    if (parts.length === 1) {
        const namePart = parts[0];
        // Если введенное слово короче 2 символов, это ошибка (валидация на уровне API)
        // Но здесь на всякий случай вернем ник
        if (namePart.length < 2) {
             console.log("Single part display name is too short, using generated nickname:", generatedNickname);
             return generatedNickname;
        }

        const generatedParts = generatedNickname.split(' ');
        const generatedPart = generatedParts[1] || generatedParts[0]; // Берем "Животное" из ника
        const finalName = `${namePart} ${generatedPart}`;
        console.log(`Single part display name "${namePart}", generated part "${generatedPart}", final: "${finalName}"`);
        // Возвращаем "Введенное Дополненное"
        return finalName;
    }

    // 3. Если введено два или больше слов, берем первые два
    const finalName = parts.slice(0, 2).join(' ');
    console.log(`Multiple parts display name provided, using first two: "${finalName}"`);
    return finalName;
}


module.exports = {
    generateNickname,
    processDisplayName
};

