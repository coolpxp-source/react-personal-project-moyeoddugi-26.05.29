const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 1. 내 채팅방 목록 조회
router.get('/my', async (req, res) => {
    const { userEmail } = req.query;
    let connection;
    try {
        connection = await db.getConnection();
        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`, [userEmail]
        );
        if (userResult.rows.length === 0) return res.json({ result: false, list: [] });
        const userId = userResult.rows[0][0];

        const result = await connection.execute(
             `SELECT r.ROOM_ID, r.ROOM_NAME, r.MAX_MEMBERS, r.INVITE_CODE, r.ROOM_TYPE,
                    r.CREATED_AT, m.IS_HOST,
                    (SELECT COUNT(*) FROM CHAT_MEMBERS WHERE ROOM_ID = r.ROOM_ID) AS MEMBER_COUNT,
                    (SELECT CONTENT FROM CHAT_MESSAGES 
                    WHERE ROOM_ID = r.ROOM_ID 
                    ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY) AS LAST_MESSAGE,
                    (SELECT CREATED_AT FROM CHAT_MESSAGES 
                    WHERE ROOM_ID = r.ROOM_ID 
                    ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY) AS LAST_MESSAGE_AT,
                    (SELECT COUNT(*) FROM CHAT_MESSAGES cm
                    WHERE cm.ROOM_ID = r.ROOM_ID 
                    AND cm.MESSAGE_ID > CASE WHEN m.LAST_READ_MESSAGE_ID IS NULL THEN 0 
                                            ELSE m.LAST_READ_MESSAGE_ID END) AS UNREAD_COUNT
            FROM CHAT_ROOMS r
            JOIN CHAT_MEMBERS m ON r.ROOM_ID = m.ROOM_ID
            WHERE m.USER_ID = :userId
            ORDER BY LAST_MESSAGE_AT DESC NULLS LAST`,
            [userId],
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


// 1:1 DM 채팅방 생성 또는 기존 DM방 조회
router.post('/dm', async (req, res) => {
    const { userEmail, targetUserId } = req.body;
    let connection;
    try {
        connection = await db.getConnection();

        // 내 userId 조회
        const userResult = await connection.execute(
            `SELECT USER_ID, NICKNAME FROM USERS WHERE EMAIL = :userEmail`,
            [userEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        const myUserId = userResult.rows[0][0];
        const myNickname = userResult.rows[0][1];

        // 상대방 닉네임 조회
        const targetResult = await connection.execute(
            `SELECT NICKNAME FROM USERS WHERE USER_ID = :targetUserId`,
            [Number(targetUserId)]
        );
        if (targetResult.rows.length === 0) {
            return res.json({ result: false, message: '상대방을 찾을 수 없어요.' });
        }
        const targetNickname = targetResult.rows[0][0];

        // 이미 DM방 존재하는지 확인
        const existResult = await connection.execute(
            `SELECT r.ROOM_ID FROM CHAT_ROOMS r
             JOIN CHAT_MEMBERS m1 ON m1.ROOM_ID = r.ROOM_ID AND m1.USER_ID = :myUserId
             JOIN CHAT_MEMBERS m2 ON m2.ROOM_ID = r.ROOM_ID AND m2.USER_ID = :targetUserId
             WHERE r.ROOM_TYPE = 'DM'`,
            [Number(myUserId), Number(targetUserId)]
        );

        if (existResult.rows.length > 0) {
            // 이미 존재하면 기존 방 반환
            return res.json({ result: true, roomId: existResult.rows[0][0], isNew: false });
        }

        // 새 DM방 생성
        await connection.execute(
            `INSERT INTO CHAT_ROOMS (ROOM_NAME, MAX_MEMBERS, ROOM_TYPE)
             VALUES (:roomName, 2, 'DM')`,
            { roomName: `${myNickname}, ${targetNickname}` },
            { autoCommit: false }
        );

        const roomIdResult = await connection.execute(
            `SELECT MAX(ROOM_ID) FROM CHAT_ROOMS WHERE ROOM_TYPE = 'DM' AND ROOM_NAME = :roomName`,
            [`${myNickname}, ${targetNickname}`]
        );
        const roomId = roomIdResult.rows[0][0];

        // 두 멤버 추가
        await connection.execute(
            `INSERT INTO CHAT_MEMBERS (ROOM_ID, USER_ID) VALUES (:roomId, :userId)`,
            [Number(roomId), Number(myUserId)]
        );
        await connection.execute(
            `INSERT INTO CHAT_MEMBERS (ROOM_ID, USER_ID) VALUES (:roomId, :userId)`,
            [Number(roomId), Number(targetUserId)]
        );

        await connection.commit();
        res.json({ result: true, roomId, isNew: true });
    } catch (error) {
        await connection.rollback();
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 2. 채팅방 상세 + 멤버 목록 조회
router.get('/:roomId', async (req, res) => {
    const { roomId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();

        const roomResult = await connection.execute(
            `SELECT r.ROOM_ID, r.ROOM_NAME, r.MAX_MEMBERS, r.INVITE_CODE,
                    r.ROOM_TYPE, r.POST_ID, r.CREATED_AT
             FROM CHAT_ROOMS r
             WHERE r.ROOM_ID = :roomId`,
            [roomId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (roomResult.rows.length === 0) {
            return res.json({ result: false, message: '채팅방을 찾을 수 없어요.' });
        }

        const memberResult = await connection.execute(
            `SELECT u.USER_ID, u.NICKNAME, u.PROFILE_IMG, m.IS_HOST, m.JOINED_AT
             FROM CHAT_MEMBERS m
             JOIN USERS u ON m.USER_ID = u.USER_ID
             WHERE m.ROOM_ID = :roomId`,
            [roomId],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.json({
            result: true,
            room: roomResult.rows[0],
            members: memberResult.rows
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 3. 메시지 목록 조회 (폴링용)
router.get('/:roomId/messages', async (req, res) => {
    const { roomId } = req.params;
    const { after } = req.query; // 마지막으로 받은 메시지 ID
    let connection;
    try {
        connection = await db.getConnection();

        let query = `
            SELECT m.MESSAGE_ID, m.CONTENT, m.CREATED_AT,
                   u.USER_ID, u.NICKNAME, u.PROFILE_IMG
            FROM CHAT_MESSAGES m
            JOIN USERS u ON m.USER_ID = u.USER_ID
            WHERE m.ROOM_ID = :roomId
        `;
        const binds = [roomId];

        if (after) {
            query += ` AND m.MESSAGE_ID > :after`;
            binds.push(after);
        }

        query += ` ORDER BY m.CREATED_AT ASC`;

        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });

        res.json({ result: true, list: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 4. 메시지 전송
router.post('/:roomId/messages', async (req, res) => {
    const { roomId } = req.params;
    const { userEmail, content } = req.body;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`, [userEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        const userId = userResult.rows[0][0];

        // 멤버인지 확인
        const memberCheck = await connection.execute(
            `SELECT MEMBER_ID FROM CHAT_MEMBERS 
             WHERE ROOM_ID = :roomId AND USER_ID = :userId`,
            [roomId, userId]
        );
        if (memberCheck.rows.length === 0) {
            return res.json({ result: false, message: '채팅방 멤버가 아니에요.' });
        }

        await connection.execute(
            `INSERT INTO CHAT_MESSAGES (ROOM_ID, USER_ID, CONTENT)
             VALUES (:roomId, :userId, :content)`,
            [roomId, userId, content],
            { autoCommit: true }
        );

        // ▼ 본인 읽음 처리 추가
        const lastMsgResult = await connection.execute(
            `SELECT MAX(MESSAGE_ID) FROM CHAT_MESSAGES WHERE ROOM_ID = :roomId`,
            [roomId]
        );
        const lastMsgId = lastMsgResult.rows[0][0] || 0;
        await connection.execute(
            `UPDATE CHAT_MEMBERS SET LAST_READ_MESSAGE_ID = :lastMsgId
            WHERE ROOM_ID = :roomId AND USER_ID = :userId`,
            [lastMsgId, roomId, userId],
            { autoCommit: true }
        );

        // ▼ 추가: 닉네임 조회
        const nickResult = await connection.execute(
            `SELECT NICKNAME FROM USERS WHERE USER_ID = :userId`, [userId]
        );
        const userNickname = nickResult.rows[0][0];

        // ▼ 추가: 채팅방 다른 멤버들에게 알림
        const allMembers = await connection.execute(
            `SELECT USER_ID FROM CHAT_MEMBERS WHERE ROOM_ID = :roomId`, [roomId]
        );
        for (const member of allMembers.rows) {
            const memberId = member[0];
            if (memberId !== userId) {
                await connection.execute(
                    `INSERT INTO NOTIFICATIONS (RECEIVER_ID, SENDER_ID, NOTI_TYPE, MESSAGE)
                    VALUES (:memberId, :userId, 'CHAT', :message)`,
                    [memberId, userId, `${userNickname}님이 채팅방에 메시지를 보냈어요.`],
                    { autoCommit: true }
                );
            }
        }

        res.json({ result: true, message: '메시지 전송 완료!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 5. 초대 코드로 채팅방 입장
router.post('/join', async (req, res) => {
    const { userEmail, inviteCode } = req.body;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`, [userEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        const userId = userResult.rows[0][0];

        // 초대 코드로 채팅방 조회
        const roomResult = await connection.execute(
            `SELECT ROOM_ID, MAX_MEMBERS FROM CHAT_ROOMS WHERE INVITE_CODE = :inviteCode`,
            [inviteCode]
        );
        if (roomResult.rows.length === 0) {
            return res.json({ result: false, message: '유효하지 않은 초대 코드예요.' });
        }
        const roomId = roomResult.rows[0][0];
        const maxMembers = roomResult.rows[0][1];

        // ▼ 1. 이미 멤버인지 먼저 확인
        const memberCheck = await connection.execute(
            `SELECT MEMBER_ID FROM CHAT_MEMBERS
             WHERE ROOM_ID = :roomId AND USER_ID = :userId`,
            [roomId, userId]
        );
        if (memberCheck.rows.length > 0) {
            return res.json({ result: true, roomId, message: '이미 참여 중인 채팅방이에요.' });
        }

        // ▼ 2. 인원 확인
        const countResult = await connection.execute(
            `SELECT COUNT(*) FROM CHAT_MEMBERS WHERE ROOM_ID = :roomId`, [roomId]
        );
        if (countResult.rows[0][0] >= maxMembers) {
            return res.json({ result: false, message: '채팅방이 가득 찼어요.' });
        }

        // ▼ 3. 멤버 추가
        await connection.execute(
            `INSERT INTO CHAT_MEMBERS (ROOM_ID, USER_ID, LAST_READ_MESSAGE_ID)
             VALUES (:roomId, :userId, 0)`,
            [Number(roomId), Number(userId)],
            { autoCommit: true }
        );

        // ▼ 4. 닉네임 조회
        const nickResult = await connection.execute(
            `SELECT NICKNAME FROM USERS WHERE USER_ID = :userId`, [userId]
        );
        const userNickname = nickResult.rows[0][0];

        // ▼ 5. 입장 시스템 메시지
        await connection.execute(
            `INSERT INTO CHAT_MESSAGES (ROOM_ID, USER_ID, CONTENT)
             VALUES (:roomId, :userId, :content)`,
            [roomId, userId, `${userNickname}님이 채팅방에 참여했어요 🧶`],
            { autoCommit: true }
        );

        // ▼ 6. 다른 멤버들에게 알림
        const allMembers = await connection.execute(
            `SELECT USER_ID FROM CHAT_MEMBERS WHERE ROOM_ID = :roomId`, [roomId]
        );
        for (const member of allMembers.rows) {
            const memberId = member[0];
            if (memberId !== userId) {
                await connection.execute(
                    `INSERT INTO NOTIFICATIONS (RECEIVER_ID, SENDER_ID, NOTI_TYPE, MESSAGE)
                     VALUES (:memberId, :userId, 'GATHER', :message)`,
                    [memberId, userId, `${userNickname}님이 채팅방에 참여했어요 🧶`],
                    { autoCommit: true }
                );
            }
        }

        res.json({ result: true, roomId, message: '채팅방에 입장했어요!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 6. 채팅방 나가기
router.delete('/:roomId/leave', async (req, res) => {
    const { roomId } = req.params;
    const { userEmail } = req.body;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID, NICKNAME FROM USERS WHERE EMAIL = :userEmail`, [userEmail]
        );
        if (userResult.rows.length === 0) {
            return res.json({ result: false, message: '유저를 찾을 수 없어요.' });
        }
        const userId = userResult.rows[0][0];
        const userNickname = userResult.rows[0][1];

        // ▼ DM방인지 확인
        const roomResult = await connection.execute(
            `SELECT ROOM_TYPE FROM CHAT_ROOMS WHERE ROOM_ID = :roomId`, [roomId]
        );
        const roomType = roomResult.rows[0]?.[0];

        // ▼ DM방이면 상대방에게 알림
        if (roomType === 'DM') {
            const otherMember = await connection.execute(
                `SELECT USER_ID FROM CHAT_MEMBERS
                 WHERE ROOM_ID = :roomId AND USER_ID != :userId`,
                [roomId, userId]
            );
            if (otherMember.rows.length > 0) {
                const otherId = otherMember.rows[0][0];
                await connection.execute(
                    `INSERT INTO NOTIFICATIONS (RECEIVER_ID, SENDER_ID, NOTI_TYPE, MESSAGE)
                     VALUES (:otherId, :userId, 'CHAT', :message)`,
                    [otherId, userId, `${userNickname}님이 DM방을 나갔어요.`],
                    { autoCommit: true }
                );
            }
        }

        // ▼ 퇴장 시스템 메시지
        await connection.execute(
            `INSERT INTO CHAT_MESSAGES (ROOM_ID, USER_ID, CONTENT)
             VALUES (:roomId, :userId, :content)`,
            [roomId, userId, `${userNickname}님이 채팅방을 나갔어요.`],
            { autoCommit: true }
        );

        await connection.execute(
            `DELETE FROM CHAT_MEMBERS WHERE ROOM_ID = :roomId AND USER_ID = :userId`,
            [roomId, userId],
            { autoCommit: true }
        );

        res.json({ result: true, message: '채팅방을 나갔어요.' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

// 7. 읽음 처리 (채팅방 입장 시)
router.put('/:roomId/read', async (req, res) => {
    const { roomId } = req.params;
    const { userEmail } = req.body;
    let connection;
    try {
        connection = await db.getConnection();

        const userResult = await connection.execute(
            `SELECT USER_ID FROM USERS WHERE EMAIL = :userEmail`, [userEmail]
        );
        if (userResult.rows.length === 0) return res.json({ result: false });
        const userId = userResult.rows[0][0];

        // 현재 최신 메시지 ID 조회
        const lastMsgResult = await connection.execute(
            `SELECT MAX(MESSAGE_ID) FROM CHAT_MESSAGES WHERE ROOM_ID = :roomId`,
            [roomId]
        );
        const lastMsgId = lastMsgResult.rows[0][0] || 0;

        await connection.execute(
            `UPDATE CHAT_MEMBERS SET LAST_READ_MESSAGE_ID = :lastMsgId
             WHERE ROOM_ID = :roomId AND USER_ID = :userId`,
            [lastMsgId, roomId, userId],
            { autoCommit: true }
        );

        res.json({ result: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;