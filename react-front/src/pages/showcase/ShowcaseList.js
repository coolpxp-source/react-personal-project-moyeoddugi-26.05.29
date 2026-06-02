import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getShowcaseList } from '../../api/showcase';
import { toggleLike, getLikes } from '../../api/likes';
import { getComments, createComment } from '../../api/comments';
import styles from './ShowcaseList.module.css';
import RightSidebar from '../../components/RightSidebar';
import AvatarItem from '../../components/AvatarItem'; // 프로필 이미지
import SearchInput from '../../components/SearchInput'; // 검색창

function ShowcaseList() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [posts, setPosts] = useState([]);
    const [likes, setLikes] = useState({});
    const [comments, setComments] = useState({});
    const [commentInput, setCommentInput] = useState({});
    const [search, setSearch] = useState('');           // ▼ 추가
    const [popularPosts, setPopularPosts] = useState([]); // ▼ 추가

    useEffect(() => {
        const fetchAll = async () => {
            const data = await getShowcaseList();
            if (data.list) setPosts(data.list);

            const popularRes = await fetch('http://localhost:3010/api/posts/showcase/popular');
            const popularData = await popularRes.json();
            if (popularData.list) setPopularPosts(popularData.list);
        };
        fetchAll();
    }, []);

    useEffect(() => {
        if (posts.length === 0) return;
        const fetchLikesAndComments = async () => {
            for (const post of posts) {
                const likeData = await getLikes('POST', post.POST_ID, user?.userEmail);
                if (likeData.result) {
                    setLikes(prev => ({
                        ...prev,
                        [post.POST_ID]: { count: likeData.count, liked: likeData.liked }
                    }));
                }
                const commentData = await getComments('POST', post.POST_ID);
                if (commentData.list) {
                    setComments(prev => ({ ...prev, [post.POST_ID]: commentData.list }));
                }
            }
        };
        fetchLikesAndComments();
    }, [posts.length]);

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

    const handleCommentSubmit = async (postId) => {
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
        }
    };

    // ▼ 추가
    const filteredPosts = posts.filter(p =>
        (p.TITLE || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.CONTENT || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.NICKNAME || '').toLowerCase().includes(search.toLowerCase())  // ▼ 추가
    );

    return (
        <Box className={styles.container}>
            <Box className={styles.header}>
                <Typography className={styles.pageTitle}>작품 자랑</Typography>
                <Button variant="contained" className={styles.writeBtn}
                    onClick={() => navigate('/works/write')}>
                    + 작품 올리기
                </Button>
            </Box>

            {/* ▼ 검색창 */}
            <Box className={styles.searchRow}>
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="제목, 내용, 닉네임 검색..."
                />
            </Box>

            {/* ▼ 인기 작품 - 검색 중엔 숨김 */}
            {popularPosts.length > 0 && search === '' && (
                <Box className={styles.popularSection}>
                    <Typography className={styles.popularTitle}>🔥 인기 작품</Typography>
                    <Box className={styles.popularRow}>
                        {popularPosts.map(post => (
                            <Box key={post.POST_ID} className={styles.popularCard}
                                onClick={() => navigate(`/works/${post.POST_ID}`)}>
                                {post.THUMBNAIL_IMG ? (
                                    <img src={`http://localhost:3010${post.THUMBNAIL_IMG}`}
                                        alt={post.TITLE} className={styles.popularImg}/>
                                ) : (
                                    <Box className={styles.popularImgEmpty}/>
                                )}
                                <Box className={styles.popularInfo}>
                                    <Typography className={styles.popularPostTitle}>{post.TITLE}</Typography>
                                    <Typography className={styles.popularLike}>♡ {post.LIKE_COUNT}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* ▼ posts.map → filteredPosts.map */}
            {filteredPosts.length === 0 ? (
                <Typography className={styles.empty}>
                    {search ? '검색 결과가 없어요 🧶' : '아직 자랑할 작품이 없어요 🧶'}
                </Typography>
            ) : (
                filteredPosts.map(post => (
                    <Box key={post.POST_ID} className={styles.postCard}>
                        {/* 좌측 이미지 */}
                        <Box className={styles.imageSection}>
                            {post.THUMBNAIL_IMG ? (
                                <img src={`http://localhost:3010${post.THUMBNAIL_IMG}`}
                                    alt={post.TITLE} className={styles.thumbnail}/>
                            ) : (
                                <Box className={styles.noImage}>
                                    <Typography className={styles.noImageText}>사진 없음</Typography>
                                </Box>
                            )}
                        </Box>

                        {/* 중앙 내용 */}
                        <Box className={styles.contentSection}>
                            <Typography className={styles.postTitle}>{post.TITLE}</Typography>
                            <Box className={styles.authorRow}>
                                <AvatarItem
                                    src={post.PROFILE_IMG}
                                    nickname={post.NICKNAME}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.USER_ID}`); }}
                                />
                                <Typography className={styles.nickname}
                                    onClick={(e) => { e.stopPropagation(); navigate(`/user/${post.USER_ID}`); }}
                                    style={{ cursor: 'pointer' }}>
                                    {post.NICKNAME}
                                </Typography>
                            </Box>
                            <Typography className={styles.content}>{post.CONTENT}</Typography>
                            <Box className={styles.bottomRow}>
                                <Box className={styles.likeRow} onClick={(e) => handleLike(e, post.POST_ID)}>
                                    {likes[post.POST_ID]?.liked
                                        ? <Favorite className={styles.likeIconActive}/>
                                        : <FavoriteBorder className={styles.likeIcon}/>
                                    }
                                    <Typography className={styles.likeCount}>
                                        칭찬해요 {likes[post.POST_ID]?.count || 0}
                                    </Typography>
                                </Box>
                                <Button variant="text" className={styles.detailBtn}
                                    onClick={() => navigate(`/works/${post.POST_ID}`)}>
                                    자세히 보기 →
                                </Button>
                            </Box>
                        </Box>

                        {/* 우측 댓글 */}
                        <Box className={styles.commentSection}>
                            <Box className={styles.commentList}>
                                {(comments[post.POST_ID] || []).slice(0, 3).map(c => (
                                    <Box key={c.COMMENT_ID} className={styles.commentItem}>
                                        <AvatarItem
                                            src={c.PROFILE_IMG}
                                            nickname={c.NICKNAME}
                                        />
                                        <Box>
                                            <Typography className={styles.commentNick}>{c.NICKNAME}</Typography>
                                            <Typography className={styles.commentText}>{c.CONTENT}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                            <Box className={styles.commentInputRow}>
                                <input className={styles.commentInput}
                                    placeholder="댓글 달기..."
                                    value={commentInput[post.POST_ID] || ''}
                                    onChange={(e) => setCommentInput(prev => ({
                                        ...prev, [post.POST_ID]: e.target.value
                                    }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.POST_ID)}
                                />
                                <button className={styles.commentBtn}
                                    onClick={() => handleCommentSubmit(post.POST_ID)}>
                                    등록
                                </button>
                            </Box>
                        </Box>
                    </Box>
                ))
            )}

            <RightSidebar />
        </Box>
    );
}

export default ShowcaseList;