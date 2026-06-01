import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { createPlace } from '../../api/places';
import { jwtDecode } from 'jwt-decode';
import styles from './PlaceReport.module.css';

const ALLOW_STATUS_LIST = [
    { label: '허용', color: '#4CAF50' },
    { label: '불가', color: '#F44336' },
    { label: '모르겠어요', color: '#FF9800' },
];

const TAG_LIST = [
    { key: 'hasRestroom', label: '화장실 有', color: '#E8D5B7' },
    { key: 'hasOutlet', label: '콘센트', color: '#D5E8D4' },
    { key: 'isQuiet', label: '조용함', color: '#DAE8FC' },
    { key: 'noTimeLimit', label: '시간제', color: '#FFE6CC' },
    { key: 'hasManySeats', label: '좌석 많음', color: '#E1D5E7' },
    { key: 'hasWideTable', label: '넓은 테이블', color: '#FFF2CC' },
    { key: 'hasParking', label: '주차 가능', color: '#F8CECC' },
    { key: 'is24hours', label: '24시', color: '#D5E8D4' },
    { key: 'hasOutdoor', label: '야외 테이블', color: '#DAE8FC' },
    { key: 'petFriendly', label: '애견동반', color: '#FFE6CC' },
    { key: 'hasFood', label: '식사 가능', color: '#E1D5E7' },
    { key: 'noMinOrder', label: '최소 주문 없음', color: '#FFF2CC' },
];

function PlaceReport() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = token ? jwtDecode(token) : null;

    const [form, setForm] = useState({
        placeName: '',
        address: '',
        latitude: '',
        longitude: '',
        allowStatus: '',
        tags: [],
        comment: '',
        image: null,
    });
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.async = true;
        document.head.appendChild(script);
        return () => {
            if (document.head.contains(script)) document.head.removeChild(script);
        };
    }, []);

    const handleAddressSearch = () => {
        new window.daum.Postcode({
            oncomplete: (data) => {
                const geocoder = new window.kakao.maps.services.Geocoder();
                geocoder.addressSearch(data.address, (result, status) => {
                    if (status === window.kakao.maps.services.Status.OK) {
                        setForm(prev => ({
                            ...prev,
                            address: data.address,
                            latitude: result[0].y,
                            longitude: result[0].x,
                        }));
                    }
                });
            }
        }).open();
    };

    const toggleTag = (key) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.includes(key)
                ? prev.tags.filter(t => t !== key)
                : [...prev.tags, key]
        }));
    };

    const handleImageClick = () => {
        document.getElementById('imageInput').click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!form.placeName.trim()) return alert('장소 이름을 입력해주세요.');
        if (!form.address) return alert('주소를 검색해주세요.');
        if (!form.allowStatus) return alert('뜨개질 허용 여부를 선택해주세요.');

        const tagData = {};
        TAG_LIST.forEach(tag => {
            tagData[tag.key] = form.tags.includes(tag.key) ? 'Y' : 'N';
        });

        const data = await createPlace({
            userEmail: user?.userEmail,
            placeName: form.placeName,
            placeType: '카페',
            address: form.address,
            latitude: form.latitude,
            longitude: form.longitude,
            allowStatus: form.allowStatus,
            ...tagData,
        });

        if (data.result) {
            alert('장소가 등록됐어요! 🧶');
            navigate('/places');
        } else {
            alert(data.message);
        }
    };

    return (
        <Box className={styles.container}>
            <Box className={styles.card}>
                <Typography className={styles.pageTitle}>장소 제보하기</Typography>

                {/* 장소 이름 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>장소 이름 * (필수)</Typography>
                    <TextField fullWidth size="small" placeholder="장소 이름을 입력하세요."
                        value={form.placeName}
                        onChange={(e) => setForm(prev => ({ ...prev, placeName: e.target.value }))}
                    />
                </Box>

                {/* 주소 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>주소*(필수)</Typography>
                    <Box className={styles.addressRow}>
                        <TextField fullWidth size="small" placeholder="주소를 입력하세요."
                            value={form.address}
                            InputProps={{ readOnly: true }}
                        />
                        <Button variant="contained" className={styles.searchBtn}
                            onClick={handleAddressSearch}>
                            검색
                        </Button>
                    </Box>
                </Box>

                {/* 뜨개질 허용 여부 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>뜨개질 허용 여부*(필수)</Typography>
                    <Box className={styles.allowRow}>
                        {ALLOW_STATUS_LIST.map(status => (
                            <Button key={status.label}
                                variant={form.allowStatus === status.label ? 'contained' : 'outlined'}
                                className={styles.allowBtn}
                                onClick={() => setForm(prev => ({ ...prev, allowStatus: status.label }))}
                                style={{
                                    backgroundColor: form.allowStatus === status.label ? status.color : 'transparent',
                                    borderColor: status.color,
                                    color: form.allowStatus === status.label ? '#fff' : status.color,
                                }}>
                                {status.label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {/* 시설 태그 */}
                <Box className={styles.field}>
                    <Box className={styles.chipRow}>
                        {TAG_LIST.map(tag => (
                            <Chip key={tag.key} label={tag.label}
                                onClick={() => toggleTag(tag.key)}
                                style={{
                                    backgroundColor: form.tags.includes(tag.key) ? tag.color : '#F5EDD8',
                                    color: '#5C3D2E',
                                    cursor: 'pointer',
                                    border: form.tags.includes(tag.key) ? `1px solid ${tag.color}` : 'none',
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                {/* 사진 첨부 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>사진 첨부(선택)</Typography>
                    <Box className={styles.imageArea} onClick={handleImageClick}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="preview" className={styles.imagePreview}/>
                        ) : (
                            <Typography className={styles.imagePlaceholder}>
                                클릭해서 사진을 추가하세요
                            </Typography>
                        )}
                    </Box>
                    <input id="imageInput" type="file" accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                    />
                </Box>

                {/* 한 줄 코멘트 */}
                <Box className={styles.field}>
                    <Typography className={styles.label}>한 줄 코멘트 (선택)</Typography>
                    <TextField fullWidth size="small"
                        placeholder="뜨개하기 좋았던 이유를 공유해주세요"
                        value={form.comment}
                        onChange={(e) => setForm(prev => ({ ...prev, comment: e.target.value }))}
                    />
                </Box>

                {/* 버튼 */}
                <Box className={styles.btnRow}>
                    <Button variant="outlined" className={styles.cancelBtn}
                        onClick={() => navigate('/places')}>
                        다음에 하기
                    </Button>
                    <Button variant="contained" className={styles.submitBtn}
                        onClick={handleSubmit}>
                        제보 등록하기
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default PlaceReport;