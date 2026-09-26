import React, { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext();

const AUTH_TOKEN_KEY = 'token';
const AUTH_USER_KEY = 'cte_user';

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);

    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    const stored = sessionStorage.getItem(AUTH_USER_KEY);
    if (!token || !stored) {
      sessionStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }

    try {
      return JSON.parse(stored);
    } catch {
      sessionStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      navigate('/login', { replace: true });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, usuario } = response.data;
    // Session storage keeps auth isolated per browser tab/window.
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);

    const userData = {
      username: usuario?.nombre || username,
      rol: usuario?.rol,
    };
    setUser(userData);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
