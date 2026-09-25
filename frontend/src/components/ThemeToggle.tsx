import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, style }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: 10,
        padding: showLabel ? '8px 14px' : '9px',
        color: isDark ? '#fbbf24' : '#6366f1',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 0.2s ease',
        boxShadow: isDark
          ? '0 2px 8px rgba(0, 0, 0, 0.25)'
          : '0 2px 8px rgba(99, 102, 241, 0.1)',
        ...style
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px) scale(1.05)';
        e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {isDark ? (
          <Sun size={18} color="#fbbf24" />
        ) : (
          <Moon size={18} color="#6366f1" />
        )}
      </div>

      {showLabel && (
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          userSelect: 'none'
        }}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
