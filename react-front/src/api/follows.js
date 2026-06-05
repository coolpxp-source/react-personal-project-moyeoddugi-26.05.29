const BASE_URL = 'http://localhost:3010/api/follows';

export const toggleFollow = async (followerEmail, followingId) => {
    const res = await fetch(`${BASE_URL}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerEmail, followingId }),
    });
    return res.json();
};

export const getFollowStatus = async (followerEmail, followingId) => {
    const res = await fetch(`${BASE_URL}/status?followerEmail=${followerEmail}&followingId=${followingId}`);
    return res.json();
};

export const getFollowCount = async (userId) => {
    const res = await fetch(`${BASE_URL}/count/${userId}`);
    return res.json();
};

export const getFollowing = async (userId) => {
    const res = await fetch(`${BASE_URL}/following/${userId}`);
    return res.json();
};

export const getFollowers = async (userId, myUserId) => {
    const res = await fetch(`http://localhost:3010/api/follows/followers/${userId}?myUserId=${myUserId}`);
    return res.json();
};

export const getFollowingList = async (userId, myUserId) => {
    const res = await fetch(`http://localhost:3010/api/follows/following/${userId}?myUserId=${myUserId}`);
    return res.json();
};