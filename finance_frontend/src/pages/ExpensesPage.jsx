import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFinanceStore } from '../store/financeStore';
import StatCard from '../components/StatCard';
import TransactionList from '../components/TransactionList';
import ExpenseChart from '../components/ExpenseChart';
import { formatMoney } from '../utils/formatters';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { analytics, expenses, fetchAnalytics, fetchExpenses } = useFinanceStore();
  const currency = user?.currency || 'KZT';

  const getMonthYear = () => {
    const now = new Date();
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    return `${t(`months.${monthKeys[now.getMonth()]}`)} ${now.getFullYear()}`;
  };

  useEffect(() => {
    fetchAnalytics();
    fetchExpenses();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">{t('expenses.title')}</h1>
          <p className="text-dark-400 mt-1">{getMonthYear()}</p>
        </div>
      </motion.div>

      <div className="flex items-start gap-2 text-sm text-dark-400 bg-dark-900 border border-dark-800 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
        <span>{t('expenses.readOnlyHint')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('expenses.totalExpenses')} value={formatMoney(analytics?.expenses?.total || 0, currency)} icon={TrendingDown} type="expense" delay={0} />
        <StatCard title={t('expenses.transactionCount')} value={expenses?.length || 0} icon={TrendingDown} type="default" subtitle={t('dates.thisMonth')} delay={0.1} />
        <StatCard title={t('expenses.averageExpense')} value={formatMoney(expenses?.length ? (analytics?.expenses?.total || 0) / expenses.length : 0, currency)} icon={TrendingDown} type="default" subtitle={t('expenses.perTransaction')} delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart data={analytics?.expenses?.by_category} currency={currency} title={t('expenses.expenseStructure')} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-white mb-4">{t('expenses.topCategories')}</h3>
          {analytics?.expenses?.by_category && Object.keys(analytics.expenses.by_category).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(analytics.expenses.by_category).slice(0, 5).map(([name, value], index) => {
                const total = analytics.expenses.total || 1;
                const percent = (value / total) * 100;
                const cleanName = name.replace(/^[^\p{L}]+/u, '').trim();
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-dark-300">{cleanName}</span>
                      <span className="text-white font-medium">{formatMoney(value, currency)}</span>
                    </div>
                    <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.6, delay: index * 0.1 }} className="h-full bg-primary-500 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-dark-500 text-center py-8">{t('common.noData')}</p>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-white mb-6">{t('expenses.allExpenses')}</h3>
        <TransactionList transactions={expenses} type="expense" currency={currency} emptyMessage={t('expenses.noExpenses')} />
      </motion.div>
    </div>
  );
}
