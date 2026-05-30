import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, TextField, Button, Typography, Avatar, Chip, InputAdornment, Collapse } from '@mui/material';
import { Search, Favorite, FavoriteBorder, ChatBubbleOutline, Bookmark, BookmarkBorder } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../../api/posts';
import styles from './PostList.module.css';
import RightSidebar from '../../components/RightSidebar'; // 우측 배너

const BOARD_TYPES = ['전체', '자유', '질문', '모여떠요', '떠주세요', '떠드려요'];

const BADGE_COLORS = {
    '자유':    { bg: '#E8F4FD', color: '#1976D2' },
    '질문':    { bg: '#FFF3E0', color: '#E65100' },
    '모여떠요': { bg: '#E8F5E9', color: '#2E7D32' },
    '떠주세요': { bg: '#FCE4EC', color: '#C62828' },
    '떠드려요': { bg: '#EDE7F6', color: '#4527A0' },
    '작품자랑': { bg: '#FFF8E1', color: '#F57F17' },
};

// 상단에 더미 배너 데이터 추가
const dummyBanners = [
    { id: 1, title: '🧶 실 할인 이벤트', desc: '이번 주 실 30% 할인', color: '#E8D5B7' },
    { id: 2, title: '🪡 바늘 신상 입고', desc: '대바늘/코바늘 신제품', color: '#DEC9A8' },
    { id: 3, title: '📦 무료 배송', desc: '3만원 이상 무료 배송', color: '#EDE0C8' },
];

// 더미 댓글 데이터
const dummyComments = {
    1: [
        { id: 1, nickname: '김으시오', content: '무슨 실 사용하셨나요??', date: '2주전' },
        { id: 2, nickname: '푸르시오', content: 'ㅎㅎ 너무 이뻐용', date: '1주전' },
    ],
};

