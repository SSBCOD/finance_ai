import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../utils/formatters';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316', '#06b6d4', '#84cc16'];

export default function ExpenseChart({ data, currency = 'KZT', title }) {
  const { t } = useLanguage();
  
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="glass-card p-6 h-full">
        <h3 className="text-lg font-display font-semibold text-white mb-4">{title || t('dashboard.expensesByCategory')}</h3>
        <div className="flex flex-col items-center justify-center h-64 text-dark-500">
          <PieIcon className="w-12 h-12 mb-3 opacity-30" />
          <p>{t('common.noData')}</p>
        </div>
      </div>
    );
  }

  const chartData = Object.entries(data).map(([name, value], index) => ({
    name: name.replace(/^[^\s]+\s/, ''),
    fullName: name,
    value: Number(value),
    color: COLORS[index % COLORS.length],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-white font-medium">{data.fullName}</p>
          <p className="text-dark-400">{formatMoney(data.value, currency)}</p>
          <p className="text-dark-500 text-sm">{percent}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 h-full">
      <h3 className="text-lg font-display font-semibold text-white mb-4">{title || t('dashboard.expensesByCategory')}</h3>
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="w-48 h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-dark-500">{t('common.total')}</span>
            <span className="text-lg font-bold text-white">{formatMoney(total, currency)}</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 max-h-48 overflow-y-auto">
          {chartData.map((item, index) => {
            const percent = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="flex-1 text-dark-300 truncate">{item.fullName}</span>
                <span className="text-dark-500">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
