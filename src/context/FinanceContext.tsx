'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type TransactionType = 'income' | 'expense';

export interface Account {
    id: string; // generated UUID or simple ID
    name: string;
    type: string; // Bank, Cash, etc.
    balance: number; // Initial balance or calculated? The legacy app had balance as property. 
    // But transactions should update it.
    // For simplicity, we'll store current balance in account and update it on transaction.
    color?: string;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    accountId: string; // Link to account
    amount: number;
    category: string; // 'Food', 'Salary', etc.
    title: string;
    date: string; // ISO string
    source?: string; // For income
}

interface FinanceContextType {
    accounts: Account[];
    transactions: Transaction[];
    currency: string;
    theme: 'dark' | 'light';
    addAccount: (account: Omit<Account, 'id'>) => void;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    deleteTransaction: (id: string) => void;
    setCurrency: (code: string) => void;
    toggleTheme: () => void;
    getAccountName: (id: string) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
    // Raw Data (Stored in Base Currency - INR)
    const [rawAccounts, setRawAccounts] = useState<Account[]>([]);
    const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);

    // UI State
    const [currency, setCurrency] = useState<string>('INR');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [isLoaded, setIsLoaded] = useState(false);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

    // Fetch Exchange Rates
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
                const data = await res.json();
                setExchangeRates(data.rates);
            } catch (error) {
                console.error("Failed to fetch exchange rates:", error);
                // Fallback to basic rates if offline? Or just keep 1:1
            }
        };
        fetchRates();
    }, []);

    // Load from LocalStorage
    useEffect(() => {
        const savedAccounts = localStorage.getItem('finance_accounts');
        const savedTransactions = localStorage.getItem('finance_transactions');
        const savedCurrency = localStorage.getItem('finance_currency');
        const savedTheme = localStorage.getItem('finance_theme');

        let initialAccounts: Account[] = [];
        if (savedAccounts) {
            try {
                const parsed = JSON.parse(savedAccounts);
                initialAccounts = parsed.map((a: any) => ({
                    ...a,
                    id: a.id || a.name
                }));
            } catch (e) {
                console.error("Failed to parse accounts", e);
            }
        }

        if (savedTransactions) {
            try {
                const parsed = JSON.parse(savedTransactions);
                const mapped = parsed.map((t: any) => ({
                    ...t,
                    accountId: t.account,
                    date: t.date
                }));
                setRawTransactions(mapped);
            } catch (e) {
                console.error("Failed to parse transactions", e);
            }
        }

        if (initialAccounts.length > 0) setRawAccounts(initialAccounts);
        if (savedCurrency) setCurrency(savedCurrency);
        if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage (Always save RAW data)
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('finance_accounts', JSON.stringify(rawAccounts));
        localStorage.setItem('finance_transactions', JSON.stringify(rawTransactions));
        localStorage.setItem('finance_currency', currency);
        localStorage.setItem('finance_theme', theme);
    }, [rawAccounts, rawTransactions, currency, theme, isLoaded]);

    // Computed / Display Data
    const currentRate = exchangeRates[currency] || 1;

    const accounts = React.useMemo(() => {
        return rawAccounts.map(acc => ({
            ...acc,
            balance: acc.balance * currentRate
        }));
    }, [rawAccounts, currentRate]);

    const transactions = React.useMemo(() => {
        return rawTransactions.map(t => ({
            ...t,
            amount: t.amount * currentRate
        }));
    }, [rawTransactions, currentRate]);

    // Actions
    const addAccount = (data: Omit<Account, 'id'>) => {
        // Convert initial balance BACK to Base (INR) before storing
        const balanceInBase = data.balance / currentRate;
        const newAccount = { ...data, balance: balanceInBase, id: data.name };
        setRawAccounts(prev => [...prev, newAccount]);
    };

    const addTransaction = (data: Omit<Transaction, 'id'>) => {
        const newTxId = crypto.randomUUID();

        // Convert amount BACK to Base (INR) before storing
        const amountInBase = data.amount / currentRate;

        const newTx = { ...data, amount: amountInBase, id: newTxId };

        setRawTransactions(prev => [...prev, newTx]);

        // Update Account Balance (in Base)
        setRawAccounts(prev => prev.map(acc => {
            if (acc.id === data.accountId) {
                const adjustment = data.type === 'income' ? amountInBase : -amountInBase;
                return { ...acc, balance: acc.balance + adjustment };
            }
            return acc;
        }));
    };

    const deleteTransaction = (id: string) => {
        const tx = rawTransactions.find(t => t.id === id);
        if (!tx) return;

        setRawTransactions(prev => prev.filter(t => t.id !== id));

        // Revert balance (tx amount is already in Base)
        setRawAccounts(prev => prev.map(acc => {
            if (acc.id === tx.accountId) {
                const adjustment = tx.type === 'income' ? -tx.amount : tx.amount;
                return { ...acc, balance: acc.balance + adjustment };
            }
            return acc;
        }));
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const getAccountName = (id: string) => {
        const acc = rawAccounts.find(a => a.id === id);
        return acc ? acc.name : id;
    };

    if (!isLoaded) return null; // Prevent flash of wrong theme/empty data

    return (
        <FinanceContext.Provider value={{
            accounts,
            transactions,
            currency,
            theme,
            addAccount,
            addTransaction,
            deleteTransaction,
            setCurrency,
            toggleTheme,
            getAccountName
        }}>
            {children}
        </FinanceContext.Provider>
    );
}

export function useFinance() {
    const context = useContext(FinanceContext);
    if (context === undefined) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
}
