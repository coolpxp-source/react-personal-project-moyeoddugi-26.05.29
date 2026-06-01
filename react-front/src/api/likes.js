const BASE_URL = 'http://localhost:3010/api/likes';

// 좋아요 토글
export const toggleLike = async (userEmail, targetType, targetId) => {
    const res = await fetch(`${BASE_URL}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, targetType, targetId }),
    });
    return res.json();
};

// 좋아요 수 조회
export const getLikes = async (targetType, targetId, userEmail) => {
    const res = await fetch(`${BASE_URL}/${targetType}/${targetId}?userEmail=${userEmail}`);
    return res.json();
};