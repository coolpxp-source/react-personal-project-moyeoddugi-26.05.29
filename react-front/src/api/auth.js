const BASE_URL = 'http://localhost:3010/api/auth';

// 회원가입
export const register = async (userEmail, pwd, userName, nickname) => {
    const response = await fetch(`${BASE_URL}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, pwd, userName, nickname })
    });
    return response.json();
};

// 로그인
export const login = async (userEmail, pwd) => {
    const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, pwd })
    });
    return response.json();
};