const BASE_URL = 'http://localhost:3010/api/posts';

// 게시글 목록 조회
export const getPosts = async (boardType) => {
    const url = boardType && boardType !== '전체' 
        ? `${BASE_URL}?board_type=${boardType}` 
        : BASE_URL;
    const response = await fetch(url);
    return response.json();
};

// 게시글 상세 조회
export const getPost = async (postId) => {
    const response = await fetch(`${BASE_URL}/${postId}`);
    return response.json();
};

// 게시글 작성
export const createPost = async (userId, boardType, title, content) => {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, boardType, title, content })
    });
    return response.json();
};

// 게시글 수정
export const updatePost = async (postId, title, content) => {
    const response = await fetch(`${BASE_URL}/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
    });
    return response.json();
};

// 게시글 삭제
export const deletePost = async (postId) => {
    const response = await fetch(`${BASE_URL}/${postId}`, {
        method: 'DELETE'
    });
    return response.json();
};