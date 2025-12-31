'use client';

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Transaction } from '@/context/FinanceContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartExpensesProps {
    transactions: Transaction[];
}

export default function ChartExpenses({ transactions }: ChartExpensesProps) {
    const categories = ['Food', 'Travelling', 'Shopping', 'Groceries', 'Recharge', 'Cosmetics'];
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#34495e'];

    const dataMap = new Array(categories.length).fill(0);

    transactions.forEach(t => {
        if (t.type === 'expense') {
            const idx = categories.indexOf(t.category);
            if (idx !== -1) {
                dataMap[idx] += t.amount;
            }
        }
    });

    const data = {
        labels: categories,
        datasets: [
            {
                data: dataMap,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'left' as const,
                labels: {
                    color: '#a0a0b0',
                    padding: 20,
                    usePointStyle: true
                }
            }
        },
        cutout: '70%',
    };

    // If no data, show message or empty chart?
    const total = dataMap.reduce((a, b) => a + b, 0);
    if (total === 0) {
        return <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No expenses yet</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Doughnut data={data} options={options} />
        </div>
    );
}
