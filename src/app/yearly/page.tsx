'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import ChartExpenses from '@/components/Charts/ExpenseDoughnut';
import MonthlyComparisonChart from '@/components/Charts/MonthlyComparisonChart';
import DashboardData from '@/components/DashboardData';

export default function YearlyPage() {
    const { transactions, accounts, currency } = useFinance(); // Transactions are already in Display Currency
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedAccountId, setSelectedAccountId] = useState('all');

    // 1. Filter Transactions for the Year & Account
    const yearlyTransactions = useMemo(() => {
        return transactions.filter(t => {
            const d = new Date(t.date);
            const matchesYear = d.getFullYear() === selectedYear;
            const matchesAccount = selectedAccountId === 'all' || t.accountId === selectedAccountId;
            return matchesYear && matchesAccount;
        });
    }, [transactions, selectedYear, selectedAccountId]);

    // 2. Calculate Annual Stats
    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;
        yearlyTransactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
        });
        return { income, expense, balance: income - expense };
    }, [yearlyTransactions]);

    // 3. Prepare Monthly Data for Bar Chart
    const monthlyData = useMemo(() => {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Initialize aggregation
        const data = months.map(m => ({ month: m, income: 0, expense: 0 }));

        yearlyTransactions.forEach(t => {
            const monthIndex = new Date(t.date).getMonth(); // 0-11
            if (t.type === 'income') {
                data[monthIndex].income += t.amount;
            } else {
                data[monthIndex].expense += t.amount;
            }
        });

        return data;
    }, [yearlyTransactions]);

    // Helper for formatting currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(val);
    };

    return (
        <div id="year" className="view-section active">
            {/* Header / Controls */}
            <div className="section-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1>Yearly Overview</h1>
                    <div className="date-display">Statistics for {selectedYear}</div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {/* Year Selector */}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="date-picker-styled"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    {/* Account Selector */}
                    <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="date-picker-styled"
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">All Accounts</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

                {/* 1. Summary Cards */}
                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="card-label">Total Income</div>
                        <div className="card-value income">{formatCurrency(stats.income)}</div>
                    </div>
                    <div className="dashboard-card">
                        <div className="card-label">Total Expenses</div>
                        <div className="card-value expense">{formatCurrency(stats.expense)}</div>
                    </div>
                    <div className="dashboard-card">
                        <div className="card-label">Net Savings</div>
                        <div className={`card-value ${stats.balance >= 0 ? 'income' : 'expense'}`}>
                            {formatCurrency(stats.balance)}
                        </div>
                    </div>
                </div>

                {/* 2. Charts Row */}
                <div className="content-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>

                    {/* Monthly Comparison Bar Chart */}
                    <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Income vs Expense</h3>
                        <div style={{ flex: 1 }}>
                            <MonthlyComparisonChart monthlyData={monthlyData} />
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h3 style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>Expense Breakdown</h3>
                        <div style={{ width: '100%', maxWidth: '350px', flex: 1, display: 'flex', alignItems: 'center' }}>
                            <ChartExpenses transactions={yearlyTransactions} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
