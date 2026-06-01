const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 1. 리뷰 목록 조회
router.get('/:placeId', async (req, res) => {
    const { placeId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT r.REVIEW_ID, r.CONTENT, r.ALLOW_STATUS, r.CREATED_AT,
                    u.NICKNAME, u.PROFILE_IMG
             FROM PLACE_REVIEWS r
             JOIN USERS u ON r.USER_ID = u.USER_ID
             WHERE r.PLACE_ID = :placeId
             ORDER BY r.CREATED_AT DESC`,
            [placeId],
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

// 2. 리뷰 작성
router.post('/', async (req, res) => {
    const { userEmail, placeId, content, allowStatus } = req.body;

    if (!userEmail || !placeId || !content) {
        return res.json({ result: false, message: '필수 값이 누락됐어요.' });
    }
    if (content.trim() === '') {
        return res.json({ result: false, message: '내용을 입력해주세요.' });
    }

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
            `INSERT INTO PLACE_REVIEWS (PLACE_ID, USER_ID, CONTENT, ALLOW_STATUS)
             VALUES (:placeId, :userId, :content, :allowStatus)`,
            [placeId, userId, content, allowStatus || null],
            { autoCommit: true }
        );

        res.json({
            result: result.rowsAffected > 0,
            message: result.rowsAffected > 0 ? '리뷰가 등록됐어요!' : '등록에 실패했어요.'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 3. 리뷰 삭제
router.delete('/:reviewId', async (req, res) => {
    const { reviewId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `DELETE FROM PLACE_REVIEWS WHERE REVIEW_ID = :reviewId`,
            [reviewId],
            { autoCommit: true }
        );
        res.json({
            result: result.rowsAffected > 0,
            message: result.rowsAffected > 0 ? '삭제됐어요!' : '삭제에 실패했어요.'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;