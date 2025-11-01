// backend/index.js
// --- ИСПРАВЛЕНИЕ (19.4): Исправлена валидация при загрузке историй (POST /api/stories) ---
// --- ИЗМЕНЕНИЕ (v22.0): Добавлены управление пользователями, профиль, сброс пароля ---
// --- ИЗМЕНЕНИЕ (v22.1): Учтены уточнения по display_name, повторной регистрации, API админа ---
// --- ДОБАВЛЕНО (v22.10): Middleware для обновления активности и маршрут статистики ---

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// --- ИЗМЕНЕНИЕ: Импортируем только authMiddleware ---
const { authMiddleware, isAdminMiddleware } = require('./authMiddleware'); // Импортируем isAdminMiddleware здесь для старых роутов
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const themeRoutes = require('./routes/themeRoutes');
// --- ДОБАВЛЕНО: Импорт генераторов и админского роутера ---
const { generateNickname, processDisplayName } = require('./utils/generators');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, '../../frontend/public')));

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-random';

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API работает', timestamp: new Date().toISOString() });
});

// --- ДОБАВЛЕНО: Middleware для обновления активности (перед authMiddleware) ---
const updateActivityMiddleware = async (req, res, next) => {
    // 1. Пробуем получить токен (так же, как в authMiddleware)
    const authHeader = req.header('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const userId = decoded.userId;

            // 2. Асинхронно обновляем время активности
            // Используем pool.query без ожидания, чтобы не блокировать запрос
            pool.query(
                'UPDATE users SET last_online_at = NOW() WHERE id = $1',
                [userId]
            ).catch(err => {
                // Логгируем ошибку, но не прерываем выполнение запроса
                console.error('Ошибка обновления активности:', err.message);
            });
        } catch (err) {
            // Ошибка проверки токена - ничего не делаем, authMiddleware поймает
        }
    }
    // 3. Передаем управление дальше
    next();
};
// --- КОНЕЦ ДОБАВЛЕНИЯ ---


// --- ПРИМЕНЕНИЕ MIDDLEWARE: UpdateActivity ДО authMiddleware, чтобы избежать проблем с блокировкой ---
app.use(updateActivityMiddleware);


// Подключаем роутеры
app.use('/api/themes', themeRoutes);
// --- ДОБАВЛЕНО: Подключение админского роутера (включает /api/admin/*) ---
// authMiddleware применится ДО isAdminMiddleware внутри adminRoutes
app.use('/api/admin', authMiddleware, adminRoutes);


// --- ДОБАВЛЕНО: Новый маршрут для статистики (Admin only) ---
app.get('/api/admin/stats', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        // 1. Новые пользователи за последние 24 часа
        const newUsersResult = await pool.query(
            "SELECT COUNT(id) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours'"
        );
        const newUsersCount = parseInt(newUsersResult.rows[0].count, 10);

        // 2. Пользователи онлайн за последние 5 минут
        const onlineUsersResult = await pool.query(
            "SELECT COUNT(id) FROM users WHERE last_online_at >= NOW() - INTERVAL '5 minutes'"
        );
        const onlineUsersCount = parseInt(onlineUsersResult.rows[0].count, 10);


        res.json({
            newUsers24h: newUsersCount,
            online5min: onlineUsersCount
        });
    } catch (err) {
        console.error("Ошибка получения статистики админа:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере при получении статистики' });
    }
});
// --- КОНЕЦ ДОБАВЛЕНИЯ ---


// --- Старые маршруты словарей и историй (оставляем isAdminMiddleware здесь) ---
// --- ИЗМЕНЕНИЕ: Переносим isAdminMiddleware из authMiddleware.js сюда ---
// const { isAdminMiddleware } = require('./authMiddleware'); // ИМПОРТИРУЕТСЯ ВВЕРХУ

