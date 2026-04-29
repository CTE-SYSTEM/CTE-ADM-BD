import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react'; 

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validación local antes de pegarle al servidor
    if (!username.trim() || !password.trim()) {
      return setError('Ingresa usuario y contraseña');
    }

    setLoading(true);

    try {
      // 1. Ejecutamos el login
      // Si el backend responde 401, el catch atrapará el error automáticamente
      const userData = await login(username, password);

      // 2. Verificación de seguridad: si no hay userData o rol, no navegar
      if (!userData || !userData.rol) {
        throw new Error('Respuesta del servidor incompleta');
      }

      // 3. Redirección dinámica según el rol exacto
      console.log("Redirigiendo usuario con rol:", userData.rol);
      
      switch (userData.rol) {
        case 'Administrador':
          navigate('/admin');
          break;
        case 'Secretaria':
          navigate('/secretaria');
          break;
        case 'TecnicoJefe':
          navigate('/tecnico-jefe'); // Corregido para que coincida con tus rutas de App.jsx
          break;
        case 'Tecnico':
          navigate('/tecnico');
          break;
        default:
          setError('Tu cuenta no tiene un rol asignado. Contacta soporte.');
          break;
      }
    } catch (err) {
      // 4. Manejo de errores detallado
      console.error("Fallo el inicio de sesión:", err);
      
      // Si el error trae un mensaje del backend (res.status(401)), lo usamos
      const mensajeError = err.response?.data?.message || 'Usuario o contraseña incorrectos';
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md"> 
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-xl font-bold shadow-md">
              CT
            </div>
            <h2 className="text-2xl font-semibold text-center text-gray-800">Iniciar sesión</h2>
            <p className="text-sm text-gray-500 text-center mt-1">
              Centro Técnico Electrónico
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input 
                type="text"
                autoComplete="username"
                disabled={loading}
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Nombre de usuario" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                autoComplete="current-password"
                disabled={loading}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="●●●●●●" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 transition-all" 
              />
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-200 flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col space-y-4 pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  'Entrar al Sistema'
                )}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-gray-400 text-xs mt-6 uppercase tracking-widest">
          &copy; {new Date().getFullYear()} CTE-ADM-BD System
        </p>
      </div>
    </div>
  );
};

export default Login;