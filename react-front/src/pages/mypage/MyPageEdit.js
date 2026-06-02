import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import styles from './MyPageEdit.module.css';

function MyPageEdit() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [form, setForm] = useState({
        nickname: user?.userNickname || '',
        bio: user?.bio || '',
    });
    const [profileImg, setProfileImg] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleImageClick = () => {
        document.getElementById('profileImgInput').click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImg(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('userEmail', user?.userEmail);
        formData.append('nickname', form.nickname);
        formData.append('bio', form.bio);
        if (profileImg) formData.append('profileImg', profileImg);

        const res = await fetch('http://localhost:3010/api/auth/update-profile', {
            method: 'PUT',
            body: formData,
        });
        const data = await res.json();

        if (data.result) {
            // ▼ 새 토큰 저장 후 마이페이지로 이동
            localStorage.setItem('token', data.token);
            alert('프로필이 수정됐어요!');
            navigate('/mypage');
            window.location.reload(); // ▼ 토큰 재반영
        } else {
            alert(data.message);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.card}>
                <Typography className={styles.pageTitle}>프로필 수정</Typography>

                {/* 프로필 이미지 */}
                <Box className={styles.imageSection}>
                    <Box className={styles.avatarWrapper} onClick={handleImageClick}>
                        {preview ? (
                            <img src={preview} alt="profile" className={styles.profileImg}/>
                        ) :  user?.profileImg ? (
                             // ▼ 추가: 기존 프로필 이미지 보여주기
                            <img src={`http://localhost:3010${user.profileImg}`}
                                alt="profile" className={styles.profileImg}/>
                        ) : (
                            <Box className={styles.avatarDefault}>
                                <Typography className={styles.avatarInitial}>
                                    {user?.userNickname?.charAt(0)}
                                </Typography>
                            </Box>
                        )}
                        <Box className={styles.avatarOverlay}>
                            <Typography className={styles.avatarOverlayText}>변경</Typography>
                        </Box>
                    </Box>
                    <input id="profileImgInput" type="file" accept="image/*"
                        style={{ display: 'none' }} onChange={handleImageChange}/>
                </Box>

                {/* 닉네임 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>닉네임</Typography>
                    <TextField fullWidth size="small"
                        value={form.nickname}
                        onChange={(e) => setForm(prev => ({ ...prev, nickname: e.target.value }))}
                    />
                </Box>

                {/* 소개 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>소개</Typography>
                    <TextField fullWidth size="small" multiline rows={3}
                        placeholder="자신을 소개해주세요"
                        value={form.bio}
                        onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                    />
                </Box>

                {/* 버튼 */}
                <Box className={styles.btnRow}>
                    <Button variant="outlined" className={styles.cancelBtn}
                        onClick={() => navigate('/mypage')}>
                        취소
                    </Button>
                    <Button variant="contained" className={styles.submitBtn}
                        onClick={handleSubmit}>
                        저장하기
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default MyPageEdit;