// --- API для Редактора Словарей (Admin only) ---
app.get('/api/dictionary/:level/:type', authMiddleware, isAdminMiddleware, async (req, res) => {
     const { level, type } = req.params;
    const profile_key = `levels.${level}`;

    if (type !== 'words' && type !== 'phrases') {
        return res.status(400).json({ message: 'Неверный тип словаря. Ожидается "words" или "phrases".' });
    }

    try {
        const result = await pool.query(
            "SELECT content FROM training_materials WHERE profile_key = $1",
            [profile_key]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Словарь для этого уровня не найден' });
        }

        const content = (result.rows[0].content && typeof result.rows[0].content === 'object')
            ? result.rows[0].content
            : { czech: { words: {}, phrases: {} }, english: { words: {}, phrases: {} } };

        res.json({
            czech: content.czech?.[type] || {},
            english: content.english?.[type] || {},
        });
    } catch (err) {
        console.error("Ошибка получения словаря:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

app.post('/api/dictionary/:level/:type', authMiddleware, isAdminMiddleware, async (req, res) => {
    const { level, type } = req.params;
    const { ru, cz, en, category = 'Общее' } = req.body;
    const profile_key = `levels.${level}`;

    if (type !== 'words' && type !== 'phrases') {
        return res.status(400).json({ message: 'Неверный тип словаря. Ожидается "words" или "phrases".' });
    }

    if (!ru || (!cz && !en)) {
        return res.status(400).json({ message: 'Необходимо указать русское слово и хотя бы один перевод.' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const selectQuery = 'SELECT content FROM training_materials WHERE profile_key = $1 FOR UPDATE';
            const { rows } = await client.query(selectQuery, [profile_key]);
             if (rows.length === 0) { throw new Error(`Материалы для уровня ${level} не найдены.`); }
            let content = rows[0].content;

            // (ИЗМЕНЕНО) Инициализация новой структуры
            if (!content) content = {};
            if (!content.czech) content.czech = {};
            // --- (ИСПРАВЛЕНИЕ 19.1) ---
            // Если .dictionary существует, а .words нет, мигрируем
            if (content.czech.dictionary && !content.czech.words) {
                 content.czech.words = content.czech.dictionary;
                 delete content.czech.dictionary;
            }
            if (!content.czech[type]) content.czech[type] = {}; // czech.words или czech.phrases

            if (!content.english) content.english = {};
            if (content.english.dictionary && !content.english.words) {
                 content.english.words = content.english.dictionary;
                 delete content.english.dictionary;
            }
            if (!content.english[type]) content.english[type] = {}; // english.words или english.phrases
            // --- (КОНЕЦ ИСПРАВЛЕНИЯ) ---

            if (!content.czech[type][category]) content.czech[type][category] = {};
            if (!content.english[type][category]) content.english[type][category] = {};

            if(cz) content.czech[type][category][ru] = cz;
            if(en) content.english[type][category][ru] = en;

            const updateQuery = 'UPDATE training_materials SET content = $1 WHERE profile_key = $2 RETURNING content';
            const result = await client.query(updateQuery, [content, profile_key]);

            await client.query('COMMIT');
             res.status(201).json({
                czech: result.rows[0].content?.czech?.[type] || {},
                english: result.rows[0].content?.english?.[type] || {},
             });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Ошибка добавления слова:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

app.put('/api/dictionary/:level/:type', authMiddleware, isAdminMiddleware, async (req, res) => {
    const { level, type } = req.params;
    const { oldRu, oldCategory, newRu, newCz, newEn, newCategory = 'Общее' } = req.body;
    const profile_key = `levels.${level}`;

    if (type !== 'words' && type !== 'phrases') {
        return res.status(400).json({ message: 'Неверный тип словаря. Ожидается "words" или "phrases".' });
    }

    if (!oldRu || !oldCategory || !newRu || (!newCz && !newEn)) {
         return res.status(400).json({ message: 'Не все обязательные поля для обновления предоставлены.' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const selectQuery = 'SELECT content FROM training_materials WHERE profile_key = $1 FOR UPDATE';
            const { rows } = await client.query(selectQuery, [profile_key]);
             if (rows.length === 0) { throw new Error(`Материалы для уровня ${level} не найдены.`); }
            let content = rows[0].content;

            // (ИЗМЕНЕНО) Инициализация новой структуры
            if (!content) content = {};
            if (!content.czech) content.czech = {};
            // --- (ИСПРАВЛЕНИЕ 19.1) ---
            if (content.czech.dictionary && !content.czech.words) {
                 content.czech.words = content.czech.dictionary;
                 delete content.czech.dictionary;
            }
            if (!content.czech[type]) content.czech[type] = {};

            if (!content.english) content.english = {};
            if (content.english.dictionary && !content.english.words) {
                 content.english.words = content.english.dictionary;
                 delete content.english.dictionary;
            }
            if (!content.english[type]) content.english[type] = {};
            // --- (КОНЕЦ ИСПРАВЛЕНИЯ) ---

            if (content.czech[type][oldCategory]?.[oldRu] !== undefined) {
                delete content.czech[type][oldCategory][oldRu];
                if (Object.keys(content.czech[type][oldCategory]).length === 0) {
                    delete content.czech[type][oldCategory];
                }
            }
            if (content.english[type][oldCategory]?.[oldRu] !== undefined) {
                delete content.english[type][oldCategory][oldRu];
                 if (Object.keys(content.english[type][oldCategory]).length === 0) {
                    delete content.english[type][oldCategory];
                }
            }

            if (!content.czech[type][newCategory]) content.czech[type][newCategory] = {};
            if (!content.english[type][newCategory]) content.english[type][newCategory] = {};

            if(newCz) content.czech[type][newCategory][newRu] = newCz;
            if(newEn) content.english[type][newCategory][newRu] = newEn;

            const updateQuery = 'UPDATE training_materials SET content = $1 WHERE profile_key = $2 RETURNING content';
            const result = await client.query(updateQuery, [content, profile_key]);

            await client.query('COMMIT');
             res.status(200).json({
                czech: result.rows[0].content?.czech?.[type] || {},
                english: result.rows[0].content?.english?.[type] || {},
             });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Ошибка обновления слова:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

app.delete('/api/dictionary/:level/:type', authMiddleware, isAdminMiddleware, async (req, res) => {
        const { level, type } = req.params;
    const { itemsToDelete } = req.body;
    const profile_key = `levels.${level}`;

    if (type !== 'words' && type !== 'phrases') {
        return res.status(400).json({ message: 'Неверный тип словаря. Ожидается "words" или "phrases".' });
    }

    if (!itemsToDelete || !Array.isArray(itemsToDelete) || itemsToDelete.length === 0) {
        return res.status(400).json({ message: 'Не указаны элементы для удаления или неверный формат' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const selectQuery = 'SELECT content FROM training_materials WHERE profile_key = $1 FOR UPDATE';
            const { rows } = await client.query(selectQuery, [profile_key]);
            if (rows.length === 0) {
                 throw new Error(`Материалы для уровня ${level} не найдены.`);
            }

            let content = rows[0].content;

            // (ИЗМЕНЕНО) Инициализация новой структуры
            if (!content) content = {};
            if (!content.czech) content.czech = {};
             // --- (ИСПРАВЛЕНИЕ 19.1, хотя здесь не так критично, но для консистентности) ---
            if (content.czech.dictionary && !content.czech.words) {
                 content.czech.words = content.czech.dictionary;
                 delete content.czech.dictionary;
            }
            if (!content.czech[type]) content.czech[type] = {};

            if (!content.english) content.english = {};
            if (content.english.dictionary && !content.english.words) {
                 content.english.words = content.english.dictionary;
                 delete content.english.dictionary;
            }
            if (!content.english[type]) content.english[type] = {};
            // --- (КОНЕЦ ИСПРАВЛЕНИЯ) ---

            let deletedCount = 0;
            for (const item of itemsToDelete) {
                if (typeof item !== 'object' || !item || typeof item.ru !== 'string' || typeof item.category !== 'string') {
                    console.warn("Пропуск некорректного элемента в itemsToDelete:", item);
                    continue;
                }
                const { ru, category } = item;
                let itemDeleted = false;

                if (content.czech[type][category]?.[ru] !== undefined) {
                    delete content.czech[type][category][ru];
                    if (Object.keys(content.czech[type][category]).length === 0) {
                        delete content.czech[type][category];
                    }
                    itemDeleted = true;
                }

                if (content.english[type][category]?.[ru] !== undefined) {
                    delete content.english[type][category][ru];
                    if (Object.keys(content.english[type][category]).length === 0) {
                        delete content.english[type][category];
                    }
                    itemDeleted = true;
                }
                if(itemDeleted) deletedCount++;
            }

            const updateQuery = 'UPDATE training_materials SET content = $1 WHERE profile_key = $2 RETURNING content';
            const result = await client.query(updateQuery, [content, profile_key]);

            await client.query('COMMIT');
            res.status(200).json({
                message: `${deletedCount} слов(а) удалено`,
                czech: result.rows[0].content?.czech?.[type] || {},
                english: result.rows[0].content?.english?.[type] || {},
             });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Ошибка удаления слов:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

app.post('/api/dictionary/:level/:type/import', authMiddleware, isAdminMiddleware, async (req, res) => {
        const { level, type } = req.params;
    const { czech, english } = req.body; // Тело { czech: {...}, english: {...} }
    const profile_key = `levels.${level}`;

    if (type !== 'words' && type !== 'phrases') {
        return res.status(400).json({ message: 'Неверный тип словаря. Ожидается "words" или "phrases".' });
    }

    if (typeof czech !== 'object' || czech === null || typeof english !== 'object' || english === null) {
        return res.status(400).json({ message: 'Некорректный формат данных словарей для импорта.' });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const selectQuery = 'SELECT content FROM training_materials WHERE profile_key = $1 FOR UPDATE';
            const { rows } = await client.query(selectQuery, [profile_key]);
            if (rows.length === 0) {
                 throw new Error(`Материалы для уровня ${level} не найдены.`);
            }
            let content = rows[0].content || {};

            if (!content.czech) content.czech = {};
            // --- (ИСПРАВЛЕНИЕ 19.1) ---
            // При импорте мы *затираем* старые данные .dictionary, если они были
            if (content.czech.dictionary) {
                 delete content.czech.dictionary;
            }
            content.czech[type] = czech; // Записываем импорт

            if (!content.english) content.english = {};
            if (content.english.dictionary) {
                 delete content.english.dictionary;
            }
            content.english[type] = english;
            // --- (КОНЕЦ ИСПРАВЛЕНИЯ) ---

            const updateQuery = 'UPDATE training_materials SET content = $1 WHERE profile_key = $2 RETURNING content';
            const result = await client.query(updateQuery, [content, profile_key]);

            await client.query('COMMIT');
            res.status(200).json({
                message: 'Словарь успешно импортирован!',
                czech: result.rows[0].content?.czech?.[type] || {},
                english: result.rows[0].content?.english?.[type] || {},
            });
        } catch (e) {
             await client.query('ROLLBACK');
             throw e;
        } finally {
             client.release();
        }
    } catch (err) {
        console.error("Ошибка импорта словаря:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// --- API для добавления/удаления историй ---
app.post('/api/stories', authMiddleware, isAdminMiddleware, async (req, res) => {
        try {
        const storyData = req.body;

        // --- (ИЗМЕНЕНИЕ) ---
        // (ИСПРАВЛЕНИЕ) Проверяем наличие .dictionary (старый) ИЛИ .words (новый)
        const hasOldFormat = storyData.czech?.dictionary;
        const hasNewFormat = storyData.czech?.words;

        if (!storyData.name || !storyData.text_ru || (!hasOldFormat && !hasNewFormat)) {
            return res.status(400).json({ message: 'Неверная структура файла истории (ожидается .czech.dictionary или .czech.words).' });
        }
        // --- (КОНЕЦ ИЗМЕНЕНИЯ) ---

        if (storyData.czech.dictionary) {
            storyData.czech.words = storyData.czech.dictionary;
            storyData.czech.phrases = {};
            delete storyData.czech.dictionary;
        }
         if (storyData.english && storyData.english.dictionary) {
            storyData.english.words = storyData.english.dictionary;
            storyData.english.phrases = {};
            delete storyData.english.dictionary;
        }

        const material_type = 'story';
        const safeNamePart = storyData.name.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 50);
        const profile_key = `custom.${safeNamePart}_${Date.now()}`;

        await pool.query(
            `INSERT INTO training_materials (profile_key, material_type, name, content)
             VALUES ($1, $2, $3, $4)`,
            [profile_key, material_type, storyData.name, storyData]
        );

        res.status(201).json({ message: `История "${storyData.name}" успешно добавлена!`, profile_key });

    } catch (err) {
        console.error("Ошибка добавления истории:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

app.delete('/api/stories/:storyId', authMiddleware, isAdminMiddleware, async (req, res) => {
        try {
        const { storyId } = req.params;
        // (ИСПРАВЛЕНИЕ) ID теперь содержит цифры от Date.now()
        const profile_key = `custom.${storyId}`;

        // (Ослабленная проверка, т.к. в ID есть цифры и дефисы)
        if (storyId.length < 5) {
             return res.status(400).json({ message: 'Некорректный ID истории.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM user_progress WHERE profile_key = $1', [profile_key]);
            const deleteResult = await client.query(
                'DELETE FROM training_materials WHERE profile_key = $1 RETURNING name',
                [profile_key]
            );
            await client.query('COMMIT');

            if (deleteResult.rowCount === 0) {
                return res.status(404).json({ message: 'История с таким ID не найдена.' });
            }
            const deletedName = deleteResult.rows[0].name;
            res.status(200).json({ message: `История "${deletedName}" успешно удалена из базы данных.` });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Ошибка удаления истории:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});


// --- ОБНОВЛЕННЫЕ МАРШРУТЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ---

// POST /api/register - Регистрация пользователя
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, display_name, year_of_birth, nickname, about_me, avatar_emoji } = req.body;

    // --- Валидация ---
    if (!email || !password || !display_name || !year_of_birth) {
      return res.status(400).json({ message: 'Email, пароль, Имя Фамилия и Год рождения обязательны' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
       return res.status(400).json({ message: 'Некорректный формат email' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
    }
    const year = parseInt(year_of_birth, 10);
    if (isNaN(year) || year < 1920 || year > 2025) {
      return res.status(400).json({ message: 'Год рождения должен быть между 1920 и 2025' });
    }
    // --- ИЗМЕНЕНИЕ (v22.1): Валидация display_name только если пользователь его вводит ---
    // if (display_name && display_name.trim().length < 2) {
    //    return res.status(400).json({ message: 'Имя Фамилия должно содержать не менее 2 символов' });
    // }

    // --- Генерация и обработка имен ---
    const generatedNickname = generateNickname();
    const finalNickname = nickname?.trim() || generatedNickname;
    // --- ИЗМЕНЕНИЕ (v22.1): Используем processDisplayName с новыми правилами ---
    const finalDisplayName = processDisplayName(display_name, generatedNickname);
    const finalAvatar = avatar_emoji || '🤪'; // Дефолтный аватар

     // --- ИЗМЕНЕНИЕ (v22.1): Проверка display_name после обработки ---
     if (finalDisplayName.length < 2) {
         // Эта ситуация возможна, если и введенное имя короткое, и сгенерированное (маловероятно)
         return res.status(400).json({ message: 'Имя Фамилия не может быть короче 2 символов (даже сгенерированное)' });
     }


    // --- Проверка существующего пользователя ---
    const existingUserResult = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    const existingUser = existingUserResult.rows[0];

    let passwordHash = '';
    // --- ИЗМЕНЕНИЕ (v22.1): Проверяем, пустой ли хэш (был сброшен) ---
    if (existingUser && (existingUser.password_hash === null || existingUser.password_hash === '')) {
      // --- Повторная регистрация ---
      console.log(`Повторная регистрация для ${email}. Обновление данных.`);
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);

      await pool.query(
        `UPDATE users SET
          password_hash = $1, display_name = $2, year_of_birth = $3, nickname = $4,
          about_me = $5, avatar_emoji = $6, password_reset_requested = false, is_active = true
         WHERE id = $7`,
        [passwordHash, finalDisplayName, year, finalNickname, about_me, finalAvatar, existingUser.id]
      );
      res.status(200).json({ message: 'Данные пользователя обновлены. Теперь вы можете войти.', user: { id: existingUser.id, email } });

    } else if (existingUser) {
      // --- Обычный пользователь уже существует ---
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });

    } else {
      // --- Новая регистрация ---
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);

      const newUser = await pool.query(
        `INSERT INTO users (email, password_hash, display_name, year_of_birth, nickname, about_me, avatar_emoji, settings, is_active, password_reset_requested)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false)
         RETURNING id, email`,
        [email, passwordHash, finalDisplayName, year, finalNickname, about_me, finalAvatar, '{}']
      );
      res.status(201).json({
        message: 'Пользователь успешно зарегистрирован!',
        user: newUser.rows[0],
      });
    }

  } catch (err) {
    console.error("Ошибка регистрации:", err.message);
    // Обработка уникального ключа (на всякий случай, хотя проверка есть выше)
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует (ошибка БД)' });
    }
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
});

// POST /api/login - Вход пользователя
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    // --- Получаем больше данных при входе ---
    const userResult = await pool.query('SELECT id, email, password_hash, is_active FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Неверные учётные данные' });
    }

    // --- ИЗМЕНЕНИЕ (v22.1): Проверка на сброшенный пароль ---
    if (user.password_hash === null || user.password_hash === '') {
        return res.status(401).json({ message: 'Пароль сброшен. Пожалуйста, зарегистрируйтесь заново под тем же email - Ваш прогресс сохранён.' });
    }

    // --- Проверка на активность ---
    if (!user.is_active) {
        return res.status(403).json({ message: 'Аккаунт деактивирован администратором.' });
    }

    // --- Проверка пароля ---
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверные учётные данные' });
    }

    // --- Генерация токена ---
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '24h',
    });
    res.json({ message: 'Вход выполнен успешно!', token });

  } catch (err) {
    console.error("Ошибка входа:", err.message);
    res.status(500).json({ message: 'Ошибка на сервере' });
  }
});

// GET /api/profile - Получение профиля пользователя
app.get('/api/profile', authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
             return res.status(401).json({ message: 'Ошибка аутентификации. ID пользователя не найден.' });
        }
        const userId = req.user.userId;

        // --- Запрашиваем все нужные поля ---
        const userResult = await pool.query(
            `SELECT id, email, nickname, display_name, year_of_birth, about_me, avatar_emoji,
                    created_at, selected_theme_id, settings
             FROM users WHERE id = $1`,
            [userId]
        );
        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        user.settings = user.settings || {}; // Гарантируем, что settings есть
        res.json(user);

    } catch (err) {
        console.error("Ошибка получения профиля:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// PUT /api/profile - Обновление профиля пользователя
app.put('/api/profile', authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
             return res.status(401).json({ message: 'Ошибка аутентификации. ID пользователя не найден.' });
        }
        const userId = req.user.userId;
        const { nickname, display_name, year_of_birth, about_me, avatar_emoji, old_password, new_password } = req.body;

        const updates = [];
        const params = [];
        let paramIndex = 1;

        // --- Обновление основных полей профиля ---
        if (display_name !== undefined) {
             // --- ИЗМЕНЕНИЕ (v22.1): Валидация + обработка ---
             const generatedNickname = generateNickname(); // Нужен для processDisplayName
             const processedDisplayName = processDisplayName(display_name, generatedNickname);
             if (processedDisplayName.length < 2) {
                 return res.status(400).json({ message: 'Имя Фамилия не может быть короче 2 символов' });
             }
             updates.push(`display_name = $${paramIndex++}`);
             params.push(processedDisplayName);
        }
        if (year_of_birth !== undefined) {
            const year = parseInt(year_of_birth, 10);
            if (isNaN(year) || year < 1920 || year > 2025) return res.status(400).json({ message: 'Год рождения должен быть между 1920 и 2025' });
            updates.push(`year_of_birth = $${paramIndex++}`);
            params.push(year);
        }
        if (nickname !== undefined) {
            updates.push(`nickname = $${paramIndex++}`);
            params.push(nickname?.trim() || null); // Пустой ник сохраняем как NULL
        }
        if (about_me !== undefined) {
            updates.push(`about_me = $${paramIndex++}`);
            params.push(about_me?.trim() || null);
        }
         if (avatar_emoji !== undefined) {
             updates.push(`avatar_emoji = $${paramIndex++}`);
             params.push(avatar_emoji || '🤪'); // Дефолт, если прислали пустое
         }

        // --- Смена пароля ---
        if (old_password && new_password) {
            if (new_password.length < 6) return res.status(400).json({ message: 'Новый пароль должен быть не менее 6 символов' });

            const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
            const user = userResult.rows[0];
            if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
             // --- ИЗМЕНЕНИЕ (v22.1): Обработка NULL/пустого хэша при смене пароля ---
             const oldPasswordHash = user.password_hash || '';
             // Если хэш пустой (пароль сброшен), старый пароль не проверяем (считаем совпадением)
             const isMatch = (oldPasswordHash === '') ? true : await bcrypt.compare(old_password, oldPasswordHash);

            if (!isMatch) return res.status(401).json({ message: 'Старый пароль неверен' });

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(new_password, salt);
            updates.push(`password_hash = $${paramIndex++}`);
            params.push(passwordHash);
            // Если меняем пароль, сбрасываем флаг запроса на сброс
            updates.push(`password_reset_requested = false`);

        } else if (old_password || new_password) {
             // Если предоставлен только один из паролей для смены
             return res.status(400).json({ message: 'Для смены пароля необходимо указать старый и новый пароли' });
        }

        // --- Выполнение запроса, если есть что обновлять ---
        if (updates.length > 0) {
            params.push(userId); // Добавляем ID пользователя последним параметром
            const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id`;
            await pool.query(query, params);
            res.status(200).json({ message: 'Профиль успешно обновлен' });
        } else {
            res.status(200).json({ message: 'Нет данных для обновления' });
        }

    } catch (err) {
        console.error("Ошибка обновления профиля:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});


// POST /api/request-password-reset - Запрос на сброс пароля пользователем
app.post('/api/request-password-reset', authMiddleware, async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
             return res.status(401).json({ message: 'Ошибка аутентификации. ID пользователя не найден.' });
        }
        const userId = req.user.userId;

        // --- ИЗМЕНЕНИЕ (v22.1): Проверяем, не был ли пароль уже сброшен ---
        const userCheck = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден.' });
        }
        if (userCheck.rows[0].password_hash === null || userCheck.rows[0].password_hash === '') {
             return res.status(400).json({ message: 'Пароль уже сброшен. Пожалуйста, зарегистрируйтесь заново под тем же email - Ваш прогресс сохранён.' });
        }

        // Устанавливаем флаг запроса
        await pool.query('UPDATE users SET password_reset_requested = true WHERE id = $1', [userId]);

        // В будущем здесь будет отправка email
        console.log(`Пользователь ${userId} запросил сброс пароля.`);
        res.status(200).json({ message: 'Запрос на сброс пароля отправлен администратору.' });

    } catch (err) {
        console.error("Ошибка запроса на сброс пароля:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});


// POST /api/settings - Сохранение настроек (без изменений)
app.post('/api/settings', authMiddleware, async (req, res) => {
        try {
         if (!req.user || !req.user.userId) {
             return res.status(401).json({ message: 'Ошибка аутентификации. ID пользователя не найден.' });
        }
        const userId = req.user.userId;
        const { settings } = req.body;

        if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
            return res.status(400).json({ message: 'Некорректный формат настроек. Ожидается объект.' });
        }

        await pool.query(
            'UPDATE users SET settings = $1 WHERE id = $2',
            [settings, userId]
        );

        res.status(200).json({ message: 'Настройки успешно сохранены' });
    } catch (err) {
        console.error("Ошибка сохранения настроек:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// POST /api/user/theme - Установка темы пользователя (без изменений)
app.post('/api/user/theme', authMiddleware, async (req, res) => {
        try {
        if (!req.user || !req.user.userId) {
             return res.status(401).json({ message: 'Ошибка аутентификации. ID пользователя не найден.' });
        }
        const userId = req.user.userId;
        const { themeId } = req.body;

        const newThemeId = (themeId === 'null' || themeId === null) ? null : themeId;

        if (newThemeId !== null) {
            const themeExists = await pool.query('SELECT 1 FROM themes WHERE id = $1', [newThemeId]);
            if (themeExists.rowCount === 0) {
                 return res.status(404).json({ message: 'Выбранная тема не найдена.' });
            }
        }

        await pool.query(
            'UPDATE users SET selected_theme_id = $1 WHERE id = $2',
            [newThemeId, userId]
        );

        res.status(200).json({ message: 'Тема пользователя обновлена' });
    } catch (err) {
        if (err.code === '23503') {
             return res.status(404).json({ message: 'Выбранная тема не найдена (ошибка FK).' });
        }
        console.error("Ошибка обновления темы пользователя:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// GET /api/training-materials - Получение учебных материалов (без изменений)
app.get('/api/training-materials', authMiddleware, async (req, res) => {
        try {
        const materialsResult = await pool.query('SELECT profile_key, material_type, name, content FROM training_materials ORDER BY profile_key');
        const materials = { levels: {}, custom: {} };

        // (ИСПРАВЛЕНИЕ 19.1) Временное хранилище для измененных данных, которые нужно сохранить
        const updatesToSave = [];

        for (const row of materialsResult.rows) {
            const keyParts = row.profile_key.split('.');
            if (keyParts.length < 2) continue;

            const type = keyParts[0];
            const key = keyParts.slice(1).join('.');

            let content = (typeof row.content === 'object' && row.content !== null) ? row.content : {};
            let needsUpdate = false; // Флаг, что эту строку нужно обновить в БД

            // --- (НОВАЯ ЛОГИКА МИГРАЦИИ) ---
            const migrate = (dict) => {
                if (!dict) dict = {};
                // 1. Проверяем, есть ли новые ключи
                const hasNewFormat = dict.words !== undefined || dict.phrases !== undefined;
                // 2. Если старый ключ есть, а нового нет - мигрируем
                if (dict.dictionary && !hasNewFormat) {
                    console.log(`(Миграция ${row.profile_key}): найден .dictionary, .words/.phrases отсутствуют.`);
                    dict.words = dict.dictionary; // Переносим
                    dict.phrases = {}; // Создаем
                    delete dict.dictionary; // Удаляем старый
                    needsUpdate = true; // Отмечаем для сохранения
                }
                // 3. Если нового формата все еще нет (и старого не было), просто создаем пустую структуру
                if (!hasNewFormat && !dict.words) {
                    dict.words = {};
                    dict.phrases = {};
                }
                return dict;
            };
            // --- (КОНЕЦ НОВОЙ ЛОГИКИ) ---

            content.czech = migrate(content.czech);
            content.english = migrate(content.english || {}); // Гарантируем, что english есть

            if (type === 'levels') {
                materials.levels[key] = {
                    name: row.name,
                    czech: content.czech,
                    english: content.english
                 };
            } else if (type === 'custom') {
                 materials.custom[key] = content;
            }

            // Если миграция произошла, добавляем в очередь на обновление
            if (needsUpdate) {
                console.log(`Планирование обновления (миграции) для ${row.profile_key} в БД...`);
                updatesToSave.push(
                    pool.query('UPDATE training_materials SET content = $1 WHERE profile_key = $2', [content, row.profile_key])
                );
            }
        }

        // Отправляем ответ пользователю немедленно
        res.json(materials);

        // --- (ДОБАВЛЕНО) ---
        // После того, как ответ ушел, тихо сохраняем мигрированные данные в БД
        if (updatesToSave.length > 0) {
            try {
                await Promise.all(updatesToSave);
                console.log(`Успешно мигрировано ${updatesToSave.length} записей в БД.`);
            } catch (updateErr) {
                 console.error("Ошибка во время фонового сохранения миграции:", updateErr.message);
            }
        }

    } catch (err) {
        console.error("Ошибка при получении учебных материалов:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// GET /api/progress - Получение прогресса пользователя (без изменений)
app.get('/api/progress', authMiddleware, async (req, res) => {
        try {
        if (!req.user || !req.user.userId) {
             return res.status(401).json({ message: 'Ошибка аутентификации. ID пользователя не найден.' });
        }
        const userId = req.user.userId;
        const progressResult = await pool.query('SELECT profile_key, progress_data FROM user_progress WHERE user_id = $1', [userId]);
        const progress = {};
        progressResult.rows.forEach(row => {
            progress[row.profile_key] = (typeof row.progress_data === 'object' && row.progress_data !== null) ? row.progress_data : {};
        });
        res.json(progress);
    } catch (err) {
        console.error("Ошибка при получении прогресса:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// POST /api/progress - Сохранение прогресса пользователя (без изменений)
app.post('/api/progress', authMiddleware, async (req, res) => {
        try {
        if (!req.user || !req.user.userId) {
             return res.status(401).json({ message: 'Ошибка аутентификации. ID пользователя не найден.' });
        }
        const userId = req.user.userId;
        const { profile_key, progressData } = req.body;
        if (!profile_key || typeof progressData !== 'object' || progressData === null) {
            return res.status(400).json({ message: 'Не предоставлены ключ профиля или корректные данные прогресса' });
        }
        await pool.query(
            `INSERT INTO user_progress (user_id, profile_key, progress_data)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, profile_key)
             DO UPDATE SET progress_data = EXCLUDED.progress_data, updated_at = NOW();`,
            [userId, profile_key, progressData]
        );
        res.status(200).json({ message: 'Прогресс успешно сохранён' });
    } catch (err) {
        if (err.code === '23503' && err.constraint === 'user_progress_profile_key_fkey') {
            return res.status(400).json({ message: `Профиль с ключом '${req.body.profile_key}' не найден в training_materials.` });
        }
        console.error("Ошибка при сохранении прогресса:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

module.exports = app;
