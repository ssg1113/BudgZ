import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import type { ITransaction } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CategoryIcon } from '../../utils/categoryIcons';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  DollarSign,
  ArrowUpDown,
  X
} from 'lucide-react';

interface TransactionsViewProps {
  onOpenAddTransaction: () => void;
  onOpenEditTransaction: (tx: ITransaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddTransaction,
  onOpenEditTransaction
}) => {
  const { user } = useAuth();
  const { transactions, categories, refreshData } = useFinance();
  const currency = user?.currency || 'LKR';

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Filters state
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Deletion confirm modal state
  const [txToDelete, setTxToDelete] = useState<ITransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Client-side filtering & sorting
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && tx.categoryId !== categoryFilter) return false;
      if (startDate && tx.transactionDate < startDate) return false;
      if (endDate && tx.transactionDate > endDate) return false;
      if (minAmount && tx.amount < parseFloat(minAmount)) return false;
      if (maxAmount && tx.amount > parseFloat(maxAmount)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const cat = catMap.get(tx.categoryId);
        const matchDesc = tx.description.toLowerCase().includes(q);
        const matchCat = cat?.name.toLowerCase().includes(q);
        if (!matchDesc && !matchCat) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      const timeA = new Date(a.transactionDate).getTime();
      const timeB = new Date(b.transactionDate).getTime();
      return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
  }, [transactions, typeFilter, categoryFilter, startDate, endDate, minAmount, maxAmount, search, sortBy, sortOrder, catMap]);

  const handleDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(txToDelete.id);
      await refreshData();
      setTxToDelete(null);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    search ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    startDate ||
    endDate ||
    minAmount ||
    maxAmount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Transactions</h1>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
            Monitor, filter, and organize your expenses and income records
          </p>
        </div>
        <button
          onClick={onOpenAddTransaction}
          className="btn-primary"
        >
          <Plus size={18} /> New Transaction
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Search Bar & Type Quick Filter */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search
              size={18}
              color="#64748b"
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search description or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input"
              style={{ paddingLeft: 42 }}
            />
          </div>

          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 10,
            padding: 3,
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {(['all', 'income', 'expense'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: typeFilter === t ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                  color: typeFilter === t ? '#818cf8' : '#94a3b8',
                  fontWeight: typeFilter === t ? 700 : 500,
                  fontSize: '0.82rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: '#fb7185',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>

        {/* Extended Filter Controls Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Category Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="glass-input"
              style={{ fontSize: '0.85rem', padding: '8px 10px' }}
            >
              <option value="all" style={{ background: '#1e293b' }}>All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#1e293b' }}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="glass-input"
              style={{ fontSize: '0.85rem', padding: '8px 10px' }}
            />
          </div>

          {/* End Date */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="glass-input"
              style={{ fontSize: '0.85rem', padding: '8px 10px' }}
            />
          </div>

          {/* Min Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
              Min Amount
            </label>
            <input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value)}
              className="glass-input"
              style={{ fontSize: '0.85rem', padding: '8px 10px' }}
            />
          </div>

          {/* Max Amount */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
              Max Amount
            </label>
            <input
              type="number"
              placeholder="Any"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value)}
              className="glass-input"
              style={{ fontSize: '0.85rem', padding: '8px 10px' }}
            />
          </div>

          {/* Sort By */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>
              Sort
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'date' | 'amount')}
                className="glass-input"
                style={{ fontSize: '0.85rem', padding: '8px 10px', flex: 1 }}
              >
                <option value="date" style={{ background: '#1e293b' }}>Date</option>
                <option value="amount" style={{ background: '#1e293b' }}>Amount</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                className="btn-secondary"
                style={{ padding: '8px 10px' }}
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>
            Showing {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b' }}>
            <Filter size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>No transactions found</p>
            <p style={{ fontSize: '0.82rem', marginTop: 4 }}>
              {hasActiveFilters
                ? 'Try adjusting or clearing your filters to see more results.'
                : 'Get started by creating your first transaction.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredTransactions.map(tx => {
              const cat = catMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    flexWrap: 'wrap',
                    gap: 12,
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: cat ? `${cat.color}22` : 'rgba(255,255,255,0.06)',
                      color: cat?.color || '#a5b4fc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CategoryIcon name={cat?.icon || 'Tag'} size={20} />
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.98rem' }}>
                        {tx.description || cat?.name || 'Untitled Transaction'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: cat?.color || '#94a3b8',
                          fontWeight: 600
                        }}>
                          {cat?.name || 'Other'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {formatDate(tx.transactionDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: isIncome ? '#34d399' : '#fb7185',
                      textAlign: 'right'
                    }}>
                      {isIncome ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => onOpenEditTransaction(tx)}
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
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => setTxToDelete(tx)}
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
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <div className="modal-overlay" onClick={() => setTxToDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: 24, maxWidth: 420 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fb7185', marginBottom: 12 }}>
              Delete Transaction?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to delete this {txToDelete.type} transaction of{' '}
              <strong>{formatCurrency(txToDelete.amount, currency)}</strong>? This will automatically recalculate your budgets.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setTxToDelete(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
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
