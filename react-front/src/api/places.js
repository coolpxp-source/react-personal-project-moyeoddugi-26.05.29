const BASE_URL = 'http://localhost:3010/api/places';

export const getPlaces = async (allowStatus) => {
    const url = allowStatus ? `${BASE_URL}?allow_status=${allowStatus}` : BASE_URL;
    const res = await fetch(url);
    return res.json();
};

export const createPlace = async (data) => {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
};