'use client';

import React from 'react';
import { useFinance, Transaction } from '@/context/FinanceContext';

interface TransactionListProps {
    transactions: Transaction[];
    limit?: number;
    emptyMsg?: string;
}

export default function TransactionList({ transactions, limit, emptyMsg = "No transactions found." }: TransactionListProps) {
    const { currency } = useFinance();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const displayList = limit ? transactions.slice(0, limit) : transactions;

    if (displayList.length === 0) {
        return <div className="empty-msg">{emptyMsg}</div>;
    }

    return (
        <div className="transactions-list-wrapper">
            <table className="transactions-table">
                <tbody>
                    {displayList.map((t) => {
                        const dateObj = new Date(t.date);
                        const dateStr = dateObj.toLocaleDateString();
                        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const isIncome = t.type === 'income';

                        return (
                            <tr key={t.id} className="transaction-row">
                                <td>
                                    <div className="t-info">
                                        <span className="t-title">{t.title}</span>
                                        <span className="t-meta">
                                            {isIncome ? t.source : t.category}
                                        </span>
                                    </div>
                                </td>
                                <td>{dateStr}</td>
                                <td>{timeStr}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <span className={`t-amount ${isIncome ? 'income' : 'expense'}`}>
                                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
