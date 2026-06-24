import { useState, useCallback } from 'react';

const getPastDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
};

export const useViopDateRange = (initialRange = '1mo') => {
    const [range, setRange] = useState(initialRange);
    const [customFromDate, setCustomFromDate] = useState(() => getPastDate(30));
    const [customToDate, setCustomToDate] = useState(() => getPastDate(0));

    const handleRangeChange = useCallback((newRange) => {
        setRange(newRange);
        
        switch (newRange) {
            case '1w':
                setCustomFromDate(getPastDate(7));
                break;
            case '1mo':
                setCustomFromDate(getPastDate(30));
                break;
            case '1y':
                setCustomFromDate(getPastDate(365));
                break;
            default:
                break;
        }
    }, []);

    return {
        range,
        customFromDate,
        customToDate,
        setCustomFromDate,
        setCustomToDate,
        handleRangeChange
    };
};
