import React, { useContext, useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import Table from '../../components/Table';
import { AuthContext } from '../../context/AuthContext';

const buildColumns = (canResetPassword) => [
  { header: 'ID', accessor: 'id_usuario' },
  { header: 'Usuario', accessor: 'nombre_usuario' },
  { header: 'Correo', accessor: 'correo_electronico' },
  { header: 'Rol', accessor: 'rol' },
  { header: 'Activo', accessor: 'activo' },
  {
    header: 'Acciones',
    accessor: 'acciones',
    render: (row) => (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={row.onToggleActive}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${row.activo === 'Sí' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          {row.activo === 'Sí' ? 'Desactivar' : 'Reactivar'}
        </button>
        <button
          type="button"
          onClick={row.onEdit}
          className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-900"
        >
          Editar
        </button>
        {canResetPassword && (
          <button
            type="button"
            onClick={row.onPassword}
            className="rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-700"
          >
            Contrasena
          </button>
        )}
      </div>
    ),
  },
];

const fetchUsuarios = async (setUsuarios, setLoading, setError, onToggleActive, onEdit, onPassword) => {
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
          onEdit: onEdit ? () => onEdit(u) : undefined,
          onPassword: onPassword ? () => onPassword(u) : undefined,
          raw: u,
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
  const { user } = useContext(AuthContext);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [passwordUsuario, setPasswordUsuario] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editLoading, setEditLoading] = useState(false);
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
  const canResetPassword = user?.rol === 'admin_pro';
  const columns = useMemo(() => buildColumns(canResetPassword), [canResetPassword]);

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
      fetchUsuarios(setUsuarios, setLoading, setError, handleToggleUsuarioActivo, handleEditUsuario, handlePasswordUsuario);
    } catch (error) {
      setError(error.response?.data?.error || `No se pudo ${action} al usuario`);
    }
  };

  const handleEditUsuario = (usuario) => {
    setSelectedUsuario(usuario);
    setEditMessage('');
  };

  const handlePasswordUsuario = (usuario) => {
    setPasswordUsuario(usuario);
    setNewPassword('');
    setPasswordMessage('');
  };

  const handleUpdateUsuario = async (event) => {
    event.preventDefault();
    if (!selectedUsuario) return;

    setEditLoading(true);
    setEditMessage('');
    try {
      await api.put(`/admin_pro/usuarios/${selectedUsuario.id_usuario}`, {
        nombre_usuario: selectedUsuario.nombre_usuario,
        correo_electronico: selectedUsuario.correo_electronico === '-' ? null : selectedUsuario.correo_electronico,
        rol: selectedUsuario.rol,
        activo: selectedUsuario.activo === 'Sí',
      });
      setEditMessage('Usuario actualizado correctamente.');
      fetchUsuarios(setUsuarios, setLoading, setError, handleToggleUsuarioActivo, handleEditUsuario, handlePasswordUsuario);
    } catch (updateError) {
      setEditMessage(updateError.response?.data?.error || 'No se pudo actualizar el usuario.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    if (!passwordUsuario) return;

    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setPasswordMessage('La nueva contrasena debe tener al menos 6 caracteres.');
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage('');
    try {
      const response = await api.put(`/admin_pro/usuarios/${passwordUsuario.id_usuario}/password`, {
        password: newPassword.trim(),
      });
      setPasswordMessage(response.data?.message || 'Contrasena actualizada correctamente.');
      setNewPassword('');
    } catch (passwordError) {
      setPasswordMessage(passwordError.response?.data?.error || 'No se pudo actualizar la contrasena.');
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios(setUsuarios, setLoading, setError, handleToggleUsuarioActivo, handleEditUsuario, handlePasswordUsuario);
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
        fetchUsuarios(setUsuarios, setLoading, setError, handleToggleUsuarioActivo, handleEditUsuario, handlePasswordUsuario);
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

  const filteredUsuarios = usuarios.filter((usuario) => {
    const term = searchText.trim().toLowerCase();
    if (!term) return true;
    return [usuario.nombre_usuario, usuario.correo_electronico, usuario.rol, usuario.activo].some((field) => field?.toLowerCase().includes(term));
  });

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión avanzada de usuarios</h2>
          <p className="text-gray-500 mt-1">Crea, edita y administra los cuentas con permisos de administrador y acceso avanzado.</p>
        </div>
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Buscar usuario, rol o estado"
          className="w-full rounded-2xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-80"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
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
                <span>Activo</span>
              </label>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  {creating ? 'Creando usuario...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Listado de usuarios</h3>
            <Table columns={columns} data={filteredUsuarios} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
            <h3 className="text-lg font-semibold">Modo administrador</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Edita roles, cambia el estado de cuentas y controla perfiles dentro del sistema de la empresa.
              {canResetPassword ? ' Como admin_pro tambien puedes reasignar contrasenas.' : ''}
            </p>
          </div>

          {canResetPassword && passwordUsuario && (
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-2">Cambiar contrasena</h3>
              <p className="mb-4 text-sm text-gray-500">Usuario: {passwordUsuario.nombre_usuario}</p>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nueva contrasena</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Minimo 6 caracteres"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-400 transition"
                >
                  {passwordLoading ? 'Actualizando...' : 'Asignar nueva contrasena'}
                </button>
                {passwordMessage && <div className="text-sm text-slate-600 mt-2">{passwordMessage}</div>}
              </form>
            </div>
          )}

          {selectedUsuario && (
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-4">Editar usuario seleccionado</h3>
              <form onSubmit={handleUpdateUsuario} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nombre de usuario</label>
                  <input
                    type="text"
                    value={selectedUsuario.nombre_usuario}
                    onChange={(e) => setSelectedUsuario((prev) => ({ ...prev, nombre_usuario: e.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Correo electrónico</label>
                  <input
                    type="email"
                    value={selectedUsuario.correo_electronico === '-' ? '' : selectedUsuario.correo_electronico}
                    onChange={(e) => setSelectedUsuario((prev) => ({ ...prev, correo_electronico: e.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Rol</label>
                  <select
                    value={selectedUsuario.rol}
                    onChange={(e) => setSelectedUsuario((prev) => ({ ...prev, rol: e.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Secretaria">Secretaria</option>
                    <option value="TecnicoJefe">Tecnico Jefe</option>
                    <option value="Tecnico">Tecnico</option>
                    <option value="admin_pro">admin_pro</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedUsuario.activo === 'Sí'}
                    onChange={(e) => setSelectedUsuario((prev) => ({ ...prev, activo: e.target.checked ? 'Sí' : 'No' }))}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Activo</span>
                </div>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                >
                  {editLoading ? 'Guardando...' : 'Guardar cambios'}
                </button>
                {editMessage && <div className="text-sm text-slate-600 mt-2">{editMessage}</div>}
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
