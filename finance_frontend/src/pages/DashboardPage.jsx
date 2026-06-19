import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Plus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFinanceStore } from '../store/financeStore';
import StatCard from '../components/StatCard';
import ExpenseChart from '../components/ExpenseChart';
import BudgetProgress from '../components/BudgetProgress';
import TransactionList from '../components/TransactionList';
import { formatMoney } from '../utils/formatters';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { analytics, expenses, budgetSummary, fetchAnalytics, fetchExpenses, fetchBudgetSummary } = useFinanceStore();

  useEffect(() => {
    fetchAnalytics();
    fetchExpenses();
    fetchBudgetSummary();
  }, []);

  const currency = user?.currency || 'KZT';

  // Приветствие по времени суток
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('dashboard.greeting.morning');
    if (hour >= 12 && hour < 17) return t('dashboard.greeting.afternoon');
    if (hour >= 17 && hour < 22) return t('dashboard.greeting.evening');
    return t('dashboard.greeting.night');
  };

  // Месяц на нужном языке
  const getMonthYear = () => {
    const now = new Date();
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    const monthName = t(`months.${monthKeys[now.getMonth()]}`);
    return `${monthName} ${now.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            {getGreeting()}, <span className="gradient-text">{user?.username}</span>!
          </h1>
          <p className="text-dark-400 mt-1">{getMonthYear()} • {t('dashboard.financialSummary')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/bank" className="btn-primary flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">{t('account.openBank')}</span>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.monthlyIncome')}
          value={formatMoney(analytics?.income?.total || 0, currency)}
          icon={TrendingUp}
          type="income"
          delay={0}
        />
        <StatCard
          title={t('dashboard.monthlyExpenses')}
          value={formatMoney(analytics?.expenses?.total || 0, currency)}
          icon={TrendingDown}
          type="expense"
          delay={0.1}
        />
        <StatCard
          title={t('dashboard.monthlyBalance')}
          value={formatMoney(analytics?.balance?.month || 0, currency)}
          icon={Wallet}
          type="balance"
          delay={0.2}
        />
        <StatCard
          title={t('dashboard.totalBalance')}
          value={formatMoney(analytics?.balance?.total || 0, currency)}
          icon={Wallet}
          type="default"
          delay={0.3}
        />
      </div>

      {/* Charts & Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart 
          data={analytics?.expenses?.by_category} 
          currency={currency}
          title={t('dashboard.expensesByCategory')}
        />
        <BudgetProgress budget={budgetSummary} currency={currency} />
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display font-semibold text-white">{t('dashboard.recentExpenses')}</h3>
          <Link to="/expenses" className="btn-ghost flex items-center gap-1 text-sm">
            {t('dashboard.viewAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <TransactionList 
          transactions={expenses?.slice(0, 5)} 
          type="expense"
          currency={currency}
          emptyMessage={t('expenses.noExpenses')}
        />
      </motion.div>

      {/* AI Assistant Promo */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Link to="/ai-chat" className="block glass-card-hover p-6 group">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center transition-colors">
              <Sparkles className="w-6 h-6 text-primary-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-display font-bold text-white mb-1">
                {t('dashboard.aiPromo.title')}
              </h3>
              <p className="text-dark-400">
                {t('dashboard.aiPromo.description')}
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-dark-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
