import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('cte_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (username) => {
    const u = { username };
    setUser(u);
    localStorage.setItem('cte_user', JSON.stringify(u));
    navigate('/');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cte_user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
