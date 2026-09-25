import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { monthNames, currencySymbols } from '../utils/formatters';
import { ThemeToggle } from './ThemeToggle';
import {
  Wallet,
  Bell,
  LogOut,
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  Tags,
  Settings,
  AlertTriangle,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead
  } = useFinance();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--bg-navbar)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
          }}>
            <Wallet size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Budg<span style={{ color: '#818cf8' }}>Z</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
              Smart Finance & Budgeting
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px 6px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: Period, Notifications & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Period Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-glass-strong)',
            padding: '4px 8px',
            borderRadius: 10,
            border: '1px solid var(--border-subtle)'
          }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1} style={{ background: 'var(--bg-dropdown)', color: 'var(--text-main)' }}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {yearOptions.map(yr => (
                <option key={yr} value={yr} style={{ background: 'var(--bg-dropdown)', color: 'var(--text-main)' }}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Currency Pill */}
          <div
            onClick={() => setActiveTab('settings')}
            style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              border: '1px solid var(--border-glow)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title="Active currency - click to switch in Settings"
          >
            {currencySymbols[user?.currency || 'LKR'] || 'Rs '} {user?.currency || 'LKR'}
          </div>

          {/* Notification Bell Dropdown */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                background: showNotifications ? 'var(--primary-light)' : 'var(--bg-glass-strong)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 10,
                padding: '8px 10px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  className="pulse-indicator"
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: '#f43f5e',
                    color: '#fff',
                    borderRadius: 9999,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 0 10px rgba(244, 63, 94, 0.8)'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Popover Panel */}
            {showNotifications && (
              <div style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 360,
                maxHeight: 460,
                backgroundColor: 'var(--bg-modal)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 16,
                boxShadow: 'var(--card-shadow-hover)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div style={{ overflowY: 'auto', maxHeight: 360, padding: 8 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b' }}>
                      <CheckCircle2 size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>All caught up!</div>
                      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>No active budget alerts for this account.</div>
                    </div>
                  ) : (
                    notifications.map(n => {
                      const isExceeded = n.type === 'EXCEEDED';
                      return (
                        <div
                          key={n.id}
                          onClick={() => !n.read && markNotificationRead(n.id)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 10,
                            marginBottom: 6,
                            background: n.read ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.06)',
                            borderLeft: `3px solid ${isExceeded ? '#f43f5e' : '#f59e0b'}`,
                            cursor: n.read ? 'default' : 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            {isExceeded ? (
                              <AlertCircle size={15} color="#f43f5e" />
                            ) : (
                              <AlertTriangle size={15} color="#f59e0b" />
                            )}
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: isExceeded ? '#fb7185' : '#fbbf24'
                            }}>
                              {isExceeded ? 'BUDGET EXCEEDED' : 'NEAR LIMIT WARNING'}
                            </span>
                            {!n.read && (
                              <span style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#6366f1',
                                marginLeft: 'auto'
                              }} />
                            )}
                          </div>
                          <p style={{ fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                            {n.message}
                          </p>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {n.period}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* User Profile & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              {user?.name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div
              onClick={() => setActiveTab('settings')}
              style={{ display: 'block', cursor: 'pointer' }}
              title="Click to view Settings & switch currency"
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600, marginTop: 2 }}>
                <span style={{
                  background: 'rgba(99, 102, 241, 0.18)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                  {user?.currency || 'LKR'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'var(--bg-glass-strong)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: 8,
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
