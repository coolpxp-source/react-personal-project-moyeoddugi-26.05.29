const BASE_URL = 'http://localhost:3010/api/notifications';

export const getNotifications = async (userEmail) => {
    const res = await fetch(`${BASE_URL}?userEmail=${userEmail}`);
    return res.json();
};

export const getUnreadCount = async (userEmail) => {
    const res = await fetch(`${BASE_URL}/unread-count?userEmail=${userEmail}`);
    return res.json();
};

export const readAllNotifications = async (userEmail) => {
    const res = await fetch(`${BASE_URL}/read-all?userEmail=${userEmail}`, {
        method: 'PUT',
    });
    return res.json();
};

export const readNotification = async (notiId) => {
    const res = await fetch(`${BASE_URL}/${notiId}/read`, {
        method: 'PUT',
    });
    return res.json();
};