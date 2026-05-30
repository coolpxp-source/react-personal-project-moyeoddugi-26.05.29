import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import styles from './RightSidebar.module.css';

const dummyBanners = [
    { id: 1, title: '🧶 실 할인 이벤트', desc: '이번 주 실 30% 할인', color: '#E8D5B7' },
    { id: 2, title: '🪡 바늘 신상 입고', desc: '대바늘/코바늘 신제품', color: '#DEC9A8' },
    { id: 3, title: '📦 무료 배송', desc: '3만원 이상 무료 배송', color: '#EDE0C8' },
];

function RightSidebar() {
    const navigate = useNavigate();

    return (
        <Box className={styles.sideSection}>
            <Button variant="contained" className={styles.writeBtn}
                onClick={() => navigate('/posts/write')}>
                + 글쓰기
            </Button>

            {dummyBanners.map((banner) => (
                <Box key={banner.id} className={styles.banner}
                    style={{ backgroundColor: banner.color }}>
                    <Typography className={styles.bannerTitle}>{banner.title}</Typography>
                    <Typography className={styles.bannerDesc}>{banner.desc}</Typography>
                </Box>
            ))}
        </Box>
    );
}

export default RightSidebar;