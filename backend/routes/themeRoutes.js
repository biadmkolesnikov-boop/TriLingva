// backend/routes/themeRoutes.js
// (НОВЫЙ ФАЙЛ)
// Этот файл содержит все маршруты, связанные с API тем оформления.

const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authMiddleware, isAdminMiddleware } = require('../authMiddleware'); // <-- Импортируем middleware из папки выше (..)

const router = express.Router(); // Создаем экземпляр Router

// Секретный ключ (можно вынести в конфиг, но пока оставим здесь для простоты)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-random';

// --- Маршруты для Тем ---
// (Весь код из index.js, связанный с /api/themes, перенесен сюда)
// Обрати внимание: пути теперь указываются относительно '/api/themes',
// так как этот роутер будет монтироваться именно на этот префикс в index.js

// GET /api/themes/active
router.get('/active', async (req, res) => {
    // 1. Пробуем извлечь токен
    let token;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    let userId = null;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            userId = decoded.userId;
        } catch (e) {
            userId = null;
        }
    }

    try {
        let themeResult;
        // 2. Если токен валиден, ищем персональную тему
        if (userId) {
            const userThemeQuery = `
                SELECT T.id, T.name, T.colors
                FROM themes T
                JOIN users U ON U.selected_theme_id = T.id
                WHERE U.id = $1
            `;
            themeResult = await pool.query(userThemeQuery, [userId]);
        }
        // 3. Если персональная тема не найдена, ищем глобальную
        if (!themeResult || themeResult.rows.length === 0) {
            themeResult = await pool.query('SELECT id, name, colors FROM themes WHERE is_active = true LIMIT 1');
        }
        // 4. Если и глобальной нет, отдаем первую попавшуюся
        if (themeResult.rows.length === 0) {
            themeResult = await pool.query('SELECT id, name, colors FROM themes ORDER BY id LIMIT 1');
        }
        // 5. Если совсем ничего нет
        if (themeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Темы не найдены в базе данных.' });
        }
        res.json(themeResult.rows[0]);
    } catch (err) {
        console.error("Ошибка при получении активной темы:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// GET /api/themes
// Middleware authMiddleware здесь нужен, так как пользователь должен быть залогинен, чтобы видеть список тем
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, colors, is_active FROM themes ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error("Ошибка при получении списка тем:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// POST /api/themes
router.post('/', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { name, colors } = req.body;
        const id = `theme-${name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}`;
        const result = await pool.query(
            'INSERT INTO themes (id, name, colors, is_active) VALUES ($1, $2, $3, false) RETURNING *',
            [id, name, colors]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
         if (err.code === '23505') {
            return res.status(400).json({ message: 'Тема с таким ID (сгенерированным из имени) уже существует.' });
        }
        console.error("Ошибка добавления темы:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// PUT /api/themes/:id
router.put('/:id', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, colors } = req.body;
        const result = await pool.query(
            'UPDATE themes SET name = $1, colors = $2 WHERE id = $3 RETURNING *',
            [name, colors, id]
        );
         if (result.rows.length === 0) {
             return res.status(404).json({ message: 'Тема с таким ID не найдена.' });
         }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Ошибка обновления темы:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// DELETE /api/themes/:id
router.delete('/:id', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const checkActive = await pool.query('SELECT is_active FROM themes WHERE id = $1', [id]);
        if (checkActive.rows.length > 0 && checkActive.rows[0].is_active) {
            return res.status(400).json({ message: 'Нельзя удалить глобально активную тему. Сначала сделайте активной другую.' });
        }
        const deleteResult = await pool.query('DELETE FROM themes WHERE id = $1 RETURNING id', [id]);
        if (deleteResult.rowCount === 0) {
             return res.status(404).json({ message: 'Тема с таким ID не найдена.' });
        }
        res.status(200).json({ message: `Тема ${id} удалена` });
    } catch (err) {
        console.error("Ошибка удаления темы:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// POST /api/themes/:id/activate
router.post('/:id/activate', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Используем транзакцию для атомарности
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('UPDATE themes SET is_active = false WHERE is_active = true'); // Снимаем флаг со старой активной темы
            const result = await client.query('UPDATE themes SET is_active = true WHERE id = $1 RETURNING id', [id]); // Устанавливаем флаг новой
            await client.query('COMMIT');
            if (result.rowCount === 0) {
                 return res.status(404).json({ message: 'Тема с таким ID не найдена.' });
            }
            res.status(200).json({ message: `Тема ${id} активирована` });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e; // Пробрасываем ошибку дальше
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Ошибка активации темы:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// Экспортируем роутер, чтобы его можно было подключить в index.js
module.exports = router;