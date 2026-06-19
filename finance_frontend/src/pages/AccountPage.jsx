import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Lock, CreditCard,
  ExternalLink, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { accountAPI } from '../services/api';
import { formatMoney, formatDate } from '../utils/formatters';
import ExpenseChart from '../components/ExpenseChart';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const currency = user?.currency || 'KZT';

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [accRes, txRes, anRes] = await Promise.all([
        accountAPI.getAccount(),
        accountAPI.getTransactions({ limit: 50 }),
        accountAPI.getAnalytics(),
      ]);
      setAccount(accRes.data);
      setTransactions(txRes.data);
      setAnalytics(anRes.data);
    } catch (e) {
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{t('account.title')}</h1>
          <p className="text-dark-400">{t('account.subtitle')}</p>
        </div>
        <Link to="/bank" className="btn-secondary flex items-center gap-2 text-sm">
          <ExternalLink className="w-4 h-4" />
          {t('account.openBank')}
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-dark-900 border border-dark-800 p-8"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-dark-500">
              <CreditCard className="w-4 h-4" />
              <span className="text-xs font-mono tracking-widest">{account.account_number}</span>
            </div>
            <Wallet className="w-5 h-5 text-dark-600" />
          </div>

          <div className="mb-8">
            <p className="text-dark-500 text-sm mb-2">{t('account.balance')}</p>
            <p className="text-4xl sm:text-5xl font-display font-semibold text-white tracking-tight">
              {formatMoney(account.balance, currency)}
            </p>
          </div>

          <div className="flex flex-wrap gap-8 pt-5 border-t border-dark-800">
            <div>
              <p className="text-dark-500 text-xs mb-1">{t('account.available')}</p>
              <p className="text-base font-medium text-white">
                {formatMoney(account.available_amount, currency)}
              </p>
            </div>
            <div>
              <p className="text-dark-500 text-xs mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> {t('account.reserved')}
              </p>
              <p className="text-base font-medium text-dark-300">
                {formatMoney(account.reserved_amount, currency)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-income-500/15 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-income-400" />
          </div>
          <div>
            <p className="text-dark-400 text-xs">{t('account.monthIn')}</p>
            <p className="text-white font-semibold">{formatMoney(analytics?.month_in || 0, currency)}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-expense-500/15 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-expense-400" />
          </div>
          <div>
            <p className="text-dark-400 text-xs">{t('account.monthOut')}</p>
            <p className="text-white font-semibold">{formatMoney(analytics?.month_out || 0, currency)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart data={analytics?.by_category} currency={currency} />

        <div className="glass-card p-6">
          <h3 className="text-lg font-display font-semibold text-white mb-4">{t('account.limits')}</h3>
          {analytics?.limits?.length > 0 ? (
            <div className="space-y-4">
              {analytics.limits.map((lim, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-dark-300">{lim.category}</span>
                    <span className={lim.percent > 100 ? 'text-expense-400' : 'text-dark-400'}>
                      {formatMoney(lim.spent, currency)} / {formatMoney(lim.limit, currency)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-dark-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${lim.percent > 100 ? 'bg-expense-500' : lim.percent > 80 ? 'bg-yellow-500' : 'bg-income-500'}`}
                      style={{ width: `${Math.min(lim.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dark-500 text-center py-8">{t('common.noData')}</p>
          )}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-display font-semibold text-white mb-4">{t('account.history')}</h3>
        {transactions.length === 0 ? (
          <p className="text-dark-500 text-center py-8">{t('account.noTransactions')}</p>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-dark-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.direction === 'in' ? 'bg-income-500/15' : 'bg-expense-500/15'}`}>
                    {tx.direction === 'in'
                      ? <ArrowDownRight className="w-4 h-4 text-income-400" />
                      : <ArrowUpRight className="w-4 h-4 text-expense-400" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {tx.description || tx.source_display}
                    </p>
                    <p className="text-dark-500 text-xs">
                      {tx.category_name ? tx.category_name + ' · ' : ''}{formatDate(tx.date, 'dd.MM.yyyy')}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${tx.direction === 'in' ? 'text-income-400' : 'text-expense-400'}`}>
                  {tx.direction === 'in' ? '+' : '−'}{formatMoney(tx.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
