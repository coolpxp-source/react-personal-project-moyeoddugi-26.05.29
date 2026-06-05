import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getMyChatRooms, getChatRoom, getMessages, sendMessage, joinChatRoom, leaveChatRoom, markAsRead } from '../../api/chat';
import AvatarItem from '../../components/AvatarItem';
import styles from './Chat.module.css';
import { useLocation } from 'react-router-dom';

function Chat() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;
    const messagesEndRef = useRef(null);
    const pollingRef = useRef(null);

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [members, setMembers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const lastMessageIdRef = useRef(null);
    const [inviteInput, setInviteInput] = useState('');
    const [showInviteInput, setShowInviteInput] = useState(false);
    const [activeTab, setActiveTab] = useState('group'); // 'group' | 'dm'
    const location = useLocation();
    

    // 내 채팅방 목록 조회
    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        const data = await getMyChatRooms(user?.userEmail);
        if (data.result) setRooms(data.list);
    };
    

    // 채팅방 선택
    const handleRoomSelect = async (room) => {
        // 기존 폴링 중지
        if (pollingRef.current) clearInterval(pollingRef.current);

        const data = await getChatRoom(room.ROOM_ID);
        if (data.result) {
            setSelectedRoom(data.room);
            setMembers(data.members);
        }

        // 메시지 전체 로드
        const msgData = await getMessages(room.ROOM_ID);
        if (msgData.result) {
            setMessages(msgData.list);
            if (msgData.list.length > 0) {
                lastMessageIdRef.current = msgData.list[msgData.list.length - 1].MESSAGE_ID;
            }
        }

        // ▼ 읽음 처리 추가
        await markAsRead(room.ROOM_ID, user?.userEmail);
        // ▼ 뱃지 없애려고 목록 갱신
        fetchRooms();

        // 폴링 시작 (3초마다)
        pollingRef.current = setInterval(async () => {
            const newData = await getMessages(room.ROOM_ID, lastMessageIdRef.current);
            if (newData.result && newData.list.length > 0) {
                setMessages(prev => [...prev, ...newData.list]);
                lastMessageIdRef.current = newData.list[newData.list.length - 1].MESSAGE_ID;
            }
        }, 3000);
    };

    // 컴포넌트 언마운트 시 폴링 중지
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // 메시지 전송
    const handleSend = async () => {
        if (!messageInput.trim() || !selectedRoom) return;
        const data = await sendMessage(selectedRoom.ROOM_ID, user?.userEmail, messageInput);
        if (data.result) {
            setMessageInput('');
            // 전송 후 즉시 새 메시지 조회
            const msgData = await getMessages(selectedRoom.ROOM_ID, lastMessageIdRef.current);
            if (msgData.result && msgData.list.length > 0) {
                setMessages(prev => [...prev, ...msgData.list]);
                lastMessageIdRef.current = msgData.list[msgData.list.length - 1].MESSAGE_ID;
            }
        }
    };

    // 스크롤 최하단 유지
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 초대 코드로 입장
    const handleJoin = async () => {
        if (!inviteInput.trim()) return;
        const data = await joinChatRoom(user?.userEmail, inviteInput.trim());
        if (data.result) {
            alert(data.message);
            setInviteInput('');
            setShowInviteInput(false);
            await fetchRooms(); // ← await 추가
            if (data.roomId) handleRoomSelect({ ROOM_ID: data.roomId });
        } else {
            alert(data.message);
        }
    };

    // 채팅방 나가기
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleLeave = async () => {
        if (!window.confirm('채팅방을 나갈까요?')) return;
        const data = await leaveChatRoom(selectedRoom.ROOM_ID, user?.userEmail);
        if (data.result) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setSelectedRoom(null);
            setMessages([]);
            fetchRooms();
        }
    };

    // 날짜 구분선 표시용
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit'
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (location.state?.roomId) {
            handleRoomSelect({ ROOM_ID: location.state.roomId });
        }
    }, [rooms]);
    
    // ▼ 탭별 미읽음 count 계산 — filteredRooms 위에 추가
    const groupUnread = rooms
        .filter(r => r.ROOM_TYPE !== 'DM')
        .reduce((sum, r) => sum + (r.UNREAD_COUNT || 0), 0);

    const dmUnread = rooms
        .filter(r => r.ROOM_TYPE === 'DM')
        .reduce((sum, r) => sum + (r.UNREAD_COUNT || 0), 0);

    const filteredRooms = rooms.filter(room =>
        activeTab === 'dm' ? room.ROOM_TYPE === 'DM' : room.ROOM_TYPE !== 'DM'
    );

    return (
        <Box className={styles.container}>
            {/* 좌측 채팅방 목록 */}
            <Box className={styles.roomList}>
                <Box className={styles.roomListHeader}>
                    <Typography className={styles.roomListTitle}>참여 중인 모임 채팅</Typography>
                    <button className={styles.joinBtn}
                        onClick={() => setShowInviteInput(prev => !prev)}>
                        + 참여
                    </button>
                </Box>
                <Box className={styles.tabRow}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'group' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('group')}>
                        👥 모임
                        {groupUnread > 0 && (
                            <span className={styles.tabBadge}>{groupUnread > 99 ? '99+' : groupUnread}</span>
                        )}
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'dm' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('dm')}>
                        💬 DM
                        {dmUnread > 0 && (
                            <span className={styles.tabBadge}>{dmUnread > 99 ? '99+' : dmUnread}</span>
                        )}
                    </button>
                </Box>

                {/* 초대 코드 입력 */}
                {showInviteInput && (
                    <Box className={styles.inviteBox}>
                        <input
                            className={styles.inviteInput}
                            placeholder="초대 코드 입력"
                            value={inviteInput}
                            onChange={(e) => setInviteInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        />
                        <button className={styles.inviteSubmitBtn} onClick={handleJoin}>
                            입장
                        </button>
                    </Box>
                )}
                
                {/* 채팅방 목록 */}
                {filteredRooms.length === 0 ? (
                    <Typography className={styles.emptyRoom}>
                        {activeTab === 'dm' ? 'DM이 없어요 💬' : '참여 중인 채팅방이 없어요 🧶'}
                    </Typography>
                ) : (
                    
                    filteredRooms.map(room => (
                        <Box key={room.ROOM_ID}
                            className={`${styles.roomItem} ${selectedRoom?.ROOM_ID === room.ROOM_ID ? styles.roomItemActive : ''}`}
                            onClick={() => handleRoomSelect(room)}>
                            <Box className={styles.roomItemLeft}>
                                <Typography className={styles.roomItemName}>{room.ROOM_NAME}</Typography>
                                <Typography className={styles.roomItemLast}>
                                    {room.LAST_MESSAGE || '아직 메시지가 없어요'}
                                </Typography>
                            </Box>
                            <Box className={styles.roomItemRight}>
                                <Typography className={styles.roomItemMember}>
                                    👥 {room.MEMBER_COUNT}명
                                </Typography>
                                {room.LAST_MESSAGE_AT && (
                                    <Typography className={styles.roomItemTime}>
                                        {formatTime(room.LAST_MESSAGE_AT)}
                                    </Typography>
                                )}
                                {/* ▼ 뱃지 추가 */}
                                {room.UNREAD_COUNT > 0 && (
                                    <Box className={styles.unreadBadge}>
                                        {room.UNREAD_COUNT > 99 ? '99+' : room.UNREAD_COUNT}
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    ))
                )}
            </Box>

            {/* 우측 채팅창 */}
            {selectedRoom ? (
                <Box className={styles.chatArea}>
                    {/* 채팅방 헤더 */}
                    <Box className={styles.chatHeader}>
                        <Box className={styles.chatHeaderLeft}>
                            <Typography className={styles.chatRoomName}>
                                {selectedRoom.ROOM_NAME}
                            </Typography>
                            <Typography className={styles.chatMemberCount}>
                                👥 {members.length}명 참여 중
                            </Typography>
                            {selectedRoom.POST_ID && (
                                <Typography className={styles.chatPostLink}
                                    onClick={() => navigate(`/posts`)}>
                                    · 모여떠요 게시글 보기 →
                                </Typography>
                            )}
                        </Box>
                        <Box className={styles.chatHeaderRight}>
                            {/* 멤버 아바타 */}
                            <Box className={styles.memberAvatars}>
                                {members.slice(0, 5).map(m => (
                                    <AvatarItem
                                        key={m.USER_ID}
                                        src={m.PROFILE_IMG}
                                        nickname={m.NICKNAME}
                                        size={28}
                                        onClick={() => navigate(`/user/${m.USER_ID}`)}
                                    />
                                ))}
                            </Box>
                
                            {/* 초대 코드 복사 — DM이 아닐 때만 표시 */}
                            {selectedRoom.ROOM_TYPE !== 'DM' && (
                                <button className={styles.inviteCodeBtn}
                                    onClick={() => {
                                        navigator.clipboard.writeText(selectedRoom.INVITE_CODE);
                                        alert(`초대 코드 복사됨: ${selectedRoom.INVITE_CODE}`);
                                    }}>
                                    🔗 초대 코드
                                </button>
                            )}
                            <button className={styles.leaveBtn} onClick={handleLeave}>
                                나가기
                            </button>
                        </Box>
                    </Box>

                    {/* 메시지 목록 */}
                    <Box className={styles.messageList}>
                        {messages.map((msg, idx) => {
                            const isMe = msg.USER_ID === user?.userId;
                            const showDate = idx === 0 ||
                                formatDate(messages[idx - 1].CREATED_AT) !== formatDate(msg.CREATED_AT);

                            return (
                                <React.Fragment key={msg.MESSAGE_ID}>
                                    {showDate && (
                                        <Box className={styles.dateDivider}>
                                            <Typography className={styles.dateDividerText}>
                                                {formatDate(msg.CREATED_AT)}
                                            </Typography>
                                        </Box>
                                    )}
                                    {msg.CONTENT.includes('님이 채팅방') ? (
                                        <Box className={styles.systemMessage}>
                                            <Typography className={styles.systemMessageText}>
                                                {msg.CONTENT}
                                            </Typography>
                                        </Box>
                                    ) : (
                                            <Box className={`${styles.messageItem} ${isMe ? styles.messageItemMe : ''}`}>
                                                {!isMe && (
                                                    <AvatarItem
                                                        src={msg.PROFILE_IMG}
                                                        nickname={msg.NICKNAME}
                                                        size={32}
                                                        onClick={() => navigate(`/user/${msg.USER_ID}`)}
                                                    />
                                                )}
                                                <Box className={styles.messageBubbleWrap}>
                                                    {!isMe && (
                                                        <Typography className={styles.messageSender}>
                                                            {msg.NICKNAME}
                                                        </Typography>
                                                    )}
                                                    <Box className={styles.messageBubbleRow}>
                                                        {isMe && (
                                                            <Typography className={styles.messageTime}>
                                                                {formatTime(msg.CREATED_AT)}
                                                            </Typography>
                                                        )}
                                                        <Box className={`${styles.messageBubble} ${isMe ? styles.messageBubbleMe : styles.messageBubbleOther}`}>
                                                            <Typography className={styles.messageText}>
                                                                {msg.CONTENT}
                                                            </Typography>
                                                        </Box>
                                                        {!isMe && (
                                                            <Typography className={styles.messageTime}>
                                                                {formatTime(msg.CREATED_AT)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Box>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        <div ref={messagesEndRef}/>
                    </Box>

                    {/* 메시지 입력 */}
                    <Box className={styles.messageInput}>
                        <input
                            className={styles.messageInputField}
                            placeholder="메시지를 입력하세요"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button className={styles.sendBtn} onClick={handleSend}>
                            ➤
                        </button>
                    </Box>
                </Box>
            ) : (
                <Box className={styles.emptyChat}>
                    <Typography className={styles.emptyChatText}>
                        채팅방을 선택해주세요 🧶
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default Chat;