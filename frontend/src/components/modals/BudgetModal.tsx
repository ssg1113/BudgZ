import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { IBudget } from '../../types';
import { api } from '../../services/api';
import { CategoryIcon } from '../../utils/categoryIcons';
import { monthNames } from '../../utils/formatters';
import { X, Target } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: IBudget | null;
  defaultCategoryId?: string | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
  defaultCategoryId = null
}) => {
  const { categories, selectedMonth, selectedYear, refreshData } = useFinance();

  const [categoryId, setCategoryId] = useState<string | null>(defaultCategoryId);
  const [amount, setAmount] = useState<string>('');
  const [warningThreshold, setWarningThreshold] = useState<number>(80);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.categoryId);
      setAmount(String(budgetToEdit.amount));
      setWarningThreshold(budgetToEdit.warningThreshold || 80);
    } else {
      setCategoryId(defaultCategoryId);
      setAmount('');
      setWarningThreshold(80);
    }
  }, [budgetToEdit, defaultCategoryId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a budget amount greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.setBudget({
        categoryId,
        amount: parsedAmount,
        month: selectedMonth,
        year: selectedYear,
        warningThreshold
      });

      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <Target size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {budgetToEdit ? 'Adjust Budget' : 'Set Budget Target'}
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                For {monthNames[selectedMonth - 1]} {selectedYear}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 10,
            padding: '10px 14px',
            color: '#fb7185',
            fontSize: '0.85rem',
            marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Target Type: Overall vs Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
              Budget Scope
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: `1px solid ${categoryId === null ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                  background: categoryId === null ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: categoryId === null ? '#a5b4fc' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Overall Monthly
              </button>
              <button
                type="button"
                onClick={() => {
                  if (categoryId === null && expenseCategories.length > 0) {
                    setCategoryId(expenseCategories[0].id);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 10,
                  border: `1px solid ${categoryId !== null ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                  background: categoryId !== null ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                  color: categoryId !== null ? '#a5b4fc' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Category Specific
              </button>
            </div>

            {categoryId !== null && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 8,
                maxHeight: 140,
                overflowY: 'auto',
                padding: 2
              }}>
                {expenseCategories.map(cat => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px',
                        borderRadius: 10,
                        border: `1px solid ${isSelected ? cat.color : 'rgba(255,255,255,0.08)'}`,
                        background: isSelected ? `${cat.color}22` : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#fff' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 700 : 500,
                        textAlign: 'left'
                      }}
                    >
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        background: cat.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        flexShrink: 0
                      }}>
                        <CategoryIcon name={cat.icon} size={12} />
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Budget Limit Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Budget Limit Amount
            </label>
            <input
              type="number"
              step="1"
              placeholder="e.g. 800"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="glass-input"
              style={{ fontSize: '1.25rem', fontWeight: 700 }}
              required
            />
          </div>

          {/* Warning Threshold Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>
                Warning Threshold Alert
              </label>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: warningThreshold >= 85 ? '#f59e0b' : '#34d399',
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: 6
              }}>
                Trigger at {warningThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={warningThreshold}
              onChange={e => setWarningThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
              <span>50% (Early notice)</span>
              <span>80% (Default standard)</span>
              <span>95% (Near max)</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 6 }}
          >
            {isSubmitting ? 'Saving...' : 'Set Budget'}
          </button>
        </form>
      </div>
    </div>
  );
};
