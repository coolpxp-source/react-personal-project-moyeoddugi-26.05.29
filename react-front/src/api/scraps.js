const BASE_URL = 'http://localhost:3010/api/scraps';

export const toggleScrap = async (userEmail, targetType, targetId) => {
    const res = await fetch(`${BASE_URL}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, targetType, targetId }),
    });
    return res.json();
};

export const getScrap = async (targetType, targetId, userEmail) => {
    const res = await fetch(`${BASE_URL}/${targetType}/${targetId}?userEmail=${userEmail}`);
    return res.json();
};

export const getScraps = async (userEmail, targetType) => {
    const res = await fetch(`${BASE_URL}/list?userEmail=${userEmail}&targetType=${targetType}`);
    return res.json();
}