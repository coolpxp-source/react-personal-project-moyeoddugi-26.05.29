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

// 3. 스크랩 목록 조회
router.get('/list', async (req, res) => {
    const { userEmail, targetType } = req.query;
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

        let result;
        if (targetType === 'PATTERN') {
            result = await connection.execute(
                `SELECT p.PATTERN_ID, p.TITLE, p.NEEDLE_TYPE, p.DIFFICULTY,
                        u.NICKNAME, u.PROFILE_IMG, p.THUMBNAIL_IMG
                 FROM SCRAPS s
                 JOIN PATTERNS p ON s.TARGET_ID = p.PATTERN_ID
                 JOIN USERS u ON p.USER_ID = u.USER_ID
                 WHERE s.USER_ID = :userId AND s.TARGET_TYPE = :targetType
                 ORDER BY s.CREATED_AT DESC`,
                [userId, targetType],
                { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
            );
        } else if (targetType === 'POST') {
            result = await connection.execute(
                `SELECT p.POST_ID, p.TITLE, p.CONTENT, p.BOARD_TYPE, p.CREATED_AT,
                        u.NICKNAME, u.PROFILE_IMG
                 FROM SCRAPS s
                 JOIN POSTS p ON s.TARGET_ID = p.POST_ID
                 JOIN USERS u ON p.USER_ID = u.USER_ID
                 WHERE s.USER_ID = :userId AND s.TARGET_TYPE = :targetType
                 ORDER BY s.CREATED_AT DESC`,
                [userId, targetType],
                { outFormat: require('oracledb').OUT_FORMAT_OBJECT }
            );
        }
        res.json({ result: true, list: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;