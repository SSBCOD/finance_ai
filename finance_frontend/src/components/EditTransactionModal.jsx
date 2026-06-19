import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Calendar, MessageSquare, Tag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { financesAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function EditTransactionModal({ isOpen, onClose, transaction, type = 'expense', onSuccess }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ amount: '', category: '', date: '', comment: '' });

  useEffect(() => {
    if (isOpen && transaction) {
      loadCategories();
      setFormData({
        amount: transaction.amount || '',
        category: transaction.category || '',
        date: transaction.date || new Date().toISOString().split('T')[0],
        comment: transaction.comment || '',
      });
    }
  }, [isOpen, transaction, type]);

  const loadCategories = async () => {
    try {
      const response = await financesAPI.getCategories(type);
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.date) {
      toast.error(t('errors.required'));
      return;
    }

    setLoading(true);
    try {
      const data = { ...formData, amount: parseFloat(formData.amount), category: parseInt(formData.category) };

      if (type === 'income') {
        await financesAPI.updateIncome(transaction.id, data);
        toast.success(t('income.incomeUpdated'));
      } else {
        await financesAPI.updateExpense(transaction.id, data);
        toast.success(t('expenses.expenseUpdated'));
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(t('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-white">
                {type === 'income' ? t('income.editIncome') : t('expenses.editExpense')}
              </h2>
              <button onClick={onClose} className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label">{t('common.amount')} *</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" className="input-field text-2xl font-mono font-semibold pl-12" required />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500 text-xl">₸</span>
                </div>
              </div>

              <div>
                <label className="input-label flex items-center gap-2"><Tag className="w-4 h-4" />{t('common.category')} *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field" required>
                  <option value="">{t('common.category')}...</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
              </div>

              <div>
                <label className="input-label flex items-center gap-2"><Calendar className="w-4 h-4" />{t('common.date')} *</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" required />
              </div>

              <div>
                <label className="input-label flex items-center gap-2"><MessageSquare className="w-4 h-4" />{t('common.comment')}</label>
                <textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} placeholder={t('common.comment')} className="input-field resize-none h-20" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 btn-secondary">{t('common.cancel')}</button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5" /><span>{t('common.save')}</span></>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
