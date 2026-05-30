const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 1. 게시글 목록 조회
router.get('/', async (req, res) => {
  const { board_type } = req.query; // ?board_type=자유
  let connection;
  try {
    connection = await db.getConnection();
    // 기본 쿼리
    let query = `
        SELECT p.POST_ID, p.BOARD_TYPE, p.TITLE, p.CONTENT, 
              p.VIEW_COUNT, p.CREATED_AT,
              u.NICKNAME, u.PROFILE_IMG
        FROM POSTS p
        JOIN USERS u ON p.USER_ID = u.USER_ID
    `;
    const binds = [];

    // board_type 있으면 WHERE 추가
    if(board_type && board_type !== '전체'){
        // board_type이 있고 '전체'가 아니면 WHERE 절 추가
        query += ` WHERE BOARD_TYPE = :board_type`;
        binds.push(board_type);  // 바인딩 값 추가
    }
    // 항상 최신순 정렬
    query += ` ORDER BY CREATED_AT DESC`;  
    // 완성된 쿼리 실행
    const result = await connection.execute(
        query, 
        binds, 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    res.json({
        list : result.rows
    });
    
  } catch (error) {
    console.error('Error executing query', error);
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

// 3. 게시글 작성
router.post('/', async (req, res) => {
    const { userId, boardType, title, content } = req.body;
    // 빈 값 검사
    if(!userId || !boardType || !title || !content){
        return res.json({
            result: false,
            message: '제목과 내용을 입력해주세요!'
        });
    }
    // title, content 공백만 있는 경우도 체크
    if(title.trim() === '' || content.trim() === ''){
        return res.json({
            result: false,
            message: '제목과 내용을 입력해주세요!'
        });
    }

    let connection;
    try {
        connection = await db.getConnection();
        
        const result = await connection.execute(
            `
            INSERT INTO POSTS (USER_ID, BOARD_TYPE, TITLE, CONTENT, VIEW_COUNT)
             VALUES (:userId, :boardType, :title, :content, 0)
             `,
            [userId, boardType, title, content],
            { autoCommit: true }
        );
        
        res.json({
            result: result.rowsAffected > 0, // 몇 개의 행에 영향을 줬는지 
            message: result.rowsAffected > 0 ? '등록되었습니다!' : '등록에 실패했습니다😅'
        });
        
    } catch (error) {
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