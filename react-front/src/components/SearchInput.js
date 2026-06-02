// src/components/SearchInput.jsx
import React from 'react';

function SearchInput({ value, onChange, placeholder = '검색...' }) {
    return (
        <input
            style={{
                width: '100%',
                border: '1px solid #E8D5B7',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#ffffff',
                color: '#3D2B1A',
                boxSizing: 'border-box',
            }}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    );
}

export default SearchInput;