import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { createShowcase } from '../../api/showcase';
import styles from './ShowcaseWrite.module.css';

function ShowcaseWrite() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [form, setForm] = useState({ title: '', content: '' });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 3) {
            alert('사진은 최대 3장까지 올릴 수 있어요.');
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
        if (!form.title.trim()) return alert('제목을 입력해주세요.');
        if (!form.content.trim()) return alert('내용을 입력해주세요.');
        if (images.length === 0) return alert('사진을 최소 1장 올려주세요.');

        const formData = new FormData();
        formData.append('userEmail', user?.userEmail);
        formData.append('title', form.title);
        formData.append('content', form.content);
        images.forEach(img => formData.append('images', img));

        const data = await createShowcase(formData);
        if (data.result) {
            alert('작품이 등록됐어요! 🧶');
            navigate('/works');
        } else {
            alert(data.message);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.card}>
                <Typography className={styles.pageTitle}>작품 올리기</Typography>

                {/* 이미지 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>사진 (최대 3장) *</Typography>
                    <Box className={styles.imageArea}>
                        {previews.map((src, idx) => (
                            <Box key={idx} className={styles.imageItem}>
                                <img src={src} alt={`preview-${idx}`} className={styles.imagePreview}/>
                                <button className={styles.removeBtn} onClick={() => removeImage(idx)}>✕</button>
                            </Box>
                        ))}
                        {images.length < 3 && (
                            <Box className={styles.imageUpload}
                                onClick={() => document.getElementById('showcaseImage').click()}>
                                <Typography className={styles.imagePlaceholder}>
                                    {images.length === 0 ? '+ 사진 추가' : '+ 추가'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <input id="showcaseImage" type="file" accept="image/*" multiple
                        style={{ display: 'none' }} onChange={handleImageChange}/>
                </Box>

                {/* 제목 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>제목 *</Typography>
                    <TextField fullWidth size="small"
                        placeholder="작품 제목을 입력하세요"
                        value={form.title}
                        onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                </Box>

                {/* 내용 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>내용 *</Typography>
                    <TextField fullWidth multiline rows={6}
                        placeholder="작품에 대해 자유롭게 소개해주세요"
                        value={form.content}
                        onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                    />
                </Box>

                {/* 버튼 */}
                <Box className={styles.btnRow}>
                    <Button variant="outlined" className={styles.cancelBtn}
                        onClick={() => navigate('/works')}>
                        취소
                    </Button>
                    <Button variant="contained" className={styles.submitBtn}
                        onClick={handleSubmit}>
                        등록하기
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default ShowcaseWrite;