import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import styles from './RightSidebar.module.css';

const dummyBanners = [
    {
        id: 1,
        img: '/banners/prym.webp',
        tag: 'NEW',
        brand: 'PRYM ERGONOMICS',
        title: '카본 더블 포인트 대바늘 세트',
        desc: '2.0~4.0mm 5종 세트',
        subDesc: '카본 소재 · 에르고노믹 디자인',
        link: 'https://slowflow.co.kr/product/프림-카본-더블-포인트-막대-바늘/1064/category/57/display/1/',
        dark: true,
        overlayColor: 'rgba(0,0,0,0.55)',
    },
    {
        id: 2,
        img: '/banners/crova.jpg',
        tag: '한정판',
        brand: 'CLOVER · 명품 코바늘',
        title: '라벤더 펜e 코바늘 세트',
        desc: '전용 파우치 포함 · 한정 수량',
        subDesc: '골드 팁 · 라벤더 그립 · 7종 세트',
        link: 'https://slowflow.co.kr/product/크로바-라벤더-펜e-코바늘-세트-한정판/1108/?srsltid=AfmBOopEPU4E93IsA5uSoEgJdzU4wDjlmfK3etgIah84v6S17hbOFRgT',
        dark: false,
        overlayColor: 'rgba(100,70,120,0.6)',
    },
    {
        id: 3,
        img: '/banners/class.jpg',
        tag: '공방',
        brand: '뜨개쟁이 · 합정역 3번출구 도보 5분',
        title: '뜨개질 클래스',
        desc: '초심자 위주 · 탄탄하고 즐겁게!',
        subDesc: '전용 유튜브 링크 제공',
        link: 'https://www.knitter.kr/?NaPm=ct%3Dmpvx7l46%7Cci%3Dcheckout%7Ctr%3Dds%7Ctrx%3Dnull%7Chk%3D13a3d747fb822a126fd04e72cc0992ce9c4a5b26',
        dark: false,
        overlayColor: 'rgba(0,0,0,0.45)',
    },
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
                    onClick={() => window.open(banner.link, '_blank')}
                    style={{ padding: 0, overflow: 'hidden', backgroundColor: 'transparent' }}>
                    
                    <Box style={{ position: 'relative', width: '100%', height: '160px', overflow: 'hidden' }}>
                        <img src={banner.img} alt={banner.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        <Box style={{
                            position: 'absolute', top: 8, left: 8,
                            background: '#7B4F2E', color: 'white',
                            fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4
                        }}>{banner.tag}</Box>
                        <Box style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: banner.overlayColor, padding: '10px 12px'
                        }}>
                            <Typography style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>
                                {banner.brand}
                            </Typography>
                            <Typography style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'white' }}>
                                {banner.title}
                            </Typography>
                        </Box>
                    </Box>

                    <Box style={{ background: '#FAF6F0', padding: '10px 12px' }}>
                        <Typography style={{ fontSize: 11, color: '#7B4F2E', fontWeight: 500, marginBottom: 4 }}>
                            {banner.desc}
                        </Typography>
                        <Typography style={{ fontSize: 11, color: '#B08060', marginBottom: 8 }}>
                            {banner.subDesc}
                        </Typography>
                        <Box style={{
                            background: '#7B4F2E', color: 'white', textAlign: 'center',
                            padding: '6px', borderRadius: 20, fontSize: 11, fontWeight: 500
                        }}>
                            자세히 보기 →
                        </Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}


export default RightSidebar;