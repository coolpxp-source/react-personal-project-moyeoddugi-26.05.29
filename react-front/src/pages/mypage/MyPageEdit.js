import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import styles from './MyPageEdit.module.css';

function MyPageEdit() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;
    // 회원 탈퇴
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawPw, setWithdrawPw] = useState('');

    const [form, setForm] = useState({
        nickname: user?.userNickname || '',
        bio: user?.bio || '',
    });
    const [profileImg, setProfileImg] = useState(null);
    const [preview, setPreview] = useState(null);

    const [pwForm, setPwForm] = useState({
        currentPassword: '',
        newPassword: '',
        newPasswordCheck: '',
    });

    // 탈퇴
    const handleWithdraw = async () => {
        if (!withdrawPw.trim()) return alert('비밀번호를 입력해주세요.');
        if (!window.confirm('정말 탈퇴할까요? 모든 데이터가 삭제돼요.')) return;
        const res = await fetch('http://localhost:3010/api/auth/withdraw', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: user?.userEmail, password: withdrawPw }),
        });
        const data = await res.json();
        if (data.result) {
            alert('탈퇴가 완료됐어요. 이용해주셔서 감사해요 🧶');
            localStorage.removeItem('token');
            navigate('/');
        } else {
            alert(data.message);
        }
    };
    const handlePasswordChange = async () => {
        if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.newPasswordCheck) {
            return setPwError('모든 항목을 입력해주세요.');
        }
        if (pwForm.newPassword.length < 8) {
            return setPwError('새 비밀번호는 8자 이상이어야 해요.');
        }
        if (pwForm.newPassword !== pwForm.newPasswordCheck) {
            return setPwError('새 비밀번호가 일치하지 않아요.');
        }
        const res = await fetch('http://localhost:3010/api/auth/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail: user?.userEmail,
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            }),
        });
        const data = await res.json();
        if (data.result) {
            alert('비밀번호가 변경됐어요! 🧶');
            setPwForm({ currentPassword: '', newPassword: '', newPasswordCheck: '' });
            setPwError('');
        } else {
            setPwError(data.message);
        }
    };

    const [pwError, setPwError] = useState('');

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
                        className={styles.hiddenInput} onChange={handleImageChange}/>
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

                {/* 비밀번호 변경 */}
                <Box className={styles.section}>
                    <Typography className={styles.sectionTitle}>비밀번호 변경</Typography>
                    <Box className={styles.field}>
                        <Typography className={styles.label}>현재 비밀번호</Typography>
                        <TextField fullWidth size="small" type="password"
                            value={pwForm.currentPassword}
                            onChange={(e) => setPwForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        />
                    </Box>
                    <Box className={styles.field}>
                        <Typography className={styles.label}>새 비밀번호</Typography>
                        <TextField fullWidth size="small" type="password"
                            value={pwForm.newPassword}
                            onChange={(e) => setPwForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                    </Box>
                    <Box className={styles.field}>
                        <Typography className={styles.label}>새 비밀번호 확인</Typography>
                        <TextField fullWidth size="small" type="password"
                            value={pwForm.newPasswordCheck}
                            onChange={(e) => setPwForm(prev => ({ ...prev, newPasswordCheck: e.target.value }))}
                        />
                    </Box>
                    {pwError && (
                        <Typography className={styles.errorText}>{pwError}</Typography>
                    )}
                    <Button variant="contained" className={styles.pwChangeBtn}
                        onClick={handlePasswordChange}>
                        비밀번호 변경
                    </Button>
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
                
                {/* 회원탈퇴 */}
                <Box className={styles.withdrawSection}>
                    {!showWithdraw ? (
                        <button className={styles.withdrawOpenBtn}
                            onClick={() => setShowWithdraw(true)}>
                            회원탈퇴
                        </button>
                    ) : (
                        <Box className={styles.withdrawBox}>
                            <Typography className={styles.withdrawTitle}>정말 탈퇴할까요?</Typography>
                            <Typography className={styles.withdrawDesc}>
                                탈퇴 시 모든 데이터가 삭제되며 복구할 수 없어요.
                            </Typography>
                            <input
                                type="password"
                                className={styles.withdrawInput}
                                placeholder="비밀번호를 입력하세요"
                                value={withdrawPw}
                                onChange={(e) => setWithdrawPw(e.target.value)}
                            />
                            <Box className={styles.withdrawBtns}>
                                <button className={styles.withdrawCancelBtn}
                                    onClick={() => { setShowWithdraw(false); setWithdrawPw(''); }}>
                                    취소
                                </button>
                                <button className={styles.withdrawBtn}
                                    onClick={handleWithdraw}>
                                    탈퇴하기
                                </button>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}

export default MyPageEdit;