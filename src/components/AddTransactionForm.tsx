'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';

export default function AddTransactionForm() {
    const { accounts, addTransaction, theme } = useFinance();
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [category, setCategory] = useState<string>('Food'); // Default
    const [source, setSource] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const expenseCategories = ['Food', 'Travelling', 'Shopping', 'Groceries', 'Recharge', 'Cosmetics'];



    const handleSubmit = (e: React.FormEvent) => {

        e.preventDefault();
        if (!amount || !selectedAccount || !title) return;

        // Validate Account
        const acc = accounts.find(a => a.id === selectedAccount || a.name === selectedAccount);
        if (!acc && accounts.length > 0) {
            // Fallback to first if not selected but available? No, enforce selection
            alert("Please select an account");
            return;
        }

        addTransaction({
            type,
            title,
            amount: parseFloat(amount),
            accountId: selectedAccount,
            category: type === 'expense' ? category : 'Salary', // Default category for income?
            source: type === 'income' ? source : undefined,
            date: new Date().toISOString()
        });

        // Reset
        setTitle('');
        setAmount('');
        setSource('');
        setIsExpanded(false); // Auto-collapse
    };

    // If no accounts, show message
    if (accounts.length === 0) {
        return <div className="placeholder-content">Please add an account first (in Settings or Sidebar).</div>;
    }

    if (!isExpanded) {
        return (
            <div
                className="glass-panel"
                style={{
                    padding: '0',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    overflow: 'hidden',
                    border: '1px solid rgba(108, 92, 231, 0.3)',
                }}
                onClick={() => setIsExpanded(true)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div
                    style={{
                        padding: '1.5rem',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        background: 'linear-gradient(90deg, rgba(108, 92, 231, 0.1) 0%, rgba(108, 92, 231, 0.05) 50%, rgba(108, 92, 231, 0.1) 100%)',
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(108, 92, 231, 0.4)'
                    }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>+</span>
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: '500', color: theme === 'light' ? 'var(--text-primary)' : '#fff' }}>Add New Transaction</span>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Add Transaction</h3>
                <button
                    onClick={() => setIsExpanded(false)}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'var(--text-secondary)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    title="Minimize"
                >
                    ✕
                </button>
            </div>

            <div className="auth-tabs" style={{ marginBottom: '1rem' }}>
                <button
                    className={`auth-tab ${type === 'expense' ? 'active' : ''}`}
                    onClick={() => setType('expense')}
                >
                    Expense
                </button>
                <button
                    className={`auth-tab ${type === 'income' ? 'active' : ''}`}
                    onClick={() => setType('income')}
                >
                    Income
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>Account</label>
                    <select
                        value={selectedAccount}
                        onChange={e => setSelectedAccount(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select Account</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} (Bal: {acc.balance})</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label>Title</label>
                    <input
                        type="text"
                        placeholder="What is this for?"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Amount</label>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        required
                        min="0"
                        step="0.01"
                    />
                </div>

                {type === 'expense' ? (
                    <div className="input-group">
                        <label>Category</label>
                        <div className="category-chips">
                            {expenseCategories.map(cat => (
                                <div
                                    key={cat}
                                    className={`chip ${category === cat ? 'active' : ''}`}
                                    onClick={() => setCategory(cat)}
                                >
                                    {cat}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="input-group">
                        <label>Source</label>
                        <input
                            type="text"
                            placeholder="e.g. Salary, Freelance"
                            value={source}
                            onChange={e => setSource(e.target.value)}
                            required
                        />
                    </div>
                )}

                <button type="submit" className="btn-submit">
                    {type === 'expense' ? 'Add Expense' : 'Add Income'}
                </button>
            </form>
        </div>
    );
}
