const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 1. 팔로우 토글
router.post('/toggle', async (req, res) => {
    const { followerEmail, followingId } = req.body;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :email`,
            [followerEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        const followerId = userResult.rows[0][0];

        const existing = await connection.execute(
            `SELECT FOLLOW_ID FROM FOLLOWS 
             WHERE FOLLOWER_ID = :followerId AND FOLLOWING_ID = :followingId`,
            [followerId, followingId]
        );

        if (existing.rows.length > 0) {
            await connection.execute(
                `DELETE FROM FOLLOWS WHERE FOLLOW_ID = :followId`,
                [existing.rows[0][0]],
                { autoCommit: true }
            );
            res.json({ result: true, following: false });
        } else {
            await connection.execute(
                `INSERT INTO FOLLOWS (FOLLOWER_ID, FOLLOWING_ID)
                 VALUES (:followerId, :followingId)`,
                [followerId, followingId],
                { autoCommit: true }
            );

            // ▼ 알림 추가
            const senderResult = await connection.execute(
                `SELECT NICKNAME FROM USERS WHERE USER_ID = :followerId`,
                [followerId]
            );
            const senderNick = senderResult.rows[0][0];
            await connection.execute(
                `INSERT INTO NOTIFICATIONS (RECEIVER_ID, SENDER_ID, NOTI_TYPE, MESSAGE)
                VALUES (:followingId, :followerId, 'FOLLOW', :message)`,
                [followingId, followerId, `${senderNick}님이 팔로우했어요.`],
                { autoCommit: true }
            );
            res.json({ result: true, following: true });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 2. 팔로우 상태 조회
router.get('/status', async (req, res) => {
    const { followerEmail, followingId } = req.query;
    let connection;
    try {
        connection = await db.getConnection();
        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :email`,
            [followerEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: true, following: false, followedByThem: false });
        }
        const followerId = userResult.rows[0][0];

        // 내가 상대를 팔로우?
        const result = await connection.execute(
            `SELECT FOLLOW_ID FROM FOLLOWS 
             WHERE FOLLOWER_ID = :followerId AND FOLLOWING_ID = :followingId`,
            [followerId, followingId]
        );

        // 상대가 나를 팔로우?
        const reverseResult = await connection.execute(
            `SELECT FOLLOW_ID FROM FOLLOWS 
             WHERE FOLLOWER_ID = :followingId AND FOLLOWING_ID = :followerId`,
            [followingId, followerId]
        );

        res.json({ 
            result: true, 
            following: result.rows.length > 0,
            followedByThem: reverseResult.rows.length > 0
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 3. 팔로워/팔로잉 수 조회
router.get('/count/:userId', async (req, res) => {
    const { userId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const followerCount = await connection.execute(
            `SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWING_ID = :userId`,
            [userId]
        );
        const followingCount = await connection.execute(
            `SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWER_ID = :userId`,
            [userId]
        );
        res.json({
            result: true,
            followerCount: followerCount.rows[0][0],
            followingCount: followingCount.rows[0][0]
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});


// 팔로워 목록 — 맞팔 여부 추가
router.get('/followers/:userId', async (req, res) => {
    const { userId } = req.params;
    const { myUserId } = req.query;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT u.USER_ID, u.NICKNAME, u.PROFILE_IMG, u.BIO,
                    CASE WHEN EXISTS (
                        SELECT 1 FROM FOLLOWS f2
                        WHERE f2.FOLLOWER_ID = :myUserId
                        AND f2.FOLLOWING_ID = u.USER_ID
                    ) THEN 'Y' ELSE 'N' END AS IS_MUTUAL
             FROM FOLLOWS f
             JOIN USERS u ON f.FOLLOWER_ID = u.USER_ID
             WHERE f.FOLLOWING_ID = :userId
             ORDER BY f.CREATED_AT DESC`,
            { userId: Number(userId), myUserId: Number(myUserId) },
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

// 팔로잉 목록 — 맞팔 여부 추가
router.get('/following/:userId', async (req, res) => {
    const { userId } = req.params;
    const { myUserId } = req.query;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT u.USER_ID, u.NICKNAME, u.PROFILE_IMG, u.BIO
             ${myUserId ? `,CASE WHEN EXISTS (
                SELECT 1 FROM FOLLOWS f2
                WHERE f2.FOLLOWER_ID = u.USER_ID
                AND f2.FOLLOWING_ID = :myUserId
            ) THEN 'Y' ELSE 'N' END AS IS_MUTUAL` : ''}
             FROM FOLLOWS f
             JOIN USERS u ON f.FOLLOWING_ID = u.USER_ID
             WHERE f.FOLLOWER_ID = :userId
             ORDER BY f.CREATED_AT DESC`,
            myUserId 
                ? { userId: Number(userId), myUserId: Number(myUserId) }
                : { userId: Number(userId) },
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

module.exports = router;