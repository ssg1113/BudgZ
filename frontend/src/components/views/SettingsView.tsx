import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { currencySymbols } from '../../utils/formatters';
import {
  User,
  DollarSign,
  Bell,
  Check,
  ShieldCheck,
  Server,
  Sun,
  Moon,
  Palette
} from 'lucide-react';

const supportedCurrencies = [
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee (LKR)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)' }
];

export const SettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'LKR');
  const [threshold, setThreshold] = useState(
    user?.preferences?.notificationThreshold || 80
  );
  const [browserAlerts, setBrowserAlerts] = useState(
    user?.preferences?.browserNotificationsEnabled ?? true
  );

  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.currency) setCurrency(user.currency);
      if (user.preferences?.notificationThreshold) setThreshold(user.preferences.notificationThreshold);
      if (user.preferences?.browserNotificationsEnabled !== undefined) {
        setBrowserAlerts(user.preferences.browserNotificationsEnabled);
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedMessage('');

    try {
      await updateProfile({
        name: name.trim(),
        currency,
        preferences: {
          notificationThreshold: threshold,
          browserNotificationsEnabled: browserAlerts
        }
      });
      setSavedMessage('Settings successfully saved!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Account & Preferences</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Manage your profile, visual theme, preferred currency, and budget warning thresholds
        </p>
      </div>

      {savedMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '12px 16px',
          borderRadius: 12,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Check size={18} /> {savedMessage}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <User size={20} color="#818cf8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Profile Information</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="glass-input"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="glass-input"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </div>

        {/* Appearance & Theme Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Palette size={20} color="#818cf8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Appearance & Theme</h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            Customize your visual workspace. Switch dynamically between dark obsidian and luminous light themes:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14
          }}>
            {/* Dark Mode Option */}
            <button
              id="theme-select-dark"
              type="button"
              onClick={() => setTheme('dark')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 14,
                border: `2px solid ${theme === 'dark' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                background: theme === 'dark' ? 'var(--primary-light)' : 'var(--bg-glass)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: theme === 'dark' ? '0 4px 16px rgba(99, 102, 241, 0.25)' : 'none'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
                flexShrink: 0
              }}>
                <Moon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Dark Obsidian</span>
                  {theme === 'dark' && <Check size={18} color="var(--primary)" />}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Deep night aesthetic with glowing accents & reduced eye strain
                </div>
              </div>
            </button>

            {/* Light Mode Option */}
            <button
              id="theme-select-light"
              type="button"
              onClick={() => setTheme('light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 14,
                border: `2px solid ${theme === 'light' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                background: theme === 'light' ? 'var(--primary-light)' : 'var(--bg-glass)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: theme === 'light' ? '0 4px 16px rgba(99, 102, 241, 0.25)' : 'none'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>
                <Sun size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Light Pure</span>
                  {theme === 'light' && <Check size={18} color="var(--primary)" />}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  Clean, radiant interface with high clarity and daylight contrast
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Currency Preference Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <DollarSign size={20} color="#818cf8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Preferred Currency</h2>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            All balances, metrics, charts, and budget limits will automatically be displayed in this currency:
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10
          }}>
            {supportedCurrencies.map(curr => {
              const isSelected = currency === curr.code;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => setCurrency(curr.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'var(--primary-light)' : 'var(--bg-glass)',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: isSelected ? 'var(--primary)' : 'var(--text-dim)',
                      width: 24
                    }}>
                      {curr.symbol}
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: isSelected ? 700 : 500 }}>
                      {curr.name}
                    </span>
                  </div>
                  {isSelected && <Check size={16} color="var(--primary)" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Alert Preferences */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Bell size={20} color="#818cf8" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Alert & Warning Thresholds</h2>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Default Budget Near-Limit Threshold
              </label>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--warning-text)',
                background: 'var(--bg-glass-strong)',
                padding: '2px 10px',
                borderRadius: 8
              }}>
                {threshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 6 }}>
              You will automatically receive near-limit alerts when your monthly or category expenses reach {threshold}% of your budget limit.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>In-App & Browser Alerts</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Display badge counters and toast notifications for threshold warnings
              </div>
            </div>
            <input
              type="checkbox"
              checked={browserAlerts}
              onChange={e => setBrowserAlerts(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* System & Architecture Status */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Server size={18} color="var(--text-muted)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>System Architecture Status</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              API Server: <strong>http://localhost:5000</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
              Storage Engine: <strong>Dual-Mode (MongoDB + JSON Local Persistence)</strong>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary"
          style={{ width: '100%', padding: 14, fontSize: '1rem' }}
        >
          {isSaving ? 'Saving Changes...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
};
