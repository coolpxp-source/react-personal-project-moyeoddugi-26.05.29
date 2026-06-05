import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Tabs, Tab, Chip } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUser, getUserPatterns, getUserPosts } from '../../api/users';
import {getFollowStatus, toggleFollow, getFollowing } from '../../api/follows';
import { getPatterns } from '../../api/patterns';
import { toggleLike, getLikes } from '../../api/likes';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import styles from './UserPage.module.css';
import RightSidebar from '../../components/RightSidebar';
import AvatarItem from '../../components/AvatarItem'; // 프로필 이미지
import { getScraps } from '../../api/scraps'; // 스크랩
import { createDM } from '../../api/chat'; // 일대일 디엠방 만들기

const DIFFICULTY_COLORS = {
    '입문': { bg: '#E8F5E9', color: '#2E7D32' },
    '초급': { bg: '#E3F2FD', color: '#1565C0' },
    '중급': { bg: '#FFF3E0', color: '#E65100' },
    '고급': { bg: '#FCE4EC', color: '#C62828' },
};

const BADGE_COLORS = {
    '자유':    { bg: '#E8F4FD', color: '#1976D2' },
    '질문':    { bg: '#FFF3E0', color: '#E65100' },
    '모여떠요': { bg: '#E8F5E9', color: '#2E7D32' },
    '떠주세요': { bg: '#FCE4EC', color: '#C62828' },
    '떠드려요': { bg: '#EDE7F6', color: '#4527A0' },
};

function UserPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const me = token ? jwtDecode(token) : null;
    const isMe = me?.userId === Number(userId);

    const [userInfo, setUserInfo] = useState(null);
    const [tab, setTab] = useState(0);
    const [patterns, setPatterns] = useState([]);
    const [posts, setPosts] = useState([]);
    const [following, setFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [likes, setLikes] = useState({});
    const [followingNews, setFollowingNews] = useState([]);
    const [scrappedPatterns, setScrappedPatterns] = useState([]); // 도안 스크랩
    const [scrappedPosts, setScrappedPosts] = useState([]); // 게시글 스크랩
    const [showAllPatterns, setShowAllPatterns] = useState(false); // 스크랩 페이지에서 보이는 최대 갯수 제한
    const [showAllPosts, setShowAllPosts] = useState(false);

    useEffect(() => {
        const fetchAll = async () => {
            const userData = await getUser(userId);
            if (userData.result) {
                setUserInfo(userData.data);
                setFollowerCount(userData.data.FOLLOWER_COUNT);
            }

            const patternData = await getUserPatterns(userId);
            if (patternData.result) setPatterns(patternData.list);

            const postData = await getUserPosts(userId);
            if (postData.result) setPosts(postData.list);

            if (me) {
                const followData = await getFollowStatus(me.userEmail, userId);
                if (followData.result) setFollowing(followData.following);
            }
            // 내 페이지면 팔로잉 새 소식도 조회
            if (isMe) {
                const followingData = await getFollowing(userId);
                if (followingData.list && followingData.list.length > 0) {
                    const followingIds = followingData.list.map(f => f.USER_ID);
                    const allPatterns = await getPatterns();
                    if (allPatterns.list) {
                        const news = allPatterns.list.filter(p =>
                            followingIds.includes(p.USER_ID)
                        ).slice(0, 5);
                        setFollowingNews(news);
                    }
                }
                const scrapData = await getScraps(me.userEmail, 'PATTERN');
                if (scrapData.list) setScrappedPatterns(scrapData.list);
            }
            if (isMe) {
                const scrapPostData = await getScraps(me.userEmail, 'POST');
                if (scrapPostData.list) setScrappedPosts(scrapPostData.list);
            }
        };
        fetchAll();
    }, [userId, isMe, me]);

    // 좋아요 조회
    useEffect(() => {
        if (patterns.length === 0) return;
        const fetchLikes = async () => {
            await Promise.all(patterns.map(async (p) => {
                const data = await getLikes('PATTERN', p.PATTERN_ID, me?.userEmail);
                if (data.result) {
                    setLikes(prev => ({
                        ...prev,
                        [p.PATTERN_ID]: { count: data.count, liked: data.liked }
                    }));
                }
            }));
        };
        fetchLikes();
    }, [patterns.length, me?.userEmail]);

    const handleFollow = async () => {
        const data = await toggleFollow(me?.userEmail, userId);
        if (data.result) {
            setFollowing(data.following);
            setFollowerCount(prev => data.following ? prev + 1 : prev - 1);
        }
    };

    const handleLike = async (e, patternId) => {
        e.stopPropagation();
        const data = await toggleLike(me?.userEmail, 'PATTERN', patternId);
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

    if (!userInfo) return (
        <Box className={styles.container}>
            <Typography className={styles.loading}>불러오는 중... 🧶</Typography>
        </Box>
    );

    // DM 방 생성 추가
    const handleDM = async () => {
        const data = await createDM(me?.userEmail, userId);
        if (data.result) {
            navigate('/chat', { state: { roomId: data.roomId } });
        }
    };

    return (
        <Box className={styles.container}>
            {/* 프로필 카드 */}
            <Box className={styles.profileCard}>
                <Box className={styles.profileLeft}>
                    <AvatarItem
                        src={userInfo.PROFILE_IMG}
                        nickname={userInfo.NICKNAME}
                        size={64}
                    />
                    <Box className={styles.profileInfo}>
                        <Typography className={styles.nickname}>{userInfo.NICKNAME}</Typography>
                        <Typography className={styles.bio}>
                            {userInfo.BIO || '뜨개질을 좋아하는 뜨개인'}
                        </Typography>
                    </Box>
                </Box>
                <Box className={styles.profileRight}>
                    {isMe ? (
                        <Button variant="outlined" className={styles.editBtn}
                            onClick={() => navigate('/mypage/edit')}>
                            프로필 수정
                        </Button>
                    ) : (
                        <Box className={styles.btnRow}>
                            <Button variant={following ? 'outlined' : 'contained'}
                                className={following ? styles.unfollowBtn : styles.followBtn}
                                onClick={handleFollow}>
                                {following ? '팔로잉' : '팔로우'}
                            </Button>
                            <Button className={styles.dmBtn} onClick={handleDM}>
                                💬 DM
                            </Button>
                        </Box>
                    )}
                    <Box className={styles.statsRow}>
                        <Box className={styles.statItem}>
                            <Typography className={styles.statNum}>{followerCount}</Typography>
                            <Typography className={styles.statLabel}>팔로워</Typography>
                        </Box>
                        <Box className={styles.statItem}>
                            <Typography className={styles.statNum}>{userInfo.FOLLOWING_COUNT}</Typography>
                            <Typography className={styles.statLabel}>팔로잉</Typography>
                        </Box>
                        <Box className={styles.statItem}>
                            <Typography className={styles.statNum}>{userInfo.PATTERN_COUNT}</Typography>
                            <Typography className={styles.statLabel}>도안</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* 탭 - 내 페이지면 스크랩/내게시글 탭 추가 */}
            <Tabs value={tab} onChange={(e, val) => setTab(val)} className={styles.tabs}>
                <Tab label="도안" className={styles.tab}/>
                <Tab label="게시글" className={styles.tab}/>
                {isMe && <Tab label="스크랩" className={styles.tab}/>}
                {isMe && <Tab label="팔로잉 새 소식" className={styles.tab}/>}
            </Tabs>

            {/* 도안 탭 */}
            {tab === 0 && (
                <Box className={styles.grid}>
                    {patterns.length === 0 ? (
                        <Typography className={styles.empty}>올린 도안이 없어요 🧶</Typography>
                    ) : (
                        patterns.map(pattern => (
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
                                            {pattern.TAGS?.filter(t => t && t.trim()).map((tag, idx) => (
                                                <Chip key={idx} label={tag} size="small"
                                                    style={{ backgroundColor: '#F5EDD8', color: '#7B4F2E', fontSize: 10, height: 20 }}
                                                />
                                            ))}
                                        </Box>
                                        <Box className={styles.cardFooter}>
                                            <Box className={styles.footerItem}
                                                onClick={(e) => handleLike(e, pattern.PATTERN_ID)}>
                                                {likes[pattern.PATTERN_ID]?.liked
                                                    ? <Favorite className={styles.likeIconActive}/>
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
            )}

            {/* 게시글 탭 */}
            {tab === 1 && (
                <Box className={styles.postList}>
                    {posts.length === 0 ? (
                        <Typography className={styles.empty}>올린 게시글이 없어요 🧶</Typography>
                    ) : (
                        posts.map(post => (
                            <Box key={post.POST_ID} className={styles.postCard}>
                                <Box className={styles.postHeader}>
                                    {post.BOARD_TYPE && (
                                        <Chip label={post.BOARD_TYPE} size="small"
                                            style={{
                                                backgroundColor: BADGE_COLORS[post.BOARD_TYPE]?.bg,
                                                color: BADGE_COLORS[post.BOARD_TYPE]?.color,
                                                fontSize: 11, height: 20
                                            }}
                                        />
                                    )}
                                    <Typography className={styles.postDate}>
                                        {new Date(post.CREATED_AT).toLocaleDateString()}
                                    </Typography>
                                </Box>
                                {post.TITLE && (
                                    <Typography className={styles.postTitle}>{post.TITLE}</Typography>
                                )}
                                <Typography className={styles.postContent}>
                                    {post.CONTENT?.length > 150
                                        ? post.CONTENT.slice(0, 150) + '...'
                                        : post.CONTENT}
                                </Typography>
                                {post.IMAGES?.length > 0 && (
                                    <Box className={styles.postImgGrid} style={{
                                        gridTemplateColumns: post.IMAGES.length === 1 ? '1fr'
                                            : post.IMAGES.length === 2 ? 'repeat(2, 1fr)'
                                            : 'repeat(2, 1fr)'
                                    }}>
                                        {post.IMAGES.map((img, idx) => (
                                            <img key={idx}
                                                src={`http://localhost:3010${img}`}
                                                alt={`post-img-${idx}`}
                                                className={styles.postImgItem}
                                                style={{
                                                    gridColumn: post.IMAGES.length === 3 && idx === 0 ? '1 / -1' : 'auto',
                                                    height: post.IMAGES.length === 1 ? '400px'
                                                        : post.IMAGES.length === 2 ? '300px'
                                                        : post.IMAGES.length === 3 && idx === 0 ? '280px'
                                                        : '200px'
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}
                                <Box className={styles.postFooter}>
                                    <Typography className={styles.postStat}>♡ {post.LIKE_COUNT || 0}</Typography>
                                    <Typography className={styles.postStat}>💬 {post.COMMENT_COUNT || 0}</Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            )}
            {/* 스크랩 탭 */}
            {isMe && tab === 2 && (
                <Box className={styles.postList}>
                    {/* 스크랩 도안 */}
                    <Typography className={styles.sectionTitle}>📌 스크랩한 도안</Typography>
                    {scrappedPatterns.length === 0 ? (
                        <Typography className={styles.empty}>스크랩한 도안이 없어요 🧶</Typography>
                    ) : (
                        <>
                            <Box className={styles.grid}>
                                {(showAllPatterns ? scrappedPatterns : scrappedPatterns.slice(0, 6)).map(pattern => (
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
                                                <Box className={styles.cardMeta}>
                                                    <AvatarItem src={pattern.PROFILE_IMG} nickname={pattern.NICKNAME} size={20}/>
                                                    <Typography className={styles.cardNick}>{pattern.NICKNAME}</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                            {scrappedPatterns.length > 6 && (
                                <Button variant="text" className={styles.moreBtn}
                                    onClick={() => setShowAllPatterns(prev => !prev)}>
                                    {showAllPatterns ? '접기 ↑' : `더보기 (+${scrappedPatterns.length - 6}) ↓`}
                                </Button>
                            )}
                        </>
                    )}

                    {/* 스크랩 게시글 */}
                    <Typography className={styles.sectionTitleMargin}>📌 스크랩한 게시글</Typography>
                    {scrappedPosts.length === 0 ? (
                        <Typography className={styles.empty}>스크랩한 게시글이 없어요 🧶</Typography>
                    ) : (
                        <>
                            {(showAllPosts ? scrappedPosts : scrappedPosts.slice(0, 3)).map(post => (
                                <Box key={post.POST_ID} className={styles.postCard}
                                    onClick={() => navigate('/community')}>
                                    <Box className={styles.postHeader}>
                                        {post.BOARD_TYPE && (
                                            <Chip label={post.BOARD_TYPE} size="small"
                                                style={{
                                                    backgroundColor: BADGE_COLORS[post.BOARD_TYPE]?.bg,
                                                    color: BADGE_COLORS[post.BOARD_TYPE]?.color,
                                                    fontSize: 11, height: 20
                                                }}
                                            />
                                        )}
                                        <Typography className={styles.postDate}>
                                            {new Date(post.CREATED_AT).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                    {post.TITLE && (
                                        <Typography className={styles.postTitle}>{post.TITLE}</Typography>
                                    )}
                                    <Typography className={styles.postContent}>
                                        {post.CONTENT?.length > 150 ? post.CONTENT.slice(0, 150) + '...' : post.CONTENT}
                                    </Typography>
                                </Box>
                            ))}
                            {scrappedPosts.length > 3 && (
                                <Button variant="text" className={styles.moreBtn}
                                    onClick={() => setShowAllPosts(prev => !prev)}>
                                    {showAllPosts ? '접기 ↑' : `더보기 (+${scrappedPosts.length - 3}) ↓`}
                                </Button>
                            )}
                        </>
                    )}
                </Box>
            )}

            {/* 팔로잉 새 소식 탭 */}
            {isMe && tab === 3 && (
                <Box className={styles.newsSection}>
                    <Typography className={styles.newsTitle}>팔로잉 새 소식</Typography>
                    {followingNews.length === 0 ? (
                        <Typography className={styles.newsEmpty}>새 소식이 없습니다 🧶</Typography>
                    ) : (
                        followingNews.map(pattern => (
                            <Box key={pattern.PATTERN_ID} className={styles.newsItem}
                                onClick={() => navigate(`/patterns/${pattern.PATTERN_ID}`)}>
                                <AvatarItem
                                    src={pattern.PROFILE_IMG}
                                    nickname={pattern.NICKNAME}
                                    size={36}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/user/${pattern.USER_ID}`); }}
                                />
                                <Box className={styles.newsContent}>
                                    <Box className={styles.newsHeader}>
                                        <Typography className={styles.newsNick}>{pattern.NICKNAME}</Typography>
                                        <Chip label="새 도안" size="small"
                                            style={{ backgroundColor: '#FCE4EC', color: '#C62828', fontSize: 10, height: 18 }}
                                        />
                                    </Box>
                                    <Typography className={styles.newsDesc}>{pattern.TITLE}</Typography>
                                    <Typography className={styles.newsDate}>
                                        {new Date(pattern.CREATED_AT).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            )}

            <RightSidebar />
        </Box>
    );
}

export default UserPage;