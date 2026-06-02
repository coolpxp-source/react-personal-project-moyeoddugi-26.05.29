import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, Tabs, Tab, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getPatterns } from '../../api/patterns';
import { getFollowCount, getFollowing } from '../../api/follows';
import { toggleLike, getLikes } from '../../api/likes';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import styles from './MyPage.module.css';
import RightSidebar from '../../components/RightSidebar';

const DIFFICULTY_COLORS = {
    '입문': { bg: '#E8F5E9', color: '#2E7D32' },
    '초급': { bg: '#E3F2FD', color: '#1565C0' },
    '중급': { bg: '#FFF3E0', color: '#E65100' },
    '고급': { bg: '#FCE4EC', color: '#C62828' },
};

function MyPage() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [tab, setTab] = useState(0);
    const [myPatterns, setMyPatterns] = useState([]);
    const [followCount, setFollowCount] = useState({ followerCount: 0, followingCount: 0 });
    const [likes, setLikes] = useState({});
    const [followingNews, setFollowingNews] = useState([]);

    useEffect(() => {
        const fetchAll = async () => {
            if (!user) return;

            // 내 도안 조회
            const patternData = await getPatterns();
            if (patternData.list) {
                const mine = patternData.list.filter(p => p.NICKNAME === user.userNickname);
                setMyPatterns(mine);
            }

            // 팔로워/팔로잉 수
            const countData = await getFollowCount(user.userId);
            if (countData.result) setFollowCount(countData);

            // 팔로잉 새 소식 (팔로잉 유저들의 최신 도안)
            const followingData = await getFollowing(user.userId);
            if (followingData.list && followingData.list.length > 0) {
                const followingIds = followingData.list.map(f => f.USER_ID);
                const allPatterns = await getPatterns();
                if (allPatterns.list) {
                    // 팔로잉 유저가 올린 도안만 필터
                    const news = allPatterns.list.filter(p =>
                        followingIds.includes(p.USER_ID)
                    ).slice(0, 5);
                    setFollowingNews(news);
                }
            }
        };
        fetchAll();
    }, []);

    // 좋아요 조회
    useEffect(() => {
        if (myPatterns.length === 0) return;
        const fetchLikes = async () => {
            for (const p of myPatterns) {
                const data = await getLikes('PATTERN', p.PATTERN_ID, user?.userEmail);
                if (data.result) {
                    setLikes(prev => ({
                        ...prev,
                        [p.PATTERN_ID]: { count: data.count, liked: data.liked }
                    }));
                }
            }
        };
        fetchLikes();
    }, [myPatterns.length]);

    const handleLike = async (e, patternId) => {
        e.stopPropagation();
        const data = await toggleLike(user?.userEmail, 'PATTERN', patternId);
        if (data.result) {
            setLikes(prev => ({
                ...prev,
                [patternId]: {
                    count: data.liked ? (prev[patternId]?.count || 0) + 1 : (prev[patternId]?.count || 1) - 1,
                    liked: data.liked
                }
            }));
        }
    };

    return (
        <Box className={styles.container}>
            {/* 프로필 카드 */}
            <Box className={styles.profileCard}>
                <Box className={styles.profileLeft}>
                    {user?.profileImg ? (
                        <img src={`http://localhost:3010${user.profileImg}`}
                            alt="profile"
                            className={styles.profileAvatar}
                        />
                    ) : (
                        <Box className={styles.profileAvatarDefault}>
                            <Typography className={styles.profileAvatarInitial}>
                                {user?.userNickname?.charAt(0)}
                            </Typography>
                        </Box>
                    )}
                    <Box className={styles.profileInfo}>
                        <Typography className={styles.nickname}>{user?.userNickname}</Typography>
                        <Typography className={styles.bio}>{user?.bio || '뜨개질을 좋아하는 뜨개인'}</Typography>
                    </Box>
                </Box>
                <Box className={styles.profileRight}>
                    <Button variant="outlined" className={styles.editBtn}
                        onClick={() => navigate('/mypage/edit')}>
                        프로필 수정
                    </Button>
                    <Box className={styles.statsRow}>
                        <Box className={styles.statItem}>
                            <Typography className={styles.statNum}>{followCount.followerCount}</Typography>
                            <Typography className={styles.statLabel}>팔로워</Typography>
                        </Box>
                        <Box className={styles.statItem}>
                            <Typography className={styles.statNum}>{followCount.followingCount}</Typography>
                            <Typography className={styles.statLabel}>팔로잉</Typography>
                        </Box>
                        <Box className={styles.statItem}>
                            <Typography className={styles.statNum}>{myPatterns.length}</Typography>
                            <Typography className={styles.statLabel}>내 도안</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* 탭 */}
            <Tabs value={tab} onChange={(e, val) => setTab(val)} className={styles.tabs}>
                <Tab label="전체" className={styles.tab}/>
                <Tab label="스크랩" className={styles.tab}/>
                <Tab label="내 게시글" className={styles.tab}/>
                <Tab label="팔로잉" className={styles.tab}/>
            </Tabs>

            {/* 탭 내용 */}
            <Box className={styles.tabContent}>
                {/* 전체 - 내 도안 */}
                {tab === 0 && (
                    <>
                    <Box className={styles.grid}>
                        {myPatterns.length === 0 ? (
                            <Typography className={styles.empty}>아직 올린 도안이 없어요 🧶</Typography>
                        ) : (
                            myPatterns.map(pattern => (
                                <Box key={pattern.PATTERN_ID} className={styles.card}
                                    onClick={() => navigate(`/patterns/${pattern.PATTERN_ID}`)}>
                                    <Box className={styles.cardImgWrapper}>
                                        {pattern.THUMBNAIL_IMG ? (
                                            <img src={`http://localhost:3010${pattern.THUMBNAIL_IMG}`}
                                                alt={pattern.TITLE} className={styles.cardImg}/>
                                        ) : (
                                            <Box className={styles.cardImgEmpty}>
                                                <Typography className={styles.noImg}>도안 이미지</Typography>
                                            </Box>
                                        )}
                                        <Box className={styles.cardOverlay}>
                                            <Typography className={styles.cardTitle}>{pattern.TITLE}</Typography>
                                            <Box className={styles.cardTags}>
                                                <Chip label={pattern.NEEDLE_TYPE} size="small"
                                                    style={{
                                                        backgroundColor: pattern.NEEDLE_TYPE === '코바늘' ? '#E8F5E9' : '#E3F2FD',
                                                        color: pattern.NEEDLE_TYPE === '코바늘' ? '#2E7D32' : '#1565C0',
                                                        fontSize: 10, height: 20
                                                    }}
                                                />
                                                {pattern.DIFFICULTY && (
                                                    <Chip label={pattern.DIFFICULTY} size="small"
                                                        style={{
                                                            backgroundColor: DIFFICULTY_COLORS[pattern.DIFFICULTY]?.bg,
                                                            color: DIFFICULTY_COLORS[pattern.DIFFICULTY]?.color,
                                                            fontSize: 10, height: 20
                                                        }}
                                                    />
                                                )}
                                                {/* ▼ 추가: 태그 */}
                                                {pattern.TAGS?.filter(tag => tag && tag.trim() !== '').map((tag, idx) => (
                                                    <Chip key={`${tag}-${idx}`} label={tag} size="small"
                                                        style={{ backgroundColor: '#F5EDD8', color: '#7B4F2E', fontSize: 10, height: 20 }}
                                                    />
                                                ))}
                                            </Box>
                                            <Box className={styles.cardFooter}>
                                                <Box className={styles.footerItem}
                                                    onClick={(e) => handleLike(e, pattern.PATTERN_ID)}>
                                                    {likes[pattern.PATTERN_ID]?.liked
                                                        ? <Favorite className={styles.likeIcon}/>
                                                        : <FavoriteBorder className={styles.likeIcon}/>
                                                    }
                                                    <Typography className={styles.footerText}>
                                                        {likes[pattern.PATTERN_ID]?.count || 0}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                    {/* ▼ 구분선 + 팔로잉 새 소식  */}
                    <Box className={styles.divider}/>
                        {/* 팔로잉 새 소식 */}
                        <Box className={styles.newsSection}>
                            <Typography className={styles.newsTitle}>팔로잉 새 소식</Typography>
                            {followingNews.length === 0 ? (
                                <Typography className={styles.newsEmpty}>새 소식이 없습니다 🧶</Typography>
                            ) : (
                                followingNews.map(pattern => (
                                    <Box key={pattern.PATTERN_ID} className={styles.newsItem}
                                        onClick={() => navigate(`/patterns/${pattern.PATTERN_ID}`)}>
                                        <Box className={styles.newsAvatar}>
                                            <Typography className={styles.newsAvatarInitial}>
                                                {pattern.NICKNAME?.charAt(0)}
                                            </Typography>
                                        </Box>
                                        <Box className={styles.newsContent}>
                                            <Box className={styles.newsHeader}>
                                                <Typography className={styles.newsNick}>{pattern.NICKNAME}</Typography>
                                                <Chip label="새 도안" size="small" className={styles.newChip}/>
                                            </Box>
                                            <Typography className={styles.newsDesc}>{pattern.TITLE}</Typography>
                                            <Typography className={styles.newsDate}>
                                                {new Date(pattern.CREATED_AT).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Button variant="outlined" className={styles.followBtn}
                                            onClick={(e) => e.stopPropagation()}>
                                            팔로잉
                                        </Button>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </>
                )}

                {tab === 1 && (
                    <Typography className={styles.empty}>스크랩한 도안이 없어요 🧶</Typography>
                )}

                {tab === 2 && (
                    <Typography className={styles.empty}>작성한 게시글이 없어요 🧶</Typography>
                )}

                {tab === 3 && (
                    <Typography className={styles.empty}>팔로잉 중인 유저가 없어요 🧶</Typography>
                )}
            </Box>

            <RightSidebar />
        </Box>
    );
}

export default MyPage;