import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Main from './pages/main/Main'; // 메인
import Menu from './components/Menu';  // 메뉴(좌측)
import Sub from './components/Sub'; // 미사용
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
import MyPage from './pages/mypage/MyPage';
import MyPageEdit from './pages/mypage/MyPageEdit';
// 작품 자랑
import ShowcaseList from './pages/showcase/ShowcaseList';
import ShowcaseWrite from './pages/showcase/ShowcaseWrite';


function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/join';

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
          <Route path="/main" element={<Main />} />
          <Route path="/posts" element={<PostList />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/places" element={<PlaceMap />} />
          <Route path="/places/report" element={<PlaceReport />} />
          <Route path="/patterns" element={<PatternList />} />
          <Route path="/patterns/write" element={<PatternWrite />} />
          <Route path="/patterns/:id" element={<PatternDetail />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/edit" element={<MyPageEdit />} />
          <Route path="/works" element={<ShowcaseList />} />
          <Route path="/works/write" element={<ShowcaseWrite />} />
        </Routes>
      </Box>
    </Box>
    
  );
}

export default App;
