const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const postStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/posts/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`);
    }
});
// ▼ memory storage로 변경 (sharp 처리 후 저장)
const uploadPost = multer({ storage: multer.memoryStorage() });

// ▼ 이미지 저장 헬퍼 함수
const saveImage = async (buffer, filename) => {
    const outputPath = path.join('uploads/posts', filename);
    await sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
    return `/uploads/posts/${filename}`;
};

// 1. 게시글 목록 조회
router.get('/', async (req, res) => {
    const { board_type, userEmail } = req.query;
    let connection;
    try {
        connection = await db.getConnection();
        const binds = [userEmail || '']; // ▼ 여기서 선언 + userEmail 먼저 추가
        let query = `
            SELECT p.POST_ID, p.BOARD_TYPE, p.TITLE, p.CONTENT, 
                p.VIEW_COUNT, p.CREATED_AT,
                u.NICKNAME, u.PROFILE_IMG,
                (SELECT IMAGE_URL FROM POST_IMAGES 
                    WHERE POST_ID = p.POST_ID AND IS_THUMBNAIL = 'Y'
                    AND ROWNUM = 1) AS THUMBNAIL_IMG,
                (SELECT COUNT(*) FROM COMMENTS c 
                    WHERE c.TARGET_ID = p.POST_ID 
                    AND c.TARGET_TYPE = 'POST') AS COMMENT_COUNT,
                (SELECT COUNT(*) FROM LIKES l
                    WHERE l.TARGET_TYPE = 'POST' 
                    AND l.TARGET_ID = p.POST_ID) AS LIKE_COUNT,
                (SELECT COUNT(*) FROM LIKES l2
                    JOIN USERS u2 ON l2.USER_ID = u2.USER_ID
                    WHERE l2.TARGET_TYPE = 'POST' 
                    AND l2.TARGET_ID = p.POST_ID
                    AND u2.EMAIL = :userEmail) AS IS_LIKED
            FROM POSTS p
            JOIN USERS u ON p.USER_ID = u.USER_ID
        `;
        if (board_type && board_type !== '전체') {
            query += ` WHERE p.BOARD_TYPE = :board_type AND p.BOARD_TYPE != '작품자랑'`;
            binds.push(board_type);
        } else {
            query += ` WHERE p.BOARD_TYPE != '작품자랑'`;
        }
        query += ` ORDER BY p.CREATED_AT DESC`;

        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        const posts = result.rows;
        for (const post of posts) {
            const imgResult = await connection.execute(
                `SELECT IMAGE_URL FROM POST_IMAGES 
                WHERE POST_ID = :postId ORDER BY SORT_ORDER ASC`,
                [post.POST_ID]
            );
            post.IMAGES = imgResult.rows.map(r => r[0]);
        }

        res.json({ list: posts });
    } catch (error) {
        console.error('Error executing query', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 인기 태그 top 10
router.get('/popular-tags', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT TAG_NAME, COUNT(*) AS TAG_COUNT
             FROM PATTERN_TAGS
             GROUP BY TAG_NAME
             ORDER BY TAG_COUNT DESC
             FETCH FIRST 10 ROWS ONLY`,
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

