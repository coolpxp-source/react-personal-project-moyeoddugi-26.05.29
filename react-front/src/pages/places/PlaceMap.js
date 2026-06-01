import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Chip, TextField, Button, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';
import { getPlaces } from '../../api/places';
import { jwtDecode } from 'jwt-decode';
import styles from './PlaceMap.module.css';
import RightSidebar from '../../components/RightSidebar';
import { useNavigate } from 'react-router-dom';
import { getPlaceReviews, createPlaceReview, deletePlaceReview } from '../../api/placeReviews';

const ALLOW_STATUS_COLORS = {
    '허용': '#4CAF50',
    '금지': '#F44336',
    '모르겠어요': '#FF9800',
};

const TAG_FILTERS = [
    { key: 'HAS_WIDE_TABLE', label: '넓은 테이블' },
    { key: 'HAS_OUTLET', label: '콘센트' },
    { key: 'IS_QUIET', label: '조용함' },
    { key: 'NO_TIME_LIMIT', label: '시간제 없음' },
    { key: 'HAS_MANY_SEATS', label: '좌석 많음' },
    { key: 'NO_MIN_ORDER', label: '최소 주문 없음' },
    { key: 'HAS_PARKING', label: '주차 가능' },
    { key: 'IS_24HOURS', label: '24시간' },
    { key: 'HAS_OUTDOOR', label: '야외 테이블' },
    { key: 'PET_FRIENDLY', label: '애견동반' },
    { key: 'HAS_FOOD', label: '식사 가능' },
    { key: 'HAS_RESTROOM', label: '화장실 有' },
];

const FILTER_CHIPS = ['전체', '허용', '금지', '모르겠어요'];

