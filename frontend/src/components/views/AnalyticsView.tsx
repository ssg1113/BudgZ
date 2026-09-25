import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, monthNames } from '../../utils/formatters';
import { CategoryIcon } from '../../utils/categoryIcons';
import '../../utils/chartConfig';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  TrendingUp,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  Receipt
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const {
    selectedMonth,
    selectedYear,
    summary,
    categoryBreakdown,
    spendingTrends
  } = useFinance();

  const isDark = theme === 'dark';
  const chartTextColor = isDark ? '#94a3b8' : '#475569';
  const chartGridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const chartBorderColor = isDark ? '#131b2e' : '#ffffff';

  const currency = user?.currency || 'LKR';

  // Doughnut Chart Data
  const doughnutData = {
    labels: categoryBreakdown.map(c => c.name),
    datasets: [
      {
        data: categoryBreakdown.map(c => c.amount),
        backgroundColor: categoryBreakdown.map(c => c.color),
        borderColor: chartBorderColor,
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: chartTextColor,
          font: { size: 12 },
          padding: 14,
          boxWidth: 14
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
    cutout: '68%'
  };

  // Line Chart Data (Daily Trends)
  const lineData = {
    labels: spendingTrends.map(p => `Day ${p.day}`),
    datasets: [
      {
        label: 'Daily Expenses',
        data: spendingTrends.map(p => p.expense),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6
      },
      {
        label: 'Daily Income',
        data: spendingTrends.map(p => p.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        tension: 0.35,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: chartTextColor, maxTicksLimit: 15 }
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
        position: 'top' as const,
        labels: { color: chartTextColor, boxWidth: 14 }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Financial Analytics</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Comprehensive spending breakdown and trends for {monthNames[selectedMonth - 1]} {selectedYear}
        </p>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16
      }}>
        {/* Highest Spending Category */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Highest Spending Category</span>
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
              <Award size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>
            {summary?.highestExpenseCategory.name || 'None'}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#fb7185', fontWeight: 700, marginTop: 4 }}>
            {formatCurrency(summary?.highestExpenseCategory.amount || 0, currency)}
          </div>
        </div>

        {/* Net Savings Rate */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Savings Rate</span>
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
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
            {summary && summary.totalIncome > 0
              ? `${Math.max(0, Math.round(((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100))}%`
              : '0%'}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            Saved {formatCurrency(Math.max(0, (summary?.totalIncome || 0) - (summary?.totalExpenses || 0)), currency)}
          </div>
        </div>

        {/* Total Expense Count */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Transactions Volume</span>
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
              <Layers size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {summary?.transactionCount || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
            In {monthNames[selectedMonth - 1]}
          </div>
        </div>
      </div>

      {/* Spending Trend Over Time (Line Chart) */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>Daily Cashflow Timeline</h2>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 18 }}>
          Day-by-day progression of incoming earnings versus expenditures
        </p>
        <div style={{ height: 300 }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Category Breakdown: Chart & Table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20
      }}>
        {/* Doughnut Chart */}
        <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>Category Distribution</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16 }}>
            Share of overall expenses by category
          </p>
          <div style={{ height: 280, position: 'relative' }}>
            {categoryBreakdown.length > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b'
              }}>
                No expense data available for chart
              </div>
            )}
          </div>
        </div>

        {/* Detailed Category Table */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 4 }}>Breakdown Details</h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16 }}>
            Aggregated expenditure list and weight percentage
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
            {categoryBreakdown.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                No category expenses to display
              </div>
            ) : (
              categoryBreakdown.map(cb => (
                <div
                  key={cb.categoryId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: `${cb.color}22`,
                      color: cb.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CategoryIcon name={cb.icon} size={15} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cb.name}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {formatCurrency(cb.amount, currency)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {cb.percentage}% of total
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
