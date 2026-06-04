const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. 좋아요 토글 (좋아요/취소)
router.post('/toggle', async (req, res) => {
    const { userEmail, targetType, targetId } = req.body;

    let connection;
    try {
        connection = await db.getConnection();

        // 이메일로 USER_ID 조회
        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`,
            [userEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        const userId = userResult.rows[0][0];

        // 이미 좋아요 했는지 확인
        const existing = await connection.execute(
            `SELECT LIKE_ID FROM LIKES 
             WHERE USER_ID = :userId AND TARGET_TYPE = :targetType AND TARGET_ID = :targetId`,
            [userId, targetType, targetId]
        );

        if (existing.rows.length > 0) {
            // ▼ 이미 좋아요 → 취소
            await connection.execute(
                `DELETE FROM LIKES WHERE LIKE_ID = :likeId`,
                [existing.rows[0][0]],
                { autoCommit: true }
            );
            res.json({ result: true, liked: false, message: '좋아요 취소!' });
        } else {
            // ▼ 좋아요 추가
            await connection.execute(
                `INSERT INTO LIKES (USER_ID, TARGET_TYPE, TARGET_ID)
                 VALUES (:userId, :targetType, :targetId)`,
                [userId, targetType, targetId],
                { autoCommit: true }
            );

            // ▼ 알림 추가
            const ownerTable = targetType === 'PATTERN' ? 'PATTERNS' : 'POSTS';
            const ownerCol = targetType === 'PATTERN' ? 'PATTERN_ID' : 'POST_ID';
            const ownerResult = await connection.execute(
                `SELECT USER_ID FROM ${ownerTable} WHERE ${ownerCol} = :targetId`,
                [targetId]
            );
            if (ownerResult.rows.length > 0) {
                const receiverId = ownerResult.rows[0][0];
                if (receiverId !== userId) {
                    const senderResult = await connection.execute(
                        `SELECT NICKNAME FROM USERS WHERE USER_ID = :userId`,
                        [userId]
                    );
                    const senderNick = senderResult.rows[0][0];

                    // ▼ 제목 조회 추가
                    const targetResult = await connection.execute(
                        `SELECT TITLE FROM ${ownerTable} WHERE ${ownerCol} = :targetId`,
                        [targetId]
                    );
                    const targetTitle = targetResult.rows[0]?.[0] || '';
                    const message = `${senderNick}님이 "${targetTitle}"에 좋아요를 눌렀어요.`;

                    await connection.execute(
                        `INSERT INTO NOTIFICATIONS (RECEIVER_ID, SENDER_ID, NOTI_TYPE, TARGET_TYPE, TARGET_ID, MESSAGE)
                        VALUES (:receiverId, :userId, 'LIKE', :targetType, :targetId, :message)`,
                        [receiverId, userId, targetType, targetId, message],
                        { autoCommit: true }
                    );
                }
            }
            res.json({ result: true, liked: true, message: '좋아요!' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 2. 좋아요 수 조회
router.get('/:targetType/:targetId', async (req, res) => {
    const { targetType, targetId } = req.params;
    const { userEmail } = req.query;

    let connection;
    try {
        connection = await db.getConnection();

        // 좋아요 수
        const countResult = await connection.execute(
            `SELECT COUNT(*) FROM LIKES 
             WHERE TARGET_TYPE = :targetType AND TARGET_ID = :targetId`,
            [targetType, targetId]
        );
        const count = countResult.rows[0][0];

        // 내가 좋아요 했는지
        let liked = false;
        if (userEmail) {
            const userResult = await connection.execute(
                `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`,
                [userEmail]
            );
            if (userResult.rows.length > 0) {
                const userId = userResult.rows[0][0];
                const likedResult = await connection.execute(
                    `SELECT LIKE_ID FROM LIKES 
                     WHERE USER_ID = :userId AND TARGET_TYPE = :targetType AND TARGET_ID = :targetId`,
                    [userId, targetType, targetId]
                );
                liked = likedResult.rows.length > 0;
            }
        }

        res.json({ result: true, count, liked });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;