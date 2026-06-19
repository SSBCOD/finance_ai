import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    config.headers['Accept-Language'] = userData.language || 'ru';
  }
  return config;
});

const getApiErrorMessage = (error) => {
  if (!error.response) {
    return 'Сервер недоступен. Проверьте адрес API в переменной VITE_API_URL.';
  }

  if (error.response.data?.detail) {
    return error.response.data.detail;
  }

  if (typeof error.response.data === 'string') {
    return error.response.data;
  }

  return 'Ошибка соединения с сервером. Попробуйте ещё раз.';
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/token/refresh/`, { refresh: refreshToken });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/users/register/', data),
  login: (data) => api.post('/users/login/', data),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
  changePassword: (data) => api.post('/users/change-password/', data),
};

export const authAPI = {
  register: (data) => api.post('/users/register/', data),
  login: (data) => api.post('/users/login/', data),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data) => api.patch('/users/profile/', data),
  changePassword: (data) => api.post('/users/change-password/', data),
};

export const financesAPI = {
  getCategories: (type) => api.get('/finances/categories/', { params: { type } }),
  createCategory: (data) => api.post('/finances/categories/create/', data),
  updateCategory: (id, data) => api.patch(`/finances/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/finances/categories/${id}/`),
  
  getIncomes: (params) => api.get('/finances/incomes/', { params }),
  createIncome: (data) => api.post('/finances/incomes/', data),
  updateIncome: (id, data) => api.patch(`/finances/incomes/${id}/`, data),
  deleteIncome: (id) => api.delete(`/finances/incomes/${id}/`),
  
  getExpenses: (params) => api.get('/finances/expenses/', { params }),
  createExpense: (data) => api.post('/finances/expenses/', data),
  updateExpense: (id, data) => api.patch(`/finances/expenses/${id}/`, data),
  deleteExpense: (id) => api.delete(`/finances/expenses/${id}/`),
  
  getAnalytics: () => api.get('/finances/analytics/'),
};

export const budgetAPI = {
  getBudgets: () => api.get('/budget/'),
  createBudget: (data) => api.post('/budget/create/', data),
  getCurrentBudget: () => api.get('/budget/current/'),
  getBudgetSummary: (params) => api.get('/budget/summary/', { params }),
  updateBudget: (id, data) => api.patch(`/budget/${id}/`, data),
  deleteBudget: (id) => api.delete(`/budget/${id}/`),
  addCategoryLimit: (budgetId, data) => api.post(`/budget/${budgetId}/limits/`, data),
  updateCategoryLimit: (id, data) => api.patch(`/budget/limits/${id}/`, data),
  deleteCategoryLimit: (id) => api.delete(`/budget/limits/${id}/`),
};

export const aiAPI = {
  chat: (message) => api.post('/ai/chat/', { message }),
  getHistory: (limit = 100) => api.get('/ai/history/', { params: { limit } }),
  clearHistory: () => api.delete('/ai/history/clear/'),
};

export const accountAPI = {
  getAccount: () => api.get('/accounts/account/'),
  updateAccount: (data) => api.patch('/accounts/account/', data),
  getTransactions: (params) => api.get('/accounts/transactions/', { params }),
  topup: (data) => api.post('/accounts/topup/', data),
  pay: (data) => api.post('/accounts/pay/', data),
  getAnalytics: () => api.get('/accounts/analytics/'),
  getLimitsStatus: () => api.get('/accounts/limits-status/'),
  fastForward: (data) => api.post('/accounts/fast-forward/', data),

  getScheduled: () => api.get('/accounts/scheduled/'),
  createScheduled: (data) => api.post('/accounts/scheduled/', data),
  updateScheduled: (id, data) => api.patch(`/accounts/scheduled/${id}/`, data),
  deleteScheduled: (id) => api.delete(`/accounts/scheduled/${id}/`),
  payScheduled: (id) => api.post(`/accounts/scheduled/${id}/pay/`),

  getRules: () => api.get('/accounts/rules/'),
  createRule: (data) => api.post('/accounts/rules/', data),
  deleteRule: (id) => api.delete(`/accounts/rules/${id}/`),
};

export default api;
