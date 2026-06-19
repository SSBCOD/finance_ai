import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Plus, Send, Settings as SettingsIcon, FastForward,
  ArrowDownLeft, ArrowUpRight, X, Wifi, Check, AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { accountAPI, financesAPI } from '../services/api';
import { formatMoney, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const BRAND = 'Amanat';

export default function BankPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const currency = user?.currency || 'KZT';

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'deposit' | 'pay' | 'salary'

  const load = async () => {
    try {
      const [a, tx, lim] = await Promise.all([
        accountAPI.getAccount(),
        accountAPI.getTransactions({ limit: 40 }),
        accountAPI.getLimitsStatus(),
      ]);
      setAccount(a.data);
      setTransactions(tx.data);
      setLimits(lim.data || []);
    } catch (e) {
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fastForward = async () => {
    try {
      const r = await accountAPI.fastForward({});
      const res = r.data.result;
      if (res.salary_applied) toast.success(t('bank.salaryReceived'));
      else toast(t('bank.timeAdvanced') + ' → ' + r.data.target_date);
      load();
    } catch (e) {
      toast.error(t('errors.serverError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#eef1ef] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-700/30 border-t-emerald-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#eef1ef] text-slate-800">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#eef1ef]/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>a</span>
            </div>
            <div className="leading-tight">
              <p className="font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{BRAND}</p>
              <p className="text-[11px] text-slate-500">{t('bank.tagline')}</p>
            </div>
          </div>
          <Link to="/account" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Finance AI
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-6 space-y-6">
        {/* Debit card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)' }}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -right-20 top-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <span className="text-sm font-medium tracking-wide text-white/80" style={{ fontFamily: 'Outfit, sans-serif' }}>{BRAND} Bank</span>
              <Wifi className="w-5 h-5 text-white/70 rotate-90" />
            </div>
            <p className="text-emerald-100/70 text-xs mb-1">{t('account.balance')}</p>
            <p className="text-4xl font-semibold tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {formatMoney(account.balance, currency)}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm tracking-[0.2em] text-white/90">
                {formatCard(account.account_number)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BankAction icon={Plus} label={t('bank.deposit')} onClick={() => setModal('deposit')} primary />
          <BankAction icon={Send} label={t('bank.pay')} onClick={() => setModal('pay')} />
          <BankAction icon={SettingsIcon} label={t('bank.salary')} onClick={() => setModal('salary')} />
          <BankAction icon={FastForward} label={t('bank.fastForward')} onClick={fastForward} />
        </div>

        {/* Salary status */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{t('bank.salaryAuto')}</p>
            <p className="font-semibold text-slate-900">
              {account.salary_enabled && account.salary_amount > 0
                ? formatMoney(account.salary_amount, currency)
                : t('bank.salaryOff')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">{t('bank.salaryDay')}</p>
            <p className="font-medium text-slate-700">
              {account.salary_day === 0 ? t('account.lastDayOfMonth') : `${account.salary_day} ${t('account.dayOfMonth')}`}
            </p>
          </div>
        </div>

        {/* Limit alerts */}
        <LimitBanner limits={limits} currency={currency} />

        {/* Operations */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {t('bank.operations')}
          </h3>
          {transactions.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">{t('account.noTransactions')}</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.direction === 'in' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                      {tx.direction === 'in'
                        ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{tx.description || tx.source_display}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.date, 'dd.MM.yyyy')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.direction === 'in' ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {tx.direction === 'in' ? '+' : '−'}{formatMoney(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          {t('bank.disclaimer')}
        </p>
      </main>

      {modal === 'deposit' && <DepositModal currency={currency} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
      {modal === 'pay' && <PayModal currency={currency} limits={limits} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
      {modal === 'salary' && <SalaryModal account={account} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}
    </div>
  );
}

function formatCard(num) {
  if (!num) return '•••• •••• ••••';
  const tail = num.slice(-8);
  return '•••• ' + tail.replace(/(.{4})/g, '$1 ').trim();
}

function LimitBanner({ limits, currency }) {
  const { t } = useLanguage();
  const alerts = (limits || []).filter((l) => l.percent >= 80);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((l, i) => {
        const over = l.percent >= 100;
        return (
          <div key={i}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
              over ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
            }`}>
            <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${over ? 'text-rose-500' : 'text-amber-500'}`} />
            <div className="text-sm">
              <p className={`font-medium ${over ? 'text-rose-700' : 'text-amber-700'}`}>
                {over
                  ? t('bank.limitOver', { category: l.category })
                  : t('bank.limitNear', { category: l.category })}
              </p>
              <p className={over ? 'text-rose-600/80' : 'text-amber-600/80'}>
                {t('bank.limitLeft', { left: formatMoney(Math.max(l.remaining, 0), currency), limit: formatMoney(l.limit, currency) })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BankAction({ icon: Icon, label, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-colors ${
        primary
          ? 'bg-emerald-700 border-emerald-700 text-white hover:bg-emerald-800'
          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

// ---------- Deposit Modal ----------
function DepositModal({ currency, onClose, onDone }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [incomeType, setIncomeType] = useState('salary');
  const [saving, setSaving] = useState(false);

  const types = [
    { key: 'salary', label: t('bank.typeSalary') },
    { key: 'freelance', label: t('bank.typeFreelance') },
    { key: 'other', label: t('bank.typeOther') },
    { key: 'none', label: t('bank.typeTransfer') },
  ];

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await accountAPI.topup({ amount, description, income_type: incomeType });
      toast.success(t('bank.depositDone'));
      onDone();
    } catch (e) {
      toast.error(t('errors.saveFailed'));
      setSaving(false);
    }
  };

  return (
    <BankModal title={t('bank.depositTitle')} onClose={onClose}>
      <BankField label={t('account.amount')}>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="bank-input" placeholder="0" autoFocus />
      </BankField>

      <BankField label={t('bank.incomeType')}>
        <div className="grid grid-cols-2 gap-2">
          {types.map((tp) => (
            <button key={tp.key} type="button" onClick={() => setIncomeType(tp.key)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                incomeType === tp.key
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
              {tp.label}
              {incomeType === tp.key && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
        {incomeType === 'none' && (
          <p className="text-xs text-slate-400 mt-2">{t('bank.transferHint')}</p>
        )}
      </BankField>

      <BankField label={t('account.description')}>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className="bank-input" placeholder={t('bank.depositPlaceholder')} />
      </BankField>

      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">{t('common.cancel')}</button>
        <button onClick={submit} disabled={saving || !amount}
          className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 disabled:opacity-40">
          {t('bank.deposit')}
        </button>
      </div>
    </BankModal>
  );
}

// ---------- Pay Modal ----------
function PayModal({ currency, limits = [], onClose, onDone }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [needCategory, setNeedCategory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    financesAPI.getCategories('expense').then((r) => setCategories(r.data.results || r.data)).catch(() => {});
  }, []);

  // Статус лимита по выбранной категории
  const limitInfo = category
    ? limits.find((l) => String(l.category_id) === String(category))
    : null;
  const amountNum = Number(amount) || 0;
  const afterRemaining = limitInfo ? limitInfo.remaining - amountNum : null;
  const willExceed = limitInfo && amountNum > 0 && afterRemaining < 0;

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      const payload = { amount, description };
      if (category) payload.category = category;
      if (needCategory) payload.force = true;
      const res = await accountAPI.pay(payload);
      if (res.data.need_category) {
        setNeedCategory(true);
        setSaving(false);
        toast(t('account.needCategory'), { icon: '🏷️' });
        return;
      }
      toast.success(t('bank.payDone'));
      onDone();
    } catch (e) {
      toast.error(t('errors.saveFailed'));
      setSaving(false);
    }
  };

  return (
    <BankModal title={t('bank.payTitle')} onClose={onClose}>
      <BankField label={t('account.amount')}>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="bank-input" placeholder="0" autoFocus />
      </BankField>
      <BankField label={t('account.description')}>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
          className="bank-input" placeholder={t('account.descriptionPlaceholder')} />
      </BankField>
      <BankField label={needCategory ? t('account.needCategory') : t('scheduled.category')}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="bank-input">
          <option value="">{needCategory ? t('account.selectCategory') : t('account.categoryAuto')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </BankField>

      {/* Предупреждение о лимите заранее */}
      {limitInfo && (
        <div className={`rounded-xl px-3 py-2.5 text-sm mb-2 ${
          willExceed ? 'bg-rose-50 text-rose-700 border border-rose-200'
                     : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {willExceed ? (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{t('bank.payWillExceed', {
                category: limitInfo.category,
                over: formatMoney(Math.abs(afterRemaining), currency),
              })}</span>
            </div>
          ) : (
            <span>{t('bank.payLimitLeft', {
              left: formatMoney(limitInfo.remaining, currency),
              category: limitInfo.category,
            })}</span>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-3">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">{t('common.cancel')}</button>
        <button onClick={submit} disabled={saving || !amount || (needCategory && !category)}
          className={`flex-1 py-3 rounded-xl text-white font-medium disabled:opacity-40 ${
            willExceed ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
          }`}>
          {willExceed ? t('bank.payAnyway') : t('bank.pay')}
        </button>
      </div>
    </BankModal>
  );
}

// ---------- Salary Modal ----------
function SalaryModal({ account, onClose, onDone }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(account.salary_amount || '');
  const [day, setDay] = useState(account.salary_day ?? 0);
  const [enabled, setEnabled] = useState(account.salary_enabled);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await accountAPI.updateAccount({ salary_amount: amount || 0, salary_day: day, salary_enabled: enabled });
      toast.success(t('account.salarySaved'));
      onDone();
    } catch (e) {
      toast.error(t('errors.saveFailed'));
      setSaving(false);
    }
  };

  return (
    <BankModal title={t('bank.salaryTitle')} onClose={onClose}>
      <BankField label={t('account.salaryAmount')}>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bank-input" placeholder="0" />
      </BankField>
      <BankField label={t('account.salaryDay')}>
        <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="bank-input">
          <option value={0}>{t('account.lastDayOfMonth')}</option>
          {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>{d} {t('account.dayOfMonth')}</option>
          ))}
        </select>
      </BankField>
      <label className="flex items-center gap-3 mt-1 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4 rounded accent-emerald-700" />
        <span className="text-sm text-slate-600">{t('account.salaryEnabled')}</span>
      </label>
      <div className="flex gap-3 mt-5">
        <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50">{t('common.cancel')}</button>
        <button onClick={submit} disabled={saving}
          className="flex-1 py-3 rounded-xl bg-emerald-700 text-white font-medium hover:bg-emerald-800 disabled:opacity-40">
          {t('account.save')}
        </button>
      </div>
    </BankModal>
  );
}

// ---------- Shared ----------
function BankModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function BankField({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
