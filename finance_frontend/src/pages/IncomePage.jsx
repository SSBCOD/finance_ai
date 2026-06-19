import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFinanceStore } from '../store/financeStore';
import StatCard from '../components/StatCard';
import TransactionList from '../components/TransactionList';
import { formatMoney } from '../utils/formatters';

export default function IncomePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { analytics, incomes, fetchAnalytics, fetchIncomes } = useFinanceStore();
  const currency = user?.currency || 'KZT';

  const getMonthYear = () => {
    const now = new Date();
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    return `${t(`months.${monthKeys[now.getMonth()]}`)} ${now.getFullYear()}`;
  };

  useEffect(() => {
    fetchAnalytics();
    fetchIncomes();
  }, []);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">{t('income.title')}</h1>
          <p className="text-dark-400 mt-1">{getMonthYear()}</p>
        </div>
      </motion.div>

      <div className="flex items-start gap-2 text-sm text-dark-400 bg-dark-900 border border-dark-800 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
        <span>{t('income.readOnlyHint')}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={t('income.totalIncome')} value={formatMoney(analytics?.income?.total || 0, currency)} icon={TrendingUp} type="income" delay={0} />
        <StatCard title={t('income.transactionCount')} value={incomes?.length || 0} icon={TrendingUp} type="default" subtitle={t('dates.thisMonth')} delay={0.1} />
        <StatCard title={t('income.averageIncome')} value={formatMoney(incomes?.length ? (analytics?.income?.total || 0) / incomes.length : 0, currency)} icon={TrendingUp} type="default" subtitle={t('income.perTransaction')} delay={0.2} />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-white mb-6">{t('income.allIncomes')}</h3>
        <TransactionList transactions={incomes} type="income" currency={currency} emptyMessage={t('income.noIncomes')} />
      </motion.div>
    </div>
  );
}
