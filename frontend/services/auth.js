import Cookies from 'js-cookie';
import { authAPI } from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const authService = {
  async login(credentials) {
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;

      this.setToken(token);
      this.setUser(user);

      return { user, token };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro no login');
    }
  },

  logout() {
    this.removeToken();
    this.removeUser();
  },

  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) return null;

      const response = await authAPI.getProfile();
      const user = response.data.data;

      this.setUser(user);
      return user;
    } catch (error) {
      this.logout();
      return null;
    }
  },

  setToken(token) {
    Cookies.set(TOKEN_KEY, token, { expires: 7 });
  },

  getToken() {
    return Cookies.get(TOKEN_KEY);
  },

  removeToken() {
    Cookies.remove(TOKEN_KEY);
  },

  setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser() {
    if (typeof window === 'undefined') return null;

    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  removeUser() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  }
};

export default authService;