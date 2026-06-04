import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getPattern } from '../../api/patterns';
import { toggleLike, getLikes } from '../../api/likes';
import { jwtDecode } from 'jwt-decode';
import { getComments, createComment, deleteComment, updateComment } from '../../api/comments';
import styles from './PatternDetail.module.css';
import RightSidebar from '../../components/RightSidebar';
import AvatarItem from '../../components/AvatarItem'; // 프로필 이미지
import useScrap from '../../hooks/useScrap'; // 스크랩


const DIFFICULTY_COLORS = {
    '입문': { bg: '#E8F5E9', color: '#2E7D32' },
    '초급': { bg: '#E3F2FD', color: '#1565C0' },
    '중급': { bg: '#FFF3E0', color: '#E65100' },
    '고급': { bg: '#FCE4EC', color: '#C62828' },
};

function PatternDetail() {
    // user, token state
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;
    // 패턴, 태그
    const [pattern, setPattern] = useState(null);
    const [tags, setTags] = useState([]);
    // 좋아요
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    // 코멘트
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    // 이미지 슬라이더
    const [images, setImages] = useState([]); 
    const [currentImg, setCurrentImg] = useState(0);
    // 댓글 state
    const [editComment, setEditComment] = useState({});
    const [editInput, setEditInput] = useState({});
    const [openReply, setOpenReply] = useState({});
    const [replyInput, setReplyInput] = useState({});
    // 스크랩
    const { scrapped, handleScrap } = useScrap(user?.userEmail, 'PATTERN', id);
    // 수정
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        const fetchAll = async () => {
            const data = await getPattern(id);
            if (data.result) setPattern(data.data);

            const tagRes = await fetch(`http://localhost:3010/api/patterns/${id}/tags`);
            const tagData = await tagRes.json();
            if (tagData.list) setTags(tagData.list.filter(t => t && t.trim()));

            const likeData = await getLikes('PATTERN', id, user?.userEmail);
            if (likeData.result) {
                setLiked(likeData.liked);
                setLikeCount(likeData.count);
            }

            const commentData = await getComments('PATTERN', id);
            if (commentData.list) setComments(commentData.list);

            const imgRes = await fetch(`http://localhost:3010/api/patterns/${id}/images`);
            const imgData = await imgRes.json();
            if (imgData.list && imgData.list.length > 0) {
                setImages(imgData.list);
            } else if (data.data.THUMBNAIL_IMG) {
                setImages([data.data.THUMBNAIL_IMG]);
            }
        };
        fetchAll();
    }, [id]);

    const handleLike = async () => {
        const data = await toggleLike(user?.userEmail, 'PATTERN', id);
        if (data.result) {
            setLiked(data.liked);
            setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
        }
    };

    const handleCommentSubmit = async () => {
        if (!commentInput.trim()) return;
        const data = await createComment({
            userEmail: user?.userEmail,
            targetType: 'PATTERN',
            targetId: id,
            content: commentInput,
        });
        if (data.result) {
            const updated = await getComments('PATTERN', id);
            if (updated.list) setComments(updated.list);
            setCommentInput('');
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            alert('링크가 복사됐어요! 🧶');
        });
    };

    const handleCommentDelete = async (commentId) => {
        if (!window.confirm('댓글을 삭제할까요?')) return;
        const data = await deleteComment(commentId);
        if (data.result) {
            const updated = await getComments('PATTERN', id);
            if (updated.list) setComments(updated.list);
        }
    };

    const handleCommentEdit = async (commentId) => {
        const content = editInput[commentId]?.trim();
        if (!content) return;
        const data = await updateComment(commentId, content);
        if (data.result) {
            const updated = await getComments('PATTERN', id);
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
            targetType: 'PATTERN',
            targetId: id,
            content,
            parentId,
            replyTo: replyTo || null,
        });
        if (data.result) {
            const updated = await getComments('PATTERN', id);
            if (updated.list) setComments(updated.list);
            setReplyInput(prev => ({ ...prev, [inputKey]: '' }));
            setOpenReply(prev => ({ ...prev, [inputKey]: false }));
        }
    };


    if (!pattern) return (
        <Box className={styles.container}>
            <Typography className={styles.loading}>불러오는 중... 🧶</Typography>
        </Box>
    );

    // 수정
    const handlePatternEdit = async () => {
        const res = await fetch(`http://localhost:3010/api/patterns/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        const data = await res.json();
        if (data.result) {
            // ▼ 대문자 키로 맞춰서 업데이트
            setPattern(prev => ({
                ...prev,
                TITLE: editForm.title,
                DESCRIPTION: editForm.description,
                DIFFICULTY: editForm.difficulty,
                YARN_TYPE: editForm.yarnType,
                NEEDLE_SIZE: editForm.needleSize,
                FINISHED_SIZE: editForm.finishedSize,
                WORK_TIME: editForm.workTime,
            }));
            setIsEditing(false);
            alert('도안이 수정됐어요! 🧶');
        }
    };

    // 삭제
    const handlePatternDelete = async () => {
        if (!window.confirm('도안을 삭제할까요?')) return;
        const res = await fetch(`http://localhost:3010/api/patterns/${id}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        alert('삭제 됐어요! 🧶');
        if (data.result) navigate('/patterns');
    };

    return (
        <Box className={styles.container}>
            {/* 뒤로가기 */}
            <Button variant="outlined" className={styles.backBtn}
                onClick={() => navigate('/patterns')}>
                뒤로가기
            </Button>

            <Box className={styles.card}>
                {/* 2단 레이아웃 */}
                <Box className={styles.mainLayout}>
                    {/* 좌측 - 이미지 */}
                    <Box className={styles.imageSection}>
                        {/* 이미지 슬라이더 */}
                        <Box className={styles.mainImageArea}>
                            {images.length > 0 ? (
                                <img src={`http://localhost:3010${images[currentImg]}`}
                                    alt={pattern.TITLE} className={styles.mainImage}/>
                            ) : (
                                <Box className={styles.noImage}>
                                    <Typography className={styles.noImageText}>대표이미지</Typography>
                                </Box>
                            )}
                        </Box>
                        {/* 썸네일 */}
                        <Box className={styles.thumbRow}>
                            {images.map((img, idx) => (
                                <Box key={idx}
                                    className={`${styles.thumb} ${currentImg === idx ? styles.thumbActive : ''}`}
                                    onClick={() => setCurrentImg(idx)}>
                                    <img src={`http://localhost:3010${img}`} alt={`thumb-${idx}`}
                                        className={styles.thumbImg}/>
                                </Box>
                            ))}
                        </Box>

                        {/* 좋아요/스크랩/공유 */}
                        <Box className={styles.actionRow}>
                            <Button variant="contained" className={styles.likeBtn}
                                onClick={handleLike}
                                startIcon={liked
                                    ? <Favorite sx={{ fontSize: 16 }}/>
                                    : <FavoriteBorder sx={{ fontSize: 16 }}/>
                                }
                                style={{ backgroundColor: liked ? '#E0A0A0' : '#EDE0C8', color: 'white' }}>
                                좋아요 {likeCount}
                            </Button>
                            <Button variant="outlined" className={styles.actionBtn}
                                onClick={handleScrap}
                                style={{ 
                                    borderColor: scrapped ? '#7B4F2E' : '#E8D5B7',
                                    color: scrapped ? '#7B4F2E' : '#B08060',
                                    backgroundColor: scrapped ? '#F5EDD8' : 'transparent'
                                }}>
                                {scrapped ? '★ 스크랩됨' : '☆ 스크랩'}
                            </Button>
                            <Button variant="outlined" className={styles.actionBtn}
                                onClick={handleShare}>
                                공유하기
                            </Button>
                        </Box>


                        {/* 설명 */}
                        <Box className={styles.descSection}>
                            <Typography className={styles.sectionLabel}>설명</Typography>
                            <Typography className={styles.descText}>{pattern.DESCRIPTION}</Typography>
                        </Box>
                    </Box>

                    {/* 우측 - 정보 */}
                    <Box className={styles.infoSection}>
                        <Typography className={styles.title}>{pattern.TITLE}</Typography>
                        <Box className={styles.authorRow}>
                            <AvatarItem
                                src={pattern.PROFILE_IMG}
                                nickname={pattern.NICKNAME}
                                size={28}
                                onClick={() => navigate(`/user/${pattern.USER_ID}`)}
                            />
                            <Typography className={styles.nickname}
                                onClick={() => navigate(`/user/${pattern.USER_ID}`)}
                                style={{ cursor: 'pointer' }}>
                                {pattern.NICKNAME}
                            </Typography>
                            <Typography className={styles.date}>
                                {new Date(pattern.CREATED_AT).toLocaleDateString()}
                            </Typography>
                            <Typography className={styles.viewCount}>조회 {pattern.VIEW_COUNT}</Typography>
                            {/* ▼ 추가 */}
                            {pattern.NICKNAME === user?.userNickname && (
                                <Box className={styles.postActions}>
                                    <button className={styles.postActionBtn}
                                        onClick={() => {
                                            setEditForm({
                                                title: pattern.TITLE,
                                                description: pattern.DESCRIPTION,
                                                difficulty: pattern.DIFFICULTY,
                                                yarnType: pattern.YARN_TYPE || '',
                                                needleSize: pattern.NEEDLE_SIZE || '',
                                                finishedSize: pattern.FINISHED_SIZE || '',
                                                workTime: pattern.WORK_TIME || '',
                                            });
                                            setIsEditing(true);
                                        }}>수정</button>
                                    <button className={styles.postActionBtn}
                                        onClick={handlePatternDelete}>삭제</button>
                                </Box>
                            )}
                        </Box>

                        {/* 도안 정보 */}
                        <Box className={styles.infoBox}>
                            <Typography className={styles.infoTitle}>도안 정보</Typography>
                            <Box className={styles.infoRow}>
                                <Typography className={styles.infoLabel}>종류</Typography>
                                <Chip label={pattern.NEEDLE_TYPE} size="small"
                                    style={{
                                        backgroundColor: pattern.NEEDLE_TYPE === '코바늘' ? '#E8F5E9' : '#E3F2FD',
                                        color: pattern.NEEDLE_TYPE === '코바늘' ? '#2E7D32' : '#1565C0',
                                        fontSize: 11, height: 20
                                    }}
                                />
                            </Box>
                            <Box className={styles.infoRow}>
                                <Typography className={styles.infoLabel}>난이도</Typography>
                                <Chip label={pattern.DIFFICULTY} size="small"
                                    style={{
                                        backgroundColor: DIFFICULTY_COLORS[pattern.DIFFICULTY]?.bg,
                                        color: DIFFICULTY_COLORS[pattern.DIFFICULTY]?.color,
                                        fontSize: 11, height: 20
                                    }}
                                />
                            </Box>
                            {pattern.YARN_TYPE && (
                                <Box className={styles.infoRow}>
                                    <Typography className={styles.infoLabel}>실종류</Typography>
                                    <Typography className={styles.infoValue}>{pattern.YARN_TYPE}</Typography>
                                </Box>
                            )}
                            {pattern.NEEDLE_SIZE && (
                                <Box className={styles.infoRow}>
                                    <Typography className={styles.infoLabel}>바늘 호수</Typography>
                                    <Typography className={styles.infoValue}>{pattern.NEEDLE_SIZE}</Typography>
                                </Box>
                            )}
                            {pattern.FINISHED_SIZE && (
                                <Box className={styles.infoRow}>
                                    <Typography className={styles.infoLabel}>완성 크기</Typography>
                                    <Typography className={styles.infoValue}>{pattern.FINISHED_SIZE}</Typography>
                                </Box>
                            )}
                            {pattern.WORK_TIME && (
                                <Box className={styles.infoRow}>
                                    <Typography className={styles.infoLabel}>소요 시간</Typography>
                                    <Typography className={styles.infoValue}>{pattern.WORK_TIME}</Typography>
                                </Box>
                            )}
                        </Box>

                        {/* 태그 */}
                        {tags.length > 0 && (
                            <Box className={styles.tagSection}>
                                <Typography className={styles.infoTitle}>태그</Typography>
                                <Box className={styles.tagRow}>
                                    {tags.map((tag, idx) => (
                                        <Chip key={idx} label={tag} size="small"
                                            style={{ backgroundColor: '#F5EDD8', color: '#7B4F2E', fontSize: 11 }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* 댓글 */}
                        <Box className={styles.commentSection}>
                            <Typography className={styles.infoTitle}>댓글 {comments.filter(c => !c.PARENT_ID).length}</Typography>
                            <Box className={styles.commentList}>
                                {comments.filter(c => !c.PARENT_ID).length === 0 ? (
                                    <Typography className={styles.noComment}>아직 댓글이 없어요 🧶</Typography>
                                ) : (
                                    comments.filter(c => !c.PARENT_ID).map(c => (
                                        <Box key={c.COMMENT_ID} className={styles.commentItem}>
                                            <AvatarItem
                                                src={c.PROFILE_IMG}
                                                nickname={c.NICKNAME}
                                                size={24}
                                            />
                                            <Box className={styles.commentBody}>
                                                <Box className={styles.commentHeader}>
                                                    <Typography className={styles.commentNick}>{c.NICKNAME}</Typography>
                                                    <Typography className={styles.commentDate}>
                                                        {new Date(c.CREATED_AT).toLocaleDateString()}
                                                    </Typography>
                                                    {c.NICKNAME === user?.userNickname && (
                                                        <Box className={styles.commentActions}>
                                                            <button className={styles.commentActionBtn}
                                                                onClick={() => {
                                                                    setEditComment(prev => ({ ...prev, [c.COMMENT_ID]: true }));
                                                                    setEditInput(prev => ({ ...prev, [c.COMMENT_ID]: c.CONTENT }));
                                                                }}>수정</button>
                                                            <button className={styles.commentActionBtn}
                                                                onClick={() => handleCommentDelete(c.COMMENT_ID)}>삭제</button>
                                                        </Box>
                                                    )}
                                                </Box>

                                                {editComment[c.COMMENT_ID] ? (
                                                    <Box className={styles.editRow}>
                                                        <input className={styles.commentInputField}
                                                            value={editInput[c.COMMENT_ID] || ''}
                                                            onChange={(e) => setEditInput(prev => ({ ...prev, [c.COMMENT_ID]: e.target.value }))}
                                                        />
                                                        <button className={styles.editBtn}
                                                            onClick={() => handleCommentEdit(c.COMMENT_ID)}>완료</button>
                                                        <button className={styles.cancelBtn2}
                                                            onClick={() => setEditComment(prev => ({ ...prev, [c.COMMENT_ID]: false }))}>취소</button>
                                                    </Box>
                                                ) : (
                                                    <Typography className={styles.commentText}>{c.CONTENT}</Typography>
                                                )}

                                                {/* 답글 달기 */}
                                                <button className={styles.replyToggleBtn}
                                                    onClick={() => setOpenReply(prev => ({ ...prev, [c.COMMENT_ID]: !prev[c.COMMENT_ID] }))}>
                                                    답글 달기
                                                </button>

                                                {/* 대댓글 목록 */}
                                                {comments.filter(r => r.PARENT_ID === c.COMMENT_ID).map(reply => (
                                                    <Box key={reply.COMMENT_ID} className={styles.replyItem}>
                                                        <AvatarItem
                                                            src={reply.PROFILE_IMG}
                                                            nickname={reply.NICKNAME}
                                                            size={20}
                                                        />
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box className={styles.commentHeader}>
                                                                <Typography className={styles.commentNick}>{reply.NICKNAME}</Typography>
                                                                <Typography className={styles.commentDate}>
                                                                    {new Date(reply.CREATED_AT).toLocaleDateString()}
                                                                </Typography>
                                                                {/* ▼ 추가: 수정/삭제 */}
                                                                {reply.NICKNAME === user?.userNickname && (
                                                                    <Box className={styles.commentActions}>
                                                                        <button className={styles.commentActionBtn}
                                                                            onClick={() => {
                                                                                setEditComment(prev => ({ ...prev, [reply.COMMENT_ID]: true }));
                                                                                setEditInput(prev => ({ ...prev, [reply.COMMENT_ID]: reply.CONTENT }));
                                                                            }}>수정</button>
                                                                        <button className={styles.commentActionBtn}
                                                                            onClick={() => handleCommentDelete(reply.COMMENT_ID)}>삭제</button>
                                                                    </Box>
                                                                )}
                                                            </Box>

                                                            {editComment[reply.COMMENT_ID] ? (
                                                                <Box className={styles.editRow}>
                                                                    <input className={styles.commentInputField}
                                                                        value={editInput[reply.COMMENT_ID] || ''}
                                                                        onChange={(e) => setEditInput(prev => ({ ...prev, [reply.COMMENT_ID]: e.target.value }))}
                                                                    />
                                                                    <button className={styles.editBtn}
                                                                        onClick={() => handleCommentEdit(reply.COMMENT_ID)}>완료</button>
                                                                    <button className={styles.cancelBtn2}
                                                                        onClick={() => setEditComment(prev => ({ ...prev, [reply.COMMENT_ID]: false }))}>취소</button>
                                                                </Box>
                                                            ) : (
                                                                <Typography className={styles.commentText}>{reply.CONTENT}</Typography>
                                                            )}

                                                            {/* ▼ 추가: 답글 달기 */}
                                                            <button className={styles.replyToggleBtn}
                                                                onClick={() => setOpenReply(prev => ({ ...prev, [reply.COMMENT_ID]: !prev[reply.COMMENT_ID] }))}>
                                                                답글 달기
                                                            </button>

                                                            {openReply[reply.COMMENT_ID] && (
                                                                <Box className={styles.replyInputRow}>
                                                                    <input className={styles.commentInputField}
                                                                        placeholder="답글을 입력하세요"
                                                                        value={replyInput[reply.COMMENT_ID] || ''}
                                                                        onChange={(e) => setReplyInput(prev => ({ ...prev, [reply.COMMENT_ID]: e.target.value }))}
                                                                    />
                                                                    <button className={styles.editBtn}
                                                                        onClick={() => handleReplySubmit(c.COMMENT_ID, reply.COMMENT_ID)}>
                                                                        등록
                                                                    </button>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                ))}

                                                {/* 답글 입력창 */}
                                                {openReply[c.COMMENT_ID] && (
                                                    <Box className={styles.replyInputRow}>
                                                        <input className={styles.commentInputField}
                                                            placeholder="답글을 입력하세요"
                                                            value={replyInput[c.COMMENT_ID] || ''}
                                                            onChange={(e) => setReplyInput(prev => ({ ...prev, [c.COMMENT_ID]: e.target.value }))}
                                                        />
                                                        <button className={styles.editBtn}
                                                            onClick={() => handleReplySubmit(c.COMMENT_ID)}>등록</button>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Box>
                            <Box className={styles.commentInput}>
                                <input className={styles.commentInputField}
                                    placeholder="댓글을 입력하세요"
                                    value={commentInput}
                                    onChange={(e) => setCommentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                                />
                                <Button variant="contained" className={styles.commentBtn}
                                    onClick={handleCommentSubmit}>
                                    등록
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
            {/* 수정 모달 */}
            {isEditing && (
                <Box className={styles.modalOverlay} onClick={() => setIsEditing(false)}>
                    <Box className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                        <Typography className={styles.modalTitle}>도안 수정</Typography>

                        <Box className={styles.modalField}>
                            <Typography className={styles.modalLabel}>제목</Typography>
                            <input className={styles.modalInput}
                                value={editForm.title || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </Box>

                        <Box className={styles.modalField}>
                            <Typography className={styles.modalLabel}>설명</Typography>
                            <textarea className={styles.modalTextarea}
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </Box>

                        <Box className={styles.modalField}>
                            <Typography className={styles.modalLabel}>난이도</Typography>
                            <select className={styles.modalSelect}
                                value={editForm.difficulty || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value }))}>
                                {['입문', '초급', '중급', '고급'].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </Box>

                        <Box className={styles.modalField}>
                            <Typography className={styles.modalLabel}>실 종류</Typography>
                            <input className={styles.modalInput}
                                value={editForm.yarnType || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, yarnType: e.target.value }))}
                            />
                        </Box>

                        <Box className={styles.modalField}>
                            <Typography className={styles.modalLabel}>바늘 호수</Typography>
                            <input className={styles.modalInput}
                                value={editForm.needleSize || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, needleSize: e.target.value }))}
                            />
                        </Box>

                        <Box className={styles.modalField}>
                            <Typography className={styles.modalLabel}>완성 크기</Typography>
                            <input className={styles.modalInput}
                                value={editForm.finishedSize || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, finishedSize: e.target.value }))}
                            />
                        </Box>

                        <Box className={styles.modalField}>
                            <Typography className={styles.modalLabel}>소요 시간</Typography>
                            <input className={styles.modalInput}
                                value={editForm.workTime || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, workTime: e.target.value }))}
                            />
                        </Box>

                        <Box className={styles.modalBtns}>
                            <button className={styles.modalSubmit} onClick={handlePatternEdit}>완료</button>
                            <button className={styles.modalCancel} onClick={() => setIsEditing(false)}>취소</button>
                        </Box>
                    </Box>
                </Box>
            )}
            <RightSidebar />
        </Box>
    );
}

export default PatternDetail;