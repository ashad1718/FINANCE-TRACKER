'use client';

import { useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';

export default function ThemeEffect() {
    const { theme } = useFinance();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return null;
}
