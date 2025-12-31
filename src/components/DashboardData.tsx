'use client';

import React from 'react';
import { useFinance } from '@/context/FinanceContext';

export default function DashboardData({ relatedAccountId, onAccountChange }: { relatedAccountId: string, onAccountChange: (id: string) => void }) {
    const { accounts, currency } = useFinance();
    const [showBalance, setShowBalance] = React.useState(false);

    // Hide balance when account changes
    React.useEffect(() => {
        setShowBalance(false);
    }, [relatedAccountId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const displayBalance = relatedAccountId === 'all'
        ? 0
        : accounts.find(acc => acc.id === relatedAccountId)?.balance || 0;

    return (
        <div className="stats-container" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="input-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                <select
                    value={relatedAccountId}
                    onChange={(e) => onAccountChange(e.target.value)}
                    style={{ padding: '0.8rem', backgroundColor: 'rgba(20, 20, 30, 0.6)', border: 'none' }}
                >
                    <option value="all">Select Account</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
            </div>

            <div className="card" style={{ border: 'none', padding: '1rem', minWidth: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {showBalance ? (
                    <div
                        className="amount"
                        style={{ fontSize: '1.5rem', cursor: 'pointer' }}
                        onClick={() => setShowBalance(false)}
                        title="Click to hide"
                    >
                        {formatCurrency(displayBalance)}
                    </div>
                ) : (
                    <button
                        onClick={() => setShowBalance(true)}
                        style={{
                            background: 'var(--accent-primary)',
                            border: 'none',
                            color: 'white',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Show Balance
                    </button>
                )}
            </div>
        </div>
    );
}
