const BASE_URL = 'http://localhost:3010/api/notifications';

export const getNotifications = async (userId, notiType) => {
    const url = notiType && notiType !== '전체'
        ? `${BASE_URL}/${userId}?noti_type=${notiType}`
        : `${BASE_URL}/${userId}`;
    const res = await fetch(url);
    return res.json();
};

export const readNotification = async (notiId) => {
    const res = await fetch(`${BASE_URL}/${notiId}/read`, { method: 'PUT' });
    return res.json();
};

export const readAllNotifications = async (userId) => {
    const res = await fetch(`${BASE_URL}/read-all/${userId}`, { method: 'PUT' });
    return res.json();
};

export const getUnreadCount = async (userId) => {
    const res = await fetch(`${BASE_URL}/unread/${userId}`);
    return res.json();
};