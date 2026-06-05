import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getShowcase } from '../../api/showcase';
import { getComments, createComment, deleteComment, updateComment } from '../../api/comments';
import { toggleLike, getLikes } from '../../api/likes';
import styles from './ShowcaseDetail.module.css';
import RightSidebar from '../../components/RightSidebar';
import AvatarItem from '../../components/AvatarItem'; // 프로필 이미지

function ShowcaseDetail() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [post, setPost] = useState(null);
    const [images, setImages] = useState([]);
    const [currentImg, setCurrentImg] = useState(0);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [editComment, setEditComment] = useState({});
    const [editInput, setEditInput] = useState({});
    const [openReply, setOpenReply] = useState({});
    const [replyInput, setReplyInput] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const fetchAll = async () => {
            const data = await getShowcase(postId);
            if (data.result) {
                setPost(data.data);
                setImages(data.images || []);
            }
            const likeData = await getLikes('POST', postId, user?.userEmail);
            if (likeData.result) {
                setLiked(likeData.liked);
                setLikeCount(likeData.count);
            }
            const commentData = await getComments('POST', postId);
            if (commentData.list) setComments(commentData.list);
        };
        fetchAll();
    }, [postId]);

    const handleLike = async () => {
        if (!requireLogin()) return;
        const data = await toggleLike(user?.userEmail, 'POST', postId);
        if (data.result) {
            setLiked(data.liked);
            setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
        }
    };

    const handleCommentSubmit = async () => {
        if (!requireLogin()) return;
        if (!commentInput.trim()) return;
        const data = await createComment({
            userEmail: user?.userEmail,
            targetType: 'POST',
            targetId: postId,
            content: commentInput,
        });
        if (data.result) {
            const updated = await getComments('POST', postId);
            if (updated.list) setComments(updated.list);
            setCommentInput('');
        }
    };

    const handleCommentDelete = async (commentId) => {
        if (!window.confirm('댓글을 삭제할까요?')) return;
        const data = await deleteComment(commentId);
        if (data.result) {
            const updated = await getComments('POST', postId);
            if (updated.list) setComments(updated.list);
            alert('삭제됐어요! 🧶');
        }
    };

    const handleCommentEdit = async (commentId) => {
        const content = editInput[commentId]?.trim();
        if (!content) return;
        const data = await updateComment(commentId, content);
        if (data.result) {
            const updated = await getComments('POST', postId);
            if (updated.list) setComments(updated.list);
            setEditComment(prev => ({ ...prev, [commentId]: false }));

        }
    };

    const handleReplySubmit = async (parentId, replyTo = null) => {
        const inputKey = replyTo || parentId;
        const content = replyInput[inputKey]?.trim();
        if (!content) return;
        const data = await createComment({
            userEmail: user?.userEmail,
            targetType: 'POST',
            targetId: postId,
            content,
            parentId,
            replyTo: replyTo || null,
        });
        if (data.result) {
            const updated = await getComments('POST', postId);
            if (updated.list) setComments(updated.list);
            setReplyInput(prev => ({ ...prev, [inputKey]: '' }));
            setOpenReply(prev => ({ ...prev, [inputKey]: false }));
        }
    };

    if (!post) return (
        <Box className={styles.container}>
            <Typography className={styles.loading}>불러오는 중... 🧶</Typography>
        </Box>
    );

    // 게시글 수정
    const handlePostEdit = async () => {
        const res = await fetch(`http://localhost:3010/api/posts/showcase/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: editTitle, content: editContent }),
        });
        const data = await res.json();
        if (data.result) {
            setPost(prev => ({ ...prev, TITLE: editTitle, CONTENT: editContent }));
            setIsEditing(false);
            alert('수정됐어요! 🧶');
        }
    };

    // 게시글 삭제
    const handlePostDelete = async () => {
        if (!window.confirm('작품을 삭제할까요?')) return;
        const res = await fetch(`http://localhost:3010/api/posts/${postId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (data.result) {
            alert('삭제됐어요! 🧶');
            navigate('/works');
        }
    };

    const requireLogin = () => {
        if (!user) {
            alert('로그인이 필요해요!');
            navigate('/');
            return false;
        }
        return true;
    };

    return (
        <Box className={styles.container}>
            <Button variant="outlined" className={styles.backBtn}
                onClick={() => navigate('/works')}>
                뒤로가기
            </Button>

            <Box className={styles.card}>
                <Box className={styles.mainLayout}>
                    {/* 좌측 이미지 */}
                    <Box className={styles.imageSection}>
                        <Box className={styles.mainImageArea}>
                            {images.length > 0 ? (
                                <img src={`http://localhost:3010${images[currentImg]}`}
                                    alt={post.TITLE} className={styles.mainImage}/>
                            ) : (
                                <Box className={styles.noImage}>
                                    <Typography className={styles.noImageText}>이미지 없음</Typography>
                                </Box>
                            )}
                        </Box>
                        {/* 썸네일 */}
                        {images.length > 1 && (
                            <Box className={styles.thumbRow}>
                                {images.map((img, idx) => (
                                    <Box key={idx}
                                        className={`${styles.thumb} ${currentImg === idx ? styles.thumbActive : ''}`}
                                        onClick={() => setCurrentImg(idx)}>
                                        <img src={`http://localhost:3010${img}`}
                                            alt={`thumb-${idx}`} className={styles.thumbImg}/>
                                    </Box>
                                ))}
                            </Box>
                        )}
                        {/* 좋아요 */}
                        <Box className={styles.likeRow} onClick={handleLike}>
                            {liked
                                ? <Favorite className={styles.likeIconActive}/>
                                : <FavoriteBorder className={styles.likeIcon}/>
                            }
                            <Typography className={styles.likeCount}>칭찬해요 {likeCount}</Typography>
                        </Box>
                        {/* 내용 */}
                        <Box className={styles.contentSection}>
                            <Typography className={styles.content}>{post.CONTENT}</Typography>
                        </Box>
                    </Box>

                    {/* 우측 댓글 */}
                    <Box className={styles.commentSection}>
                        {/* 작성자 */}
                        <Box className={styles.authorRow}>
                            <AvatarItem
                                src={post.PROFILE_IMG}
                                nickname={post.NICKNAME}
                                size={40}
                                onClick={() => navigate(`/user/${post.USER_ID}`)}
                            />
                            <Box>
                                <Typography className={styles.nickname}
                                    onClick={() => navigate(`/user/${post.USER_ID}`)}>
                                    {post.NICKNAME}
                                </Typography>
                                <Typography className={styles.date}>
                                    {new Date(post.CREATED_AT).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Box>
                        {/* ▼ 본인만 수정/삭제 표시 */}
                        {post.NICKNAME === user?.userNickname && (
                            <Box className={styles.postActions}>
                                <button className={styles.postActionBtn}
                                    onClick={() => {
                                        setIsEditing(true);
                                        setEditTitle(post.TITLE || '');
                                        setEditContent(post.CONTENT || '');
                                    }}>수정</button>
                                <button className={styles.postActionBtn}
                                    onClick={handlePostDelete}>삭제</button>
                            </Box>
                        )}

                        {isEditing ? (
                            <Box className={styles.editBox}>
                                <input
                                    className={styles.editTitleInput}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="제목"
                                />
                                <textarea
                                    className={styles.editTextarea}
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    placeholder="내용"
                                />
                                <Box className={styles.editBtns}>
                                    <button className={styles.editSubmit} onClick={handlePostEdit}>완료</button>
                                    <button className={styles.editCancel} onClick={() => setIsEditing(false)}>취소</button>
                                </Box>
                            </Box>
                        ) : (
                            <>
                                <Typography className={styles.postTitle}>{post.TITLE}</Typography>
                                <Typography className={styles.postContent}>{post.CONTENT}</Typography>
                            </>
                        )}

                        {/* 댓글 목록 */}
                        <Box className={styles.commentList}>
                            <Typography className={styles.commentTitle}>
                                댓글 {comments.filter(c => !c.PARENT_ID).length}
                            </Typography>
                            {comments.filter(c => !c.PARENT_ID).length === 0 ? (
                                <Typography className={styles.noComment}>아직 댓글이 없어요 🧶</Typography>
                            ) : (
                                comments.filter(c => !c.PARENT_ID).map(c => (
                                    <Box key={c.COMMENT_ID} className={styles.commentItem}>
                                        <AvatarItem
                                            src={c.PROFILE_IMG}
                                            nickname={c.NICKNAME}
                                            size={28}
                                        />
                                        <Box className={styles.commentBody}>
                                            <Box className={styles.commentHeader}>
                                                <Typography className={styles.commentNick}>{c.NICKNAME}</Typography>
                                                <Typography className={styles.commentDate}>
                                                    {new Date(c.CREATED_AT).toLocaleDateString()}
                                                </Typography>
                                                {c.NICKNAME === user?.userNickname && (
                                                    <Box className={styles.commentActions}>
                                                        <button className={styles.actionBtn}
                                                            onClick={() => {
                                                                setEditComment(prev => ({ ...prev, [c.COMMENT_ID]: true }));
                                                                setEditInput(prev => ({ ...prev, [c.COMMENT_ID]: c.CONTENT }));
                                                            }}>수정</button>
                                                        <button className={styles.actionBtn}
                                                            onClick={() => handleCommentDelete(c.COMMENT_ID)}>삭제</button>
                                                    </Box>
                                                )}
                                            </Box>
                                            {editComment[c.COMMENT_ID] ? (
                                                <Box className={styles.editRow}>
                                                    <input className={styles.inputField}
                                                        value={editInput[c.COMMENT_ID] || ''}
                                                        onChange={(e) => setEditInput(prev => ({ ...prev, [c.COMMENT_ID]: e.target.value }))}
                                                    />
                                                    <button className={styles.submitBtn}
                                                        onClick={() => handleCommentEdit(c.COMMENT_ID)}>완료</button>
                                                    <button className={styles.cancelBtn}
                                                        onClick={() => setEditComment(prev => ({ ...prev, [c.COMMENT_ID]: false }))}>취소</button>
                                                </Box>
                                            ) : (
                                                <Typography className={styles.commentText}>{c.CONTENT}</Typography>
                                            )}
                                            <button className={styles.replyBtn}
                                                onClick={() => setOpenReply(prev => ({ ...prev, [c.COMMENT_ID]: !prev[c.COMMENT_ID] }))}>
                                                답글 달기
                                            </button>
                                            {openReply[c.COMMENT_ID] && (
                                                <Box className={styles.editRow}>
                                                    <input className={styles.inputField}
                                                        placeholder="답글을 입력하세요"
                                                        value={replyInput[c.COMMENT_ID] || ''}
                                                        onChange={(e) => setReplyInput(prev => ({ ...prev, [c.COMMENT_ID]: e.target.value }))}
                                                    />
                                                    <button className={styles.submitBtn}
                                                        onClick={() => handleReplySubmit(c.COMMENT_ID)}>등록</button>
                                                </Box>
                                            )}
                                            {/* 대댓글 */}
                                            {comments.filter(r => r.PARENT_ID === c.COMMENT_ID).map(reply => (
                                                <Box key={reply.COMMENT_ID} className={styles.replyItem}>
                                                    <AvatarItem
                                                        src={reply.PROFILE_IMG}
                                                        nickname={reply.NICKNAME}
                                                        size={22}
                                                    />
                                                    <Box className={styles.commentBody}>
                                                        <Box className={styles.commentHeader}>
                                                            <Typography className={styles.commentNick}>{reply.NICKNAME}</Typography>
                                                            {reply.NICKNAME === user?.userNickname && (
                                                                <Box className={styles.commentActions}>
                                                                    <button className={styles.actionBtn}
                                                                        onClick={() => {
                                                                            setEditComment(prev => ({ ...prev, [reply.COMMENT_ID]: true }));
                                                                            setEditInput(prev => ({ ...prev, [reply.COMMENT_ID]: reply.CONTENT }));
                                                                        }}>수정</button>
                                                                    <button className={styles.actionBtn}
                                                                        onClick={() => handleCommentDelete(reply.COMMENT_ID)}>삭제</button>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                        {editComment[reply.COMMENT_ID] ? (
                                                            <Box className={styles.editRow}>
                                                                <input className={styles.inputField}
                                                                    value={editInput[reply.COMMENT_ID] || ''}
                                                                    onChange={(e) => setEditInput(prev => ({ ...prev, [reply.COMMENT_ID]: e.target.value }))}
                                                                />
                                                                <button className={styles.submitBtn}
                                                                    onClick={() => handleCommentEdit(reply.COMMENT_ID)}>완료</button>
                                                                <button className={styles.cancelBtn}
                                                                    onClick={() => setEditComment(prev => ({ ...prev, [reply.COMMENT_ID]: false }))}>취소</button>
                                                            </Box>
                                                        ) : (
                                                            <Typography className={styles.commentText}>{reply.CONTENT}</Typography>
                                                        )}
                                                        <button className={styles.replyBtn}
                                                            onClick={() => setOpenReply(prev => ({ ...prev, [reply.COMMENT_ID]: !prev[reply.COMMENT_ID] }))}>
                                                            답글 달기
                                                        </button>
                                                        {openReply[reply.COMMENT_ID] && (
                                                            <Box className={styles.editRow}>
                                                                <input className={styles.inputField}
                                                                    placeholder="답글을 입력하세요"
                                                                    value={replyInput[reply.COMMENT_ID] || ''}
                                                                    onChange={(e) => setReplyInput(prev => ({ ...prev, [reply.COMMENT_ID]: e.target.value }))}
                                                                />
                                                                <button className={styles.submitBtn}
                                                                    onClick={() => handleReplySubmit(c.COMMENT_ID, reply.COMMENT_ID)}>등록</button>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>

                        {/* 댓글 입력 */}
                        <Box className={styles.commentInput}>
                            <input className={styles.inputField}
                                placeholder="댓글을 입력하세요"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                            />
                            <button className={styles.submitBtn} onClick={handleCommentSubmit}>등록</button>
                        </Box>
                    </Box>
                </Box>
            </Box>
            <RightSidebar />
        </Box>
    );
}

export default ShowcaseDetail;