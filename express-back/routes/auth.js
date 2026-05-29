const express = require('express');
const oracledb = require('oracledb');
const db = require("../db");
const bcrypt = require('bcrypt'); // 비밀번호 해시화를 위한 부분
const router = express.Router();
const jwt = require('jsonwebtoken');
require("dotenv").config();

const JWT_KEY = process.env.jwt_key; 
// 해시 함수 실행 위해 사용할 키로 아주 긴 랜덤한 문자를 사용하길 권장하며, 노출되면 안됨.
// .env로 관리해야 함.
const saltRounds = 10; // 해시화를 몇번 할 것인지에 대한 전역변수


// 1. 회원가입
router.post('/join', async (req, res) => {
  const { userEmail, pwd, userName, nickname  } = req.body;
  const hashPwd = await bcrypt.hash(pwd, saltRounds);
  let connection;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `
        INSERT INTO USERS(EMAIL, PASSWORD , USER_NAME, NICKNAME) VALUES(:userEmail, :hashPwd, :userName, :nickname) 
      `, // pwd -> hashPwd : 암호화된 비밀번호로 저장.
      [userEmail , hashPwd, userName, nickname],
      {autoCommit : true}
    );
    let isLogin = false;
    let message = "회원가입 실패";
    if(result.rowsAffected > 0){ // rowsAffected : 몇개의 행에 영향을 줬는지
      isLogin = true;
      message = "회원가입 성공!";
    }

    res.json({
        result : isLogin,
        message : message,
        // list : result.rows
    });
    
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  } finally {
    await connection.close();
  }
});

// 2. 로그인
router.post('/login', async (req, res) => {
  const { userEmail, pwd } = req.body;
  let connection;
  let message = "";
  let info = {}
  let token = "";
  let isLogin = false;
  try {
    connection = await db.getConnection();
    const result = await connection.execute(
      `
        SELECT * FROM USERS WHERE EMAIL = :userEmail
      `,
      [userEmail],
      {outFormat: oracledb.OUT_FORMAT_OBJECT}
    );
    
    if(result.rows.length > 0){ // id 있는지 없는지
      let match = await bcrypt.compare(pwd, result.rows[0].PASSWORD);
      if(match){
        isLogin = true;
        message ="로그인 성공";
        let payload = {
          userEmail : result.rows[0].EMAIL,
          userName :  result.rows[0].USER_NAME,
          role : result.rows[0].ROLE,
        };
        // 토큰 생성 
        // 첫번째 파라미터(페이로드) : 담고싶은 정보(비밀번호와 같은 중요한 데이터는 넣지 말 것)
        // 두번째 파라미터(키) : 위에서 선언한 서버의 비밀 키
        // 세번째 파라미터 : 만료 시간
        token = jwt.sign(payload, JWT_KEY, {expiresIn : '1h'});
        console.log(JWT_KEY);
        console.log(token);
      }else{
        message = "비밀번호가 틀렸습니다.";
      }
    }else{
        message = "존재하지 않는 이메일입니다.";
    }
      res.json({
          result : isLogin,
          message : message,
          token : token
          // list : result.rows
      });
  } catch (error) {
    console.error('Error executing query', error);
    res.status(500).send('Error executing query');
  } finally {
    await connection.close();
  }
});


module.exports = router;