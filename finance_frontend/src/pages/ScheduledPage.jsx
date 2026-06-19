import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Repeat, CheckCircle, Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { accountAPI, financesAPI } from '../services/api';
import { formatMoney } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function ScheduledPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const currency = user?.currency || 'KZT';

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    try {
      const res = await accountAPI.getScheduled();
      setPayments(res.data);
    } catch (e) {
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePay = async (id) => {
    try {
      await accountAPI.payScheduled(id);
      toast.success(t('scheduled.paidSuccess'));
      load();
    } catch (e) {
      toast.error(t('errors.serverError'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('scheduled.deleteConfirm'))) return;
    try {
      await accountAPI.deleteScheduled(id);
      toast.success(t('scheduled.deleted'));
      load();
    } catch (e) {
      toast.error(t('errors.deleteFailed'));
    }
  };

  const dayLabel = (d) => d === 0 ? t('account.lastDayOfMonth') : `${d} ${t('account.dayOfMonth')}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{t('scheduled.title')}</h1>
          <p className="text-dark-400">{t('scheduled.subtitle')}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('scheduled.add')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : payments.length === 0 ? (
        <div className="glass-card p-12 text-center text-dark-500">
          <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('scheduled.noPayments')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${p.kind === 'subscription' ? 'bg-accent-500/20' : 'bg-primary-500/20'}`}>
                  <Repeat className={`w-5 h-5 ${p.kind === 'subscription' ? 'text-accent-400' : 'text-primary-400'}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium truncate">{p.name}</p>
                    {p.kind === 'subscription' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400 font-medium flex-shrink-0">
                        {t('scheduled.auto')}
                      </span>
                    )}
                  </div>
                  <p className="text-dark-500 text-xs">
                    {p.category_name ? p.category_name + ' · ' : ''}{dayLabel(p.day_of_month)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-white font-semibold whitespace-nowrap">{formatMoney(p.amount, currency)}</span>

                {p.paid_this_month ? (
                  <span className="flex items-center gap-1 text-income-400 text-xs">
                    <CheckCircle className="w-4 h-4" /> <span className="hidden sm:inline">{t('scheduled.paid')}</span>
                  </span>
                ) : p.kind === 'manual' ? (
                  <button onClick={() => handlePay(p.id)} className="px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium transition-colors">
                    {t('scheduled.payNow')}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-dark-500 text-xs">
                    <Clock className="w-4 h-4" /> <span className="hidden sm:inline">{t('scheduled.pending')}</span>
                  </span>
                )}

                <button onClick={() => handleDelete(p.id)} className="text-dark-500 hover:text-expense-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddScheduledModal onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); }} />
      )}
    </div>
  );
}

function AddScheduledModal({ onClose, onDone }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('manual');
  const [day, setDay] = useState(1);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    financesAPI.getCategories('expense').then((res) => setCategories(res.data.results || res.data)).catch(() => {});
  }, []);

  const submit = async () => {
    if (!name || !amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await accountAPI.createScheduled({
        name, amount, kind, day_of_month: day,
        category: category || null,
      });
      toast.success(t('scheduled.added'));
      onDone();
    } catch (e) {
      toast.error(t('errors.saveFailed'));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-display font-semibold text-white">{t('scheduled.add')}</h3>
          <button onClick={onClose} className="text-dark-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-dark-400 mb-1.5">{t('scheduled.name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="input-field" placeholder={t('scheduled.namePlaceholder')} autoFocus />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-dark-400 mb-1.5">{t('scheduled.amount')}</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="input-field" placeholder="0" />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-dark-400 mb-1.5">{t('scheduled.kind')}</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="input-field">
            <option value="manual">{t('scheduled.manual')}</option>
            <option value="subscription">{t('scheduled.subscription')}</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-dark-400 mb-1.5">{t('scheduled.day')}</label>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="input-field">
            <option value={0}>{t('account.lastDayOfMonth')}</option>
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d} {t('account.dayOfMonth')}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-dark-400 mb-1.5">{t('scheduled.category')}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
            <option value="">{t('account.selectCategory')}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button onClick={submit} disabled={saving || !name || !amount} className="btn-primary flex-1">
            {t('scheduled.add')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
