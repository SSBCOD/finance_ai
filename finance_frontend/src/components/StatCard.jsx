import { motion } from 'framer-motion';

export default function StatCard({ title, value, subtitle, icon: Icon, type = 'default', delay = 0 }) {
  const typeStyles = {
    income: { card: 'stat-card stat-card-income', icon: 'bg-income-500/20 text-income-400', value: 'text-income-400' },
    expense: { card: 'stat-card stat-card-expense', icon: 'bg-expense-500/20 text-expense-400', value: 'text-expense-400' },
    balance: { card: 'stat-card stat-card-balance', icon: 'bg-primary-500/20 text-primary-400', value: 'text-white' },
    default: { card: 'stat-card', icon: 'bg-dark-700 text-dark-400', value: 'text-white' },
  };
  const styles = typeStyles[type] || typeStyles.default;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className={styles.card}>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${styles.icon}`}><Icon className="w-6 h-6" /></div>
        </div>
        <p className="text-dark-400 text-sm mb-1">{title}</p>
        <p className={`text-2xl lg:text-3xl font-display font-bold ${styles.value}`}>{value}</p>
        {subtitle && <p className="text-dark-500 text-sm mt-2">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
