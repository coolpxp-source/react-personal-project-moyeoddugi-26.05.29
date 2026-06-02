const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. 스크랩 토글
router.post('/toggle', async (req, res) => {
    const { userEmail, targetType, targetId } = req.body;
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

        const existing = await connection.execute(
            `SELECT SCRAP_ID FROM SCRAPS 
             WHERE USER_ID = :userId AND TARGET_TYPE = :targetType AND TARGET_ID = :targetId`,
            [userId, targetType, targetId]
        );

        if (existing.rows.length > 0) {
            await connection.execute(
                `DELETE FROM SCRAPS WHERE SCRAP_ID = :scrapId`,
                [existing.rows[0][0]],
                { autoCommit: true }
            );
            res.json({ result: true, scrapped: false, message: '스크랩 취소!' });
        } else {
            await connection.execute(
                `INSERT INTO SCRAPS (USER_ID, TARGET_TYPE, TARGET_ID)
                 VALUES (:userId, :targetType, :targetId)`,
                [userId, targetType, targetId],
                { autoCommit: true }
            );
            res.json({ result: true, scrapped: true, message: '스크랩!' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 2. 스크랩 여부 조회
router.get('/:targetType/:targetId', async (req, res) => {
    const { targetType, targetId } = req.params;
    const { userEmail } = req.query;
    let connection;
    try {
        connection = await db.getConnection();
        let scrapped = false;
        if (userEmail) {
            const userResult = await connection.execute(
                `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`,
                [userEmail]
            );
            if (userResult.rows.length > 0) {
                const userId = userResult.rows[0][0];
                const result = await connection.execute(
                    `SELECT SCRAP_ID FROM SCRAPS 
                     WHERE USER_ID = :userId AND TARGET_TYPE = :targetType AND TARGET_ID = :targetId`,
                    [userId, targetType, targetId]
                );
                scrapped = result.rows.length > 0;
            }
        }
        res.json({ result: true, scrapped });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;