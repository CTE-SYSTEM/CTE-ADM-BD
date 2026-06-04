import React, { useState, useContext, useRef } from 'react'; // Guardamos useRef para los enfoques
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

  // Referencias para controlar el foco de los inputs y el botón
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const submitRef = useRef(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); // El parámetro 'e' ahora puede ser opcional si llamamos la función manualmente
    setError(null);

    if (!username.trim() || !password.trim()) {
      return setError('Ingresa usuario y contraseña');
    }

    setLoading(true);

    try {
      const userData = await login(username, password);

      if (!userData || !userData.rol) {
        throw new Error('Respuesta del servidor incompleta');
      }
      
      switch (userData.rol) {
        case 'Administrador':
        case 'admin_pro':
          navigate('/admin');
          break;
        case 'Secretaria':
          navigate('/secretaria');
          break;
        case 'TecnicoJefe':
          navigate('/tecnico-jefe'); 
          break;
        case 'Tecnico':
          navigate('/tecnico');
          break;
        default:
          setError('Tu cuenta no tiene un rol asignado. Contacta soporte.');
          break;
      }
    } catch (err) {
      console.error("Fallo el inicio de sesión:", err);
      const mensajeError = err.response?.data?.message || 'Usuario o contraseña incorrectos';
      setError(mensajeError);
    } finally {
      setLoading(false);
    }
  };

  // Manejador de teclado para el campo de Usuario
  const handleUsernameKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault(); // Evita que el Enter intente enviar el formulario antes de tiempo
      passwordRef.current?.focus();
    }
  };

  // Manejador de teclado para el campo de Contraseña
  const handlePasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(); // Al presionar Enter en contraseña, ejecuta directamente el Login
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      usernameRef.current?.focus(); // Sube al campo de usuario con la flecha de arriba
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      submitRef.current?.focus(); // Baja al botón de entrar con la flecha de abajo
    }
  };

  // Manejador de teclado para el Botón de Entrar (por si bajó con la flecha y quiere subir)
  const handleButtonKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      passwordRef.current?.focus();
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
                ref={usernameRef} // Asignamos la referencia
                type="text"
                autoComplete="username"
                disabled={loading}
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                onKeyDown={handleUsernameKeyDown} // Escuchamos las teclas
                placeholder="Nombre de usuario" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                ref={passwordRef} // Asignamos la referencia
                type="password" 
                autoComplete="current-password"
                disabled={loading}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                onKeyDown={handlePasswordKeyDown} // Escuchamos las teclas
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
                ref={submitRef} // Asignamos la referencia
                type="submit" 
                disabled={loading}
                onKeyDown={handleButtonKeyDown} // Escuchamos si quiere regresar con flecha arriba
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