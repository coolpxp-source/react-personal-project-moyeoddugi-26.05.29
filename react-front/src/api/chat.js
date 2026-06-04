const BASE_URL = 'http://localhost:3010/api/chat';

// 내 채팅방 목록
export const getMyChatRooms = async (userEmail) => {
    const res = await fetch(`${BASE_URL}/my?userEmail=${userEmail}`);
    return res.json();
};

// 채팅방 상세 + 멤버
export const getChatRoom = async (roomId) => {
    const res = await fetch(`${BASE_URL}/${roomId}`);
    return res.json();
};

// 메시지 목록 (폴링용)
export const getMessages = async (roomId, after = null) => {
    const url = after
        ? `${BASE_URL}/${roomId}/messages?after=${after}`
        : `${BASE_URL}/${roomId}/messages`;
    const res = await fetch(url);
    return res.json();
};

// 메시지 전송
export const sendMessage = async (roomId, userEmail, content) => {
    const res = await fetch(`${BASE_URL}/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, content }),
    });
    return res.json();
};

// 초대 코드로 입장
export const joinChatRoom = async (userEmail, inviteCode) => {
    const res = await fetch(`${BASE_URL}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, inviteCode }),
    });
    return res.json();
};

// 채팅방 나가기
export const leaveChatRoom = async (roomId, userEmail) => {
    const res = await fetch(`${BASE_URL}/${roomId}/leave`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail }),
    });
    return res.json();
};

// 읽음 처리
export const markAsRead = async (roomId, userEmail) => {
    const res = await fetch(`${BASE_URL}/${roomId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail }),
    });
    return res.json();
};

export const getTotalUnreadCount = async (userEmail) => {
    const res = await fetch(`${BASE_URL}/my?userEmail=${userEmail}`);
    const data = await res.json();
    if (!data.result) return 0;
    return data.list.reduce((sum, room) => sum + (room.UNREAD_COUNT || 0), 0);
};