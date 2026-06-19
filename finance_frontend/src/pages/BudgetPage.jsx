import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Wallet, Target, AlertTriangle, CheckCircle, Lightbulb, TrendingUp, PiggyBank, CircleDollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useFinanceStore } from '../store/financeStore';
import { budgetAPI } from '../services/api';
import BudgetProgress from '../components/BudgetProgress';
import { formatMoney } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function BudgetPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { budgetSummary, fetchBudgetSummary, fetchAnalytics } = useFinanceStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ total_budget: '' });
  const currency = user?.currency || 'KZT';

  const getMonthYear = () => {
    const now = new Date();
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    return { monthName: t(`months.${monthKeys[now.getMonth()]}`), year: now.getFullYear(), month: now.getMonth() + 1 };
  };

  const { monthName, year, month } = getMonthYear();

  useEffect(() => {
    fetchBudgetSummary();
    fetchAnalytics();
  }, []);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!formData.total_budget) {
      toast.error(t('errors.required'));
      return;
    }
    setLoading(true);
    try {
      await budgetAPI.createBudget({ year, month, total_budget: parseFloat(formData.total_budget) });
      toast.success(t('budget.budgetCreated'));
      setShowCreateModal(false);
      setFormData({ total_budget: '' });
      fetchBudgetSummary();
    } catch (error) {
      toast.error(t('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const tips = [
    { icon: Lightbulb, title: t('budget.tips.rule503020.title'), desc: t('budget.tips.rule503020.description'), color: 'text-amber-400' },
    { icon: TrendingUp, title: t('budget.tips.trackExpenses.title'), desc: t('budget.tips.trackExpenses.description'), color: 'text-primary-400' },
    { icon: Target, title: t('budget.tips.setGoals.title'), desc: t('budget.tips.setGoals.description'), color: 'text-income-400' },
    { icon: PiggyBank, title: t('budget.tips.emergencyFund.title'), desc: t('budget.tips.emergencyFund.description'), color: 'text-accent-400' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">{t('budget.title')}</h1>
          <p className="text-dark-400 mt-1">{monthName} {year}</p>
        </div>
        {!budgetSummary?.has_budget && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>{t('budget.createBudget')}</span>
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetProgress budget={budgetSummary} currency={currency} />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-400" />
            {t('budget.tips.title')}
          </h3>
          <div className="space-y-4">
            {tips.map((tip, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.1 }} className="flex gap-4 p-3 rounded-xl bg-dark-800/30">
                <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center flex-shrink-0">
                  <tip.icon className={`w-5 h-5 ${tip.color}`} />
                </div>
                <div>
                  <p className="font-medium text-white">{tip.title}</p>
                  <p className="text-sm text-dark-400">{tip.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {budgetSummary?.has_budget && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <CircleDollarSign className="w-5 h-5 text-primary-400" />
              </div>
              <span className="text-dark-400">{t('budget.totalBudget')}</span>
            </div>
            <p className="text-2xl font-display font-bold text-white">{formatMoney(budgetSummary.total_budget, currency)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-expense-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-expense-400" />
              </div>
              <span className="text-dark-400">{t('budget.spent')}</span>
            </div>
            <p className="text-2xl font-display font-bold text-expense-400">{formatMoney(budgetSummary.total_spent, currency)}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${budgetSummary.is_exceeded ? 'bg-expense-500/10' : 'bg-income-500/10'}`}>
                {budgetSummary.is_exceeded ? <AlertTriangle className="w-5 h-5 text-expense-400" /> : <CheckCircle className="w-5 h-5 text-income-400" />}
              </div>
              <span className="text-dark-400">{t('budget.remaining')}</span>
            </div>
            <p className={`text-2xl font-display font-bold ${budgetSummary.is_exceeded ? 'text-expense-400' : 'text-income-400'}`}>
              {formatMoney(budgetSummary.remaining, currency)}
            </p>
          </motion.div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md glass-card p-6">
            <h2 className="text-xl font-display font-bold text-white mb-6">{t('budget.createBudget')} - {monthName}</h2>
            <form onSubmit={handleCreateBudget} className="space-y-5">
              <div>
                <label className="input-label">{t('budget.monthlyBudget')}</label>
                <div className="relative">
                  <input type="number" step="0.01" min="1" value={formData.total_budget} onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })} placeholder="0.00" className="input-field text-2xl font-mono font-semibold pl-12" required />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 text-xl">{currency === 'KZT' ? '₸' : currency === 'RUB' ? '₽' : currency === 'EUR' ? '€' : '$'}</span>
                </div>
                <p className="text-dark-500 text-sm mt-2">{t('budget.howMuchToSpend')}</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : t('common.save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
