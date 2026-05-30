import { Box, Tabs, Tab, Card, CardContent, CardMedia, Typography, Avatar } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import styles from './Main.module.css';
import { useState } from 'react';
import RightSidebar from '../../components/RightSidebar'; // 우측 배너 영역

// 더미 데이터
const dummyWorks = [
    { id: 1, title: '귀여운 곰돌이 인형', nickname: '뜨개중독', content: '간만에 작품 자랑합니다 ㅎㅎ', likes: 24, tags: ['#넓은테이블', '#뜨개환영'] },
    { id: 2, title: '버킷햇 여름 모자', nickname: '실뭉치언니', content: '여름 준비 완료!', likes: 18, tags: ['#코바늘', '#모자'] },
    { id: 3, title: '귀여운 곰돌이 인형', nickname: '뜨개중독', content: '간만에 작품 자랑합니다 ㅎㅎ', likes: 24, tags: ['#넓은테이블', '#뜨개환영'] },
    { id: 4, title: '버킷햇 여름 모자', nickname: '실뭉치언니', content: '여름 준비 완료!', likes: 18, tags: ['#코바늘', '#모자'] },
];

const dummyComments = [
    { id: 1, nickname: '뜨띠', content: '넘 귀여워요!! 넘 갑니다 ✨' },
    { id: 2, nickname: '뜨개중독', content: '넘 좋은 곳이네요~~' },
    { id: 3, nickname: '푸르시오', content: '좋은 곳 공유 감사합니다' },
];

function Main(){
    const token = localStorage.getItem('token');
    const [tab, setTab] = useState(0);
    return <>
        <Box className={styles.container}>
            <Tabs
                value={tab}
                onChange={(e, newVal) => setTab(newVal)}
                className={styles.tabs}
            >
                <Tab label="작품 자랑 (주간 베스트)" className={styles.tab}/>
                <Tab label="도안 공유 (주간 베스트)" className={styles.tab}/>
                <Tab label="뜨개지도" className={styles.tab}/>
            </Tabs>

            {/* 탭 내용 */}
            <Box className={styles.mainLayout}>
                <Box className={styles.cardSection}>
                    {tab === 0 && (
                        <Box className={styles.cardGrid}>
                            {dummyWorks.map((work) => (
                            <Box key={work.id} className={styles.cardRow}>
                                {/* 이미지 */}
                                <Box className={styles.cardImg}/>
                                        {/* 내용 */}
                                    <Box className={styles.cardContent}>
                                        <Typography className={styles.cardTitle}>{work.title}</Typography>
                                        <Typography className={styles.cardNick}>{work.nickname}</Typography>
                                        <Typography className={styles.cardText}>{work.content}</Typography>
                                        <Box className={styles.tagRow}>
                                            {work.tags.map(tag => (
                                                <Typography key={tag} className={styles.tag}>{tag}</Typography>
                                            ))}
                                        </Box>
                                        <Box className={styles.likeBtn}>
                                            <Favorite sx={{ fontSize: 14, color: '#E91E63' }}/>
                                            <Typography>{work.likes}</Typography>
                                        </Box>
                                    </Box>

                                    {/* 오른쪽 댓글 */}
                                    <Box className={styles.commentBox}>
                                        {dummyComments.map((c) => (
                                            <Box key={c.id} className={styles.commentItem}>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: 11, backgroundColor: '#C4956A' }}>
                                                    {c.nickname.charAt(0)}
                                                </Avatar>
                                                <Box>
                                                    <Typography className={styles.commentNick}>{c.nickname}</Typography>
                                                    <Typography className={styles.commentText}>{c.content}</Typography>
                                                </Box>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {tab === 1 && (
                        <Typography sx={{ p: 3, color: '#B08060' }}>도안 공유 준비 중...</Typography>
                    )}

                    {tab === 2 && (
                        <Typography sx={{ p: 3, color: '#B08060' }}>뜨개 지도 준비 중...</Typography>
                    )}
                    
                </Box>
                {/* 오른쪽 배너 */}
                <RightSidebar />
            </Box>
        </Box>
    </>
}

export default Main;