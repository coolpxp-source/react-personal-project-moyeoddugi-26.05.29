const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');

// 1. 장소 목록 조회
router.get('/', async (req, res) => {
    const { allow_status } = req.query;
    let connection;
    try {
        connection = await db.getConnection();
        let query = `
            SELECT p.PLACE_ID, p.PLACE_NAME, p.PLACE_TYPE, p.ADDRESS,
                   p.LATITUDE, p.LONGITUDE, p.ALLOW_STATUS,
                   p.HAS_WIDE_TABLE, p.HAS_OUTLET, p.IS_QUIET,
                   p.NO_TIME_LIMIT, p.HAS_MANY_SEATS, p.NO_MIN_ORDER,
                   p.HAS_PARKING, p.IS_24HOURS, p.HAS_OUTDOOR,
                   p.PET_FRIENDLY, p.HAS_FOOD, p.HAS_RESTROOM,
                   p.PLACE_IMG, u.NICKNAME
            FROM PLACES p
            JOIN USERS u ON p.USER_ID = u.USER_ID
        `;
        const binds = [];
        if (allow_status) {
            query += ` WHERE p.ALLOW_STATUS = :allow_status`;
            binds.push(allow_status);
        }
        query += ` ORDER BY p.CREATED_AT DESC`;

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

// 2. 장소 등록
router.post('/', async (req, res) => {
    const {
        userEmail, placeName, placeType, address,
        latitude, longitude, allowStatus,
        hasWideTable, hasOutlet, isQuiet, noTimeLimit,
        hasManySeats, noMinOrder, hasParking, is24hours,
        hasOutdoor, petFriendly, hasFood, hasRestroom
    } = req.body;

    if (!userEmail || !placeName || !address || !latitude || !longitude || !allowStatus) {
        return res.json({ result: false, message: '필수 값이 누락됐어요.' });
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
            `INSERT INTO PLACES (
                USER_ID, PLACE_NAME, PLACE_TYPE, ADDRESS,
                LATITUDE, LONGITUDE, ALLOW_STATUS,
                HAS_WIDE_TABLE, HAS_OUTLET, IS_QUIET, NO_TIME_LIMIT,
                HAS_MANY_SEATS, NO_MIN_ORDER, HAS_PARKING, IS_24HOURS,
                HAS_OUTDOOR, PET_FRIENDLY, HAS_FOOD, HAS_RESTROOM
            ) VALUES (
                :userId, :placeName, :placeType, :address,
                :latitude, :longitude, :allowStatus,
                :hasWideTable, :hasOutlet, :isQuiet, :noTimeLimit,
                :hasManySeats, :noMinOrder, :hasParking, :is24hours,
                :hasOutdoor, :petFriendly, :hasFood, :hasRestroom
            )`,
            [
                userId, placeName, placeType || '카페', address,
                latitude, longitude, allowStatus,
                hasWideTable || 'N', hasOutlet || 'N', isQuiet || 'N', noTimeLimit || 'N',
                hasManySeats || 'N', noMinOrder || 'N', hasParking || 'N', is24hours || 'N',
                hasOutdoor || 'N', petFriendly || 'N', hasFood || 'N', hasRestroom || 'N'
            ],
            { autoCommit: true }
        );

        res.json({
            result: result.rowsAffected > 0,
            message: result.rowsAffected > 0 ? '장소가 등록됐어요!' : '등록에 실패했어요.'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error executing query');
    } finally {
        await connection.close();
    }
});

module.exports = router;