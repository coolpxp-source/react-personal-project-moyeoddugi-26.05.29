import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, TextField, Button, Typography, Avatar, Chip, InputAdornment, Collapse } from '@mui/material';
import { Search, Favorite, FavoriteBorder, ChatBubbleOutline, BookmarkBorder } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getPosts } from '../../api/posts';
import { getComments, createComment, deleteComment, updateComment } from '../../api/comments'; // ▼ 추가
import { toggleLike, getLikes } from '../../api/likes'; // ▼ 추가
import { jwtDecode } from 'jwt-decode'; // ▼ 추가
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

function PostList() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null; // ▼ 추가
    const [editComment, setEditComment] = useState({}); // ▼ 추가: 수정 상태 (commentId별로 관리)
    const [editInput, setEditInput] = useState({});
    const [likes, setLikes] = useState({}); // ▼ 추가: 좋아요 데이터 (postId별로 관리)

    const [tab, setTab] = useState(0);
    const [posts, setPosts] = useState([]);
    const [search, setSearch] = useState('');
    // 댓글 토글 상태 (게시글 ID별로 관리)
    const [openComments, setOpenComments] = useState({});
    // 답글 토글 상태
    const [openReply, setOpenReply] = useState({});
    // ▼ 추가: 댓글 데이터 (postId별로 관리)
    const [comments, setComments] = useState({});
    // ▼ 추가: 댓글 입력값 (postId별로 관리)
    const [commentInput, setCommentInput] = useState({});
    // ▼ 추가: 답글 입력값 (commentId별로 관리)
    const [replyInput, setReplyInput] = useState({});

    const fetchPosts = async (boardType) => {
        const data = await getPosts(boardType);
        if(data.list) setPosts(data.list);
    };

    useEffect(() => {
        fetchPosts(BOARD_TYPES[tab]);
    }, [tab]);

    // 좋아요 조회
    useEffect(() => {
        if (posts.length === 0) return;
        const fetchLikes = async () => {
            for (const post of posts) {
                const data = await getLikes('POST', post.POST_ID, user?.userEmail);
                if (data.result) {
                    setLikes(prev => ({
                        ...prev,
                        [post.POST_ID]: { count: data.count, liked: data.liked }
                    }));
                }
            }
        };
        fetchLikes();
    }, [posts.length, tab]); // ▼ 수정: posts 대신 posts.length, tab으로

    const filteredPosts = posts.filter(post =>
        post.TITLE.toLowerCase().includes(search.toLowerCase())
    );

    // ▼ 추가: 댓글 수정
    const handleEditSubmit = async (e, postId, commentId) => {
        e.stopPropagation();
        const content = editInput[commentId]?.trim();
        if (!content) return;
        const data = await updateComment(commentId, content);
        if (data.result) {
            const updated = await getComments('POST', postId);
            if (updated.list) setComments(prev => ({ ...prev, [postId]: updated.list }));
            setEditComment(prev => ({ ...prev, [commentId]: false }));
            setEditInput(prev => ({ ...prev, [commentId]: '' }));
        } else {
            alert(data.message);
        }
    };

    // ▼ 추가: 댓글 삭제
    const handleDelete = async (e, postId, commentId) => {
        e.stopPropagation();
        if (!window.confirm('댓글을 삭제할까요?')) return;
        const data = await deleteComment(commentId);
        if (data.result) {
            const updated = await getComments('POST', postId);
            if (updated.list) setComments(prev => ({ ...prev, [postId]: updated.list }));
        } else {
            alert(data.message);
        }
    };

    // ▼ 수정: 댓글 토글 시 API 호출
    const toggleComment = async (e, postId) => {
        e.stopPropagation();
        const isOpening = !openComments[postId];
        setOpenComments(prev => ({ ...prev, [postId]: isOpening }));
        // ▼ 수정: 열 때마다 최신 댓글 조회
        if (isOpening) {
            const data = await getComments('POST', postId);
            if (data.list) {
                console.log('user.userName:', user?.userName); // ▼ 추가
                console.log('첫번째 댓글 NICKNAME:', data.list[0]?.NICKNAME); // ▼ 추가
                setComments(prev => ({ ...prev, [postId]: data.list }));
            }
        }
    };

    // 답글 토글
    const toggleReply = (e, commentId) => {
        e.stopPropagation();
        setOpenReply(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    // ▼ 추가: 댓글 등록
    const handleCommentSubmit = async (e, postId) => {
        e.stopPropagation();
        const content = commentInput[postId]?.trim();
        if (!content) return;
        const data = await createComment({
            userEmail: user?.userEmail,
            targetType: 'POST',
            targetId: postId,
            content,
        });
        if (data.result) {
            const updated = await getComments('POST', postId);
            if (updated.list) setComments(prev => ({ ...prev, [postId]: updated.list }));
            setCommentInput(prev => ({ ...prev, [postId]: '' }));
        } else {
            alert(data.message);
        }
    };

    // ▼ 추가: 답글 등록
    const handleReplySubmit = async (e, postId, parentId, inputKey, content, replyTo) => { // ▼ replyTo 추가
        e.stopPropagation();
        const finalContent = content ?? replyInput[inputKey]?.trim();
        if (!finalContent) return;
        const data = await createComment({
            userEmail: user?.userEmail,
            targetType: 'POST',
            targetId: postId,
            content: finalContent,
            parentId,
            replyTo: replyTo || null, // ▼ 추가
        });
        if (data.result) {
            const updated = await getComments('POST', postId);
            if (updated.list) setComments(prev => ({ ...prev, [postId]: updated.list }));
            setReplyInput(prev => ({ ...prev, [inputKey]: '' }));
            setOpenReply(prev => ({ ...prev, [inputKey]: false }));
        } else {
            alert(data.message);
        }
    };

    // ▼ 추가: 좋아요 토글
    const handleLike = async (e, postId) => {
        e.stopPropagation();
        const data = await toggleLike(user?.userEmail, 'POST', postId);
        if (data.result) {
            setLikes(prev => ({
                ...prev,
                [postId]: {
                    count: data.liked
                        ? (prev[postId]?.count || 0) + 1
                        : (prev[postId]?.count || 1) - 1,
                    liked: data.liked
                }
            }));
        }
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

                                {/* 2. 제목 */}
                                <Typography className={styles.postTitle}>
                                    {post.TITLE}
                                </Typography>

                                {/* 3. 작성자 */}
                                <Box className={styles.authorRow}>
                                    <Avatar className={styles.avatarLarge}>
                                        {post.NICKNAME?.charAt(0)}
                                    </Avatar>
                                    <Typography className={styles.nickname}>{post.NICKNAME}</Typography>
                                    <Typography className={styles.date}>
                                        {new Date(post.CREATED_AT).toLocaleDateString()}
                                    </Typography>
                                </Box>

                                {/* 4. 내용 */}
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
                                        onClick={(e) => handleLike(e, post.POST_ID)}>
                                            {/* ▼ 수정: 좋아요 여부에 따라 아이콘 변경 */}
                                            {likes[post.POST_ID]?.liked
                                                ? <Favorite sx={{ fontSize: 18, color: '#E0A0A0', cursor: 'pointer' }}/>
                                                : <FavoriteBorder sx={{ fontSize: 18, color: '#E0A0A0', cursor: 'pointer' }}/>
                                            }
                                            <Typography className={styles.footerText}>
                                                {likes[post.POST_ID]?.count || 0}
                                            </Typography>
                                    </Box>
                                    <Box className={styles.footerItem}
                                        onClick={(e) => toggleComment(e, post.POST_ID)}>
                                        <ChatBubbleOutline className={styles.iconChat}
                                            style={{ color: openComments[post.POST_ID] ? '#7B4F2E' : '#B08060' }}/>
                                        {/* ▼ 수정: 토글 전에도 댓글 수 보이게 */}
                                        <Typography className={styles.footerText}>
                                            {comments[post.POST_ID]?.length ?? post.COMMENT_COUNT ?? 0}
                                        </Typography>
                                    </Box>
                                    <BookmarkBorder className={styles.iconBookmark}
                                        onClick={(e) => e.stopPropagation()}/>
                                </Box>

                                {/* 댓글 토글 */}
                                <Collapse in={openComments[post.POST_ID]}>
                                    <Box className={styles.commentArea}>
                                        {/* ▼ 수정: 실제 댓글 데이터 */}
                                        {comments[post.POST_ID]?.filter(c => !c.PARENT_ID).length > 0 ? (
                                            comments[post.POST_ID].filter(c => !c.PARENT_ID).map((c) => (
                                                <Box key={c.COMMENT_ID} className={styles.commentItem}
                                                    onClick={(e) => e.stopPropagation()}>
                                                    <Avatar className={styles.avatarMedium}>
                                                        {c.NICKNAME?.charAt(0)}
                                                    </Avatar>
                                                    <Box className={styles.commentBody}>
                                                        <Box className={styles.commentHeader}>
                                                            <Typography className={styles.commentNick}>{c.NICKNAME}</Typography>
                                                            <Typography className={styles.commentDate}>
                                                                {new Date(c.CREATED_AT).toLocaleDateString()}
                                                            </Typography>
                                                        </Box>
                                                        <Typography className={styles.commentText}>{c.CONTENT}</Typography>
                                                        
                                                        {/* ▼ 추가: 수정/삭제 버튼 - 본인 댓글만 */}
                                                        {c.NICKNAME === user?.userNickname  && (
                                                            <Box className={styles.commentActions}>
                                                                <Button size="small" className={styles.actionBtn}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditComment(prev => ({ ...prev, [c.COMMENT_ID]: true }));
                                                                        setEditInput(prev => ({ ...prev, [c.COMMENT_ID]: c.CONTENT }));
                                                                    }}>
                                                                    수정
                                                                </Button>
                                                                <Button size="small" className={styles.actionBtn}
                                                                    onClick={(e) => handleDelete(e, post.POST_ID, c.COMMENT_ID)}>
                                                                    삭제
                                                                </Button>
                                                            </Box>
                                                        )}

                                                        {/* ▼ 추가: 수정 입력창 */}
                                                        <Collapse in={editComment[c.COMMENT_ID]}>
                                                            <Box className={styles.replyInput} onClick={(e) => e.stopPropagation()}>
                                                                <TextField fullWidth size="small"
                                                                    value={editInput[c.COMMENT_ID] || ''}
                                                                    onChange={(e) => setEditInput(prev => ({ ...prev, [c.COMMENT_ID]: e.target.value }))}
                                                                />
                                                                <Button variant="contained" className={styles.commentBtn}
                                                                    onClick={(e) => handleEditSubmit(e, post.POST_ID, c.COMMENT_ID)}>
                                                                    완료
                                                                </Button>
                                                                <Button size="small" className={styles.actionBtn}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditComment(prev => ({ ...prev, [c.COMMENT_ID]: false }));
                                                                    }}>
                                                                    취소
                                                                </Button>
                                                            </Box>
                                                        </Collapse>

                                                        {/* 답글 달기 */}
                                                        <Button size="small" className={styles.replyBtn}
                                                            onClick={(e) => toggleReply(e, c.COMMENT_ID)}>
                                                            답글 달기
                                                        </Button>
                                                        <Collapse in={openReply[c.COMMENT_ID]}>
                                                            <Box className={styles.replyInput}
                                                                onClick={(e) => e.stopPropagation()}>
                                                                <TextField fullWidth size="small"
                                                                    placeholder="답글을 입력하세요"
                                                                    value={replyInput[c.COMMENT_ID] || ''}
                                                                    onChange={(e) => setReplyInput(prev => ({ ...prev, [c.COMMENT_ID]: e.target.value }))}
                                                                />
                                                                <Button variant="contained" className={styles.commentBtn}
                                                                    onClick={(e) => handleReplySubmit(e, post.POST_ID, c.COMMENT_ID, c.COMMENT_ID)}>
                                                                    등록
                                                                </Button>
                                                            </Box>
                                                        </Collapse>

                                                        {/* 대댓글 목록 - REPLY_TO 기준으로 정렬 */}
                                                        {(() => {
                                                            const replies = comments[post.POST_ID]?.filter(r => r.PARENT_ID === c.COMMENT_ID) || [];
                                                            const ordered = [];
                                                            replies.filter(r => !r.REPLY_TO).forEach(r => {
                                                                ordered.push(r);
                                                                replies.filter(sub => sub.REPLY_TO === r.COMMENT_ID).forEach(sub => ordered.push(sub));
                                                            });
                                                            return ordered.map((reply) => (
                                                                <Box key={reply.COMMENT_ID}
                                                                    className={reply.REPLY_TO ? styles.replyItemNested : styles.replyItem}>
                                                                    <Avatar className={styles.avatarSmall}>
                                                                        {reply.NICKNAME?.charAt(0)}
                                                                    </Avatar>
                                                                    <Box sx={{ width: '100%' }}>
                                                                        <Typography className={styles.commentNick}>{reply.NICKNAME}</Typography>
                                                                        <Typography className={styles.commentText}>
                                                                            {reply.CONTENT?.startsWith('@') ? (
                                                                                <>
                                                                                    <span style={{ color: '#7B4F2E', fontWeight: 600 }}>
                                                                                        {reply.CONTENT.split(' ')[0]}
                                                                                    </span>
                                                                                    {' ' + reply.CONTENT.split(' ').slice(1).join(' ')}
                                                                                </>
                                                                            ) : reply.CONTENT}
                                                                        </Typography>
                                                                        
                                                                        {/* ▼ 추가: 대댓글 수정/삭제 */}
                                                                        {reply.NICKNAME === user?.userNickname && (
                                                                            <Box className={styles.commentActions}>
                                                                                <Button size="small" className={styles.actionBtn}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditComment(prev => ({ ...prev, [reply.COMMENT_ID]: true }));
                                                                                        setEditInput(prev => ({ ...prev, [reply.COMMENT_ID]: reply.CONTENT }));
                                                                                    }}>
                                                                                    수정
                                                                                </Button>
                                                                                <Button size="small" className={styles.actionBtn}
                                                                                    onClick={(e) => handleDelete(e, post.POST_ID, reply.COMMENT_ID)}>
                                                                                    삭제
                                                                                </Button>
                                                                            </Box>
                                                                        )}

                                                                        {/* ▼ 추가: 대댓글 수정 입력창 */}
                                                                        <Collapse in={editComment[reply.COMMENT_ID]}>
                                                                            <Box className={styles.replyInput} onClick={(e) => e.stopPropagation()}>
                                                                                <TextField fullWidth size="small"
                                                                                    value={editInput[reply.COMMENT_ID] || ''}
                                                                                    onChange={(e) => setEditInput(prev => ({ ...prev, [reply.COMMENT_ID]: e.target.value }))}
                                                                                />
                                                                                <Button variant="contained" className={styles.commentBtn}
                                                                                    onClick={(e) => handleEditSubmit(e, post.POST_ID, reply.COMMENT_ID)}>
                                                                                    완료
                                                                                </Button>
                                                                                <Button size="small" className={styles.actionBtn}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditComment(prev => ({ ...prev, [reply.COMMENT_ID]: false }));
                                                                                    }}>
                                                                                    취소
                                                                                </Button>
                                                                            </Box>
                                                                        </Collapse>

                                                                        <Button size="small" className={styles.replyBtn}
                                                                            onClick={(e) => toggleReply(e, reply.COMMENT_ID)}>
                                                                            답글 달기
                                                                        </Button>
                                                                        <Collapse in={openReply[reply.COMMENT_ID]}>
                                                                            <Box className={styles.replyInput}
                                                                                onClick={(e) => e.stopPropagation()}>
                                                                                <TextField fullWidth size="small"
                                                                                    placeholder="답글을 입력하세요"
                                                                                    value={replyInput[reply.COMMENT_ID] || ''}
                                                                                    onChange={(e) => setReplyInput(prev => ({ ...prev, [reply.COMMENT_ID]: e.target.value }))}
                                                                                />
                                                                                <Button variant="contained" className={styles.commentBtn}
                                                                                    onClick={(e) => {
                                                                                        const currentInput = replyInput[reply.COMMENT_ID] || '';
                                                                                        const finalContent = currentInput.startsWith(`@${reply.NICKNAME}`)
                                                                                            ? currentInput
                                                                                            : `@${reply.NICKNAME} ${currentInput}`;
                                                                                        handleReplySubmit(e, post.POST_ID, c.COMMENT_ID, reply.COMMENT_ID, finalContent.trim(), reply.COMMENT_ID);
                                                                                    }}>
                                                                                    등록
                                                                                </Button>
                                                                            </Box>
                                                                        </Collapse>
                                                                    </Box>
                                                                </Box>
                                                            ));
                                                        })()}
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
                                                value={commentInput[post.POST_ID] || ''}
                                                onChange={(e) => setCommentInput(prev => ({ ...prev, [post.POST_ID]: e.target.value }))}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <Button variant="contained" className={styles.commentBtn}
                                                onClick={(e) => handleCommentSubmit(e, post.POST_ID)}>
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