'use client';

import React from 'react';
import { Transaction, useFinance } from '@/context/FinanceContext';
import { X } from 'lucide-react';

interface DayDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date | null;
    transactions: Transaction[];
}

export default function DayDetailsModal({ isOpen, onClose, date, transactions }: DayDetailsModalProps) {
    const { currency } = useFinance();

    if (!isOpen || !date) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className={`modal ${isOpen ? 'show' : ''}`} style={{ display: isOpen ? 'flex' : 'none' }}>
            <div className="modal-content">
                <button className="close-modal-x" onClick={onClose} style={{ display: 'block' }}>
                    <X />
                </button>

                <h3 style={{ marginBottom: '1.5rem', marginTop: 0 }}>
                    {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>

                <div className="transactions-list-wrapper" style={{ maxHeight: '400px' }}>
                    {sortedTransactions.length === 0 ? (
                        <div className="empty-msg">No transactions found.</div>
                    ) : (
                        sortedTransactions.map(t => {
                            const timeStr = new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const isIncome = t.type === 'income';
                            return (
                                <div key={t.id} className="transaction-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                    <div className="t-info">
                                        <span className="t-title" style={{ display: 'block', fontWeight: 500 }}>{t.title}</span>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            <span>{timeStr}</span> • <span>{isIncome ? t.source : t.category}</span>
                                        </div>
                                    </div>
                                    <span className={`t-amount ${isIncome ? 'income' : 'expense'}`} style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
