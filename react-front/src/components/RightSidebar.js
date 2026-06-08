import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import styles from './RightSidebar.module.css';


export const dummyBanners = [
    {
        id: 1,
        tag: 'NEW ARRIVAL',
        brand: 'PRYM ERGONOMICS',
        highlight: '손목 부담 ZERO',
        title: '카본 대바늘 세트',
        price: '38,000원',
        badge: '입문자 추천',
        img: '/banners/prym.webp',
        link: 'https://slowflow.co.kr/product/프림-카본-더블-포인트-막대-바늘/1064/category/57/display/1/',
    },
    {
        id: 2,
        tag: '한정판',
        brand: 'CLOVER',
        highlight: '라벤더 감성 ✨',
        title: '펜e 코바늘 세트',
        price: '89,000원',
        badge: '한정 수량',
        img: '/banners/crova.jpg',
        link: 'https://slowflow.co.kr/product/크로바-라벤더-펜e-코바늘-세트-한정판/1108/',
    },
    {
        id: 3,
        tag: '공방',
        brand: '뜨개쟁이',
        highlight: '합정역 도보 5분',
        title: '뜨개질 클래스',
        price: '65,000원',
        badge: '초심자 환영',
        img: '/banners/class.jpg',
        link: 'https://www.knitter.kr/',
    },
    {
        id: 4,
        tag: 'BEST',
        brand: 'Amy Wool',
        highlight: '포근한 메리노울',
        title: '메리노 울 100% 실타래',
        price: '5,600원',
        badge: '울 100%',
        img: '/banners/yarn.PNG',
        link: 'https://smartstore.naver.com/fumi/products/3750281813?nl-query=%EB%A9%94%EB%A6%AC%EB%85%B8%20%EC%9A%B8%20100%25%20%EC%8B%A4%ED%83%80%EB%9E%98&nl-au=945269f74bc14f048c0aaf81fd142e56&NaPm=ci%3D945269f74bc14f048c0aaf81fd142e56%7Cct%3Dmq4x9412%7Ctr%3Dnslsl%7Csn%3D200628%7Chk%3D61454103608ea1c2d0bdfb63ff461190b52ec93b',
    },
    {
        id: 5,
        tag: '세트',
        brand: 'TULIP',
        highlight: '코바늘의 교과서',
        title: '에띠모(ETIMO) 레드 코바늘 세트',
        price: '129,000원',
        badge: '인기 1위',
        img: '/banners/tulip.PNG',
        link: 'https://smartstore.naver.com/by_in/products/5118090238?nl-query=%EC%97%90%ED%8B%B0%EB%AA%A8%20%EC%BD%94%EB%B0%94%EB%8A%98%20%EC%84%B8%ED%8A%B8&nl-au=ac34a85ff8264919b73aac8bdae2c03c&NaPm=ci%3Dac34a85ff8264919b73aac8bdae2c03c%7Cct%3Dmq4xcdvd%7Ctr%3Dnslsl%7Csn%3D1126579%7Chk%3D2fcd38399f2e0065498ab41e204213dc7046dea1',
    },
    {
        id: 6,
        tag: '소품',
        brand: 'DIY 가방',
        highlight: '가방도 내 손으로',
        title: '러빈백(사계절용) 뜨개가방 DIY KIT 코바늘가방 손뜨개',
        price: '33,000원',
        badge: '3+1 행사',
        img: '/banners/ratan.PNG',
        link: 'https://smartstore.naver.com/orda_made/products/11555358847?nl-query=%EB%9C%A8%EA%B0%9C%20diy&nl-au=3ad258ff1209416594fac645d407bf37&NaPm=ci%3D3ad258ff1209416594fac645d407bf37%7Cct%3Dmq4xfyxh%7Ctr%3Dnslsl%7Csn%3D6768405%7Chk%3D53c49c0473292274798d7886fb3ed8891b992074',
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