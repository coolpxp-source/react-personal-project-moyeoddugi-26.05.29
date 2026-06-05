const BASE_URL = 'http://localhost:3010/api/users';

export const getUser = async (userId) => {
    const res = await fetch(`${BASE_URL}/${userId}`);
    return res.json();
};

export const getUserPatterns = async (userId) => {
    const res = await fetch(`${BASE_URL}/${userId}/patterns`);
    return res.json();
};

export const getUserPosts = async (userId) => {
    const res = await fetch(`${BASE_URL}/${userId}/posts`);
    return res.json();
};

export const getRecommendUsers = async (userEmail) => {
    const res = await fetch(`http://localhost:3010/api/users/recommend?userEmail=${userEmail}`);
    return res.json();
};