import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import type { IBudget, BudgetStatusReport } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, monthNames } from '../../utils/formatters';
import { CategoryIcon } from '../../utils/categoryIcons';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  PieChart
} from 'lucide-react';

interface BudgetsViewProps {
  onOpenSetBudget: (categoryId?: string | null, budgetToEdit?: IBudget | null) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ onOpenSetBudget }) => {
  const { user } = useAuth();
  const {
    selectedMonth,
    selectedYear,
    budgets,
    categories,
    refreshData
  } = useFinance();

  const currency = user?.currency || 'LKR';
  const catMap = new Map(categories.map(c => [c.id, c]));

  const [budgetToDelete, setBudgetToDelete] = useState<IBudget | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const overallBudget = budgets.find(b => b.budget.categoryId === null);
  const categoryBudgets = budgets.filter(b => b.budget.categoryId !== null);

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteBudget(budgetToDelete.id);
      await refreshData();
      setBudgetToDelete(null);
    } catch (err) {
      console.error('Failed to delete budget:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: BudgetStatusReport['status'], utilization: number) => {
    if (status === 'EXCEEDED') {
      return (
        <span className="badge badge-exceeded">
          <AlertCircle size={12} /> Exceeded ({utilization}%)
        </span>
      );
    }
    if (status === 'WARNING') {
      return (
        <span className="badge badge-warning">
          <AlertTriangle size={12} /> Near Limit ({utilization}%)
        </span>
      );
    }
    return (
      <span className="badge badge-normal">
        <CheckCircle2 size={12} /> On Track ({utilization}%)
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Budgets & Targets</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            Manage monthly thresholds for {monthNames[selectedMonth - 1]} {selectedYear}
          </p>
        </div>
        <button
          onClick={() => onOpenSetBudget(null)}
          className="btn-primary"
        >
          <Plus size={18} /> Set New Budget
        </button>
      </div>

      {/* Overall Monthly Budget Hero Card */}
      <div className="glass-card glass-card-glow" style={{ padding: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}>
              <Target size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Overall Monthly Budget</h2>
                {overallBudget && getStatusBadge(overallBudget.status, overallBudget.utilization)}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
                Applies across all expense categories for {monthNames[selectedMonth - 1]}
              </p>
            </div>
          </div>

          {overallBudget ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onOpenSetBudget(null, overallBudget.budget)}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                <Edit2 size={14} /> Adjust
              </button>
              <button
                onClick={() => setBudgetToDelete(overallBudget.budget)}
                className="btn-danger"
                style={{ padding: '6px 10px' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onOpenSetBudget(null)}
              className="btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              + Set Overall Target
            </button>
          )}
        </div>

        {overallBudget ? (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 16
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Budget Cap</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: 4 }}>
                  {formatCurrency(overallBudget.budget.amount, currency)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Spent</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fb7185', marginTop: 4 }}>
                  {formatCurrency(overallBudget.spent, currency)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Remaining</span>
                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: overallBudget.remaining >= 0 ? '#34d399' : '#fb7185',
                  marginTop: 4
                }}>
                  {formatCurrency(overallBudget.remaining, currency)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Warning Threshold</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
                  {overallBudget.budget.warningThreshold}%
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div style={{
              height: 12,
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(overallBudget.utilization, 100)}%`,
                background: overallBudget.status === 'EXCEEDED'
                  ? 'linear-gradient(90deg, #f43f5e, #e11d48)'
                  : overallBudget.status === 'WARNING'
                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                  : 'linear-gradient(90deg, #10b981, #059669)',
                borderRadius: 999,
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <p style={{ fontSize: '0.9rem' }}>
              You have not set an overall monthly spending limit for {monthNames[selectedMonth - 1]}.
            </p>
          </div>
        )}
      </div>

      {/* Category Specific Budgets Grid */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Category Budgets</h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>
              Track spending against limits for individual categories
            </p>
          </div>
        </div>

        {categoryBudgets.length === 0 ? (
          <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <PieChart size={38} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#94a3b8' }}>No category budgets set</p>
            <p style={{ fontSize: '0.8rem', marginTop: 4 }}>
              Assign spending limits to categories like Food, Transport, or Shopping.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16
          }}>
            {categoryBudgets.map(cb => {
              const cat = catMap.get(cb.budget.categoryId || '');
              return (
                <div key={cb.budget.id} className="glass-card" style={{ padding: 20 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: cat ? `${cat.color}22` : 'rgba(255,255,255,0.06)',
                        color: cat?.color || '#a5b4fc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {cb.categoryName}
                        </div>
                        <div style={{ marginTop: 3 }}>
                          {getStatusBadge(cb.status, cb.utilization)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => onOpenSetBudget(cb.budget.categoryId, cb.budget)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#94a3b8',
                          borderRadius: 8,
                          padding: '6px 8px',
                          cursor: 'pointer'
                        }}
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setBudgetToDelete(cb.budget)}
                        style={{
                          background: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.2)',
                          color: '#fb7185',
                          borderRadius: 8,
                          padding: '6px 8px',
                          cursor: 'pointer'
                        }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Figures */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 10
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Spent / Cap</span>
                      <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 2 }}>
                        {formatCurrency(cb.spent, currency)}{' '}
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                          / {formatCurrency(cb.budget.amount, currency)}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Remaining</span>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: cb.remaining >= 0 ? '#34d399' : '#fb7185',
                        marginTop: 2
                      }}>
                        {formatCurrency(cb.remaining, currency)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{
                    height: 8,
                    borderRadius: 999,
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(cb.utilization, 100)}%`,
                      background: cb.status === 'EXCEEDED'
                        ? '#f43f5e'
                        : cb.status === 'WARNING'
                        ? '#f59e0b'
                        : cat?.color || '#10b981',
                      borderRadius: 999,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Budget Confirmation Modal */}
      {budgetToDelete && (
        <div className="modal-overlay" onClick={() => setBudgetToDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 24, maxWidth: 400 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fb7185', marginBottom: 10 }}>
              Remove Budget Target?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to delete this budget limit? Your past transactions will not be deleted, but alert threshold tracking for this target will stop.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBudget}
                disabled={isDeleting}
                className="btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Delete Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
