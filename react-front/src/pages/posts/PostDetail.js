import React, { useState } from 'react';
import { Box, Typography, Avatar, Chip, Button, TextField, Collapse } from '@mui/material';
import { Favorite, FavoriteBorder, ChatBubbleOutline, Bookmark, BookmarkBorder } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './PostDetail.module.css';

// 더미 데이터
const dummyPost = {
    POST_ID: 1,
    BOARD_TYPE: '모여떠요',
    TITLE: '오랜만에 하는 뜨개질...',
    NICKNAME: '작성자',
    CREATED_AT: '2026-05-30',
    CONTENT: '오랜만에 하는 뜨개질... 너무 집중해서 3시간 동안 떠버렸더니 손이 마비 되는거 같아요 ㅎㄷㄷ 그래도 결과물은 굿 ~',
    LIKES: 30,
    BOOKMARKS: 3,
};

const dummyComments = [
    { id: 1, nickname: '김으시오', content: '무슨 실 사용하셨나요??', date: '2주전' },
    { id: 2, nickname: '푸르시오', content: 'ㅎㅎ 너무 이뻐용', date: '1주전' },
];

function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [openReply, setOpenReply] = useState({});

    const toggleReply = (commentId) => {
        setOpenReply(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.card}>
                {/* 뱃지 */}
                <Box className={styles.badgeRow}>
                    <Chip label={dummyPost.BOARD_TYPE} size="small"
                        sx={{ backgroundColor: '#E8F5E9', color: '#2E7D32', fontSize: 11, height: 22 }}
                    />
                </Box>

                {/* 제목 */}
                <Typography className={styles.title}>{dummyPost.TITLE}</Typography>

                {/* 작성자 */}
                <Box className={styles.authorRow}>
                    <Avatar sx={{ width: 32, height: 32, backgroundColor: '#C4956A', fontSize: 13 }}>
                        {dummyPost.NICKNAME.charAt(0)}
                    </Avatar>
                    <Typography className={styles.nickname}>{dummyPost.NICKNAME}</Typography>
                    <Typography className={styles.date}>| {dummyPost.CREATED_AT}</Typography>
                </Box>

                {/* 내용 */}
                <Typography className={styles.content}>{dummyPost.CONTENT}</Typography>

                {/* 좋아요/댓글/북마크 */}
                <Box className={styles.footer}>
                    <Box className={styles.footerItem} onClick={() => setLiked(!liked)}>
                        {liked
                            ? <Favorite sx={{ fontSize: 18, color: '#E0A0A0' }}/>
                            : <FavoriteBorder sx={{ fontSize: 18, color: '#E0A0A0' }}/>
                        }
                        <Typography className={styles.footerText}>{dummyPost.LIKES}</Typography>
                    </Box>
                    <Box className={styles.footerItem} onClick={() => setShowComments(!showComments)}>
                        <ChatBubbleOutline sx={{ 
                            fontSize: 18, cursor: 'pointer',
                            color: showComments ? '#7B4F2E' : '#B08060'
                        }}/>
                        <Typography className={styles.footerText}>{dummyComments.length}</Typography>
                    </Box>
                    <Box onClick={() => setBookmarked(!bookmarked)}>
                        {bookmarked
                            ? <Bookmark sx={{ fontSize: 18, color: '#B08060', cursor: 'pointer' }}/>
                            : <BookmarkBorder sx={{ fontSize: 18, color: '#B08060', cursor: 'pointer' }}/>
                        }
                    </Box>
                    <Typography className={styles.footerText}>북마크 {dummyPost.BOOKMARKS}</Typography>
                </Box>

                {/* 댓글 영역 */}
                <Collapse in={showComments}>
                    <Box className={styles.commentSection}>
                        {dummyComments.map((c) => (
                            <Box key={c.id} className={styles.commentItem}>
                                <Avatar sx={{ width: 28, height: 28, backgroundColor: '#C4956A', fontSize: 12 }}>
                                    {c.nickname.charAt(0)}
                                </Avatar>
                                <Box className={styles.commentBody}>
                                    <Box className={styles.commentHeader}>
                                        <Typography className={styles.commentNick}>{c.nickname}</Typography>
                                        <Typography className={styles.commentDate}>{c.date}</Typography>
                                    </Box>
                                    <Typography className={styles.commentText}>{c.content}</Typography>
                                    <Button size="small" className={styles.replyBtn}
                                        onClick={() => toggleReply(c.id)}>
                                        답글 달기
                                    </Button>
                                    <Collapse in={openReply[c.id]}>
                                        <Box className={styles.replyInput}>
                                            <TextField fullWidth size="small" placeholder="답글을 입력하세요"/>
                                            <Button variant="contained" className={styles.submitBtn}>등록</Button>
                                        </Box>
                                    </Collapse>
                                </Box>
                            </Box>
                        ))}

                        {/* 댓글 입력 */}
                        <Box className={styles.commentInput}>
                            <TextField fullWidth size="small" placeholder="댓글을 입력하세요"/>
                            <Button variant="contained" className={styles.submitBtn}>등록</Button>
                        </Box>
                    </Box>
                </Collapse>
            </Box>
        </Box>
    );
}

export default PostDetail;