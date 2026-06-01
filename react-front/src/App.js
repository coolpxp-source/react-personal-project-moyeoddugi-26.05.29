import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Main from './pages/main/Main';
import Menu from './components/Menu'; 
import Sub from './components/Sub';
import Login from './pages/auth/Login'; 
import Register from './pages/auth/Register'; 
import PostList from './pages/posts/PostList'; 
import PostDetail  from './pages/posts/PostDetail'; 
import PostWrite  from './pages/posts/PostWrite'; 
import PlaceMap from './pages/places/PlaceMap';
import PlaceReport from './pages/places/PlaceReport';
import PatternList from './pages/patterns/PatternList';
import PatternWrite from './pages/patterns/PatternWrite';


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
          <Route path="/posts/write" element={<PostWrite />} />
          <Route path="/places" element={<PlaceMap />} />
          <Route path="/places/report" element={<PlaceReport />} />
          <Route path="/patterns" element={<PatternList />} />
          <Route path="/patterns/write" element={<PatternWrite />} />
        </Routes>
      </Box>
    </Box>
    
  );
}

export default App;
