const BASE_URL = 'http://localhost:3010/api/posts';

export const getShowcaseList = async () => {
    const res = await fetch(`${BASE_URL}/showcase`);
    return res.json();
};

export const getShowcase = async (postId) => {
    const res = await fetch(`${BASE_URL}/showcase/${postId}`);
    return res.json();
};

export const createShowcase = async (formData) => {
    const res = await fetch(`${BASE_URL}/showcase`, {
        method: 'POST',
        body: formData,
    });
    return res.json();
};