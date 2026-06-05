import React from 'react';
import { 
  Drawer, List, ListItemButton, ListItemText, 
  ListItemIcon, Typography, Box, Divider  
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Menu.module.css';
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';
import { getUnreadCount } from '../api/notifications';
import { getTotalUnreadCount } from '../api/chat';
import AvatarItem from './AvatarItem';

const topMenuItems = [
  { text: '알림', icon: '🔔', path: '/notifications' },
  { text: '나의 채팅방', icon: '💬', path: '/chat' },
];

const menuItems = [
  { text: '모여 홈', icon: '🏠', path: '/posts' },
  { text: '도안 공유', icon: '🧶', path: '/patterns' },
  { text: '작품 자랑', icon: '🎨', path: '/works' },
  { text: '뜨개 지도', icon: '📍', path: '/places' },
];

function Menu() {
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;
  const navigate = useNavigate();

  const handleLogout = () => {
      localStorage.removeItem('token');
      navigate('/');
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  useEffect(() => {
      if (!user?.userEmail) return;
      const fetchCount = async () => {
          const data = await getUnreadCount(user.userEmail);
          if (data.result) setUnreadCount(data.count);
          const chatCount = await getTotalUnreadCount(user.userEmail);
          setChatUnreadCount(chatCount);
      };
      fetchCount();
      const interval = setInterval(fetchCount,3000);
      return () => clearInterval(interval);
  }, [user?.userEmail]);

  return (
    <Drawer variant="permanent" classes={{ paper: styles.drawerPaper }}>

      {/* 로고 */}
      <Link to="/posts" className={styles.logoLink}>
          <img src="/logo/logo_title.png" alt="모여뜨기" className={styles.logoImg}/>
      </Link>

      {/* 프로필 */}
      <Box className={styles.profileBox}>
          <AvatarItem
              src={user?.profileImg}
              nickname={user?.userNickname}
              size={40}
              onClick={() => navigate('/mypage')}
          />
          <Typography className={styles.profileNick}>
              {user?.userNickname || '닉네임'}
          </Typography>
      </Box>

      <Divider className={styles.divider}/>

      {/* 상단 메뉴 */}
      <List>
          {topMenuItems.map((item) => (
              <ListItemButton component={Link} to={item.path} key={item.text}
                  className={styles.menuItem}>
                  <ListItemIcon className={styles.menuIcon}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} className={styles.menuText}/>
                  {item.text === '알림' && unreadCount > 0 && (
                      <Box className={styles.badge}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                      </Box>
                  )}
                  {item.text === '나의 채팅방' && chatUnreadCount > 0 && (
                      <Box className={styles.badge}>
                          {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                      </Box>
                  )}
              </ListItemButton>
          ))}
      </List>

      <Divider className={styles.divider}/>

      {/* 마이페이지 */}
      <List>
          <ListItemButton component={Link} to="/mypage" className={styles.menuItem}>
              <ListItemIcon className={styles.menuIcon}>👤</ListItemIcon>
              <ListItemText primary="마이페이지" className={styles.menuText}/>
          </ListItemButton>
      </List>

      <Divider className={styles.divider}/>

      {/* 메뉴 목록 */}
      <List>
          {menuItems.map((item) => (
              <ListItemButton component={Link} to={item.path} key={item.text}
                  className={styles.menuItem}>
                  <ListItemIcon className={styles.menuIcon}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} className={styles.menuText}/>
              </ListItemButton>
          ))}
      </List>

      <Divider className={styles.divider}/>

      {/* 로그아웃 */}
      <List>
          <ListItemButton component={Link} to="/" className={styles.menuItem}
              onClick={handleLogout}>
              <ListItemText primary="로그아웃" className={styles.logoutText}/>
          </ListItemButton>
      </List>
    </Drawer>
  );
}

export default Menu;