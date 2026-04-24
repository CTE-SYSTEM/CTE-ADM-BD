import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Ingresa usuario y contraseña');
    login(username);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="hidden lg:flex flex-col justify-center p-8 rounded-lg hero-gradient shadow-card">
          <div className="mb-6">
            <h2 className="text-3xl font-semibold text-primary">Bienvenido a CTE</h2>
            <p className="mt-2 text-muted">Gestiona clientes, equipos, órdenes y facturación desde un solo lugar.</p>
          </div>
          <div className="mt-6">
            <ul className="space-y-3 text-sm text-muted">
              <li>• Interfaz minimalista y rápida</li>
              <li>• Tablas con acciones y animaciones</li>
              <li>• Autenticación basada en JWT (API lista)</li>
            </ul>
          </div>
          <div className="mt-auto text-sm text-muted">¿Necesitas ayuda? Contacta con el administrador.</div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-soft card">
          <div className="mb-6">
            <div className="w-12 h-12 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-lg">CT</div>
            <h2 className="text-2xl font-semibold text-center">Iniciar sesión</h2>
            <p className="text-sm text-muted text-center mt-1">Ingresa con tu usuario y contraseña</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1">Usuario</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ej. juan.perez" className="input" />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="●●●●●●" className="input" />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex items-center justify-between">
              <button className="btn-primary">Entrar</button>
              <a href="#" className="text-sm text-muted">¿Olvidaste tu contraseña?</a>
            </div>

            <div className="pt-4 border-t mt-2">
              <div className="text-center text-sm text-muted">O entra con</div>
              <div className="flex gap-3 justify-center mt-3">
                <button type="button" className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition">Google</button>
                <button type="button" className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition">Microsoft</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;