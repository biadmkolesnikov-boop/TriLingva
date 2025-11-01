// backend/routes/adminRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db'); // Путь к db.js
const { isAdminMiddleware } = require('../authMiddleware'); // Только isAdminMiddleware

const router = express.Router();

// Middleware для проверки прав админа на все маршруты в этом файле
router.use(isAdminMiddleware);

// GET /api/admin/users - Получить список пользователей
router.get('/users', async (req, res) => {
    const { resetRequested } = req.query; // Получаем параметр ?resetRequested=true
    const adminEmail = 'admin@example.com'; // Ваш email админа

    try {
        let query = `
            SELECT id, email, nickname, display_name, year_of_birth, is_active, password_reset_requested
            FROM users
        `;
        const params = [];

        if (resetRequested === 'true') {
            query += ' WHERE password_reset_requested = true';
        }

        // Добавляем сортировку: админ всегда первый, остальные по email
        // Параметр $1 будет adminEmail
        query += ` ORDER BY CASE WHEN email = $1 THEN 0 ELSE 1 END, email ASC`;
        params.push(adminEmail);

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (err) {
        console.error("Ошибка получения списка пользователей:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// POST /api/admin/users/:userId/reset-password - Сбросить пароль пользователя
router.post('/users/:userId/reset-password', async (req, res) => {
    const { userId } = req.params;

    try {
        // Устанавливаем пароль в NULL (или пустую строку) и сбрасываем флаг запроса
        // Используем пустую строку '', т.к. NULL может вызвать проблемы с bcrypt при след. логине
        const result = await pool.query(
            'UPDATE users SET password_hash = $1, password_reset_requested = false WHERE id = $2 RETURNING id, email',
            ['', userId] // Устанавливаем пустую строку
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        console.log(`Администратор ${req.user.userId} сбросил пароль для пользователя ${result.rows[0].email} (ID: ${userId})`);
        res.status(200).json({ message: `Пароль для пользователя ${result.rows[0].email} сброшен.` });
    } catch (err) {
        console.error("Ошибка сброса пароля админом:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// PUT /api/admin/users/:userId/change-password - Изменить пароль пользователя (включая админа)
router.put('/users/:userId/change-password', async (req, res) => {
    const { userId } = req.params;
    const { new_password } = req.body;

    // Проверяем, меняет ли админ свой пароль или чужой
    // req.user.userId - ID админа, userId - ID цели
    // (Права админа уже проверены isAdminMiddleware)

    if (!new_password || new_password.length < 6) {
        return res.status(400).json({ message: 'Новый пароль должен быть не менее 6 символов' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(new_password, salt);

        // Обновляем пароль и сбрасываем флаг запроса (на всякий случай)
        const result = await pool.query(
            'UPDATE users SET password_hash = $1, password_reset_requested = false WHERE id = $2 RETURNING id, email',
            [passwordHash, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        console.log(`Администратор ${req.user.userId} изменил пароль для пользователя ${result.rows[0].email} (ID: ${userId})`);
        res.status(200).json({ message: `Пароль для пользователя ${result.rows[0].email} успешно изменен.` });
    } catch (err) {
        console.error("Ошибка изменения пароля админом:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// PUT /api/admin/users/:userId/toggle-active - Активировать/деактивировать пользователя
router.put('/users/:userId/toggle-active', async (req, res) => {
    const { userId } = req.params;
    const adminEmail = 'admin@example.com'; // Ваш email админа

    try {
        // Проверка, не пытается ли админ деактивировать сам себя
        const userCheck = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length > 0 && userCheck.rows[0].email === adminEmail) {
            return res.status(400).json({ message: 'Администратор не может деактивировать сам себя.' });
        }

        // Инвертируем текущее значение is_active
        const result = await pool.query(
            'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, email, is_active',
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = result.rows[0];
        const status = user.is_active ? 'активирован' : 'деактивирован';
        console.log(`Администратор ${req.user.userId} ${status} пользователя ${user.email} (ID: ${userId})`);
        res.status(200).json({ message: `Пользователь ${user.email} ${status}.`, is_active: user.is_active });
    } catch (err) {
        console.error("Ошибка активации/деактивации пользователя:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

// DELETE /api/admin/users/:userId - Удалить пользователя
router.delete('/users/:userId', async (req, res) => {
    const { userId } = req.params;
    const adminEmail = 'admin@example.com'; // Ваш email админа

    try {
        // Проверка, не пытается ли админ удалить сам себя
        const userCheck = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length > 0 && userCheck.rows[0].email === adminEmail) {
            return res.status(400).json({ message: 'Администратор не может удалить сам себя.' });
        }

        // Удаляем связанные данные (прогресс) и самого пользователя
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Сначала удаляем прогресс, чтобы не нарушать foreign key constraint
            await client.query('DELETE FROM user_progress WHERE user_id = $1', [userId]);
            // Затем удаляем пользователя
            const deleteResult = await client.query('DELETE FROM users WHERE id = $1 RETURNING email', [userId]);
            await client.query('COMMIT');

            if (deleteResult.rowCount === 0) {
                return res.status(404).json({ message: 'Пользователь не найден' });
            }

            const deletedEmail = deleteResult.rows[0].email;
            console.log(`Администратор ${req.user.userId} удалил пользователя ${deletedEmail} (ID: ${userId})`);
            res.status(200).json({ message: `Пользователь ${deletedEmail} успешно удален.` });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e; // Пробрасываем ошибку для внешней обработки
        } finally {
            client.release();
        }
    } catch (err) {
        console.error("Ошибка удаления пользователя админом:", err.message);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

module.exports = router;

