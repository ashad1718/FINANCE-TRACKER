'use client';

import React, { useState } from 'react';
import { useFinance, Account } from '@/context/FinanceContext';

export default function SettingsPage() {
    const { accounts, addAccount, currency, setCurrency } = useFinance();
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState('Bank');
    const [newAccountBalance, setNewAccountBalance] = useState('');

    const handleAddAccount = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAccountName) return;

        addAccount({
            name: newAccountName,
            type: newAccountType,
            balance: parseFloat(newAccountBalance) || 0,
            color: '#6c5ce7' // Default color
        });

        setNewAccountName('');
        setNewAccountBalance('');
    };

    const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

    return (
        <div id="settings-view" className="view-section active">
            <h1 style={{ marginBottom: '2rem' }}>Settings</h1>

            <div className="dashboard-grid">
                <div className="visuals-col">
                    <div className="glass-panel">
                        <h3>Accounts</h3>
                        <div className="transactions-list-wrapper" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            {accounts.length === 0 && <div className="empty-msg">No accounts yet.</div>}
                            <ul className="accounts-list" style={{ listStyle: 'none', padding: 0 }}>
                                {accounts.map(acc => (
                                    <li key={acc.id} className="sidebar-item" style={{ justifyContent: 'space-between', cursor: 'default' }}>
                                        <div className="acc-info">
                                            <span className="acc-name">{acc.name}</span>
                                            <span className="acc-type" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{acc.type}</span>
                                        </div>
                                        <span className="acc-balance" style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(acc.balance)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <form onSubmit={handleAddAccount} className="new-account-form" style={{ marginTop: '1rem' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Add New Account</h4>

                            <div className="input-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. HDFC Bank"
                                    value={newAccountName}
                                    onChange={e => setNewAccountName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Initial Balance</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={newAccountBalance}
                                    onChange={e => setNewAccountBalance(e.target.value)}
                                />
                            </div>

                            <button type="submit" className="btn-submit">Add Account</button>
                        </form>
                    </div>
                </div>

                <div className="data-col">
                    <div className="glass-panel">
                        <h3>Preferences</h3>

                        <div className="input-group">
                            <label>App Currency</label>
                            <select
                                value={currency}
                                onChange={e => setCurrency(e.target.value)}
                            >
                                {currencies.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
