import { useState, useEffect } from 'react';
import { toggleScrap, getScrap } from '../api/scraps';

function useScrap(userEmail, targetType, targetId) {
    const [scrapped, setScrapped] = useState(false);

    useEffect(() => {
        if (!userEmail || !targetId) return;
        const fetch = async () => {
            const data = await getScrap(targetType, targetId, userEmail);
            if (data.result) setScrapped(data.scrapped);
        };
        fetch();
    }, [targetId]);

    const handleScrap = async (e) => {
        if (e) e.stopPropagation();
        const data = await toggleScrap(userEmail, targetType, targetId);
        if (data.result) setScrapped(data.scrapped);
    };

    return { scrapped, handleScrap };
}

export default useScrap;