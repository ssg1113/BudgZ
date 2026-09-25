import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { ICategory } from '../../types';
import { api } from '../../services/api';
import { CategoryIcon } from '../../utils/categoryIcons';
import {
  Plus,
  Trash2,
  Lock,
  Tag,
  AlertTriangle,
  FolderPlus
} from 'lucide-react';

interface CategoriesViewProps {
  onOpenAddCategory: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ onOpenAddCategory }) => {
  const { categories, transactions, refreshData } = useFinance();

  const [categoryToDelete, setCategoryToDelete] = useState<ICategory | null>(null);
  const [reassignCategory, setReassignCategory] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Count transactions using each category
  const txCountByCat = transactions.reduce((acc, tx) => {
    acc[tx.categoryId] = (acc[tx.categoryId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      await api.deleteCategory(categoryToDelete.id, reassignCategory || undefined);
      await refreshData();
      setCategoryToDelete(null);
      setReassignCategory('');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const otherCatOptions = categories.filter(c => c.id !== categoryToDelete?.id && c.type === categoryToDelete?.type);

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
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Categories</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            System standard categories and custom user-created classifications
          </p>
        </div>
        <button onClick={onOpenAddCategory} className="btn-primary">
          <Plus size={18} /> New Custom Category
        </button>
      </div>

      {/* Expense Categories */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Expense Categories</h2>
          <span className="badge badge-expense">{expenseCategories.length}</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14
        }}>
          {expenseCategories.map(cat => {
            const count = txCountByCat[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="glass-card"
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: `${cat.color}22`,
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 12px ${cat.color}33`
                  }}>
                    <CategoryIcon name={cat.icon} size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                      {count} transaction{count === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                {cat.isDefault ? (
                  <span title="Standard system category" style={{ color: '#64748b', padding: 6 }}>
                    <Lock size={15} />
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setCategoryToDelete(cat);
                      setDeleteError('');
                      if (otherCatOptions.length > 0) setReassignCategory(otherCatOptions[0].id);
                    }}
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      color: '#fb7185',
                      borderRadius: 8,
                      padding: '6px 8px',
                      cursor: 'pointer'
                    }}
                    title="Delete Category"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Income Categories */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Income Categories</h2>
          <span className="badge badge-income">{incomeCategories.length}</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 14
        }}>
          {incomeCategories.map(cat => {
            const count = txCountByCat[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className="glass-card"
                style={{
                  padding: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: `${cat.color}22`,
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 12px ${cat.color}33`
                  }}>
                    <CategoryIcon name={cat.icon} size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                      {count} transaction{count === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                {cat.isDefault ? (
                  <span title="Standard system category" style={{ color: '#64748b', padding: 6 }}>
                    <Lock size={15} />
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setCategoryToDelete(cat);
                      setDeleteError('');
                      if (otherCatOptions.length > 0) setReassignCategory(otherCatOptions[0].id);
                    }}
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      color: '#fb7185',
                      borderRadius: 8,
                      padding: '6px 8px',
                      cursor: 'pointer'
                    }}
                    title="Delete Category"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Delete Category with Safe Reassignment Modal */}
      {categoryToDelete && (
        <div className="modal-overlay" onClick={() => setCategoryToDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 24, maxWidth: 440 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fb7185', marginBottom: 10 }}>
              Delete Category "{categoryToDelete.name}"?
            </h3>

            {deleteError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 10,
                padding: '8px 12px',
                color: '#fb7185',
                fontSize: '0.85rem',
                marginBottom: 12
              }}>
                {deleteError}
              </div>
            )}

            {(txCountByCat[categoryToDelete.id] || 0) > 0 ? (
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#fbbf24',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: 8
                }}>
                  <AlertTriangle size={18} />
                  Category is used by {txCountByCat[categoryToDelete.id]} transactions
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 12 }}>
                  To safely delete this category without corrupting your historical records, select a category to reassign these transactions to:
                </p>

                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
                  Reassign existing transactions to:
                </label>
                <select
                  value={reassignCategory}
                  onChange={e => setReassignCategory(e.target.value)}
                  className="glass-input"
                  required
                >
                  {otherCatOptions.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 20 }}>
                This category is not used by any transactions. Are you sure you want to delete it?
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={isDeleting}
                className="btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
