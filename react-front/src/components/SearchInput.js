// src/components/SearchInput.jsx
import React from 'react';
import { Search } from '@mui/icons-material';
import { Box } from '@mui/material';
import styles from './SearchInput.module.css';

function SearchInput({ value, onChange, placeholder = '검색...' }) {
    return (
        <Box className={styles.wrapper}>
            <Search className={styles.icon}/>
            <input
                className={styles.input}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </Box>
    );
}

export default SearchInput;