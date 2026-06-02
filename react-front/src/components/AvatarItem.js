// src/components/AvatarItem.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const BASE_URL = 'http://localhost:3010';

function AvatarItem({ src, nickname, size = 24, onClick }) {
    const style = {
        width: size,
        height: size,
        borderRadius: '50%',
        cursor: onClick ? 'pointer' : 'default',
    };

    if (src) {
        return (
            <img
                src={`${BASE_URL}${src}`}
                alt="profile"
                style={{ ...style, objectFit: 'cover' }}
                onClick={onClick}
            />
        );
    }

    return (
        <Box
            style={{ ...style, backgroundColor: '#C4956A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClick}
        >
            <Typography style={{ fontSize: size * 0.45, color: 'white', fontWeight: 500 }}>
                {nickname?.charAt(0)}
            </Typography>
        </Box>
    );
}

export default AvatarItem;