import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Table from '../../components/Table';

const columns = [
  { header: 'ID', accessor: 'id_usuario' },
  { header: 'Usuario', accessor: 'nombre_usuario' },
  { header: 'Correo', accessor: 'correo_electronico' },
  { header: 'Rol', accessor: 'rol' },
  { header: 'Activo', accessor: 'activo' },
  {
    header: 'Acciones',
    accessor: 'acciones',
    render: (row) => (
      <button
        type="button"
        onClick={() => row.onToggleActive?.()}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${row.activo === 'Sí' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
      >
        {row.activo === 'Sí' ? 'Desactivar' : 'Reactivar'}
      </button>
    ),
  },
];

const fetchUsuarios = async (setUsuarios, setLoading, setError, onToggleActive) => {
  setLoading(true);
  try {
    const response = await api.get('/admin_pro/usuarios');
    const data = response.data;
    if (data.data) {
      setUsuarios(
        data.data.map((u) => ({
          id_usuario: u.id_usuario,
          nombre_usuario: u.nombre_usuario,
          correo_electronico: u.correo_electronico || '-',
          rol: u.rol,
          activo: u.activo ? 'Sí' : 'No',
          onToggleActive: onToggleActive ? () => onToggleActive(u.id_usuario, u.activo) : undefined,
        }))
      );
    } else {
      setError('No se pudo cargar la información de usuarios');
    }
  } catch (e) {
    setError('Error de red o servidor');
  }
  setLoading(false);
};

export default function UsuariosAvanzado() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo_electronico: '',
    password: '',
    rol: 'Administrador',
    activo: true,
    especialidad: '',
    horario: '',
    contacto: '',
  });

  const handleToggleUsuarioActivo = async (id_usuario, activo) => {
    const action = activo ? 'desactivar' : 'reactivar';
    const confirmed = window.confirm(`¿Seguro que quieres ${action} este usuario?`);
    if (!confirmed) return;

    setError('');
    setSuccessMessage('');
    try {
      await api.put(`/admin_pro/usuarios/${id_usuario}`, {
        activo: !activo,
      });
      setSuccessMessage(`Usuario ${activo ? 'desactivado' : 'reactivado'} correctamente.`);
      fetchUsuarios(setUsuarios, setLoading, setError, handleToggleUsuarioActivo);
    } catch (error) {
      setError(error.response?.data?.error || `No se pudo ${action} al usuario`);
    }
  };

  useEffect(() => {
    fetchUsuarios(setUsuarios, setLoading, setError, handleToggleUsuarioActivo);
  }, []);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreateUsuario = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!formData.nombre_usuario.trim() || !formData.password.trim() || !formData.rol.trim()) {
      setFormError('Nombre de usuario, contraseña y rol son obligatorios.');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/admin_pro/usuarios', {
        nombre_usuario: formData.nombre_usuario.trim(),
        correo_electronico: formData.correo_electronico.trim() || null,
        rol: formData.rol,
        password: formData.password,
        activo: formData.activo,
        especialidad: formData.rol === 'Tecnico' ? formData.especialidad.trim() || null : null,
        horario: formData.rol === 'Tecnico' ? formData.horario.trim() || null : null,
        contacto: formData.rol === 'Tecnico' ? formData.contacto.trim() || formData.correo_electronico.trim() || null : null,
      });
      if (response.data?.data) {
        setSuccessMessage('Usuario creado correctamente.');
        setFormData({
          nombre_usuario: '',
          correo_electronico: '',
          password: '',
          rol: 'Administrador',
          activo: true,
          especialidad: '',
          horario: '',
          contacto: '',
        });
        fetchUsuarios(setUsuarios, setLoading, setError, handleToggleUsuarioActivo);
      } else {
        setFormError('No se pudo crear el usuario.');
      }
    } catch (createError) {
      const message = createError.response?.data?.error || createError.message || 'Error de red';
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Gestión avanzada de usuarios</h2>

      <section className="mb-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold">Crear nuevo usuario</h3>
            <p className="text-sm text-gray-500">Agrega usuarios y asigna el rol correcto para el acceso.</p>
          </div>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            Rol asignado: {formData.rol}
          </span>
        </div>

        {formError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
        {successMessage && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

        <form onSubmit={handleCreateUsuario} className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Nombre de usuario</span>
            <input
              type="text"
              name="nombre_usuario"
              value={formData.nombre_usuario}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="ejemplo123"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Correo electrónico</span>
            <input
              type="email"
              name="correo_electronico"
              value={formData.correo_electronico}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="usuario@correo.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Contraseña</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="********"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Rol</span>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="Administrador">Administrador</option>
              <option value="Secretaria">Secretaria</option>
              <option value="TecnicoJefe">Tecnico Jefe</option>
              <option value="Tecnico">Tecnico</option>
              <option value="admin_pro">admin_pro</option>
            </select>
          </label>

          {formData.rol === 'Tecnico' && (
            <>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Especialidad</span>
                <input
                  type="text"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Ej: Microelectrónica"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Horario</span>
                <input
                  type="text"
                  name="horario"
                  value={formData.horario}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Ej: L-V 08:00-17:00"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Contacto</span>
                <input
                  type="text"
                  name="contacto"
                  value={formData.contacto}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Teléfono o email"
                />
              </label>
            </>
          )}

          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="activo"
              checked={formData.activo}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Usuario activo
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {creating ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </section>

      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <Table columns={columns} data={usuarios} />
    </div>
  );
}