function PlaceMap() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;
    const [tagFilters, setTagFilters] = useState([]);
    const navigate = useNavigate();

    const [places, setPlaces] = useState([]);
    const [filter, setFilter] = useState('전체');
    const [search, setSearch] = useState('');
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [searchResults, setSearchResults] = useState([]); // ▼ 추가: 검색 미리보기
    const markerImageCache = {}; // ▼ 추가: 마커 이미지 캐시
    const [reviews, setReviews] = useState([]);
    const [reviewInput, setReviewInput] = useState('');
    const [reviewAllowStatus, setReviewAllowStatus] = useState('');

    // 마커 이미지 SVG로 생성
    const getMarkerImage = (color) => {
        // ▼ 캐시에 있으면 재사용
        if (markerImageCache[color]) return markerImageCache[color];
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="35" viewBox="0 0 24 35">
                <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 23 12 23S24 21 24 12C24 5.4 18.6 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
                <circle cx="12" cy="12" r="5" fill="white"/>
            </svg>
        `;
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        // ▼ 수정: 변수에 저장 후 캐시에 넣고 return
        const markerImage = new window.kakao.maps.MarkerImage(
            url,
            new window.kakao.maps.Size(24, 35),
            { offset: new window.kakao.maps.Point(12, 35) }
        );
        markerImageCache[color] = markerImage; // ▼ return 전에 캐시 저장
        return markerImage;
    };

    const toggleTagFilter = (key) => {
        setTagFilters(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    // ▼ 추가: 검색 미리보기
    const handleSearchInput = (value) => {
        setSearch(value);
        if (!value.trim()) {
            setSearchResults([]);
            return;
        }
        // DB 장소 중 검색어 포함된 것 필터링
        const results = places.filter(p =>
            p.PLACE_NAME.includes(value) || p.ADDRESS.includes(value)
        );
        setSearchResults(results.slice(0, 5)); // 최대 5개
    };

    // ▼ 수정: 검색 결과 클릭 시 지도 이동
    const handleResultClick = (place) => {
        const coords = new window.kakao.maps.LatLng(place.LATITUDE, place.LONGITUDE);
        mapInstanceRef.current.panTo(coords);
        mapInstanceRef.current.setLevel(4);
        handlePlaceSelect(place); // ▼ 수정
        setSearch(place.PLACE_NAME);
        setSearchResults([]);
    };

    // ▼ 추가: 장소 검색 후 지도 이동
    const handleSearch = () => {
        if (!search.trim()) return;
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(search, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                mapInstanceRef.current.panTo(coords);
            } else {
                // 주소 검색 실패 시 키워드 검색으로 시도
                const places = new window.kakao.maps.services.Places();
                places.keywordSearch(search, (result, status) => {
                    if (status === window.kakao.maps.services.Status.OK) {
                        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
                        mapInstanceRef.current.panTo(coords);
                    }
                });
            }
        });
    };

    // ▼ 추가: 리뷰 조회
    const fetchReviews = async (placeId) => {
        const data = await getPlaceReviews(placeId);
        if (data.list) setReviews(data.list);
    };

    // ▼ 추가: 마커 클릭 시 리뷰도 같이 조회
    const handlePlaceSelect = (place) => {
        setSelectedPlace(place);
        setReviews([]);
        setReviewInput('');
        setReviewAllowStatus('');
        fetchReviews(place.PLACE_ID);
    };

    // ▼ 추가: 리뷰 등록
    const handleReviewSubmit = async () => {
        if (!reviewInput.trim()) return alert('내용을 입력해주세요.');
        if (!reviewAllowStatus) return alert('허용 여부를 선택해주세요.'); // ▼ 추가
        const data = await createPlaceReview({
            userEmail: user?.userEmail,
            placeId: selectedPlace.PLACE_ID,
            content: reviewInput,
            allowStatus: reviewAllowStatus || null,
        });
        if (data.result) {
            fetchReviews(selectedPlace.PLACE_ID);
            setReviewInput('');
            setReviewAllowStatus('');
        } else {
            alert(data.message);
        }
    };

    // ▼ 추가: 리뷰 삭제
    const handleReviewDelete = async (reviewId) => {
        if (!window.confirm('리뷰를 삭제할까요?')) return;
        const data = await deletePlaceReview(reviewId);
        if (data.result) fetchReviews(selectedPlace.PLACE_ID);
    };

    // 지도 초기화
    useEffect(() => {
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_KEY}&libraries=services&autoload=false`;
        script.async = true;
        script.onload = () => {
            window.kakao.maps.load(() => {
                const container = mapRef.current;
                const options = {
                    center: new window.kakao.maps.LatLng(37.5665, 126.9780),
                    level: 7,
                };
                mapInstanceRef.current = new window.kakao.maps.Map(container, options);
                setMapReady(true);
            });
        };
        document.head.appendChild(script);

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    // 장소 데이터 로드
    useEffect(() => {
        const fetchPlaces = async () => {
            const data = await getPlaces();
            if (data.list) setPlaces(data.list);
        };
        fetchPlaces();
    }, []);

    // 마커 표시
    useEffect(() => {
        if (!mapInstanceRef.current || places.length === 0) return;

        // 기존 마커 제거
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const filtered = places.filter(p => {
            const matchFilter = filter === '전체' || p.ALLOW_STATUS === filter;
            const matchSearch = search === '' || 
                p.PLACE_NAME.includes(search) || 
                p.ADDRESS.includes(search);
            // ▼ 추가: 시설 태그 필터
            const matchTags = tagFilters.length === 0 || 
                tagFilters.every(tag => p[tag] === 'Y');
            return matchFilter && matchSearch && matchTags;
        });
        
        filtered.forEach(place => {
            const position = new window.kakao.maps.LatLng(place.LATITUDE, place.LONGITUDE);
            const markerColor = ALLOW_STATUS_COLORS[place.ALLOW_STATUS] || '#9E9E9E';
            const markerImg = getMarkerImage(markerColor);
            const marker = new window.kakao.maps.Marker({
                position,
                map: mapInstanceRef.current,
                title: place.PLACE_NAME,
                image: markerImg,
            });

            window.kakao.maps.event.addListener(marker, 'click', () => {
                handlePlaceSelect(place); // ▼ 수정: setSelectedPlace → handlePlaceSelect
                mapInstanceRef.current.panTo(position);
            });

            markersRef.current.push(marker);
        });
    }, [places, filter, search, tagFilters, mapReady]);

    return (
        <Box className={styles.container}>
            {/* 필터 칩 */}
            <Box className={styles.filterRow}>
                {/* 뜨개 허용 여부 */}
                <Box className={styles.filterGroup}>
                    <Typography className={styles.filterLabel}>뜨개 허용 여부</Typography>
                    <Box className={styles.statusChips}>
                        {FILTER_CHIPS.map(chip => (
                            <Chip key={chip} label={chip} size="small"
                                onClick={() => setFilter(chip)}
                                style={{
                                    backgroundColor: filter === chip ? '#7B4F2E' : '#F5EDD8',
                                    color: filter === chip ? '#ffffff' : '#7B4F2E',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* 이런 곳 원해요 */}
                <Box className={styles.filterGroup}>
                    <Typography className={styles.filterLabel}>이런 곳 원해요</Typography>
                    <Box className={styles.tagChips}>
                        {TAG_FILTERS.map(tag => (
                            <Chip key={tag.key} label={tag.label} size="small"
                                onClick={() => toggleTagFilter(tag.key)}
                                style={{
                                    backgroundColor: tagFilters.includes(tag.key) ? '#C4956A' : '#F5EDD8',
                                    color: tagFilters.includes(tag.key) ? '#ffffff' : '#7B4F2E',
                                    cursor: 'pointer',
                                }}
                            />
                        ))}
                    </Box>
                </Box>
                {/* 검색창 */}
                <Box className={styles.searchRow}>
                    <Box className={styles.searchWrapper}>
                        <TextField size="small" placeholder="장소 검색"
                            value={search}
                            onChange={(e) => handleSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: '#B08060', fontSize: 16 }}/>
                                    </InputAdornment>
                                )
                            }}
                        />
                        {/* ▼ 추가: 미리보기 드롭다운 */}
                        {searchResults.length > 0 && (
                            <Box className={styles.searchDropdown}>
                                {searchResults.map(place => (
                                    <Box key={place.PLACE_ID} className={styles.searchDropdownItem}
                                        onClick={() => handleResultClick(place)}>
                                        <Typography className={styles.dropdownName}>
                                            {place.PLACE_NAME}
                                        </Typography>
                                        <Typography className={styles.dropdownAddress}>
                                            {place.ADDRESS}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                    <Button variant="contained" className={styles.searchBtn}
                        onClick={handleSearch}>
                        검색
                    </Button>
                </Box>
            </Box>

            {/* 지도 */}
            <Box className={styles.mapLayout}>
                <Box className={styles.mapArea}>
                    <Box ref={mapRef} className={styles.map}/>

                    {/* 범례 */}
                    <Box className={styles.legend}> 
                        {Object.entries(ALLOW_STATUS_COLORS).map(([label, color]) => (
                            <Box key={label} className={styles.legendItem}>
                                <Box className={styles.legendDot} style={{ backgroundColor: color }}/>
                                <Typography className={styles.legendText}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                    {/* 카페 제보하기 버튼 */}
                    <Button variant="contained" className={styles.reportBtn}
                        onClick={() => navigate('/places/report')}>
                        + 카페 제보하기
                    </Button>
                </Box>

                {/* 선택된 장소 상세 */}
                {selectedPlace && (
                    <Box className={styles.placeDetail}>
                        <Typography className={styles.placeName}>{selectedPlace.PLACE_NAME}</Typography>
                        <Chip label={selectedPlace.ALLOW_STATUS} size="small"
                            style={{
                                backgroundColor: ALLOW_STATUS_COLORS[selectedPlace.ALLOW_STATUS],
                                color: '#fff', marginBottom: 8
                            }}
                        />
                        <Typography className={styles.placeAddress}>{selectedPlace.ADDRESS}</Typography>

                        {/* 태그 */}
                        <Box className={styles.tagRow}>
                            {selectedPlace.HAS_WIDE_TABLE === 'Y' && <Chip label="넓은 테이블" size="small" className={styles.tag}/>}
                            {selectedPlace.HAS_OUTLET === 'Y' && <Chip label="콘센트" size="small" className={styles.tag}/>}
                            {selectedPlace.IS_QUIET === 'Y' && <Chip label="조용함" size="small" className={styles.tag}/>}
                            {selectedPlace.NO_TIME_LIMIT === 'Y' && <Chip label="시간제 없음" size="small" className={styles.tag}/>}
                            {selectedPlace.HAS_MANY_SEATS === 'Y' && <Chip label="좌석 많음" size="small" className={styles.tag}/>}
                            {selectedPlace.NO_MIN_ORDER === 'Y' && <Chip label="최소 주문 없음" size="small" className={styles.tag}/>}
                            {selectedPlace.HAS_PARKING === 'Y' && <Chip label="주차 가능" size="small" className={styles.tag}/>}
                            {selectedPlace.IS_24HOURS === 'Y' && <Chip label="24시간" size="small" className={styles.tag}/>}
                            {selectedPlace.HAS_OUTDOOR === 'Y' && <Chip label="야외 테이블" size="small" className={styles.tag}/>}
                            {selectedPlace.PET_FRIENDLY === 'Y' && <Chip label="애견동반" size="small" className={styles.tag}/>}
                            {selectedPlace.HAS_FOOD === 'Y' && <Chip label="식사 가능" size="small" className={styles.tag}/>}
                            {selectedPlace.HAS_RESTROOM === 'Y' && <Chip label="화장실 有" size="small" className={styles.tag}/>}
                        </Box>

                        {/* ▼ 추가: 리뷰 목록 */}
                        <Box className={styles.reviewSection}>
                            <Typography className={styles.reviewTitle}>리뷰 ({reviews.length})</Typography>
                            {reviews.length === 0 ? (
                                <Typography className={styles.noReview}>아직 리뷰가 없어요 🧶</Typography>
                            ) : (
                                reviews.map(review => (
                                    <Box key={review.REVIEW_ID} className={styles.reviewItem}>
                                        <Box className={styles.reviewHeader}>
                                            <Typography className={styles.reviewNick}>{review.NICKNAME}</Typography>
                                            {review.ALLOW_STATUS && (
                                                <Chip label={review.ALLOW_STATUS} size="small"
                                                    style={{
                                                        backgroundColor: ALLOW_STATUS_COLORS[review.ALLOW_STATUS],
                                                        color: '#fff', fontSize: 10, height: 18
                                                    }}
                                                />
                                            )}
                                            {review.NICKNAME === user?.userNickname && (
                                                <Button size="small" className={styles.reviewDeleteBtn}
                                                    onClick={() => handleReviewDelete(review.REVIEW_ID)}>
                                                    삭제
                                                </Button>
                                            )}
                                        </Box>
                                        <Typography className={styles.reviewContent}>{review.CONTENT}</Typography>
                                        <Typography className={styles.reviewDate}>
                                            {new Date(review.CREATED_AT).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                ))
                            )}
                        </Box>

                        {/* ▼ 추가: 리뷰 작성 */}
                        <Box className={styles.reviewInputSection}>
                            <Box className={styles.reviewStatusRow}>
                                {['허용', '금지', '모르겠어요'].map(status => (
                                    <Chip key={status} label={status} size="small"
                                        onClick={() => setReviewAllowStatus(
                                            reviewAllowStatus === status ? '' : status
                                        )}
                                        style={{
                                            backgroundColor: reviewAllowStatus === status
                                                ? ALLOW_STATUS_COLORS[status] : '#F5EDD8',
                                            color: reviewAllowStatus === status ? '#fff' : '#7B4F2E',
                                            cursor: 'pointer', fontSize: 10,
                                        }}
                                    />
                                ))}
                            </Box>
                            <Box className={styles.reviewInputRow}>
                                <TextField fullWidth size="small"
                                    placeholder="리뷰를 입력하세요"
                                    value={reviewInput}
                                    onChange={(e) => setReviewInput(e.target.value)}
                                />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <Button size="small" className={styles.closeBtn}
                                onClick={() => setSelectedPlace(null)}
                                sx={{ flex: 1 }}>
                                닫기
                            </Button>
                            <Button variant="contained" className={styles.reviewSubmitBtn}
                                onClick={handleReviewSubmit}
                                sx={{ flex: 1 }}>
                                등록
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
            {/* 추천 카페 섹션 */}
            <Box className={styles.recommendSection}>
                <Typography className={styles.recommendTitle}>🧶 뜨개하기 좋은 카페 추천</Typography>
                <Box className={styles.recommendCards}>
                    {places
                        .filter(p => p.ALLOW_STATUS === '허용' && (p.HAS_OUTLET === 'Y' || p.HAS_WIDE_TABLE === 'Y'))
                        .slice(0, 4)
                        .map(place => (
                            <Box key={place.PLACE_ID} className={styles.recommendCard}
                                onClick={() => handleResultClick(place)}>
                                <Box className={styles.recommendCardHeader}>
                                    <Typography className={styles.recommendName}>{place.PLACE_NAME}</Typography>
                                    <Chip label={place.ALLOW_STATUS} size="small"
                                        style={{
                                            backgroundColor: ALLOW_STATUS_COLORS[place.ALLOW_STATUS],
                                            color: '#fff', fontSize: 10, height: 20
                                        }}
                                    />
                                </Box>
                                <Typography className={styles.recommendAddress}>{place.ADDRESS}</Typography>
                                <Box className={styles.recommendTags}>
                                    {place.HAS_WIDE_TABLE === 'Y' && <Chip label="넓은 테이블" size="small" className={styles.tag}/>}
                                    {place.HAS_OUTLET === 'Y' && <Chip label="콘센트" size="small" className={styles.tag}/>}
                                    {place.IS_QUIET === 'Y' && <Chip label="조용함" size="small" className={styles.tag}/>}
                                    {place.NO_TIME_LIMIT === 'Y' && <Chip label="시간제 없음" size="small" className={styles.tag}/>}
                                </Box>
                            </Box>
                        ))
                    }
                </Box>
            </Box>
            <RightSidebar />
        </Box>
    );
}

export default PlaceMap;