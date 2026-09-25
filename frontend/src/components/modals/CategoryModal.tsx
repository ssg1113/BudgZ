import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { api } from '../../services/api';
import { CategoryIcon, iconMap } from '../../utils/categoryIcons';
import { X, Palette } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const colorPalette = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#64748b'  // Slate
];

const availableIcons = Object.keys(iconMap);

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const { refreshData } = useFinance();

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState<string>(colorPalette[0]);
  const [icon, setIcon] = useState<string>('Tag');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createCategory({
        name: name.trim(),
        type,
        color,
        icon
      });

      await refreshData();
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
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
              background: `${color}22`,
              color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Palette size={20} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>New Custom Category</h2>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Category Type */}
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
                color: type === 'expense' ? '#fb7185' : '#94a3b8'
              }}
            >
              Expense Category
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
                color: type === 'income' ? '#34d399' : '#94a3b8'
              }}
            >
              Income Category
            </button>
          </div>

          {/* Category Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Subscriptions & Cloud"
              value={name}
              onChange={e => setName(e.target.value)}
              className="glass-input"
              required
              maxLength={40}
            />
          </div>

          {/* Color Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
              Color Theme
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {colorPalette.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                    boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                    transition: 'all 0.15s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
              Select Icon
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
              gap: 8,
              maxHeight: 120,
              overflowY: 'auto',
              padding: 2
            }}>
              {availableIcons.map(icName => {
                const isSelected = icon === icName;
                return (
                  <button
                    key={icName}
                    type="button"
                    onClick={() => setIcon(icName)}
                    style={{
                      height: 44,
                      borderRadius: 10,
                      border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.08)'}`,
                      background: isSelected ? `${color}33` : 'rgba(255,255,255,0.03)',
                      color: isSelected ? '#fff' : '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s'
                    }}
                  >
                    <CategoryIcon name={icName} size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: 8 }}
          >
            {isSubmitting ? 'Creating...' : 'Create Category'}
          </button>
        </form>
      </div>
    </div>
  );
};
