import React, { useState } from 'react';
import { Box, TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import styles from './PostWrite.module.css'

const BOARD_TYPES = ['자유', '질문', '모여떠요', '떠주세요', '떠드려요'];

function PostWrite(){
    const navigate = useNavigate();
    const token = localStorage.getItem('token'); // 로그인한 사람 특정
    const user = token ? jwtDecode(token) : null;
    const [form , setForm] = useState({
        boardType : '자유',
        title : '',
        content : '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.content.trim()) { // 제목 또는 내용이 공백일 때
            alert('제목과 내용을 입력해주세요.');
            return;
        }
        try {
            const res = await fetch('http://localhost:3010/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: user?.userEmail,
                    boardType: form.boardType,
                    title: form.title,
                    content: form.content,
                }),
            });
            console.log('user:', user);
            const data = await res.json();
            if (data.result) {
                alert('게시글이 등록됐어요 🧶');
                navigate('/posts');
            } else {
                alert('등록에 실패했어요. 다시 시도해주세요.');
            }
        } catch (err) {
            console.error(err);
            alert('서버 오류가 발생했어요.');
        }
    }

    return<>
        <Box className={styles.container}>
            <Box className={styles.card}>
                <Typography className={styles.pageTitle}>글쓰기</Typography>

                {/* 게시판 선택 */}
                <FormControl fullWidth size="small" className={styles.field}>
                    <InputLabel>게시판</InputLabel>
                    <Select
                        name="boardType"
                        value={form.boardType}
                        onChange={handleChange}
                        label="게시판"
                    >
                        {BOARD_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* 제목 */}
                <TextField fullWidth size="small" label="제목"
                    name="title" value={form.title} onChange={handleChange}
                    className={styles.field}
                />

                {/* 내용 */}
                <TextField fullWidth multiline rows={10} label="내용"
                    name="content" value={form.content} onChange={handleChange}
                    className={styles.field}
                />

                {/* 버튼 */}
                <Box className={styles.btnRow}>
                    <Button variant="outlined" className={styles.cancelBtn}
                        onClick={() => navigate('/posts')}>
                        취소
                    </Button>
                    <Button variant="contained" className={styles.submitBtn}
                        onClick={handleSubmit}>
                        등록
                    </Button>
                </Box>
            </Box>
        </Box>
    </>
}

export default PostWrite;