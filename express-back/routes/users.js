const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 추천 팔로워 (나를 팔로우하지 않은 유저 중 도안 많은 순)
router.get('/recommend', async (req, res) => {
    const { userEmail } = req.query;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`,
            [userEmail]
        );
        if (userResult.rows.length === 0) return res.json({ result: false, list: [] });
        const userId = userResult.rows[0][0];

        const result = await connection.execute(
            `SELECT u.USER_ID, u.NICKNAME, u.PROFILE_IMG, u.BIO,
                    COUNT(p.PATTERN_ID) AS PATTERN_COUNT
            FROM USERS u
            LEFT JOIN PATTERNS p ON p.USER_ID = u.USER_ID
            WHERE u.USER_ID != :userId
            AND u.STATUS = 'ACTIVE'
            AND u.USER_ID NOT IN (
                SELECT FOLLOWING_ID FROM FOLLOWS WHERE FOLLOWER_ID = :userId2
            )
            GROUP BY u.USER_ID, u.NICKNAME, u.PROFILE_IMG, u.BIO
            ORDER BY PATTERN_COUNT DESC
            FETCH FIRST 5 ROWS ONLY`,
            { userId: Number(userId), userId2: Number(userId) }, // ← 이름 다르게 + Number()
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

// 1. 유저 정보 조회
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT USER_ID, NICKNAME, PROFILE_IMG, BIO,
                    (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWING_ID = u.USER_ID) AS FOLLOWER_COUNT,
                    (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWER_ID = u.USER_ID) AS FOLLOWING_COUNT,
                    (SELECT COUNT(*) FROM PATTERNS WHERE USER_ID = u.USER_ID) AS PATTERN_COUNT
             FROM USERS u
             WHERE USER_ID = :userId`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        res.json({ result: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 2. 유저가 올린 도안 목록
router.get('/:userId/patterns', async (req, res) => {
    const { userId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.PATTERN_ID, p.TITLE, p.NEEDLE_TYPE, p.DIFFICULTY,
                    p.CATEGORY, p.THUMBNAIL_IMG, p.CREATED_AT,
                    u.NICKNAME
             FROM PATTERNS p
             JOIN USERS u ON p.USER_ID = u.USER_ID
             WHERE p.USER_ID = :userId
             ORDER BY p.CREATED_AT DESC`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const patterns = result.rows;
        for (const pattern of patterns) {
            const tagResult = await connection.execute(
                `SELECT TAG_NAME FROM PATTERN_TAGS WHERE PATTERN_ID = :patternId`,
                [pattern.PATTERN_ID]
            );
            pattern.TAGS = tagResult.rows.map(r => r[0]);
        }

        res.json({ result: true, list: patterns });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 3. 유저가 올린 게시글 목록
router.get('/:userId/posts', async (req, res) => {
    const { userId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.POST_ID, p.BOARD_TYPE, p.TITLE, p.CONTENT, p.CREATED_AT,
                    u.NICKNAME, u.PROFILE_IMG,
                    (SELECT IMAGE_URL FROM POST_IMAGES 
                     WHERE POST_ID = p.POST_ID AND IS_THUMBNAIL = 'Y'
                     AND ROWNUM = 1) AS THUMBNAIL_IMG,
                    (SELECT COUNT(*) FROM LIKES l
                     WHERE l.TARGET_TYPE = 'POST' 
                     AND l.TARGET_ID = p.POST_ID) AS LIKE_COUNT,
                    (SELECT COUNT(*) FROM COMMENTS c
                     WHERE c.TARGET_TYPE = 'POST'
                     AND c.TARGET_ID = p.POST_ID) AS COMMENT_COUNT
             FROM POSTS p
             JOIN USERS u ON p.USER_ID = u.USER_ID
             WHERE p.USER_ID = :userId
             AND p.BOARD_TYPE != '작품자랑'
             ORDER BY p.CREATED_AT DESC`,
            [userId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const posts = result.rows;
        for (const post of posts) {
            const imgResult = await connection.execute(
                `SELECT IMAGE_URL FROM POST_IMAGES 
                 WHERE POST_ID = :postId ORDER BY SORT_ORDER ASC`,
                [post.POST_ID]
            );
            post.IMAGES = imgResult.rows.map(r => r[0]);
        }

        res.json({ result: true, list: posts });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});


module.exports = router;