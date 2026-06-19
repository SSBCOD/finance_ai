import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Wallet } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../utils/formatters';

export default function BudgetProgress({ budget, currency = 'KZT' }) {
  const { t } = useLanguage();

  if (!budget || !budget.has_budget) {
    return (
      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-white mb-4">{t('budget.monthlyBudget')}</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-800 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-dark-600" />
          </div>
          <p className="text-dark-400 mb-2">{t('budget.noBudget')}</p>
          <p className="text-dark-500 text-sm">{t('budget.noBudgetDescription')}</p>
        </div>
      </div>
    );
  }

  const { total_budget, total_spent, remaining, is_exceeded, category_limits } = budget;
  const percent = Math.min((total_spent / total_budget) * 100, 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-white">{t('budget.monthlyBudget')}</h3>
        {is_exceeded ? (
          <span className="badge bg-expense-500/20 text-expense-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {t('budget.exceeded')}
          </span>
        ) : (
          <span className="badge bg-income-500/20 text-income-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {t('budget.normal')}
          </span>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-2xl font-display font-bold text-white">{formatMoney(total_spent, currency)}</span>
            <span className="text-dark-500 ml-2">/ {formatMoney(total_budget, currency)}</span>
          </div>
          <span className={`text-sm font-semibold ${is_exceeded ? 'text-expense-400' : 'text-income-400'}`}>
            {percent.toFixed(0)}%
          </span>
        </div>

        <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(percent, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${is_exceeded ? 'bg-gradient-to-r from-expense-500 to-expense-400' : percent > 80 ? 'bg-gradient-to-r from-accent-500 to-accent-400' : 'bg-gradient-to-r from-income-500 to-income-400'}`}
          />
        </div>

        <p className={`text-sm mt-2 ${is_exceeded ? 'text-expense-400' : 'text-dark-400'}`}>
          {is_exceeded ? `${t('budget.overBy')} ${formatMoney(Math.abs(remaining), currency)}` : `${t('budget.leftToSpend')} ${formatMoney(remaining, currency)}`}
        </p>
      </div>

      {category_limits && category_limits.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-dark-400 mb-3">{t('budget.categoryLimits')}</h4>
          <div className="space-y-3">
            {category_limits.slice(0, 5).map((limit, index) => {
              const catPercent = Math.min((limit.spent / limit.limit) * 100, 100);
              const cleanName = limit.category?.replace(/^[^\p{L}]+/u, '').trim();
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-dark-300">{cleanName}</span>
                    <span className={limit.is_exceeded ? 'text-expense-400' : 'text-dark-500'}>
                      {formatMoney(limit.spent, currency)} / {formatMoney(limit.limit, currency)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${catPercent}%` }} transition={{ duration: 0.6, delay: index * 0.1 }} className={`h-full rounded-full ${limit.is_exceeded ? 'bg-expense-500' : 'bg-primary-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
