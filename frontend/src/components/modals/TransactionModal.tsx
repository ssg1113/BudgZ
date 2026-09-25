import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { ITransaction } from '../../types';
import { api } from '../../services/api';
import { CategoryIcon } from '../../utils/categoryIcons';
import { X, Plus, Check } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: ITransaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit
}) => {
  const { categories, refreshData } = useFinance();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const filteredCategories = categories.filter(c => c.type === type);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setCategoryId(transactionToEdit.categoryId);
      setDescription(transactionToEdit.description);
      setTransactionDate(transactionToEdit.transactionDate.substring(0, 10));
    } else {
      setType('expense');
      setAmount('');
      setDescription('');
      setTransactionDate(new Date().toISOString().substring(0, 10));
    }
  }, [transactionToEdit, isOpen]);

  // Default to first matching category when type changes
  useEffect(() => {
    if (!transactionToEdit && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    setIsSubmitting(true);
    try {
      if (transactionToEdit) {
        await api.updateTransaction(transactionToEdit.id, {
          type,
          amount: parsedAmount,
          categoryId,
          description,
          transactionDate
        });
      } else {
        await api.createTransaction({
          type,
          amount: parsedAmount,
          categoryId,
          description,
          transactionDate
        });
      }

      await refreshData();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {transactionToEdit ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Income vs Expense Toggle */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.04)',
            padding: 4,
            borderRadius: 12
          }}>
            <button
              type="button"
              onClick={() => setType('expense')}
              style={{
                padding: '10px',
                borderRadius: 10,
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: type === 'expense' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                color: type === 'expense' ? '#fb7185' : '#94a3b8',
                borderBottom: type === 'expense' ? '2px solid #f43f5e' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              style={{
                padding: '10px',
                borderRadius: 10,
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: type === 'income' ? '#34d399' : '#94a3b8',
                borderBottom: type === 'income' ? '2px solid #10b981' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Income (+)
            </button>
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="glass-input"
              style={{ fontSize: '1.3rem', fontWeight: 700 }}
              required
            />
          </div>

          {/* Category Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
              Category
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 8,
              maxHeight: 180,
              overflowY: 'auto',
              paddingRight: 4
            }}>
              {filteredCategories.map(cat => {
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
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: `1px solid ${isSelected ? cat.color : 'rgba(255,255,255,0.08)'}`,
                      background: isSelected ? `${cat.color}22` : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#fff' : '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      textAlign: 'left',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: cat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0
                    }}>
                      <CategoryIcon name={cat.icon} size={14} />
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Date
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={e => setTransactionDate(e.target.value)}
              className="glass-input"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery trip to Trader Joe's"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="glass-input"
              maxLength={200}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 8 }}
          >
            {isSubmitting ? 'Saving...' : transactionToEdit ? 'Update Transaction' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  );
};
