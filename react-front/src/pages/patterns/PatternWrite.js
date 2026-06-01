import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createPattern } from '../../api/patterns';
import { jwtDecode } from 'jwt-decode';
import styles from './PatternWrite.module.css';

const NEEDLE_TYPES = ['코바늘', '대바늘'];
const DIFFICULTIES = ['입문', '초급', '중급', '고급'];
const CATEGORIES = ['소품', '가방', '모자', '의류', '인형', '선물용', '기타'];
const PRESET_TAGS = ['소품', '가방', '모자', '의류', '인형', '선물용'];


function PatternWrite() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [form, setForm] = useState({
        title: '',
        description: '',
        needleType: '코바늘',
        difficulty: '입문',
        category: '',
        yarnType: '',
        needleSize: '',
        finishedSize: '',
        workTime: '',
        tags: [],
    });
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 3) {
            alert('이미지는 최대 3장까지 업로드 가능해요.');
            return;
        }
        setImages(prev => [...prev, ...files]);
        const previews = files.map(f => URL.createObjectURL(f));
        setImagePreviews(prev => [...prev, ...previews]);
    };

    const removeImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx));
        setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const removeTag = (tag) => {
        setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) return alert('제목을 입력해주세요.');
        if (!form.description.trim()) return alert('설명을 입력해주세요.');
        if (!form.needleType) return alert('바늘 종류를 선택해주세요.');
        if (!form.difficulty) return alert('난이도를 선택해주세요.');
        if (images.length === 0) return alert('이미지를 최소 1장 올려주세요.');

        const formData = new FormData();
        formData.append('userEmail', user?.userEmail);
        formData.append('title', form.title);
        formData.append('description', form.description);
        formData.append('needleType', form.needleType);
        formData.append('difficulty', form.difficulty);
        if (form.category) formData.append('category', form.category);
        if (form.yarnType) formData.append('yarnType', form.yarnType);
        if (form.needleSize) formData.append('needleSize', form.needleSize);
        if (form.finishedSize) formData.append('finishedSize', form.finishedSize);
        if (form.workTime) formData.append('workTime', form.workTime);
        formData.append('tags', JSON.stringify(form.tags));
        formData.append('image', images[0]); // ▼ 첫번째 이미지가 대표이미지

        const res = await fetch('http://localhost:3010/api/patterns', {
            method: 'POST',
            body: formData, // Content-Type 헤더 없이 전송
        });
        const data = await res.json();

        if (data.result) {
            alert('도안이 등록됐어요! 🧶');
            navigate('/patterns');
        } else {
            alert(data.message);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.card}>
                <Typography className={styles.pageTitle}>도안 등록하기</Typography>

                {/* 도안 정보 섹션 */}
                <Box className={styles.section}>
                    <Typography className={styles.sectionTitle}>도안 정보</Typography>

                    {/* 제목 */}
                    <Box className={styles.field}>
                        <Typography className={styles.label}>제목 * (필수)</Typography>
                        <TextField fullWidth size="small" name="title"
                            value={form.title} onChange={handleChange}
                        />
                    </Box>

                    {/* 설명 */}
                    <Box className={styles.field}>
                        <Typography className={styles.label}>설명 * (필수)</Typography>
                        <TextField fullWidth multiline rows={4} name="description"
                            placeholder="줄글 도안은 여기에 작성하세요."
                            value={form.description} onChange={handleChange}
                        />
                    </Box>
                </Box>

                {/* 기본 정보 섹션 */}
                <Box className={styles.section}>
                    <Typography className={styles.sectionTitle}>기본 정보</Typography>

                    {/* 바늘 종류 */}
                    <Box className={styles.field}>
                        <Typography className={styles.label}>종류 *</Typography>
                        <Box className={styles.chipRow}>
                            {NEEDLE_TYPES.map(type => (
                                <Chip key={type} label={type}
                                    onClick={() => setForm(prev => ({ ...prev, needleType: type }))}
                                    style={{
                                        backgroundColor: form.needleType === type ? '#4CAF50' : '#F5EDD8',
                                        color: form.needleType === type ? '#fff' : '#7B4F2E',
                                        cursor: 'pointer', fontWeight: 500,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* 난이도 */}
                    <Box className={styles.field}>
                        <Typography className={styles.label}>난이도 *</Typography>
                        <Box className={styles.chipRow}>
                            {DIFFICULTIES.map(d => (
                                <Chip key={d} label={d}
                                    onClick={() => setForm(prev => ({ ...prev, difficulty: d }))}
                                    style={{
                                        backgroundColor: form.difficulty === d ? '#7B4F2E' : '#F5EDD8',
                                        color: form.difficulty === d ? '#fff' : '#7B4F2E',
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* 세부 정보 */}
                    <Box className={styles.detailGrid}>
                        <Box className={styles.field}>
                            <Typography className={styles.label}>사용한 실 종류</Typography>
                            <TextField fullWidth size="small" name="yarnType"
                                placeholder="예) 로미오 실 등"
                                value={form.yarnType} onChange={handleChange}
                            />
                        </Box>
                        <Box className={styles.field}>
                            <Typography className={styles.label}>사용한 바늘 호수</Typography>
                            <TextField fullWidth size="small" name="needleSize"
                                placeholder="예) 코바늘 5호"
                                value={form.needleSize} onChange={handleChange}
                            />
                        </Box>
                        <Box className={styles.field}>
                            <Typography className={styles.label}>완성 크기</Typography>
                            <TextField fullWidth size="small" name="finishedSize"
                                placeholder="예) 약 30cm"
                                value={form.finishedSize} onChange={handleChange}
                            />
                        </Box>
                        <Box className={styles.field}>
                            <Typography className={styles.label}>소요 시간</Typography>
                            <TextField fullWidth size="small" name="workTime"
                                placeholder="예) 3~4시간"
                                value={form.workTime} onChange={handleChange}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* 이미지 섹션 */}
                <Box className={styles.section}>
                    <Typography className={styles.sectionTitle}>완성품 이미지 & 도안 이미지 (최대 3장)</Typography>
                    <Box className={styles.imageArea}>
                        {imagePreviews.map((src, idx) => (
                            <Box key={idx} className={styles.imageItem}>
                                <img src={src} alt={`preview-${idx}`} className={styles.imagePreview}/>
                                <Button size="small" className={styles.removeImgBtn}
                                    onClick={() => removeImage(idx)}>✕</Button>
                            </Box>
                        ))}
                        {images.length < 3 && (
                            <Box className={styles.imageUpload}
                                onClick={() => document.getElementById('patternImage').click()}>
                                <Typography className={styles.imagePlaceholder}>
                                    {images.length === 0 ? '대표이미지' : '+ 추가'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <input id="patternImage" type="file" accept="image/*" multiple
                        style={{ display: 'none' }} onChange={handleImageChange}
                    />
                </Box>

                {/* 태그 섹션 */}
                <Box className={styles.section}>
                    <Typography className={styles.sectionTitle}>태그</Typography>
                    <Box className={styles.field}>
                        <Typography className={styles.label}>태그 추가(선택) 최대 5개</Typography>
                        <Box className={styles.chipRow}>
                            {PRESET_TAGS.map(tag => (
                                <Chip key={tag} label={tag} size="small"
                                    onClick={() => {
                                        if (form.tags.includes(tag)) {
                                            removeTag(tag);
                                        } else {
                                            if (form.tags.length >= 5) return alert('태그는 최대 5개까지 가능해요.');
                                            setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                                        }
                                    }}
                                    style={{
                                        backgroundColor: form.tags.includes(tag) ? '#C4956A' : '#F5EDD8',
                                        color: form.tags.includes(tag) ? '#fff' : '#7B4F2E',
                                        cursor: 'pointer',
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* 버튼 */}
                <Box className={styles.btnRow}>
                    <Button variant="outlined" className={styles.cancelBtn}
                        onClick={() => navigate('/patterns')}>
                        다음에 하기
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

export default PatternWrite;