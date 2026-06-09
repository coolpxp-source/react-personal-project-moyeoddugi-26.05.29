const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 1. 알림 목록 조회
router.get('/', async (req, res) => {
    const { userEmail } = req.query;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`,
            [userEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        const userId = userResult.rows[0][0];

        const result = await connection.execute(
            `SELECT n.NOTI_ID, n.NOTI_TYPE, n.TARGET_TYPE, n.TARGET_ID,
                    n.MESSAGE, n.IS_READ, n.CREATED_AT,
                    u.NICKNAME AS SENDER_NICKNAME, u.PROFILE_IMG AS SENDER_PROFILE_IMG,
                    p.BOARD_TYPE AS BOARD_TYPE
            FROM NOTIFICATIONS n
            LEFT JOIN USERS u ON n.SENDER_ID = u.USER_ID
            LEFT JOIN POSTS p ON n.TARGET_TYPE = 'POST' AND n.TARGET_ID = p.POST_ID
            WHERE n.RECEIVER_ID = :userId
            ORDER BY n.CREATED_AT DESC`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({ result: true, list: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 2. 안 읽은 알림 수 조회
router.get('/unread-count', async (req, res) => {
    const { userEmail } = req.query;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`,
            [userEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, count: 0 });
        }
        const userId = userResult.rows[0][0];

        const result = await connection.execute(
            `SELECT COUNT(*) AS CNT FROM NOTIFICATIONS
            WHERE RECEIVER_ID = :userId AND IS_READ = 'N' 
            AND NOTI_TYPE NOT IN ('CHAT')`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({ result: true, count: result.rows[0].CNT });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 3. 전체 읽음 처리
router.put('/read-all', async (req, res) => {
    const { userEmail } = req.query;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`,
            [userEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        const userId = userResult.rows[0][0];

        await connection.execute(
            `UPDATE NOTIFICATIONS SET IS_READ = 'Y'
             WHERE RECEIVER_ID = :userId AND IS_READ = 'N'`,
            [userId],
            { autoCommit: true }
        );

        res.json({ result: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 4. 단일 읽음 처리
router.put('/:notiId/read', async (req, res) => {
    const { notiId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();

        await connection.execute(
            `UPDATE NOTIFICATIONS SET IS_READ = 'Y'
             WHERE NOTI_ID = :notiId`,
            [notiId],
            { autoCommit: true }
        );

        res.json({ result: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;