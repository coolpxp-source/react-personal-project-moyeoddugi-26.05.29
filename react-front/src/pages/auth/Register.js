import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import React, { useState } from "react";
import { useNavigate , Link } from "react-router-dom";
import { register } from '../../api/auth';
import styles from './Register.module.css';
import { motion } from 'framer-motion'; // 모션 라이브러리

function Register(){
    const navigate = useNavigate();
    const [form, setForm] = useState({email : '' , userName: '' ,  password : '', passwordCheck: '', nickname : ''})
    // 상단에 에러 상태 추가
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        passwordCheck: '',
        nickname: '',
        userName: ''
    });
    const handleChange = (e) => {
        const {name, value} = e.target;
        // 이메일 - 한글 입력 막기
        if(name === 'email'){
            const englishOnly = value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
            setForm({ ...form, [name]: englishOnly });
            // 이메일 형식 피드백
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(englishOnly && !emailRegex.test(englishOnly)){
                setErrors({ ...errors, email: '올바른 이메일 형식이 아닙니다.' });
            } else {
                setErrors({ ...errors, email: '' });
            }
            return;
        }

        // 이름 - 숫자/특수문자 입력 막기
        if(name === 'userName'){
            const koreanOnly = value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z\s]/g, '');
            setForm({ ...form, [name]: koreanOnly });
            return;
        }

        // 비밀번호
        if(name === 'password'){
            setForm({ ...form, [name]: value });
            if(value.length > 0 && value.length < 8){
                setErrors({ ...errors, password: '비밀번호는 8자 이상이어야 합니다.' });
            } else {
                setErrors({ ...errors, password: '' });
            }
            return;
        }

        if(name === 'passwordCheck'){
            setForm({ ...form, [name]: value });
            if(value && value !== form.password){
                setErrors({ ...errors, passwordCheck: '비밀번호가 일치하지 않습니다.' });
            } else {
                setErrors({ ...errors, passwordCheck: '' });
            }
            return;
        }

        // 닉네임 - 특수문자 입력 막기
        if(name === 'nickname'){
            const noSpecial = value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/g, '');
            if(noSpecial.length > 8) return;
            setForm({ ...form, [name]: noSpecial });
            if(noSpecial.length > 0 && noSpecial.length < 2){
                setErrors({ ...errors, nickname: '닉네임은 2자 이상이어야 합니다.' });
            } else {
                setErrors({ ...errors, nickname: '' });
            }
            return;
        }
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async() => {
        // TODO: 회원가입 API 연결
        // 빈 값 검사
        if(!form.email || !form.password || !form.userName || !form.nickname){
            alert('모든 항목을 입력해주세요.');
            return;
        }

        // 이메일 형식 검사
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(form.email)){
            alert('올바른 이메일 형식이 아닙니다.');
            return;
        }

        // 비밀번호 길이 검사
        if(form.password.length < 8){
            alert('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        // 비밀번호 확인
        if(form.password !== form.passwordCheck){
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 닉네임 길이 검사
        if(form.nickname.length < 2){
            alert('닉네임은 2자 이상이어야 합니다.');
            return;
        }

        const data = await register(form.email, form.password, form.userName, form.nickname);
        if(data.result){
            alert('회원가입 성공! 로그인해주세요.');
            navigate('/');
        } else {
            alert(data.message);
        }
    };
    
    return<>
        <Box className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                <Box className={styles.formWrap}>
                    {/* 로고 */}
                    <Box className={styles.logoArea}>
                        <img src="/logo/logo_title.png" alt="모여뜨기 로고" className={styles.logoImg}/>
                    </Box>
                    <Typography className={styles.title}>
                        회원가입
                    </Typography>

                    <TextField
                    fullWidth label="이메일" name="email"
                    value={form.email} onChange={handleChange}
                    sx={{ mb: 2 }}
                    autoComplete="off"
                    error={!!errors.email}
                    helperText={errors.email}
                    />
                    <TextField
                    fullWidth label="이름" name="userName"
                    value={form.userName} onChange={handleChange}
                    sx={{ mb: 2 }}
                    error={!!errors.userName}
                    helperText={errors.userName}
                    />
                    <TextField
                    fullWidth label="닉네임" name="nickname"
                    value={form.nickname} onChange={handleChange}
                    sx={{ mb: 2 }}
                    error={!!errors.nickname}
                    helperText={errors.nickname || `${form.nickname.length}/8`}
                    />
                    <TextField
                    fullWidth label="비밀번호" name="password"
                    type="password" value={form.password} onChange={handleChange}
                    sx={{ mb: 2 }}
                    autoComplete="new-password"
                    error={!!errors.password}
                    helperText={errors.password}
                    />
                    <TextField
                    fullWidth label="비밀번호 확인" name="passwordCheck"
                    type="password" value={form.passwordCheck} onChange={handleChange}
                    sx={{ mb: 3 }}
                    autoComplete="new-password"
                    error={!!errors.passwordCheck}
                    helperText={errors.passwordCheck}
                    />

                    <Button fullWidth variant="contained"
                    onClick={handleSubmit}
                    className={styles.button}
                    >
                    가입하기
                    </Button>

                    <Typography className={styles.footer}>
                    이미 계정이 있으신가요?{' '}
                    <Link to="/" className={styles.link}>로그인</Link>
                    </Typography>
                </Box>
            </motion.div>
        </Box> 
    </>
}

export default Register;