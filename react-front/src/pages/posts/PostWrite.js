import React, { useState } from 'react';
import { Box, TextField, Button, Typography, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import styles from './PostWrite.module.css';

const BOARD_TYPES = ['자유', '질문', '모여떠요', '떠주세요', '떠드려요'];

function PostWrite() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [form, setForm] = useState({
        boardType: '자유',
        title: '',
        content: '',
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 3) {
            alert('이미지는 최대 3장까지 올릴 수 있어요.');
            return;
        }
        setImages(prev => [...prev, ...files]);
        setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    };

    const removeImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        const formData = new FormData();
        formData.append('userEmail', user?.userEmail);
        formData.append('boardType', form.boardType);
        formData.append('title', form.title);
        formData.append('content', form.content);
        images.forEach(img => formData.append('images', img));

        try {
            const res = await fetch('http://localhost:3010/api/posts', {
                method: 'POST',
                body: formData,
            });
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
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.card}>
                <Typography className={styles.pageTitle}>글쓰기</Typography>

                {/* 게시판 선택 */}
                <FormControl fullWidth size="small" className={styles.field}>
                    <InputLabel>게시판</InputLabel>
                    <Select name="boardType" value={form.boardType}
                        onChange={handleChange} label="게시판">
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

                {/* 이미지 첨부 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>이미지 첨부 (선택, 최대 3장)</Typography>
                    <Box className={styles.imageArea}>
                        {previews.map((src, idx) => (
                            <Box key={idx} className={styles.imageItem}>
                                <img src={src} alt={`preview-${idx}`} className={styles.imagePreview}/>
                                <button className={styles.removeBtn} onClick={() => removeImage(idx)}>✕</button>
                            </Box>
                        ))}
                        {images.length < 3 && (
                            <Box className={styles.imageUpload}
                                onClick={() => document.getElementById('postImage').click()}>
                                <Typography className={styles.imagePlaceholder}>
                                    {images.length === 0 ? '+ 이미지 추가' : '+ 추가'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <input id="postImage" type="file" accept="image/*" multiple
                        style={{ display: 'none' }} onChange={handleImageChange}/>
                </Box>

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
    );
}

export default PostWrite;