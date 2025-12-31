'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, PieChart, Shield, Wallet, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Hero Section */}
      <section style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1 style={{
          fontSize: '4rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #fff, #a0a0b0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1
        }}>
          Master Your Money.
        </h1>
        <p style={{
          fontSize: '1.5rem',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          marginBottom: '3rem',
          lineHeight: 1.6
        }}>
          Simple, beautiful, and powerful expense tracking for the modern era. Track every penny, every currency, everywhere.
        </p>

        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <button className="btn-submit" style={{
            width: 'auto',
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            Launch App <ArrowRight />
          </button>
        </Link>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '4rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
          <div style={{
            background: 'rgba(108, 92, 231, 0.2)',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            color: 'var(--accent-primary)'
          }}>
            <PieChart size={28} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Smart Analytics</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Visualise your spending habits with interactive charts and detailed monthly breakdowns.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
          <div style={{
            background: 'rgba(0, 206, 201, 0.2)',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            color: 'var(--accent-secondary)'
          }}>
            <Globe size={28} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Global Experience</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Seamless currency conversion. View your finances in any currency with live exchange rates.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'left' }}>
          <div style={{
            background: 'rgba(232, 67, 147, 0.2)',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            color: '#e84393'
          }}>
            <Shield size={28} />
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Private & Secure</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Your data stays right here. Stored locally on your device for maximum privacy and speed.
          </p>
        </div>
      </section>
    </div>
  );
}
