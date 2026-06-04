import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, TextField, Button, Typography, Chip, Collapse } from '@mui/material';
import { Favorite, FavoriteBorder, ChatBubbleOutline, BookmarkBorder, Bookmark } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getPosts, getPopularPosts, getPopularTags } from '../../api/posts';
import { getComments, createComment, deleteComment, updateComment } from '../../api/comments';
import { toggleLike, getLikes } from '../../api/likes';
import { jwtDecode } from 'jwt-decode';
import styles from './PostList.module.css';
import RightSidebar from '../../components/RightSidebar';
import AvatarItem from '../../components/AvatarItem'; // 프로필 이미지
import SearchInput from '../../components/SearchInput';
import { toggleScrap, getScrap } from '../../api/scraps'; // 스크랩


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
    const user = token ? jwtDecode(token) : null;

    const [editComment, setEditComment] = useState({});
    const [editInput, setEditInput] = useState({});
    const [likes, setLikes] = useState({});
    const [tab, setTab] = useState(0);
    const [posts, setPosts] = useState([]);
    const [search, setSearch] = useState('');
    const [openComments, setOpenComments] = useState({});
    const [openReply, setOpenReply] = useState({});
    const [comments, setComments] = useState({});
    const [commentInput, setCommentInput] = useState({});
    const [replyInput, setReplyInput] = useState({});
    const [popularPosts, setPopularPosts] = useState([]);
    const [popularTags, setPopularTags] = useState([]);
    const [lightbox, setLightbox] = useState(null); // { images, idx }
    //피드 작성창 
    const [writeForm, setWriteForm] = useState({ boardType: '자유', content: '' });
    const [writeImages, setWriteImages] = useState([]);
    const [writePreviews, setWritePreviews] = useState([]);
    const [isWriting, setIsWriting] = useState(false);
    // 스크랩(북마크)
    const [scraps, setScraps] = useState({});
    // 게시글 수정 state
    const [editPost, setEditPost] = useState({});      // { postId: true/false }
    const [editPostInput, setEditPostInput] = useState({}); // { postId: content }

    // ▼ 교체: 게시글 + 좋아요 초기값 한번에
    useEffect(() => {
        const fetchAll = async () => {
            const data = await getPosts(BOARD_TYPES[tab]);
            if (data.list) {
                setPosts(data.list);
                const initialLikes = {};
                data.list.forEach(post => {
                    initialLikes[post.POST_ID] = {
                        count: post.LIKE_COUNT || 0,
                        liked: post.IS_LIKED > 0 // ▼ 한번에 처리
                    };
                });
                setLikes(initialLikes);
            }
        };
        fetchAll();
    }, [tab]);

    // ▼ 교체: 개인 좋아요 여부만 조회
    useEffect(() => {
        if (posts.length === 0) return;
        const fetchLikedStatus = async () => {
            for (const post of posts) {
                const data = await getLikes('POST', post.POST_ID, user?.userEmail);
                if (data.result) {
                    setLikes(prev => ({
                        ...prev,
                        [post.POST_ID]: {
                            count: prev[post.POST_ID]?.count || 0,
                            liked: data.liked
                        }
                    }));
                }
                const scrapData = await getScrap('POST', post.POST_ID, user?.userEmail);
                if (scrapData.result) {
                    setScraps(prev => ({ ...prev, [post.POST_ID]: scrapData.scrapped }));
                }
            }
        };
        fetchLikedStatus();
    }, [posts.length, tab]);

    useEffect(() => {
        const fetchSidebar = async () => {
            const popularData = await getPopularPosts();
            if (popularData.list) setPopularPosts(popularData.list);
            const tagData = await getPopularTags();
            if (tagData.list) setPopularTags(tagData.list);
        };
        fetchSidebar();
    }, []);

    const filteredPosts = posts.filter(post =>
        (post.TITLE || '').toLowerCase().includes(search.toLowerCase())
        || (post.CONTENT || '').toLowerCase().includes(search.toLowerCase())
    );

    // 피드에서 작성
    const handleWriteImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (writeImages.length + files.length > 3) {
            alert('이미지는 최대 3장까지 올릴 수 있어요.');
            return;
        }
        setWriteImages(prev => [...prev, ...files]);
        setWritePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    };

    const removeWriteImage = (idx) => {
        setWriteImages(prev => prev.filter((_, i) => i !== idx));
        setWritePreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleWriteSubmit = async () => {
        if (!writeForm.content.trim()) return alert('내용을 입력해주세요.');

        const formData = new FormData();
        formData.append('userEmail', user?.userEmail);
        formData.append('boardType', writeForm.boardType);
        formData.append('title', '');
        formData.append('content', writeForm.content);
        writeImages.forEach(img => formData.append('images', img));

        try {
            const res = await fetch('http://localhost:3010/api/posts', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.result) {
                setWriteForm({ boardType: '자유', content: '' });
                setWriteImages([]);
                setWritePreviews([]);
                setIsWriting(false);
                // 게시글 새로고침
                const newData = await getPosts(BOARD_TYPES[tab], user?.userEmail);
                if (newData.list) {
                    setPosts(newData.list);
                    const initialLikes = {};
                    newData.list.forEach(post => {
                        initialLikes[post.POST_ID] = {
                            count: post.LIKE_COUNT || 0,
                            liked: post.IS_LIKED > 0
                        };
                    });
                    setLikes(initialLikes);
                }
            }
        } catch (err) {
            console.error(err);
            alert('서버 오류가 발생했어요.');
        }
    };

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

    const toggleComment = async (e, postId) => {
        e.stopPropagation();
        const isOpening = !openComments[postId];
        setOpenComments(prev => ({ ...prev, [postId]: isOpening }));
        if (isOpening) {
            const data = await getComments('POST', postId);
            if (data.list) setComments(prev => ({ ...prev, [postId]: data.list }));
        }
    };

    const toggleReply = (e, commentId) => {
        e.stopPropagation();
        setOpenReply(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

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

    const handleReplySubmit = async (e, postId, parentId, inputKey, content, replyTo) => {
        e.stopPropagation();
        const finalContent = content ?? replyInput[inputKey]?.trim();
        if (!finalContent) return;
        const data = await createComment({
            userEmail: user?.userEmail,
            targetType: 'POST',
            targetId: postId,
            content: finalContent,
            parentId,
            replyTo: replyTo || null,
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

    const handleLike = async (e, postId) => {
        e.stopPropagation();
        const data = await toggleLike(user?.userEmail, 'POST', postId);
        if (data.result) {
            setLikes(prev => ({
                ...prev,
                [postId]: {
                    count: data.liked ? (prev[postId]?.count || 0) + 1 : (prev[postId]?.count || 1) - 1,
                    liked: data.liked
                }
            }));
        }
    };

    // handleScrap 함수
    const handleScrap = async (e, postId) => {
        e.stopPropagation();
        const data = await toggleScrap(user?.userEmail, 'POST', postId);
        if (data.result) {
            setScraps(prev => ({ ...prev, [postId]: data.scrapped }));
        }
    };

    // 게시글 수정 완료
    const handlePostEdit = async (postId) => {
        const content = editPostInput[postId]?.trim();
        if (!content) return;
        const res = await fetch(`http://localhost:3010/api/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: '', content }),
        });
        const data = await res.json();
        if (data.result) {
            setPosts(prev => prev.map(p =>
                p.POST_ID === postId ? { ...p, CONTENT: content } : p
            ));
            setEditPost(prev => ({ ...prev, [postId]: false }));
            alert('수정됐어요! 🧶'); // ▼ 추가
        }
    };

    // 게시글 삭제
    const handlePostDelete = async (postId) => {
        if (!window.confirm('게시글을 삭제할까요?')) return;
        const res = await fetch(`http://localhost:3010/api/posts/${postId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (data.result) {
            setPosts(prev => prev.filter(p => p.POST_ID !== postId));
            alert('삭제됐어요! 🧶');
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

            <Box className={styles.toolbar}>
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="검색어를 입력하세요"
                />
            </Box>

            <Box className={styles.mainLayout}>
                {/* 좌측 피드 */}
                <Box className={styles.feedSection}>
                    {/* 작성창 */}
                    <Box className={styles.writeCard}>
                        <Box className={styles.writeTop}>
                            <AvatarItem
                                src={user?.profileImg}
                                nickname={user?.userNickname}
                                size={42}
                            />
                            <textarea
                                className={styles.writeTextarea}
                                placeholder="무슨 생각을 하고 계신가요? 🧶"
                                value={writeForm.content}
                                onChange={(e) => setWriteForm(prev => ({ ...prev, content: e.target.value }))}
                                onFocus={() => setIsWriting(true)}
                                rows={isWriting ? 3 : 1}
                            />
                        </Box>

                        {/* 이미지 프리뷰 */}
                        {writePreviews.length > 0 && (
                            <Box className={styles.writePreviews}>
                                {writePreviews.map((src, idx) => (
                                    <Box key={idx} className={styles.writePreviewItem}>
                                        <img src={src} alt={`preview-${idx}`} className={styles.writePreviewImg}/>
                                        <button className={styles.writeRemoveBtn}
                                            onClick={() => removeWriteImage(idx)}>✕</button>
                                    </Box>
                                ))}
                            </Box>
                        )}

                        {/* 하단 액션 */}
                        {isWriting && (
                            <Box className={styles.writeBottom}>
                                <Box className={styles.writeActions}>
                                    {/* 게시판 선택 */}
                                    <select className={styles.boardSelect}
                                        value={writeForm.boardType}
                                        onChange={(e) => setWriteForm(prev => ({ ...prev, boardType: e.target.value }))}>
                                        {['자유', '질문', '모여떠요', '떠주세요', '떠드려요'].map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>

                                    {/* 이미지 추가 */}
                                    {writeImages.length < 3 && (
                                        <button className={styles.writeImgBtn}
                                            onClick={() => document.getElementById('writeImage').click()}>
                                            🖼 사진
                                        </button>
                                    )}
                                    <input id="writeImage" type="file" accept="image/*" multiple
                                        style={{ display: 'none' }} onChange={handleWriteImageChange}/>
                                </Box>

                                <Box className={styles.writeBtns}>
                                    <button className={styles.writeCancelBtn}
                                        onClick={() => {
                                            setIsWriting(false);
                                            setWriteForm({ boardType: '자유', content: '' });
                                            setWriteImages([]);
                                            setWritePreviews([]);
                                        }}>취소</button>
                                    <button className={styles.writeSubmitBtn}
                                        onClick={handleWriteSubmit}>등록</button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                    <Box className={styles.feed}>
                        {filteredPosts.length === 0 ? (
                            <Typography className={styles.empty}>게시글이 없어요 🧶</Typography>
                        ) : (
                            filteredPosts.map((post) => (
                                <Box key={post.POST_ID} className={styles.feedCard}>
                                    <Box className={styles.cardLayout}>
                                        {/* 좌측 아바타 */}
                                        <AvatarItem
                                            src={post.PROFILE_IMG}
                                            nickname={post.NICKNAME}
                                            size={42}
                                            onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.USER_ID}`); }}
                                        />
                                        {/* 우측 내용 */}
                                        <Box className={styles.cardRight}>
                                            <Box className={styles.cardHeader}>
                                                <Typography className={styles.nickname}
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.USER_ID}`); }}
                                                    style={{ cursor: 'pointer' }}>
                                                    {post.NICKNAME}
                                                </Typography>
                                                <Typography className={styles.date}>
                                                    {new Date(post.CREATED_AT).toLocaleDateString()}
                                                </Typography>
                                                <Chip label={post.BOARD_TYPE} size="small"
                                                    style={{
                                                        backgroundColor: BADGE_COLORS[post.BOARD_TYPE]?.bg,
                                                        color: BADGE_COLORS[post.BOARD_TYPE]?.color,
                                                        fontSize: 11, height: 20, marginLeft: 'auto'
                                                    }}
                                                />
                                                {/* ▼ 본인 게시글만 수정/삭제 표시 */}
                                                {post.NICKNAME === user?.userNickname && (
                                                    <Box className={styles.postActions}>
                                                        <button className={styles.postActionBtn}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditPost(prev => ({ ...prev, [post.POST_ID]: true }));
                                                                setEditPostInput(prev => ({ ...prev, [post.POST_ID]: post.CONTENT }));
                                                            }}>수정</button>
                                                        <button className={styles.postActionBtn}
                                                            onClick={(e) => { e.stopPropagation(); handlePostDelete(post.POST_ID); }}>
                                                            삭제</button>
                                                    </Box>
                                                )}
                                            </Box>

                                            {post.TITLE && (
                                                <Typography className={styles.postTitle}>{post.TITLE}</Typography>
                                            )}
                                            {/* 내용 post content */}
                                            {editPost[post.POST_ID] ? (
                                                <Box className={styles.postEditBox}>
                                                    <textarea
                                                        className={styles.postEditTextarea}
                                                        value={editPostInput[post.POST_ID] || ''}
                                                        onChange={(e) => setEditPostInput(prev => ({
                                                            ...prev, [post.POST_ID]: e.target.value
                                                        }))}
                                                    />
                                                    <Box className={styles.postEditBtns}>
                                                        <button className={styles.postEditSubmit}
                                                            onClick={() => handlePostEdit(post.POST_ID)}>완료</button>
                                                        <button className={styles.postEditCancel}
                                                            onClick={() => setEditPost(prev => ({ ...prev, [post.POST_ID]: false }))}>
                                                            취소</button>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Typography className={styles.postContent}>
                                                    {post.CONTENT?.length > 150
                                                        ? post.CONTENT.slice(0, 150) + '...'
                                                        : post.CONTENT}
                                                </Typography>
                                            )}

                                            {/* ▼ 이미지 여러장 표시 */}
                                            {post.IMAGES && post.IMAGES.length > 0 && (
                                                <Box className={styles.postImgGrid} style={{
                                                    gridTemplateColumns: post.IMAGES.length === 1 ? '1fr'
                                                        : post.IMAGES.length === 2 ? 'repeat(2, 1fr)'
                                                        : post.IMAGES.length === 3 ? 'repeat(2, 1fr)'
                                                        : 'repeat(2, 1fr)'
                                                }}>
                                                    {post.IMAGES.map((img, idx) => (
                                                        <img key={idx}
                                                            src={`http://localhost:3010${img}`}
                                                            alt={`post-img-${idx}`}
                                                            className={styles.postImgItem}
                                                            style={{
                                                                // 3장일 때 첫번째 이미지 full width
                                                                gridColumn: post.IMAGES.length === 3 && idx === 0 ? '1 / -1' : 'auto',
                                                                height: post.IMAGES.length === 1 ? '400px'  /* ▼ 1장: 크게 */
                                                                : post.IMAGES.length === 2 ? '300px'  /* ▼ 2장: 중간 */
                                                                : post.IMAGES.length === 3 && idx === 0 ? '280px'  /* ▼ 3장 첫번째 */
                                                                : '200px'  /* ▼ 3장 나머지 */
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setLightbox({ images: post.IMAGES, idx });
                                                            }}
                                                        />
                                                    ))}
                                                </Box>
                                            )}

                                            {/* 라이트박스 */}
                                            {lightbox && (
                                                <Box className={styles.lightbox} onClick={() => setLightbox(null)}>
                                                    <Box className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                                                        <img src={`http://localhost:3010${lightbox.images[lightbox.idx]}`}
                                                            alt="lightbox" className={styles.lightboxImg}/>
                                                        <Box className={styles.lightboxNav}>
                                                            {lightbox.images.length > 1 && lightbox.images.map((_, i) => (
                                                                <Box key={i}
                                                                    className={`${styles.lightboxDot} ${i === lightbox.idx ? styles.lightboxDotActive : ''}`}
                                                                    onClick={() => setLightbox(prev => ({ ...prev, idx: i }))}
                                                                />
                                                            ))}
                                                        </Box>
                                                        {lightbox.idx > 0 && (
                                                            <button className={styles.lightboxPrev}
                                                                onClick={() => setLightbox(prev => ({ ...prev, idx: prev.idx - 1 }))}>
                                                                ‹
                                                            </button>
                                                        )}
                                                        {lightbox.idx < lightbox.images.length - 1 && (
                                                            <button className={styles.lightboxNext}
                                                                onClick={() => setLightbox(prev => ({ ...prev, idx: prev.idx + 1 }))}>
                                                                ›
                                                            </button>
                                                        )}
                                                        <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>✕</button>
                                                    </Box>
                                                </Box>
                                            )}

                                            <Box className={styles.cardFooter}>
                                                <Box className={styles.footerItem}
                                                    onClick={(e) => handleLike(e, post.POST_ID)}>
                                                    {likes[post.POST_ID]?.liked
                                                        ? <Favorite className={styles.iconLikeActive}/>
                                                        : <FavoriteBorder className={styles.iconLike}/>
                                                    }
                                                    <Typography className={styles.footerText}>
                                                        {likes[post.POST_ID]?.count || 0}
                                                    </Typography>
                                                </Box>
                                                <Box className={styles.footerItem}
                                                    onClick={(e) => toggleComment(e, post.POST_ID)}>
                                                    <ChatBubbleOutline className={styles.iconChat}
                                                        style={{ color: openComments[post.POST_ID] ? '#7B4F2E' : '#B08060' }}/>
                                                    <Typography className={styles.footerText}>
                                                        {comments[post.POST_ID]?.length ?? post.COMMENT_COUNT ?? 0}
                                                    </Typography>
                                                </Box>
                                                {scraps[post.POST_ID]
                                                    ? <Bookmark className={styles.iconBookmarkActive}
                                                        onClick={(e) => handleScrap(e, post.POST_ID)}/>
                                                    : <BookmarkBorder className={styles.iconBookmark}
                                                        onClick={(e) => handleScrap(e, post.POST_ID)}/>
                                                }
                                            </Box>

                                            {/* 댓글 토글 */}
                                            <Collapse in={openComments[post.POST_ID]}>
                                                <Box className={styles.commentArea}>
                                                    {comments[post.POST_ID]?.filter(c => !c.PARENT_ID).length > 0 ? (
                                                        comments[post.POST_ID].filter(c => !c.PARENT_ID).map((c) => (
                                                            <Box key={c.COMMENT_ID} className={styles.commentItem}
                                                                onClick={(e) => e.stopPropagation()}>
                                                                <AvatarItem
                                                                    src={c.PROFILE_IMG}
                                                                    nickname={c.NICKNAME}
                                                                    size={22}
                                                                />
                                                                <Box className={styles.commentBody}>
                                                                    <Box className={styles.commentHeader}>
                                                                        <Typography className={styles.commentNick}>{c.NICKNAME}</Typography>
                                                                        <Typography className={styles.commentDate}>
                                                                            {new Date(c.CREATED_AT).toLocaleDateString()}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Typography className={styles.commentText}>{c.CONTENT}</Typography>

                                                                    {c.NICKNAME === user?.userNickname && (
                                                                        <Box className={styles.commentActions}>
                                                                            <Button size="small" className={styles.actionBtn}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditComment(prev => ({ ...prev, [c.COMMENT_ID]: true }));
                                                                                    setEditInput(prev => ({ ...prev, [c.COMMENT_ID]: c.CONTENT }));
                                                                                }}>수정</Button>
                                                                            <Button size="small" className={styles.actionBtn}
                                                                                onClick={(e) => handleDelete(e, post.POST_ID, c.COMMENT_ID)}>삭제</Button>
                                                                        </Box>
                                                                    )}

                                                                    <Collapse in={editComment[c.COMMENT_ID]}>
                                                                        <Box className={styles.replyInput} onClick={(e) => e.stopPropagation()}>
                                                                            <TextField fullWidth size="small"
                                                                                value={editInput[c.COMMENT_ID] || ''}
                                                                                onChange={(e) => setEditInput(prev => ({ ...prev, [c.COMMENT_ID]: e.target.value }))}
                                                                            />
                                                                            <Button variant="contained" className={styles.commentBtn}
                                                                                onClick={(e) => handleEditSubmit(e, post.POST_ID, c.COMMENT_ID)}>완료</Button>
                                                                            <Button size="small" className={styles.actionBtn}
                                                                                onClick={(e) => { e.stopPropagation(); setEditComment(prev => ({ ...prev, [c.COMMENT_ID]: false })); }}>취소</Button>
                                                                        </Box>
                                                                    </Collapse>

                                                                    <Button size="small" className={styles.replyBtn}
                                                                        onClick={(e) => toggleReply(e, c.COMMENT_ID)}>답글 달기</Button>

                                                                    <Collapse in={openReply[c.COMMENT_ID]}>
                                                                        <Box className={styles.replyInput} onClick={(e) => e.stopPropagation()}>
                                                                            <TextField fullWidth size="small"
                                                                                placeholder="답글을 입력하세요"
                                                                                value={replyInput[c.COMMENT_ID] || ''}
                                                                                onChange={(e) => setReplyInput(prev => ({ ...prev, [c.COMMENT_ID]: e.target.value }))}
                                                                            />
                                                                            <Button variant="contained" className={styles.commentBtn}
                                                                                onClick={(e) => handleReplySubmit(e, post.POST_ID, c.COMMENT_ID, c.COMMENT_ID)}>등록</Button>
                                                                        </Box>
                                                                    </Collapse>

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
                                                                                <AvatarItem
                                                                                    src={reply.PROFILE_IMG}
                                                                                    nickname={reply.NICKNAME}
                                                                                    size={22}
                                                                                />
                                                                                <Box className={styles.fullWidth}>
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

                                                                                    {reply.NICKNAME === user?.userNickname && (
                                                                                        <Box className={styles.commentActions}>
                                                                                            <Button size="small" className={styles.actionBtn}
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    setEditComment(prev => ({ ...prev, [reply.COMMENT_ID]: true }));
                                                                                                    setEditInput(prev => ({ ...prev, [reply.COMMENT_ID]: reply.CONTENT }));
                                                                                                }}>수정</Button>
                                                                                            <Button size="small" className={styles.actionBtn}
                                                                                                onClick={(e) => handleDelete(e, post.POST_ID, reply.COMMENT_ID)}>삭제</Button>
                                                                                        </Box>
                                                                                    )}

                                                                                    <Collapse in={editComment[reply.COMMENT_ID]}>
                                                                                        <Box className={styles.replyInput} onClick={(e) => e.stopPropagation()}>
                                                                                            <TextField fullWidth size="small"
                                                                                                value={editInput[reply.COMMENT_ID] || ''}
                                                                                                onChange={(e) => setEditInput(prev => ({ ...prev, [reply.COMMENT_ID]: e.target.value }))}
                                                                                            />
                                                                                            <Button variant="contained" className={styles.commentBtn}
                                                                                                onClick={(e) => handleEditSubmit(e, post.POST_ID, reply.COMMENT_ID)}>완료</Button>
                                                                                            <Button size="small" className={styles.actionBtn}
                                                                                                onClick={(e) => { e.stopPropagation(); setEditComment(prev => ({ ...prev, [reply.COMMENT_ID]: false })); }}>취소</Button>
                                                                                        </Box>
                                                                                    </Collapse>

                                                                                    <Button size="small" className={styles.replyBtn}
                                                                                        onClick={(e) => toggleReply(e, reply.COMMENT_ID)}>답글 달기</Button>

                                                                                    <Collapse in={openReply[reply.COMMENT_ID]}>
                                                                                        <Box className={styles.replyInput} onClick={(e) => e.stopPropagation()}>
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
                                                                                                }}>등록</Button>
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

                                                    <Box className={styles.commentInput}>
                                                        <TextField fullWidth size="small"
                                                            placeholder="댓글을 입력하세요"
                                                            value={commentInput[post.POST_ID] || ''}
                                                            onChange={(e) => setCommentInput(prev => ({ ...prev, [post.POST_ID]: e.target.value }))}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <Button variant="contained" className={styles.commentBtn}
                                                            onClick={(e) => handleCommentSubmit(e, post.POST_ID)}>등록</Button>
                                                    </Box>
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>

                {/* 우측 위젯 */}
                <Box className={styles.sideWidget}>
                    <Box className={styles.widgetCard}>
                        <Typography className={styles.widgetTitle}>🔥 인기 게시글</Typography>
                        <Box className={styles.widgetList}>
                            {popularPosts.length === 0 ? (
                                <Typography className={styles.widgetEmpty}>아직 없어요</Typography>
                            ) : (
                                popularPosts.map((p, idx) => (
                                    <Box key={p.POST_ID} className={styles.popularItem}>
                                        <Typography className={styles.popularIdx}>{idx + 1}</Typography>
                                        <Box className={styles.popularContent}>
                                            <Typography className={styles.popularTitle}>{p.TITLE}</Typography>
                                            <Chip label={p.BOARD_TYPE} size="small"
                                                style={{
                                                    backgroundColor: BADGE_COLORS[p.BOARD_TYPE]?.bg,
                                                    color: BADGE_COLORS[p.BOARD_TYPE]?.color,
                                                    fontSize: 10, height: 18
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>
                    </Box>

                    <Box className={styles.widgetCard}>
                        <Typography className={styles.widgetTitle}>🏷 인기 태그</Typography>
                        <Box className={styles.tagCloud}>
                            {popularTags.length === 0 ? (
                                <Typography className={styles.widgetEmpty}>아직 없어요</Typography>
                            ) : (
                                popularTags.map((tag, idx) => (
                                    <Chip key={idx} label={`#${tag.TAG_NAME}`} size="small"
                                        className={styles.tagChip}
                                    />
                                ))
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            <RightSidebar />
        </Box>
    );
}

export default PostList;
