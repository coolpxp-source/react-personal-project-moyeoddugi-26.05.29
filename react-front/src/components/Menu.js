import React from 'react';
import { 
  Drawer, List, ListItemButton, ListItemText, 
  ListItemIcon, Typography, Toolbar, Avatar, Box, Divider, TextField  
} from '@mui/material';
import { Search } from '@mui/icons-material'; // 아이콘
import { Home } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Menu.module.css';
import { jwtDecode } from 'jwt-decode';



const topMenuItems = [
  { text: '게시글 작성', icon: '✏️', path: '/write' },
  { text: '나의 채팅방', icon: '💬', path: '/chat', badge: 3 },
];

const menuItems = [
  { text: '홈', icon: '🏠', path: '/main' },
  { text: '도안 공유', icon: '🧶', path: '/patterns' },
  { text: '작품 자랑', icon: '🎨', path: '/works' },
  { text: '뜨개 지도', icon: '📍', path: '/places' },
  { text: '모여 게시판', icon: '💬', path: '/posts' },
];

function Menu() {
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;
  const navigate = useNavigate();
  const handleLogout = () => {
      localStorage.removeItem('token');
      navigate('/');
  }
  return (

    <Drawer
      variant="permanent"
      sx={{
        width: 300, // 너비 설정
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 320, // Drawer 내부의 너비 설정
          boxSizing: 'border-box',
          backgroundColor: '#FAF6F0',
          borderRight: '1px solid #E8D5B7'
        },
      }}
    >
      {/* 로고 이미지 부분 */}
      <Link to="/main" style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <img src="/logo/logo_title.png" alt="모여뜨기" style={{ width: '120px' }}/>
      </Link>
      
      {/* 프로필 영역 */}
      <Box 
        sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}
      >
        <Avatar 
            src={user?.profileImg || ''}  /* 이미지 있으면 이미지, 없으면 글자 */
            sx={{ backgroundColor: '#C4956A' }}
        >
            {!user?.profileImg && (user?.userName?.charAt(0) || '👤')}
        </Avatar>
        <Typography sx={{ color: '#7B4F2E', fontWeight: 'bold' }}>
          {user?.userNickname || '닉네임'}
        </Typography>
      </Box>

      <Divider sx={{ borderColor: '#E8D5B7' }} />
      {/* 상단 메뉴 */}
      <List>
        {topMenuItems.map((item) => (
          <ListItemButton component={Link} to={item.path} key={item.text}
            sx={{ '&:hover': { backgroundColor: '#F0E6D3' } }}>
            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} sx={{ color: '#5C3D2E' }}/>
            {item.badge && (
              <Box sx={{ 
                backgroundColor: '#E53935', color: 'white',
                borderRadius: '50%', width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px'
              }}>
                {item.badge}
              </Box>
            )}
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ borderColor: '#E8D5B7' }} />
      {/* 검색창 */}
      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          fullWidth size="small" placeholder="검색"
          InputProps={{
            startAdornment: <Search sx={{ color: '#B08060', mr: 1 }} />
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': { borderRadius: 3 },
            backgroundColor: '#F5F0E8'
          }}
        />
      </Box>

      {/* 마이페이지 */}
      <List>
        <ListItemButton component={Link} to="/mypage"
          sx={{ '&:hover': { backgroundColor: '#F0E6D3' } }}>
          <ListItemIcon sx={{ minWidth: 36 }}>👤</ListItemIcon>
          <ListItemText primary="마이페이지" sx={{ color: '#5C3D2E' }}/>
        </ListItemButton>
      </List>
      <Divider sx={{ borderColor: '#E8D5B7' }} />

      {/* 메뉴 목록 */}
      <List>
        {menuItems.map((item) => (
          <ListItemButton 
            component={Link} 
            to={item.path} 
            key={item.text}
            sx={{ '&:hover': { backgroundColor: '#F0E6D3' } }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              sx={{ color: '#5C3D2E' }}
            />
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ borderColor: '#E8D5B7' }} />

      {/* 로그아웃 */}
      <List>
        <ListItemButton
          component={Link} 
          to="/"
          sx={{ '&:hover': { backgroundColor: '#F0E6D3' } }}
          onClick={handleLogout}
        >
          <ListItemText 
            primary="로그아웃" 
            sx={{ color: '#B08060' }}
          />
        </ListItemButton>
      </List>
      
    </Drawer>
  );
};

export default Menu;