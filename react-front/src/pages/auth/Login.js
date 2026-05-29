import React, { useState } from "react";
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { Link, useNavigate } from "react-router-dom";
import styles from './Login.module.css';
import { login } from '../../api/auth';
import { motion } from 'framer-motion'; // 모션 라이브러리

function Login(){
    const navigate = useNavigate(); // 페이지 이동 hook
    const [form, setForm] = useState({ email: '', password: '' }); 

    const handleChange = (e) =>{
        const {name, value} = e.target;
        // 이메일 - 한글 입력 막기
        if(name === 'email'){
            const englishOnly = value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
            setForm({ ...form, [name]: englishOnly });
            return;
        }

        // 비밀번호 - 공백 입력 막기
        if(name === 'password'){
            const noSpace = value.replace(/\s/g, '');
            setForm({ ...form, [name]: noSpace });
            return;
        }

        setForm({ ...form, [e.target.name]: e.target.value });
    }
    
    const handleSubmit = async () => {
        const data = await login(form.email, form.password);
        console.log(data);
        if(data.result){
            localStorage.setItem('token', data.token);  // 토큰 저장
            localStorage.setItem('userEmail', data.userEmail);  // 유저 정보 저장
            navigate('/main');
        } else {
            alert(data.message);
        }
    };
    
    return<>
       <Box className={styles.container}>
        {/* 왼쪽 빈 영역 (배경 이미지가 보이는 공간) */}
            <Box className={styles.leftSection} />

            {/* 오른쪽 로그인 폼 */}
            <Box className={styles.rightSection}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}>
                    <Box className={styles.formWrap}>
                        <Box className={styles.logoArea}>
                            <img src="/logo/logo.svg" alt="모여뜨기 로고" className={styles.logoImg}/>
                        </Box>

                        <TextField fullWidth label="이메일" name="email"
                            value={form.email} onChange={handleChange} 
                            autoComplete="off"
                        />
                        <TextField fullWidth label="비밀번호" name="password"
                            type="password" value={form.password} onChange={handleChange}
                            autoComplete="new-password" // 자동완성 막기용
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleSubmit();
                            }}
                        />
                        <Button className={styles.button} fullWidth variant="contained"
                            onClick={handleSubmit}>
                            로그인
                        </Button>

                        <Typography className={styles.subTitle}>
                            <Link to="/join" className={styles.link}>비밀번호를 잊으셨나요?</Link>
                        </Typography>

                        <Typography className={styles.divider}>또는</Typography>

                        <Button fullWidth variant="outlined" className={styles.socialButton}
                            startIcon={<img src="/icons/google_logo.webp" width={20} alt="google"/>}>
                            Google로 로그인
                        </Button>
                        <img src="/icons/kakao_login_medium_wide.png" alt="카카오 로그인" className={styles.socialImg}/>
                        <img src="/icons/NAVER_login.png" alt="네이버 로그인" className={styles.socialImg}/>
                        <Button fullWidth variant="outlined" component={Link} to="/join"
                            className={styles.newAccountButton}>
                            새 계정 만들기
                        </Button>
                    </Box>
                </motion.div>
            </Box>
        </Box>
    </>
}

export default Login;