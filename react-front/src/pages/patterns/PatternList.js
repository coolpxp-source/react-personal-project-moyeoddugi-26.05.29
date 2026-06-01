import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, TextField, Button, Avatar, InputAdornment, Pagination } from '@mui/material';
import { Search, Favorite, FavoriteBorder } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getPatterns } from '../../api/patterns';
import { toggleLike, getLikes } from '../../api/likes';
import { jwtDecode } from 'jwt-decode';
import styles from './PatternList.module.css';
import RightSidebar from '../../components/RightSidebar';

const NEEDLE_TYPES = ['코바늘', '대바늘'];
const DIFFICULTIES = ['전체', '입문', '초급', '중급', '고급'];
const CATEGORIES = ['전체', '소품', '가방', '모자', '의류', '인형', '선물용'];

const DIFFICULTY_COLORS = {
    '입문': { bg: '#E8F5E9', color: '#2E7D32' },
    '초급': { bg: '#E3F2FD', color: '#1565C0' },
    '중급': { bg: '#FFF3E0', color: '#E65100' },
    '고급': { bg: '#FCE4EC', color: '#C62828' },
};

function PatternList() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [needleType, setNeedleType] = useState('코바늘');
    const [difficulty, setDifficulty] = useState('전체');
    const [category, setCategory] = useState('전체');
    const [search, setSearch] = useState('');
    const [patterns, setPatterns] = useState([]);
    const [likes, setLikes] = useState({});
    const [page, setPage] = useState(1);
    const PER_PAGE = 6;

    const fetchPatterns = async () => {
        const data = await getPatterns(
            needleType,
            difficulty === '전체' ? null : difficulty,
            category === '전체' ? null : category
        );
        if (data.list) setPatterns(data.list);
    };

    useEffect(() => {
        fetchPatterns();
        setPage(1);
    }, [needleType, difficulty, category, needleType]);

    // 좋아요 조회
    useEffect(() => {
        if (patterns.length === 0) return;
        const fetchLikes = async () => {
            for (const pattern of patterns) {
                const data = await getLikes('PATTERN', pattern.PATTERN_ID, user?.userEmail);
                if (data.result) {
                    setLikes(prev => ({
                        ...prev,
                        [pattern.PATTERN_ID]: { count: data.count, liked: data.liked }
                    }));
                }
            }
        };
        fetchLikes();
    }, [patterns.length]);

    const handleLike = async (e, patternId) => {
        e.stopPropagation();
        const data = await toggleLike(user?.userEmail, 'PATTERN', patternId);
        if (data.result) {
            setLikes(prev => ({
                ...prev,
                [patternId]: {
                    count: data.liked
                        ? (prev[patternId]?.count || 0) + 1
                        : (prev[patternId]?.count || 1) - 1,
                    liked: data.liked
                }
            }));
        }
    };

    const filteredPatterns = patterns.filter(p =>
        p.TITLE.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredPatterns.length / PER_PAGE);
    const pagedPatterns = filteredPatterns.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <Box className={styles.container}>
            {/* 상단 탭 - 코바늘/대바늘 */}
            <Box className={styles.needleTabs}>
                {NEEDLE_TYPES.map(type => (
                    <Box key={type}
                        className={`${styles.needleTab} ${needleType === type ? styles.needleTabActive : ''}`}
                        onClick={() => setNeedleType(type)}>
                        <Typography className={styles.needleTabText}>{type} 도안</Typography>
                    </Box>
                ))}
            </Box>

            {/* 필터 영역 */}
            <Box className={styles.filterArea}>
                {/* 난이도 + 카테고리 */}
                <Box className={styles.filterRow}>
                    {DIFFICULTIES.map(d => (
                        <Chip key={d} label={d} size="small"
                            onClick={() => setDifficulty(d)}
                            style={{
                                backgroundColor: difficulty === d ? '#7B4F2E' : '#F5EDD8',
                                color: difficulty === d ? '#fff' : '#7B4F2E',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                    <Box className={styles.divider}/>
                    {CATEGORIES.map(c => (
                        <Chip key={c} label={c} size="small"
                            onClick={() => setCategory(c)}
                            style={{
                                backgroundColor: category === c ? '#C4956A' : '#F5EDD8',
                                color: category === c ? '#fff' : '#7B4F2E',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </Box>

                {/* 검색창 */}
                <TextField size="small" placeholder="도안 검색"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className={styles.searchInput}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#B08060', fontSize: 18 }}/>
                            </InputAdornment>
                        )
                    }}
                />
            </Box>

            {/* 카드 그리드 */}
            <Box className={styles.mainLayout}>
                {pagedPatterns.length === 0 ? (
                    <Typography className={styles.empty}>도안이 없어요 🧶</Typography>
                ) : (
                    <Box className={styles.grid}>
                        {pagedPatterns.map(pattern => (
                            <Box key={pattern.PATTERN_ID} className={styles.card}
                                onClick={() => navigate(`/patterns/${pattern.PATTERN_ID}`)}>
                                
                                {/* ▼ 수정: wrapper로 감싸기 */}
                                <Box className={styles.cardImgWrapper}>
                                    {pattern.THUMBNAIL_IMG ? (
                                        <img src={`http://localhost:3010${pattern.THUMBNAIL_IMG}`}
                                            alt={pattern.TITLE} className={styles.cardImgEl}/>
                                    ) : (
                                        <Box className={styles.cardImgEmpty}>
                                            <Typography className={styles.noImg}>도안 이미지</Typography>
                                        </Box>
                                    )}

                                    {/* 오버레이 */}
                                    <Box className={styles.cardOverlay}>
                                        <Typography className={styles.cardTitle}>{pattern.TITLE}</Typography>
                                        <Box className={styles.cardMeta}>
                                            <Avatar sx={{ width: 20, height: 20, backgroundColor: '#C4956A', fontSize: 10 }}>
                                                {pattern.NICKNAME?.charAt(0)}
                                            </Avatar>
                                            <Typography className={styles.cardNick}>{pattern.NICKNAME}</Typography>
                                            <Typography className={styles.cardDate}>
                                                {new Date(pattern.CREATED_AT).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box className={styles.cardTags}>
                                            <Chip label={pattern.NEEDLE_TYPE} size="small"
                                                style={{
                                                    backgroundColor: pattern.NEEDLE_TYPE === '코바늘' ? '#E8F5E9' : '#E3F2FD',
                                                    color: pattern.NEEDLE_TYPE === '코바늘' ? '#2E7D32' : '#1565C0',
                                                    fontSize: 10, height: 20
                                                }}
                                            />
                                            {pattern.DIFFICULTY && (
                                                <Chip label={pattern.DIFFICULTY} size="small"
                                                    style={{
                                                        backgroundColor: DIFFICULTY_COLORS[pattern.DIFFICULTY]?.bg,
                                                        color: DIFFICULTY_COLORS[pattern.DIFFICULTY]?.color,
                                                        fontSize: 10, height: 20
                                                    }}
                                                />
                                            )}
                                            {pattern.TAGS?.filter(tag => tag && tag.trim() !== '' && !tag.startsWith('['))
                                                .map((tag, idx) => (
                                                    <Chip key={`${tag}-${idx}`} label={tag} size="small"
                                                        className={styles.categoryChip}/>
                                                ))
                                            }
                                        </Box>
                                        <Box className={styles.cardFooter}>
                                            <Box className={styles.footerItem}
                                                onClick={(e) => handleLike(e, pattern.PATTERN_ID)}>
                                                {likes[pattern.PATTERN_ID]?.liked
                                                    ? <Favorite sx={{ fontSize: 14, color: '#E0A0A0' }}/>
                                                    : <FavoriteBorder sx={{ fontSize: 14, color: '#E0A0A0' }}/>
                                                }
                                                <Typography className={styles.footerText}>
                                                    {likes[pattern.PATTERN_ID]?.count || 0}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <Box className={styles.pagination}>
                        <Pagination count={totalPages} page={page}
                            onChange={(e, val) => setPage(val)}
                            sx={{
                                '& .MuiPaginationItem-root': { color: '#7B4F2E' },
                                '& .Mui-selected': { backgroundColor: '#7B4F2E !important', color: '#fff' },
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* 도안 올리기 버튼 */}
            <Button variant="contained" className={styles.uploadBtn}
                onClick={() => navigate('/patterns/write')}>
                도안 올리기
            </Button>

            <RightSidebar />
        </Box>
    );
}

export default PatternList;