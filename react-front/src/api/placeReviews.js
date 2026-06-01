const BASE_URL = 'http://localhost:3010/api/place-reviews';

export const getPlaceReviews = async (placeId) => {
    const res = await fetch(`${BASE_URL}/${placeId}`);
    return res.json();
};

export const createPlaceReview = async (data) => {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deletePlaceReview = async (reviewId) => {
    const res = await fetch(`${BASE_URL}/${reviewId}`, {
        method: 'DELETE',
    });
    return res.json();
};