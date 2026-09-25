import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/views/AuthView';
import { DashboardView } from './components/views/DashboardView';
import { TransactionsView } from './components/views/TransactionsView';
import { BudgetsView } from './components/views/BudgetsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { CategoriesView } from './components/views/CategoriesView';
import { SettingsView } from './components/views/SettingsView';
import { TransactionModal } from './components/modals/TransactionModal';
import { BudgetModal } from './components/modals/BudgetModal';
import { CategoryModal } from './components/modals/CategoryModal';
import type { ITransaction, IBudget } from './types';
import { Plus } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [txToEdit, setTxToEdit] = useState<ITransaction | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [budgetToEdit, setBudgetToEdit] = useState<IBudget | null>(null);
  const [defaultBudgetCategoyId, setDefaultBudgetCategoyId] = useState<string | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--primary)',
        fontSize: '1.2rem',
        fontWeight: 600
      }}>
        Loading BudgZ Vault...
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleOpenAddTx = () => {
    setTxToEdit(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: ITransaction) => {
    setTxToEdit(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenSetBudget = (categoryId: string | null = null, budget: IBudget | null = null) => {
    setDefaultBudgetCategoyId(categoryId);
    setBudgetToEdit(budget);
    setIsBudgetModalOpen(true);
  };

  return (
    <FinanceProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main style={{
          flex: 1,
          maxWidth: 1400,
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px 80px'
        }}>
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddTransaction={handleOpenAddTx}
              onOpenSetBudget={() => handleOpenSetBudget(null)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              onOpenAddTransaction={handleOpenAddTx}
              onOpenEditTransaction={handleOpenEditTx}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              onOpenSetBudget={handleOpenSetBudget}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              onOpenAddCategory={() => setIsCategoryModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>

        {/* Floating Add Action Button for Quick Access */}
        <button
          onClick={handleOpenAddTx}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 90,
            transition: 'transform 0.2s'
          }}
          title="Quick Record Transaction"
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={26} />
        </button>

        {/* Global Modals */}
        <TransactionModal
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          transactionToEdit={txToEdit}
        />

        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          budgetToEdit={budgetToEdit}
          defaultCategoryId={defaultBudgetCategoyId}
        />

        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
        />
      </div>
    </FinanceProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
