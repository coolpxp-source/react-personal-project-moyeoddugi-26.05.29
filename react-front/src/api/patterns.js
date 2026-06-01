const BASE_URL = 'http://localhost:3010/api/patterns';

export const getPatterns = async (needleType, difficulty, category) => {
    const params = new URLSearchParams();
    if (needleType) params.append('needle_type', needleType);
    if (difficulty) params.append('difficulty', difficulty);
    if (category) params.append('category', category); // ▼ 추가
    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL;
    const res = await fetch(url);
    return res.json();
};

export const getPattern = async (patternId) => {
    const res = await fetch(`${BASE_URL}/${patternId}`);
    return res.json();
};

export const createPattern = async (data) => {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deletePattern = async (patternId) => {
    const res = await fetch(`${BASE_URL}/${patternId}`, {
        method: 'DELETE',
    });
    return res.json();
};