import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Menu from './components/Menu';  // 메뉴(좌측)
import Login from './pages/auth/Login'; // 로그인
import Register from './pages/auth/Register'; // 회원가입
// 게시글 작성
import PostList from './pages/posts/PostList'; 
import PostDetail  from './pages/posts/PostDetail'; 
// 뜨개 지도
import PlaceMap from './pages/places/PlaceMap';
import PlaceReport from './pages/places/PlaceReport';
// 도안 공유
import PatternList from './pages/patterns/PatternList';
import PatternWrite from './pages/patterns/PatternWrite';
import PatternDetail from './pages/patterns/PatternDetail';
// 마이페이지
import MyPageEdit from './pages/mypage/MyPageEdit';
import UserPage from './pages/user/UserPage';
// 작품 자랑
import ShowcaseList from './pages/showcase/ShowcaseList';
import ShowcaseWrite from './pages/showcase/ShowcaseWrite';
import ShowcaseDetail from './pages/showcase/ShowcaseDetail';
// 알림창
import Notifications from './pages/notifications/Notifications';

import { Navigate } from 'react-router-dom'; // ▼ 추가
import { jwtDecode } from 'jwt-decode';


function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/join';

  // ▼ 추가
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      <CssBaseline />
      {!isAuthPage && <Menu />}
      <Box component="main" sx={{ 
          flexGrow: 1,
          p: isAuthPage ? 0 : 0,
          width: `calc(100% - 330px)`,
          overflow: 'hidden'
      }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Register />} />
          <Route path="/posts" element={<PostList />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/places" element={<PlaceMap />} />
          <Route path="/places/report" element={<PlaceReport />} />
          <Route path="/patterns" element={<PatternList />} />
          <Route path="/patterns/write" element={<PatternWrite />} />
          <Route path="/patterns/:id" element={<PatternDetail />} />
          <Route path="/user/:userId" element={<UserPage />} />
          <Route path="/mypage" element={<Navigate to={`/user/${user?.userId}`} replace />} />
          <Route path="/mypage/edit" element={<MyPageEdit />} />
          <Route path="/works" element={<ShowcaseList />} />
          <Route path="/works/write" element={<ShowcaseWrite />} />
          <Route path="/works/:postId" element={<ShowcaseDetail />} />
          <Route path="/notifications" element={<Notifications />} />

        </Routes>
      </Box>
    </Box>
    
  );
}

export default App;