function PostList() {
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [posts, setPosts] = useState([]);
    const [search, setSearch] = useState('');
    // 댓글 토글 상태 (게시글 ID별로 관리)
    const [openComments, setOpenComments] = useState({});
    // 답글 토글 상태
    const [openReply, setOpenReply] = useState({});

    const fetchPosts = async (boardType) => {
        const data = await getPosts(boardType);
        if(data.list) setPosts(data.list);
    };

    useEffect(() => {
        fetchPosts(BOARD_TYPES[tab]);
    }, [tab]);

    const filteredPosts = posts.filter(post =>
        post.TITLE.toLowerCase().includes(search.toLowerCase())
    );

    const toggleComment = (e, postId) => {
        e.stopPropagation(); // 카드 클릭 이벤트 막기
        setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    };

    // 답글 토글
    const toggleReply = (e, commentId) => {
        e.stopPropagation();
        setOpenReply(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    return (
        
        <Box className={styles.container}>
            <Tabs value={tab} onChange={(e, val) => setTab(val)}
                className={styles.tabs} variant="scrollable" scrollButtons="auto">
                {BOARD_TYPES.map((type) => (
                    <Tab key={type} label={type} className={styles.tab}/>
                ))}
            </Tabs>
            {/* 탭, 툴바 */}
            <Box className={styles.toolbar}>
                <TextField size="small" placeholder="검색어를 입력하세요"
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    className={styles.searchInput}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#B08060', fontSize: 18 }}/>
                            </InputAdornment>
                        )
                    }}
                />
            </Box>
            <Box className={styles.mainLayout}>
                <Box className={styles.feedSection}>
                    <Box className={styles.feed}>
                        {filteredPosts.length === 0 ? (
                            <Typography className={styles.empty}>게시글이 없어요 🧶</Typography>
                        ) : (
                            filteredPosts.map((post) => (
                                <Box key={post.POST_ID} className={styles.feedCard}>

                                {/* 1. 뱃지 */}
                                <Box className={styles.badgeRow}>
                                    <Chip label={post.BOARD_TYPE} size="small"
                                        style={{
                                            backgroundColor: BADGE_COLORS[post.BOARD_TYPE]?.bg,
                                            color: BADGE_COLORS[post.BOARD_TYPE]?.color,
                                            fontSize: 11, height: 22
                                        }}
                                    />
                                </Box>

                                {/* 2. 제목 - ▼ 수정: navigate 제거 */}
                                <Typography className={styles.postTitle}>
                                    {post.TITLE}
                                </Typography>

                                {/* 3. 작성자 */}
                                <Box className={styles.authorRow}>
                                    <Avatar sx={{ width: 28, height: 28, backgroundColor: '#C4956A', fontSize: 12 }}>
                                        {post.NICKNAME?.charAt(0)}
                                    </Avatar>
                                    <Typography className={styles.nickname}>{post.NICKNAME}</Typography>
                                    <Typography className={styles.date}>
                                        {new Date(post.CREATED_AT).toLocaleDateString()}
                                    </Typography>
                                </Box>

                                {/* 4. 내용 - ▼ 수정: navigate 제거 */}
                                <Box className={styles.contentOnly}>
                                    <Typography className={styles.postContent}>
                                        {post.CONTENT?.length > 150
                                            ? post.CONTENT.slice(0, 150) + '...'
                                            : post.CONTENT}
                                    </Typography>
                                </Box>

                                {/* 5. 하단 - 좋아요, 댓글, 북마크 나란히 */}
                                <Box className={styles.cardFooter}>
                                    <Box className={styles.footerItem}
                                        onClick={(e) => e.stopPropagation()}>
                                        <FavoriteBorder sx={{ fontSize: 18, color: '#E0A0A0', cursor: 'pointer' }}/>
                                        <Typography className={styles.footerText}>0</Typography>
                                    </Box>
                                    <Box className={styles.footerItem}
                                        onClick={(e) => toggleComment(e, post.POST_ID)}>
                                        <ChatBubbleOutline sx={{ 
                                            fontSize: 18, cursor: 'pointer',
                                            color: openComments[post.POST_ID] ? '#7B4F2E' : '#B08060'
                                        }}/>
                                        <Typography className={styles.footerText}>
                                            {dummyComments[post.POST_ID]?.length || 0}
                                        </Typography>
                                    </Box>
                                    <BookmarkBorder sx={{ fontSize: 18, color: '#B08060', cursor: 'pointer' }}
                                        onClick={(e) => e.stopPropagation()}/>
                                </Box>

                                {/* 댓글 토글 */}
                                <Collapse in={openComments[post.POST_ID]}>
                                    <Box className={styles.commentArea}>
                                        {/* ▼ 추가: 댓글 목록 */}
                                        {dummyComments[post.POST_ID]?.length > 0 ? (
                                            dummyComments[post.POST_ID].map((c) => (
                                                <Box key={c.id} className={styles.commentItem}
                                                    onClick={(e) => e.stopPropagation()}>
                                                    <Avatar sx={{ width: 26, height: 26, backgroundColor: '#C4956A', fontSize: 11 }}>
                                                        {c.nickname.charAt(0)}
                                                    </Avatar>
                                                    <Box className={styles.commentBody}>
                                                        <Box className={styles.commentHeader}>
                                                            <Typography className={styles.commentNick}>{c.nickname}</Typography>
                                                            <Typography className={styles.commentDate}>{c.date}</Typography>
                                                        </Box>
                                                        <Typography className={styles.commentText}>{c.content}</Typography>
                                                        {/* 답글 달기 */}
                                                        <Button size="small" className={styles.replyBtn}
                                                            onClick={(e) => toggleReply(e, c.id)}>
                                                            답글 달기
                                                        </Button>
                                                        <Collapse in={openReply[c.id]}>
                                                            <Box className={styles.replyInput}
                                                                onClick={(e) => e.stopPropagation()}>
                                                                <TextField fullWidth size="small"
                                                                    placeholder="답글을 입력하세요"/>
                                                                <Button variant="contained" className={styles.commentBtn}>
                                                                    등록
                                                                </Button>
                                                            </Box>
                                                        </Collapse>
                                                    </Box>
                                                </Box>
                                            ))
                                        ) : (
                                            <Typography className={styles.noComment}>
                                                아직 댓글이 없어요. 첫 댓글을 달아보세요! 🧶
                                            </Typography>
                                        )}

                                        {/* 댓글 입력 */}
                                        <Box className={styles.commentInput}>
                                            <TextField fullWidth size="small"
                                                placeholder="댓글을 입력하세요"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <Button variant="contained" className={styles.commentBtn}
                                                onClick={(e) => e.stopPropagation()}>
                                                등록
                                            </Button>
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </Box>
            {/* 오른쪽 배너 */}
            <RightSidebar />
        </Box>
    );
}

export default PostList;