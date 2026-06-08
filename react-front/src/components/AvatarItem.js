// src/components/AvatarItem.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import styles from './AvatarItem.module.css';

const BASE_URL = 'http://localhost:3010';

function AvatarItem({ src, nickname, size = 24, onClick }) {
    return (
        <Box 
            className={`${styles.wrapper} ${onClick ? styles.clickable : ''}`}
            style={{ width: size, height: size }}
            onClick={onClick}
        >
            {src ? (
                <img
                    src={`${BASE_URL}${src}`}
                    alt="profile"
                    className={styles.img}
                />
            ) : (
                <Box className={styles.default}>
                    <Typography style={{ fontSize: size * 0.45, color: 'white', fontWeight: 500 }}>
                        {nickname?.charAt(0)}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

export default AvatarItem;