const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

// router
const sampleRouter = require("./routes/sample");
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const commentsRouter = require('./routes/comments');

const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json())

// ejs 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/sample", sampleRouter);
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);

async function startServer() {
  try {
    await db.init();
    console.log('Successfully connected to Oracle database');

    app.listen(3010, () => {
      console.log('Server is running on port 3010');
    });

  } catch (err) {
    console.error('Error connecting to Oracle database. Server not started.', err);
    process.exit(1); // DB 연결 실패 시 프로세스 종료 (선택 사항)
  }
}

startServer();



