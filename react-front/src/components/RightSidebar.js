import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import styles from './RightSidebar.module.css';

export const dummyBanners = [
    {
        id: 1,
        img: '/banners/prym.webp',
        tag: 'NEW',
        brand: 'PRYM ERGONOMICS',
        title: '카본 더블 포인트 대바늘 세트',
        desc: '2.0~4.0mm 5종 세트',
        subDesc: '카본 소재 · 에르고노믹 디자인',
        link: 'https://slowflow.co.kr/product/프림-카본-더블-포인트-막대-바늘/1064/category/57/display/1/',
        adText: '뜨개 입문자도 쉽게! 가벼운 카본 소재로 손목 부담 없이',
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
        adText: '한정판 특가! 예쁜 라벤더 그립으로 뜨개 감성 UP ✨',
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
        adText: '혼자 배우기 어렵다면? 전문 강사와 함께하는 뜨개 클래스로 시작해보자!',
        dark: false,
        overlayColor: 'rgba(0,0,0,0.45)',
    },
];

function RightSidebar() {
    return (
        <Box className={styles.sideSection}>
            {dummyBanners.map((banner) => (
                <Box key={banner.id} className={styles.banner}
                    onClick={() => window.open(banner.link, '_blank')}>
                    
                    <Box className={styles.bannerImgWrapper}>
                        <img src={banner.img} alt={banner.title} className={styles.bannerImg}/>
                        <Typography className={styles.bannerTag}>{banner.tag}</Typography>
                        <Box className={styles.bannerOverlay}
                            style={{ background: banner.overlayColor }}> {/* ← 동적이라 인라인 유지 */}
                            <Typography className={styles.bannerBrand}>{banner.brand}</Typography>
                            <Typography className={styles.bannerTitle}>{banner.title}</Typography>
                        </Box>
                    </Box>

                    <Box className={styles.bannerBody}>
                        <Typography className={styles.bannerDesc}>{banner.desc}</Typography>
                        <Typography className={styles.bannerSubDesc}>{banner.subDesc}</Typography>
                        <Box className={styles.bannerBtn}>자세히 보기 →</Box>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}


export default RightSidebar;