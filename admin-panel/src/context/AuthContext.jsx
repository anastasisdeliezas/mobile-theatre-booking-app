import React, { createContext, useContext, useState } from 'react';
import api, { getApiErrorMessage } from '../api/client';
import { normalizeEmail } from '../utils/validation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email: normalizeEmail(email), password });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Η σύνδεση απέτυχε.'));
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);