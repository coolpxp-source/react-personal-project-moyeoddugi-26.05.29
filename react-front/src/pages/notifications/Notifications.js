import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getNotifications, readAllNotifications, readNotification } from '../../api/notifications';
import AvatarItem from '../../components/AvatarItem';
import RightSidebar from '../../components/RightSidebar';
import styles from './Notifications.module.css';

const NOTI_ICONS = {
    COMMENT: '💬',
    LIKE: '❤️',
    FOLLOW: '👤',
    GATHER: '🧶',
    CHAT: '📩',
};

function Notifications() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;
    const [notifications, setNotifications] = useState([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const fetchAll = async () => {
            const data = await getNotifications(user?.userEmail);
            if (data.list) {
                setNotifications(data.list);
            }
        };
        fetchAll();
    }, []);

    const handleReadAll = async () => {
        await readAllNotifications(user?.userEmail);
        setNotifications(prev => prev.map(n => ({ ...n, IS_READ: 'Y' })));
    };

    const handleClick = async (noti) => {
        await readNotification(noti.NOTI_ID);
        setNotifications(prev =>
            prev.map(n => n.NOTI_ID === noti.NOTI_ID ? { ...n, IS_READ: 'Y' } : n)
        );
        // 클릭 시 해당 페이지로 이동
        if (noti.TARGET_TYPE === 'POST') navigate('/posts');
        else if (noti.TARGET_TYPE === 'PATTERN') navigate(`/patterns/${noti.TARGET_ID}`);
        else if (noti.TARGET_TYPE === 'SHOWCASE') navigate(`/works/${noti.TARGET_ID}`);
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.header}>
                <Typography className={styles.pageTitle}>알림</Typography>
                <Button variant="text" className={styles.readAllBtn}
                    onClick={handleReadAll}>
                    전체 읽음
                </Button>
            </Box>

            {notifications.length === 0 ? (
                <Typography className={styles.empty}>알림이 없어요 🧶</Typography>
            ) : (
                notifications.filter(noti => noti.NOTI_TYPE !== 'CHAT').map(noti => (
                    <Box key={noti.NOTI_ID}
                        className={`${styles.notiItem} ${noti.IS_READ === 'N' ? styles.unread : ''}`}
                        onClick={() => handleClick(noti)}>
                        <Box className={styles.notiLeft}>
                            <Typography className={styles.notiIcon}>
                                {NOTI_ICONS[noti.NOTI_TYPE] || '🔔'}
                            </Typography>
                            {noti.SENDER_PROFILE_IMG || noti.SENDER_NICKNAME ? (
                                <AvatarItem
                                    src={noti.SENDER_PROFILE_IMG}
                                    nickname={noti.SENDER_NICKNAME}
                                    size={36}
                                />
                            ) : null}
                        </Box>
                        <Box className={styles.notiBody}>
                            <Typography className={styles.notiMessage}>{noti.MESSAGE}</Typography>
                            <Typography className={styles.notiDate}>
                                {new Date(noti.CREATED_AT).toLocaleDateString()}
                            </Typography>
                        </Box>
                        {noti.IS_READ === 'N' && (
                            <Box className={styles.unreadDot}/>
                        )}
                    </Box>
                ))
            )}
            <RightSidebar />
        </Box>
    );
}

export default Notifications;