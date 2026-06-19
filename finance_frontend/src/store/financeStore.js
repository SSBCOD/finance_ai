import { create } from 'zustand';
import { financesAPI, budgetAPI } from '../services/api';

export const useFinanceStore = create((set, get) => ({
  analytics: null,
  categories: [],
  incomes: [],
  expenses: [],
  budget: null,
  budgetSummary: null,
  loading: false,
  error: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchAnalytics: async () => {
    set({ loading: true });
    try {
      const response = await financesAPI.getAnalytics();
      set({ analytics: response.data, error: null });
    } catch (error) {
      set({ error: 'Ошибка загрузки аналитики' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async (type) => {
    try {
      const response = await financesAPI.getCategories(type);
      set({ categories: response.data.results || response.data });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  fetchIncomes: async (params = {}) => {
    set({ loading: true });
    try {
      const response = await financesAPI.getIncomes(params);
      set({ incomes: response.data.results || response.data, error: null });
    } catch (error) {
      set({ error: 'Ошибка загрузки доходов' });
    } finally {
      set({ loading: false });
    }
  },

  fetchExpenses: async (params = {}) => {
    set({ loading: true });
    try {
      const response = await financesAPI.getExpenses(params);
      set({ expenses: response.data.results || response.data, error: null });
    } catch (error) {
      set({ error: 'Ошибка загрузки расходов' });
    } finally {
      set({ loading: false });
    }
  },

  fetchCurrentBudget: async () => {
    try {
      const response = await budgetAPI.getCurrentBudget();
      set({ budget: response.data });
    } catch (error) {
      set({ budget: null });
    }
  },

  fetchBudgetSummary: async () => {
    try {
      const response = await budgetAPI.getBudgetSummary();
      set({ budgetSummary: response.data });
    } catch (error) {
      set({ budgetSummary: null });
    }
  },

  deleteIncome: async (id) => {
    try {
      await financesAPI.deleteIncome(id);
      const { incomes } = get();
      set({ incomes: incomes.filter(i => i.id !== id) });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  deleteExpense: async (id) => {
    try {
      await financesAPI.deleteExpense(id);
      const { expenses } = get();
      set({ expenses: expenses.filter(e => e.id !== id) });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  clearData: () => set({
    analytics: null,
    categories: [],
    incomes: [],
    expenses: [],
    budget: null,
    budgetSummary: null,
  }),
}));
