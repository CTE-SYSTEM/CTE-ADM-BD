import React, { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cte_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, usuario } = response.data;
    // Guardar token para futuras peticiones protegidas
    localStorage.setItem('token', token);

    const userData = {
      username: usuario?.nombre || username,
      rol: usuario?.rol,
    };
    setUser(userData);
    localStorage.setItem('cte_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cte_user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
