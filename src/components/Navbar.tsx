'use client';

import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface NavbarProps {
    onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
    const { theme, toggleTheme } = useFinance();
    return (
        <nav className="glass-nav">
            <div className="nav-left">
                <button className="hamburger-btn" id="hamburgerBtn" onClick={onMenuClick}>
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div className="nav-brand" style={{ fontWeight: 600, fontSize: '1.2rem', display: 'none' }}>
                    {/* Visible on mobile if needed, but sidebar has brand */}
                    FinanceTracker
                </div>
            </div>

            <div className="nav-links">
                {/* Theme Toggle - Logic to be implemented or hooked to Context */}
                <button
                    className="nav-theme-btn btn-sm"
                    title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    onClick={toggleTheme}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {theme === 'dark' ? <Sun size={28} /> : <Moon size={28} />}
                </button>

                <div className="auth-buttons">
                    <button className="btn btn-auth">Login</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
