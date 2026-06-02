const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 1. 알림 목록 조회
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const { noti_type } = req.query;
    let connection;
    try {
        connection = await db.getConnection();
        let query = `
            SELECT n.NOTI_ID, n.NOTI_TYPE, n.MESSAGE, n.IS_READ,
                   n.TARGET_TYPE, n.TARGET_ID, n.CREATED_AT,
                   u.NICKNAME as SENDER_NICKNAME, u.PROFILE_IMG as SENDER_IMG
            FROM NOTIFICATIONS n
            LEFT JOIN USERS u ON n.SENDER_ID = u.USER_ID
            WHERE n.RECEIVER_ID = :userId
        `;
        const binds = [userId];
        if (noti_type && noti_type !== '전체') {
            query += ` AND n.NOTI_TYPE = :notiType`;
            binds.push(noti_type);
        }
        query += ` ORDER BY n.CREATED_AT DESC`;

        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });
        res.json({ result: true, list: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 2. 알림 읽음 처리
router.put('/:notiId/read', async (req, res) => {
    const { notiId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute(
            `UPDATE NOTIFICATIONS SET IS_READ = 'Y' WHERE NOTI_ID = :notiId`,
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

// 3. 전체 읽음 처리
router.put('/read-all/:userId', async (req, res) => {
    const { userId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        await connection.execute(
            `UPDATE NOTIFICATIONS SET IS_READ = 'Y' WHERE RECEIVER_ID = :userId`,
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

// 4. 읽지 않은 알림 수
router.get('/unread/:userId', async (req, res) => {
    const { userId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT COUNT(*) FROM NOTIFICATIONS 
             WHERE RECEIVER_ID = :userId AND IS_READ = 'N'`,
            [userId]
        );
        res.json({ result: true, count: result.rows[0][0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;