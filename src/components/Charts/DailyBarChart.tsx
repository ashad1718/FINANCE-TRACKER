'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Transaction } from '@/context/FinanceContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DailyBarChartProps {
    transactions: Transaction[]; // Should be already filtered for the month? Or we filter here? Better to pass month transactions.
    daysInMonth: number;
    onDayClick?: (day: number) => void;
}

export default function DailyBarChart({ transactions, daysInMonth, onDayClick }: DailyBarChartProps) {
    const dailyData = new Array(daysInMonth).fill(0);

    transactions.forEach(t => {
        if (t.type === 'expense') {
            const d = new Date(t.date);
            const day = d.getDate(); // 1-31
            if (day <= daysInMonth) {
                dailyData[day - 1] += t.amount;
            }
        }
    });

    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const data = {
        labels,
        datasets: [
            {
                label: 'Daily Expenses',
                data: dailyData,
                backgroundColor: '#6c5ce7',
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#a0a0b0' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#a0a0b0' }
            }
        },
        onClick: (event: any, elements: any[]) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                // index is 0-based, so day is index + 1
                onDayClick?.(index + 1);
            }
        },
        onHover: (event: any, chartElement: any) => {
            event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
        }
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Bar data={data} options={options} />
        </div>
    );
}
