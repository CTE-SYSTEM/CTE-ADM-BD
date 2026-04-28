// Login.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);

  // Esta línea es la que necesita la importación de arriba
  const navigate = useNavigate(); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return setError('Ingresa usuario y contraseña');
    
    login(username, password);
    
    // Esto es lo que te llevará a la sección de secretaria
    navigate('/secretaria'); 
  };

  return (
    /* h-screen asegura que use todo el alto de la pantalla para centrar verticalmente */
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      {/* Eliminamos el grid de 2 columnas y limitamos el ancho máximo */}
      <div className="w-full max-w-md"> 
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6">
            <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold">
              CT
            </div>
            <h2 className="text-2xl font-semibold text-center">Iniciar sesión</h2>
            <p className="text-sm text-muted text-center mt-1">
              Ingresa con tu usuario y contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="ej. juan.perez" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="●●●●●●" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
              />
            </div>
            
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <div className="flex flex-col space-y-4">
              <button type="submit" className="w-full btn-primary py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                Entrar
              </button>
              <div className="text-center">
                <a href="#" className="text-sm text-gray-500 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;