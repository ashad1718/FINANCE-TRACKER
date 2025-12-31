'use client';

import React, { useState } from 'react';
import DashboardData from '@/components/DashboardData';
import TransactionList from '@/components/TransactionList';
import AddTransactionForm from '@/components/AddTransactionForm';
import { useFinance } from '@/context/FinanceContext';
import ChartExpenses from '@/components/Charts/ExpenseDoughnut';

export default function Dashboard() {
    const { transactions } = useFinance();
    const [selectedAccountId, setSelectedAccountId] = useState('all');

    // Filter for Today
    const today = new Date();
    const currentTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        const isToday = d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();

        if (!isToday) return false;

        if (selectedAccountId === 'all') return false;
        return t.accountId === selectedAccountId;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div id="today" className="view-section active">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1>Today</h1>
                    <div className="date-display">{today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div>
                    <DashboardData relatedAccountId={selectedAccountId} onAccountChange={setSelectedAccountId} />
                </div>
            </div>

            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

                {/* 1. Add Transaction Form */}
                <div style={{ width: '100%' }}>
                    <AddTransactionForm />
                </div>

                {/* 2. Row: Pie Chart & Recent Transactions */}
                <div className="content-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    {/* Pie Chart */}
                    <div className="glass-panel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', minHeight: '400px' }}>
                        <div style={{ width: '100%', maxWidth: '500px' }}>
                            <ChartExpenses transactions={currentTransactions} />
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="section-header">
                            <h3>Recent Transactions</h3>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <TransactionList
                                transactions={currentTransactions}
                                emptyMsg={selectedAccountId === 'all' ? "Please select an account." : "No transactions for today."}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