// 인기 게시글 top 5
router.get('/popular', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.POST_ID, p.TITLE, p.BOARD_TYPE,
                    COUNT(l.LIKE_ID) AS LIKE_COUNT
             FROM POSTS p
             LEFT JOIN LIKES l ON l.TARGET_TYPE = 'POST' AND l.TARGET_ID = p.POST_ID
             WHERE p.BOARD_TYPE != '작품자랑'
             GROUP BY p.POST_ID, p.TITLE, p.BOARD_TYPE
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

// 작품자랑 목록 조회
router.get('/showcase', async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.POST_ID, p.TITLE, p.CONTENT, p.CREATED_AT,
                    u.NICKNAME, u.PROFILE_IMG,
                    (SELECT IMAGE_URL FROM POST_IMAGES 
                     WHERE POST_ID = p.POST_ID AND IS_THUMBNAIL = 'Y'
                     AND ROWNUM = 1) AS THUMBNAIL_IMG,
                    (SELECT COUNT(*) FROM LIKES 
                     WHERE TARGET_TYPE = 'POST' AND TARGET_ID = p.POST_ID) AS LIKE_COUNT
             FROM POSTS p
             JOIN USERS u ON p.USER_ID = u.USER_ID
             WHERE p.BOARD_TYPE = '작품자랑'
             ORDER BY p.CREATED_AT DESC`,
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

// 작품자랑 등록
router.post('/showcase', uploadPost.array('images', 3), async (req, res) => {
    const { userEmail, title, content, tags } = req.body;
    const imageFiles = req.files || [];

    if (!userEmail || !title || !content) {
        return res.json({ result: false, message: '필수 값이 누락됐어요.' });
    }
    if (imageFiles.length === 0) {
        return res.json({ result: false, message: '사진을 최소 1장 올려주세요.' });
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
            `INSERT INTO POSTS (USER_ID, TITLE, CONTENT, BOARD_TYPE)
             VALUES (:userId, :title, :content, '작품자랑')
             RETURNING POST_ID INTO :postId`,
            {
                userId, title, content,
                postId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            },
            { autoCommit: false }
        );

        const postId = result.outBinds.postId[0];

        // 이미지 저장
        for (let i = 0; i < imageFiles.length; i++) {
            const filename = `post_${Date.now()}_${i}.jpg`;
            const imageUrl = await saveImage(imageFiles[i].buffer, filename); // ▼ sharp 리사이징
            await connection.execute(
                `INSERT INTO POST_IMAGES (POST_ID, IMAGE_URL, IS_THUMBNAIL, SORT_ORDER)
                VALUES (:postId, :imageUrl, :isThumbnail, :sortOrder)`,
                {
                    postId: Number(postId),
                    imageUrl,
                    isThumbnail: i === 0 ? 'Y' : 'N',
                    sortOrder: i
                }
            );
        }

        await connection.commit();
        res.json({ result: true, message: '작품이 등록됐어요!' });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 작품자랑 상세 조회
router.get('/showcase/:postId', async (req, res) => {
    const { postId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.POST_ID, p.TITLE, p.CONTENT, p.CREATED_AT,
                    u.NICKNAME, u.PROFILE_IMG, u.USER_ID
             FROM POSTS p
             JOIN USERS u ON p.USER_ID = u.USER_ID
             WHERE p.POST_ID = :postId`,
            [postId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (result.rows.length === 0) {
            return res.json({ result: false, message: '게시글을 찾을 수 없어요.' });
        }

        // 이미지 조회
        const imgResult = await connection.execute(
            `SELECT IMAGE_URL FROM POST_IMAGES 
             WHERE POST_ID = :postId ORDER BY SORT_ORDER ASC`,
            [postId]
        );

        res.json({
            result: true,
            data: result.rows[0],
            images: imgResult.rows.map(r => r[0])
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});


// 2. 게시글 상세 조회
router.get('/:postId', async (req, res) => {
  const { postId } = req.params; // 동적 값은 params
  let connection;
  try {
    connection = await db.getConnection();
    // 조회수 증가
      await connection.execute(
        `
        UPDATE POSTS SET VIEW_COUNT = VIEW_COUNT + 1 
        WHERE POST_ID = :postId
        `,

        [postId],
        { autoCommit: true }
      );

      const result = await connection.execute(
          `
          SELECT p.POST_ID, p.BOARD_TYPE, p.TITLE, p.CONTENT,
                 p.VIEW_COUNT, p.CREATED_AT,
                 u.NICKNAME, u.PROFILE_IMG, u.USER_ID
          FROM POSTS p
          JOIN USERS u ON p.USER_ID = u.USER_ID
          WHERE p.POST_ID = :postId
          `,
          [postId],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if(result.rows.length === 0){ // 게시글 존재 하지 않을 경우 
        return res.json({ result: false, message: '게시글을 찾을 수 없습니다.' });
      }
 
      res.json({
          post : result.rows[0]
      });
    
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  } finally {
    await connection.close();
  }
});

// 3. 게시글 등록
router.post('/', uploadPost.array('images', 3), async (req, res) => {
    const { userEmail, boardType, title, content } = req.body;
    const imageFiles = req.files || [];

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

        console.log('userId:', userId, typeof userId);
        console.log('boardType:', boardType, typeof boardType);
        console.log('title:', title, typeof title);
        console.log('content:', content, typeof content);

        await connection.execute(
            `INSERT INTO POSTS (USER_ID, BOARD_TYPE, TITLE, CONTENT)
            VALUES (:userId, :boardType, :title, :content)`,
            [Number(userId), boardType, title, content],
            { autoCommit: false }
        );

        // ▼ 방금 INSERT된 POST_ID 따로 조회
        const postIdResult = await connection.execute(
            `SELECT MAX(POST_ID) FROM POSTS WHERE USER_ID = :userId`,
            [Number(userId)]
        );
        const postId = postIdResult.rows[0][0];
        console.log('postId:', postId, typeof postId);

        // 이미지 저장
        for (let i = 0; i < imageFiles.length; i++) {
            const filename = `post_${Date.now()}_${i}.jpg`;
            const imageUrl = await saveImage(imageFiles[i].buffer, filename); // ▼ sharp 리사이징
            await connection.execute(
                `INSERT INTO POST_IMAGES (POST_ID, IMAGE_URL, IS_THUMBNAIL, SORT_ORDER)
                VALUES (:postId, :imageUrl, :isThumbnail, :sortOrder)`,
                {
                    postId: Number(postId),
                    imageUrl,
                    isThumbnail: i === 0 ? 'Y' : 'N',
                    sortOrder: i
                }
            );
        }

        await connection.commit();
        res.json({ result: true, message: '게시글이 등록됐어요!' });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 4. 게시글 수정
router.put('/:postId', async (req, res) => {
    const { postId } = req.params;
    const { title, content } = req.body;
    let connection;
    try {
        connection = await db.getConnection();
        
        const result = await connection.execute(
            `
            UPDATE POSTS SET TITLE = :title, CONTENT = :content
             WHERE POST_ID = :postId
             `,
            [title, content, postId],
            { autoCommit: true }
        );
        
        res.json({
            result: result.rowsAffected > 0,
            message: result.rowsAffected > 0 ? '수정 되었습니다.!' : '수정 중 오류가 발생했습니다.'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 5. 게시글 삭제
router.delete('/:postId', async (req, res) => {
    const { postId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        
        const result = await connection.execute(
            `DELETE FROM POSTS WHERE POST_ID = :postId`,
            [postId],
            { autoCommit: true }
        );
        
        res.json({
            result: result.rowsAffected > 0,
            message: result.rowsAffected > 0 ? '삭제되었습니다.' : '삭제 중 오류가 발생했습니다.'
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});


module.exports = router;