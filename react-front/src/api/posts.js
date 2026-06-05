const BASE_URL = 'http://localhost:3010/api/posts';

// 게시글 목록 조회
export const getPosts = async (boardType, userEmail) => {
    const params = new URLSearchParams();
    if (boardType && boardType !== '전체') params.append('board_type', boardType);
    if (userEmail) params.append('userEmail', userEmail);
    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    const res = await fetch(url);
    return res.json();
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

// 인기 게시글 top 5
export const getPopularPosts = async () => {
    const res = await fetch(`${BASE_URL}/popular`);
    return res.json();
};

// 인기 태그 top 10
export const getPopularTags = async () => {
    const res = await fetch(`${BASE_URL}/popular-tags`);
    return res.json();
};
// 구독한 사람의 피드만 보기
export const getFollowingPosts = async (userEmail) => {
    const res = await fetch(`http://localhost:3010/api/posts/following?userEmail=${userEmail}`);
    return res.json();
};