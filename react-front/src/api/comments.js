const BASE_URL = 'http://localhost:3010/api/comments';

// 댓글 목록 조회
export const getComments = async (targetType, targetId) => {
    const res = await fetch(`${BASE_URL}/${targetType}/${targetId}`);
    return res.json();
};

// 댓글 작성
export const createComment = async (data) => {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // replyTo 포함해서 그냥 넘기면 됨
    });
    return res.json();
};

// 댓글 삭제
export const deleteComment = async (commentId) => {
    const res = await fetch(`${BASE_URL}/${commentId}`, {
        method: 'DELETE',
    });
    return res.json();
};

// 댓글 수정
export const updateComment = async (commentId, content) => {
    const res = await fetch(`${BASE_URL}/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    return res.json();
};