import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Pencil, MoreVertical, Circle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney, formatRelativeDate } from '../utils/formatters';

export default function TransactionList({ 
  transactions, 
  type = 'expense',
  currency = 'KZT',
  onDelete,
  onEdit,
  emptyMessage
}) {
  const { t } = useLanguage();
  const [deletingId, setDeletingId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    setMenuOpenId(null);
    await onDelete?.(id);
    setDeletingId(null);
  };

  const handleEdit = (transaction) => {
    setMenuOpenId(null);
    onEdit?.(transaction);
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-800 flex items-center justify-center">
          <Circle className="w-8 h-8 text-dark-600" />
        </div>
        <p className="text-dark-500">{emptyMessage || t('common.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.03 }}
          className="group flex items-center gap-4 p-4 rounded-xl bg-dark-800/30 hover:bg-dark-800/50 transition-all duration-200"
        >
          {/* Icon */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${type === 'income' ? 'bg-income-500/10 text-income-400' : 'bg-expense-500/10 text-expense-400'}
          `}>
            {type === 'income' ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : (
              <ArrowDownRight className="w-5 h-5" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate">
              {transaction.category_name || t('common.category')}
            </p>
            {transaction.comment && (
              <p className="text-sm text-dark-500 truncate">{transaction.comment}</p>
            )}
          </div>

          {/* Amount & Date */}
          <div className="text-right flex-shrink-0">
            <p className={`font-semibold font-mono ${type === 'income' ? 'text-income-400' : 'text-white'}`}>
              {type === 'income' ? '+' : '-'}{formatMoney(transaction.amount, currency)}
            </p>
            <p className="text-xs text-dark-500">{formatRelativeDate(transaction.date)}</p>
          </div>

          {/* Actions */}
          {(onDelete || onEdit) && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpenId(menuOpenId === transaction.id ? null : transaction.id)}
                className={`
                  p-2 rounded-lg transition-all
                  ${menuOpenId === transaction.id ? 'bg-dark-700 text-white' : 'text-dark-500 opacity-0 group-hover:opacity-100 hover:bg-dark-700 hover:text-white'}
                `}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {menuOpenId === transaction.id && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setMenuOpenId(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-full mt-1 z-20 w-40 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden"
                  >
                    {onEdit && (
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-dark-300 hover:text-white hover:bg-dark-700/50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        <span>{t('common.edit')}</span>
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deletingId === transaction.id}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-expense-400 hover:bg-dark-700/50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === transaction.id ? (
                          <div className="w-4 h-4 border-2 border-expense-400/30 border-t-expense-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        <span>{t('common.delete')}</span>
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
