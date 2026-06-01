const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 1. 댓글 목록 조회
router.get('/:targetType/:targetId', async (req, res) => {
    const { targetType, targetId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT c.COMMENT_ID, c.CONTENT, c.PARENT_ID, c.REPLY_TO,
                    c.CREATED_AT, u.USER_ID, u.NICKNAME
             FROM COMMENTS c
             JOIN USERS u ON c.USER_ID = u.USER_ID
             WHERE c.TARGET_TYPE = :targetType
             AND c.TARGET_ID = :targetId
             ORDER BY c.CREATED_AT ASC`,
            [targetType, targetId]
        );
        const comments = result.rows.map(row => ({
            COMMENT_ID: row[0],
            CONTENT: row[1],
            PARENT_ID: row[2],
            REPLY_TO: row[3],
            CREATED_AT: row[4],
            USER_ID: row[5],
            NICKNAME: row[6],
        }));
        res.json({ result: true, list: comments });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 2. 댓글 작성
router.post('/', async (req, res) => {
    const { userEmail, targetType, targetId, content, parentId, replyTo } = req.body; // ▼ replyTo 추가

    if (!userEmail || !targetType || !targetId || !content) {
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
            `INSERT INTO COMMENTS (TARGET_TYPE, TARGET_ID, USER_ID, CONTENT, PARENT_ID, REPLY_TO)
             VALUES (:targetType, :targetId, :userId, :content, :parentId, :replyTo)`,
            [targetType, targetId, userId, content, parentId || null, replyTo || null], // ▼ replyTo 추가
            { autoCommit: true }
        );

        res.json({
            result: result.rowsAffected > 0,
            message: result.rowsAffected > 0 ? '댓글이 등록됐어요!' : '등록에 실패했어요.'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 3. 댓글 삭제
router.delete('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();

        // ▼ 수정: REPLY_TO로 참조하는 댓글 먼저 삭제
        await connection.execute(
            `DELETE FROM COMMENTS WHERE REPLY_TO = :commentId`,
            [commentId],
            { autoCommit: true }
        );

        // ▼ 대댓글 삭제 (PARENT_ID 참조)
        await connection.execute(
            `DELETE FROM COMMENTS WHERE PARENT_ID = :commentId`,
            [commentId],
            { autoCommit: true }
        );

        // ▼ 본 댓글 삭제
        const result = await connection.execute(
            `DELETE FROM COMMENTS WHERE COMMENT_ID = :commentId`,
            [commentId],
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

// 4. 댓글 수정
router.put('/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
        return res.json({ result: false, message: '내용을 입력해주세요.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE COMMENTS SET CONTENT = :content WHERE COMMENT_ID = :commentId`,
            [content, commentId],
            { autoCommit: true }
        );
        res.json({
            result: result.rowsAffected > 0,
            message: result.rowsAffected > 0 ? '수정됐어요!' : '수정에 실패했어요.'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;