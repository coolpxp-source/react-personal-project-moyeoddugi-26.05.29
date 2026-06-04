const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

const multer = require('multer');
const path = require('path');

// multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/patterns/'); // ▼ 저장 폴더
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `pattern_${Date.now()}${ext}`);
    }
});
// multer 설정 - 최대 3장
const upload = multer({ storage });


// 1. 목록 조회 - category 추가
router.get('/', async (req, res) => {
    const { needle_type, difficulty, category } = req.query; // ▼ category 추가
    let connection;
    try {
        connection = await db.getConnection();
        let query = `
            SELECT p.PATTERN_ID, p.USER_ID, p.TITLE, p.DESCRIPTION, p.NEEDLE_TYPE,
                   p.DIFFICULTY, p.CATEGORY, p.YARN_TYPE, p.NEEDLE_SIZE, 
                   p.FINISHED_SIZE, p.WORK_TIME, p.THUMBNAIL_IMG, 
                   p.VIEW_COUNT, p.CREATED_AT, u.NICKNAME, u.PROFILE_IMG
            FROM PATTERNS p
            JOIN USERS u ON p.USER_ID = u.USER_ID
        `;
        const binds = [];
        const conditions = [];

        if (needle_type) {
            conditions.push(`p.NEEDLE_TYPE = :needle_type`);
            binds.push(needle_type);
        }
        if (difficulty) {
            conditions.push(`p.DIFFICULTY = :difficulty`);
            binds.push(difficulty);
        }
        if (category) { // ▼ 추가
            conditions.push(`p.CATEGORY = :category`);
            binds.push(category);
        }
        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }
        query += ` ORDER BY p.CREATED_AT DESC`;

        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        // ▼ 추가: 각 도안의 태그 조회
        const patterns = result.rows;
        for (const pattern of patterns) {
            const tagResult = await connection.execute(
                `SELECT TAG_NAME FROM PATTERN_TAGS WHERE PATTERN_ID = :patternId`,
                [pattern.PATTERN_ID]
            );
            pattern.TAGS = tagResult.rows.map(row => row[0]);
        }

        res.json({ list: patterns });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 인기 도안 top 5 (좋아요 순)
router.get('/popular', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.PATTERN_ID, p.TITLE, p.THUMBNAIL_IMG,
                    u.NICKNAME,
                    COUNT(l.LIKE_ID) AS LIKE_COUNT
            FROM PATTERNS p
            JOIN USERS u ON p.USER_ID = u.USER_ID
            LEFT JOIN LIKES l ON l.TARGET_TYPE = 'PATTERN' 
                AND l.TARGET_ID = p.PATTERN_ID
            GROUP BY p.PATTERN_ID, p.TITLE, p.THUMBNAIL_IMG, u.NICKNAME
            ORDER BY LIKE_COUNT DESC
            FETCH FIRST 5 ROWS ONLY`,
            [],
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

// 댓글 많은 도안 top 5
router.get('/most-commented', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.PATTERN_ID, p.TITLE, p.THUMBNAIL_IMG,
                    u.NICKNAME,
                    COUNT(c.COMMENT_ID) AS COMMENT_COUNT
            FROM PATTERNS p
            JOIN USERS u ON p.USER_ID = u.USER_ID
            LEFT JOIN COMMENTS c ON c.TARGET_TYPE = 'PATTERN' 
                AND c.TARGET_ID = p.PATTERN_ID
            GROUP BY p.PATTERN_ID, p.TITLE, p.THUMBNAIL_IMG, u.NICKNAME
            ORDER BY COMMENT_COUNT DESC
            FETCH FIRST 5 ROWS ONLY`,
            [],
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

// 2. 도안 상세 조회
router.get('/:patternId', async (req, res) => {
    const { patternId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.PATTERN_ID, p.USER_ID, p.TITLE, p.DESCRIPTION, p.NEEDLE_TYPE,
                    p.DIFFICULTY, p.YARN_TYPE, p.NEEDLE_SIZE, p.FINISHED_SIZE,
                    p.WORK_TIME, p.THUMBNAIL_IMG, p.VIEW_COUNT, p.CREATED_AT,
                    u.NICKNAME, u.PROFILE_IMG
             FROM PATTERNS p
             JOIN USERS u ON p.USER_ID = u.USER_ID
             WHERE p.PATTERN_ID = :patternId`,
            [patternId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows.length === 0) {
            return res.json({ result: false, message: '도안을 찾을 수 없어요.' });
        }
        res.json({ result: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 3. 도안 등록 - 다중 이미지
router.post('/', upload.array('images', 3), async (req, res) => {
    const {
        userEmail, title, description, needleType,
        difficulty, category, yarnType, needleSize,
        finishedSize, workTime, tags
    } = req.body;

    if (!userEmail || !title || !description || !needleType || !difficulty) {
        return res.json({ result: false, message: '필수 값이 누락됐어요.' });
    }

    // ▼ 업로드된 이미지들
    const imageFiles = req.files || [];
    const thumbnailImg = imageFiles.length > 0 ? `/uploads/patterns/${imageFiles[0].filename}` : null;

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
            `INSERT INTO PATTERNS (
                USER_ID, TITLE, DESCRIPTION, NEEDLE_TYPE, DIFFICULTY, CATEGORY,
                YARN_TYPE, NEEDLE_SIZE, FINISHED_SIZE, WORK_TIME, THUMBNAIL_IMG
            ) VALUES (
                :userId, :title, :description, :needleType, :difficulty, :category,
                :yarnType, :needleSize, :finishedSize, :workTime, :thumbnailImg
            ) RETURNING PATTERN_ID INTO :patternId`,
            {
                userId, title, description, needleType, difficulty,
                category: category || null,
                yarnType: yarnType || null,
                needleSize: needleSize || null,
                finishedSize: finishedSize || null,
                workTime: workTime || null,
                thumbnailImg: thumbnailImg || null,
                patternId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: false }
        );

        const patternId = result.outBinds.patternId[0];

        // ▼ 이미지 저장
        for (let i = 0; i < imageFiles.length; i++) {
            await connection.execute(
                `INSERT INTO PATTERN_IMAGES (PATTERN_ID, IMAGE_URL, SORT_ORDER)
                 VALUES (:patternId, :imageUrl, :sortOrder)`,
                [patternId, `/uploads/patterns/${imageFiles[i].filename}`, i]
            );
        }

        // ▼ 태그 저장
        if (tags) {
            const tagList = typeof tags === 'string' ? JSON.parse(tags) : tags;
            for (const tag of tagList) {
                await connection.execute(
                    `INSERT INTO PATTERN_TAGS (PATTERN_ID, TAG_NAME) VALUES (:patternId, :tagName)`,
                    [patternId, tag]
                );
            }
        }

        await connection.commit();
        res.json({ result: true, message: '도안이 등록됐어요!' });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// ▼ 추가: 이미지 목록 조회
router.get('/:patternId/images', async (req, res) => {
    const { patternId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT IMAGE_URL FROM PATTERN_IMAGES 
             WHERE PATTERN_ID = :patternId 
             ORDER BY SORT_ORDER ASC`,
            [patternId]
        );
        res.json({ list: result.rows.map(r => r[0]) });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 도안 수정
router.put('/:patternId', async (req, res) => {
    const { patternId } = req.params;
    const { title, description, difficulty, yarnType, needleSize, finishedSize, workTime } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `UPDATE PATTERNS SET 
                TITLE = :title,
                DESCRIPTION = :description,
                DIFFICULTY = :difficulty,
                YARN_TYPE = :yarnType,
                NEEDLE_SIZE = :needleSize,
                FINISHED_SIZE = :finishedSize,
                WORK_TIME = :workTime
             WHERE PATTERN_ID = :patternId`,
            {
                title,
                description,
                difficulty,
                yarnType: yarnType || null,
                needleSize: needleSize || null,
                finishedSize: finishedSize || null,
                workTime: workTime || null,
                patternId
            },
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

// 4. 도안 삭제
router.delete('/:patternId', async (req, res) => {
    const { patternId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `DELETE FROM PATTERNS WHERE PATTERN_ID = :patternId`,
            [patternId],
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

// 5. 태그 조회
router.get('/:patternId/tags', async (req, res) => {
    const { patternId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT TAG_NAME FROM PATTERN_TAGS WHERE PATTERN_ID = :patternId`,
            [patternId]
        );
        res.json({ list: result.rows.map(r => r[0]) });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});



module.exports = router;