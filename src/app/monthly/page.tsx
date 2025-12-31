'use client';

import React, { useState } from 'react';
import { useFinance, Transaction } from '@/context/FinanceContext';
import DailyBarChart from '@/components/Charts/DailyBarChart';
import CategoryPieChart from '@/components/Charts/CategoryPieChart';
import TransactionList from '@/components/TransactionList';
import DayDetailsModal from '@/components/Modals/DayDetailsModal';

export default function MonthlyPage() {
    const { transactions, currency, accounts } = useFinance();
    const [targetDate, setTargetDate] = useState(new Date());
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);

    const currentMonth = targetDate.getMonth();
    const currentYear = targetDate.getFullYear();

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // YYYY-MM
        if (val) {
            const [year, month] = val.split('-');
            setTargetDate(new Date(parseInt(year), parseInt(month) - 1, 1));
        }
    };

    // Filter Transactions
    const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        const matchesMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        const matchesAccount = selectedAccountId === 'all' || t.accountId === selectedAccountId;
        return matchesMonth && matchesAccount;
    });

    const expenseTransactions = monthlyTransactions.filter(t => t.type === 'expense');

    // Stats
    const currentMonthExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Previous Month Comparison
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        const matchesMonth = d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
        const matchesAccount = selectedAccountId === 'all' || t.accountId === selectedAccountId;
        return matchesMonth && matchesAccount && t.type === 'expense';
    });
    const lastMonthExpenses = lastMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

    const diff = currentMonthExpenses - lastMonthExpenses;
    let comparisonText = '';
    let comparisonColor = '#a0a0b0';

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val);

    if (lastMonthExpenses === 0) {
        if (currentMonthExpenses > 0) comparisonText = `Spent ${formatCurrency(currentMonthExpenses)} this month. No data for last month.`;
        else comparisonText = "No expenses recorded.";
    } else {
        if (diff > 0) {
            comparisonText = `Spent ${formatCurrency(Math.abs(diff))} more than last month.`;
            comparisonColor = '#e74c3c';
        } else if (diff < 0) {
            comparisonText = `Spent ${formatCurrency(Math.abs(diff))} less than last month.`;
            comparisonColor = '#2ecc71';
        } else {
            comparisonText = "Spent exactly the same as last month.";
        }
    }

    const handleChartClick = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);
        setSelectedDayDate(newDate);
        setModalOpen(true);
    };

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const selectedDayTransactions = selectedDayDate
        ? transactions.filter(t => { // Use original transactions list to filter by day, but also MUST respect account filter?
            // Wait, logic above used 'monthlyTransactions' for charts etc.
            // But modal gets ANY transaction on that day? Or only what's shown?
            // Users typically expect the modal drill-down to match the filter.
            // So we should filter by account here too.
            const d = new Date(t.date);
            const matchesDay = d.getDate() === selectedDayDate.getDate() &&
                d.getMonth() === selectedDayDate.getMonth() &&
                d.getFullYear() === selectedDayDate.getFullYear();
            const matchesAccount = selectedAccountId === 'all' || t.accountId === selectedAccountId;
            return matchesDay && matchesAccount;
        })
        : [];

    return (
        <div id="month" className="view-section active">
            <div className="section-header" style={{ marginBottom: '2rem' }}>
                <div className="header-controls">
                    <h1>{targetDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h1>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        {/* Account Selector */}
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="date-picker-styled" // Reusing style for consistency
                            style={{ minWidth: '150px' }}
                        >
                            <option value="all">All Accounts</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>

                        {/* Styled Date Picker */}
                        <input
                            type="month"
                            value={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`}
                            onChange={handleDateChange}
                            className="date-picker-styled"
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

                {/* 1. Daily Activity (Full Width) */}
                <div className="glass-panel canvas-wrapper-wide" style={{ minHeight: '400px', padding: '2rem' }}>
                    <h3>Daily Activity</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <DailyBarChart
                            transactions={expenseTransactions}
                            daysInMonth={daysInMonth}
                            onDayClick={handleChartClick}
                        />
                    </div>
                </div>

                {/* 2. Breakdown & Comparison (Side by Side) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="glass-panel" style={{ height: '400px', overflow: 'hidden', padding: '2rem' }}>
                        <h3>Comparison</h3>
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            fontSize: '1.5rem',
                            fontWeight: '500',
                            padding: '1rem',
                            color: comparisonColor
                        }}>
                            {comparisonText}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ height: '400px', overflow: 'hidden', padding: '2rem' }}>
                        <h3>Breakdown</h3>
                        <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <CategoryPieChart transactions={expenseTransactions} />
                        </div>
                    </div>
                </div>

                {/* 3. Recent Transactions (Full Width) */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3>Transactions</h3>
                    <TransactionList transactions={monthlyTransactions} emptyMsg="No transactions this month." />
                </div>
            </div>

            <DayDetailsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                date={selectedDayDate}
                transactions={selectedDayTransactions}
            />
        </div>
    );
}
