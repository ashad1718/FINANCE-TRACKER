'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, PieChart, Settings, X, PlusCircle } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();

    const navItems = [
        { name: 'Today', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Monthly', path: '/monthly', icon: <Calendar size={20} /> },
        { name: 'Yearly', path: '/yearly', icon: <PieChart size={20} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className={`sidebar ${isOpen ? 'active' : ''}`} id="sidebar">
            <div className="sidebar-header">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Finance<span style={{ color: 'var(--accent-primary)' }}>Tracker</span></h2>
                <button className="close-sidebar" id="closeSidebar" onClick={onClose}>
                    <X size={24} />
                </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`sidebar-item ${pathname === item.path ? 'active' : ''}`}
                        onClick={onClose}
                        style={{ textDecoration: 'none' }}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </Link>
                ))}

                {/* Placeholder for future features */}
                {/* <button className="sidebar-item">
            <PlusCircle size={20} />
            <span>New Goal</span>
        </button> */}
            </nav>
        </aside>
    );
};

export default Sidebar;
