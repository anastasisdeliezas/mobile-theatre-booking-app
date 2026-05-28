import React, { createContext, useContext, useEffect, useState } from 'react';
import { deleteMany, getItem, setItem } from '../utils/storage';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function storeSession(data) {
    if (data?.token) await setItem('token', data.token);
    if (data?.refresh_token) await setItem('refresh_token', data.refresh_token);
  }

  useEffect(() => {
    (async () => {
      const token = await getItem('token');
      const refreshToken = await getItem('refresh_token');

      if (token || refreshToken) {
        try {
          if (!token && refreshToken) {
            const { data } = await api.post('/auth/refresh', {
              refresh_token: refreshToken
            });
            await storeSession(data);
          }

          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch {
          await deleteMany(['token', 'refresh_token']);
        }
      }

      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await storeSession(data);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    await storeSession(data);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      const refreshToken = await getItem('refresh_token');
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch {
    } finally {
      await deleteMany(['token', 'refresh_token']);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
