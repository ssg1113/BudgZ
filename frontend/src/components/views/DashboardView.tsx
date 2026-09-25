import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, monthNames } from '../../utils/formatters';
import { CategoryIcon } from '../../utils/categoryIcons';
import '../../utils/chartConfig';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Plus,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Receipt
} from 'lucide-react';

interface DashboardViewProps {
  onOpenAddTransaction: () => void;
  onOpenSetBudget: () => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTransaction,
  onOpenSetBudget,
  onNavigateTab
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const {
    selectedMonth,
    selectedYear,
    summary,
    budgets,
    categoryBreakdown,
    transactions,
    categories
  } = useFinance();

  const isDark = theme === 'dark';
  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const chartBorderColor = isDark ? '#131b2e' : '#ffffff';

  const currency = user?.currency || 'LKR';
  const catMap = new Map(categories.map(c => [c.id, c]));

  // Find alerted budgets (WARNING or EXCEEDED)
  const alertedBudgets = budgets.filter(b => b.status === 'WARNING' || b.status === 'EXCEEDED');

  // Doughnut Chart Data
  const doughnutData = {
    labels: categoryBreakdown.map(c => c.name),
    datasets: [
      {
        data: categoryBreakdown.map(c => c.amount),
        backgroundColor: categoryBreakdown.map(c => c.color),
        borderColor: chartBorderColor,
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: chartTextColor,
          font: { size: 11 },
          boxWidth: 12,
          padding: 12
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` ${context.label}: ${formatCurrency(val, currency)}`;
          }
        }
      }
    },
    cutout: '72%'
  };

  // Bar Chart Data (Income vs Expense)
  const barData = {
    labels: ['Monthly Flow'],
    datasets: [
      {
        label: 'Income',
        data: [summary?.totalIncome || 0],
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 8
      },
      {
        label: 'Expenses',
        data: [summary?.totalExpenses || 0],
        backgroundColor: 'rgba(244, 63, 94, 0.85)',
        borderRadius: 8
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartTextColor }
      },
      y: {
        grid: { color: chartGridColor },
        ticks: {
          color: chartTextColor,
          callback: (value: any) => formatCurrency(value, currency)
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: chartTextColor, boxWidth: 12 }
      }
    }
  };

  const recentTransactions = [...transactions].sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  ).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Alert Banners for Near-Limit or Exceeded Budgets */}
      {alertedBudgets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alertedBudgets.map(ab => {
            const isExceeded = ab.status === 'EXCEEDED';
            return (
              <div
                key={ab.budget.id}
                style={{
                  background: isExceeded ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${isExceeded ? 'rgba(244, 63, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {isExceeded ? (
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(244, 63, 94, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fb7185'
                    }}>
                      <AlertCircle size={22} />
                    </div>
                  ) : (
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: 'rgba(245, 158, 11, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fbbf24'
                    }}>
                      <AlertTriangle size={22} />
                    </div>
                  )}
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: isExceeded ? '#fb7185' : '#fbbf24'
                    }}>
                      {isExceeded ? 'Budget Exceeded!' : 'Near-Limit Budget Warning'}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: 2 }}>
                      {ab.categoryName}: You have spent {formatCurrency(ab.spent, currency)} of{' '}
                      {formatCurrency(ab.budget.amount, currency)} ({ab.utilization}%).
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab('budgets')}
                  className="btn-secondary"
                  style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                >
                  Adjust Budget <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16
      }}>
        {/* Total Income */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Total Income</span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.5px' }}>
            {formatCurrency(summary?.totalIncome || 0, currency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
            For {monthNames[selectedMonth - 1]} {selectedYear}
          </div>
        </div>

        {/* Total Expense */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Total Expenses</span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185'
            }}>
              <TrendingDown size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fb7185', letterSpacing: '-0.5px' }}>
            {formatCurrency(summary?.totalExpenses || 0, currency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
            {summary?.transactionCount || 0} total transactions
          </div>
        </div>

        {/* Net Balance / Savings */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Net Balance</span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: (summary?.netBalance || 0) >= 0 ? '#818cf8' : '#fb7185',
            letterSpacing: '-0.5px'
          }}>
            {formatCurrency(summary?.netBalance || 0, currency)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
            {(summary?.netBalance || 0) >= 0 ? 'Surplus savings' : 'Deficit this month'}
          </div>
        </div>

        {/* Overall Budget Progress */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Overall Budget</span>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24'
            }}>
              <Target size={20} />
            </div>
          </div>

          {summary?.overallBudget.set ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {formatCurrency(summary.overallBudget.remaining, currency)}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: summary.overallBudget.utilization > 100 ? '#fb7185' : '#a5b4fc' }}>
                  {summary.overallBudget.utilization}% used
                </span>
              </div>
              {/* Progress bar */}
              <div style={{
                height: 8,
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden',
                marginTop: 10
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(summary.overallBudget.utilization, 100)}%`,
                  background: summary.overallBudget.utilization > 100
                    ? '#f43f5e'
                    : summary.overallBudget.utilization >= 80
                    ? '#f59e0b'
                    : 'linear-gradient(90deg, #6366f1, #10b981)',
                  borderRadius: 999,
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
                Limit: {formatCurrency(summary.overallBudget.amount, currency)}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>No monthly budget set</span>
              <button
                onClick={onOpenSetBudget}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#818cf8',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                + Set Monthly Target
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Charts & Recent Transactions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 20
      }}>
        {/* Category Spending Doughnut Chart */}
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Expense by Category</h3>
            <button
              onClick={() => onNavigateTab('analytics')}
              style={{
                background: 'none',
                border: 'none',
                color: '#818cf8',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Full Analytics →
            </button>
          </div>

          <div style={{ height: 260, position: 'relative' }}>
            {categoryBreakdown.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                gap: 8
              }}>
                <Receipt size={32} opacity={0.4} />
                <span style={{ fontSize: '0.9rem' }}>No expenses recorded for this period</span>
              </div>
            )}
          </div>
        </div>

        {/* Income vs Expenses Comparison Chart */}
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Income vs Expenses</h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
          </div>

          <div style={{ height: 260 }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="glass-card" style={{ padding: 22 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Transactions</h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
              Latest transactions recorded in your account
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onOpenAddTransaction}
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              <Plus size={16} /> Add Transaction
            </button>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              View All ({transactions.length})
            </button>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
            <Receipt size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No transactions yet</p>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Click "+ Add Transaction" above to start tracking your finances.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTransactions.map(tx => {
              const cat = catMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: cat ? `${cat.color}22` : 'rgba(255,255,255,0.06)',
                      color: cat?.color || '#a5b4fc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                        {tx.description || cat?.name || 'Transaction'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                        {cat?.name} • {formatDate(tx.transactionDate)}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: isIncome ? '#34d399' : '#fb7185'
                  }}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
