import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar, Button, TextField, InputAdornment } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getShowcaseList } from '../../api/showcase';
import { toggleLike, getLikes } from '../../api/likes';
import { getComments, createComment } from '../../api/comments';
import styles from './ShowcaseList.module.css';
import RightSidebar from '../../components/RightSidebar';

function ShowcaseList() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [posts, setPosts] = useState([]);
    const [likes, setLikes] = useState({});
    const [comments, setComments] = useState({});
    const [commentInput, setCommentInput] = useState({});

    useEffect(() => {
        const fetchAll = async () => {
            const data = await getShowcaseList();
            if (data.list) setPosts(data.list);
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

    return (
        <Box className={styles.container}>
            <Box className={styles.header}>
                <Typography className={styles.pageTitle}>작품 자랑</Typography>
                <Button variant="contained" className={styles.writeBtn}
                    onClick={() => navigate('/showcase/write')}>
                    + 작품 올리기
                </Button>
            </Box>

            {posts.length === 0 ? (
                <Typography className={styles.empty}>아직 자랑할 작품이 없어요 🧶</Typography>
            ) : (
                posts.map(post => (
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
                                {post.PROFILE_IMG ? (
                                    <img src={`http://localhost:3010${post.PROFILE_IMG}`}
                                        alt="profile" className={styles.authorAvatar}/>
                                ) : (
                                    <Box className={styles.authorAvatarDefault}>
                                        <Typography className={styles.authorAvatarInitial}>
                                            {post.NICKNAME?.charAt(0)}
                                        </Typography>
                                    </Box>
                                )}
                                <Typography className={styles.nickname}>{post.NICKNAME}</Typography>
                            </Box>
                            <Typography className={styles.content}>{post.CONTENT}</Typography>
                            <Box className={styles.likeRow} onClick={(e) => handleLike(e, post.POST_ID)}>
                                {likes[post.POST_ID]?.liked
                                    ? <Favorite className={styles.likeIconActive}/>
                                    : <FavoriteBorder className={styles.likeIcon}/>
                                }
                                <Typography className={styles.likeCount}>
                                    {likes[post.POST_ID]?.count || 0}
                                </Typography>
                            </Box>
                        </Box>

                        {/* 우측 댓글 */}
                        <Box className={styles.commentSection}>
                            <Box className={styles.commentList}>
                                {(comments[post.POST_ID] || []).slice(0, 3).map(c => (
                                    <Box key={c.COMMENT_ID} className={styles.commentItem}>
                                        {c.PROFILE_IMG ? (
                                            <img src={`http://localhost:3010${c.PROFILE_IMG}`}
                                                alt="profile" className={styles.commentAvatar}/>
                                        ) : (
                                            <Box className={styles.commentAvatarDefault}>
                                                <Typography className={styles.commentAvatarInitial}>
                                                    {c.NICKNAME?.charAt(0)}
                                                </Typography>
                                            </Box>
                                        )}
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