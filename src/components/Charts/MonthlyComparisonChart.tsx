'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlyComparisonChartProps {
    monthlyData: {
        month: string;
        income: number;
        expense: number;
    }[];
}

export default function MonthlyComparisonChart({ monthlyData }: MonthlyComparisonChartProps) {
    const labels = monthlyData.map(d => d.month);

    const data = {
        labels,
        datasets: [
            {
                label: 'Income',
                data: monthlyData.map(d => d.income),
                backgroundColor: '#00cec9',
                borderRadius: 4,
            },
            {
                label: 'Expense',
                data: monthlyData.map(d => d.expense),
                backgroundColor: '#e17055',
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: '#a0a0b0' }
            },
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
    };

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Bar data={data} options={options} />
        </div>
    );
}
