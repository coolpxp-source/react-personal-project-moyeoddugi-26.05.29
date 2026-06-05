import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Menu from './components/Menu';  // 메뉴(좌측)
import Login from './pages/auth/Login'; // 로그인
import Register from './pages/auth/Register'; // 회원가입
// 게시글 작성
import PostList from './pages/posts/PostList'; 
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
// 채팅방
import Chat from './pages/chat/Chat';
// 애니메이션 효과
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';

import { Navigate } from 'react-router-dom'; // ▼ 추가
import { jwtDecode } from 'jwt-decode';


function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/join';

  // ▼ 추가
  const token = localStorage.getItem('token');
  const user = token ? jwtDecode(token) : null;

  // ▼ PrivateRoute
  const PrivateRoute = ({ children }) => {
      const token = localStorage.getItem('token');
      if (!token) {
          alert('로그인이 필요해요!');
          return <Navigate to="/" replace />;
      }
      return children;
  };

  // ▼ 페이지 래퍼 컴포넌트 추가
  const PageWrapper = ({ children }) => (
      <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ width: '100%', height: '100%' }}
      >
          {children}
      </motion.div>
  );


  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', backgroundColor: '#FAF6F0', minHeight: '100vh' }}>
      <CssBaseline />
      {!isAuthPage && <Menu />}
      <Box component="main" sx={{ 
          flexGrow: 1,
          p: 0,
          marginLeft: '320px', // ← width 대신 marginLeft 사용
          width: 'calc(100% - 320px)',
          overflow: 'hidden'
      }}>
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/join" element={<PageWrapper><Register /></PageWrapper>} />

                {/* 로그인 없이 가능 */}
                <Route path="/posts" element={<PageWrapper><PostList /></PageWrapper>} />
                <Route path="/works" element={<PageWrapper><ShowcaseList /></PageWrapper>} />
                <Route path="/works/:postId" element={<PageWrapper><ShowcaseDetail /></PageWrapper>} />

                {/* 로그인 필요 — PrivateRoute 안쪽에 PageWrapper */}
                <Route path="/places" element={<PrivateRoute><PageWrapper><PlaceMap /></PageWrapper></PrivateRoute>} />
                <Route path="/places/report" element={<PrivateRoute><PageWrapper><PlaceReport /></PageWrapper></PrivateRoute>} />
                <Route path="/patterns" element={<PrivateRoute><PageWrapper><PatternList /></PageWrapper></PrivateRoute>} />
                <Route path="/patterns/write" element={<PrivateRoute><PageWrapper><PatternWrite /></PageWrapper></PrivateRoute>} />
                <Route path="/patterns/:id" element={<PrivateRoute><PageWrapper><PatternDetail /></PageWrapper></PrivateRoute>} />
                <Route path="/user/:userId" element={<PrivateRoute><PageWrapper><UserPage /></PageWrapper></PrivateRoute>} />
                <Route path="/mypage" element={<PrivateRoute><Navigate to={`/user/${user?.userId}`} replace /></PrivateRoute>} />
                <Route path="/mypage/edit" element={<PrivateRoute><PageWrapper><MyPageEdit /></PageWrapper></PrivateRoute>} />
                <Route path="/works/write" element={<PrivateRoute><PageWrapper><ShowcaseWrite /></PageWrapper></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><PageWrapper><Notifications /></PageWrapper></PrivateRoute>} />
                <Route path="/chat" element={<PrivateRoute><PageWrapper><Chat /></PageWrapper></PrivateRoute>} />
            </Routes>
        </AnimatePresence>
      </Box>
    </Box>
    
  );
}

export default App;
