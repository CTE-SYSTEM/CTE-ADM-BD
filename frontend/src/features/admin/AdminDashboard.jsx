import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ equipos: 0, repuestos: 0, ordenes: 0, facturas: 0, usuarios: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin_pro/monitoreo');
        const data = res.data;
        if (data.data) setStats(data.data);
        else setError('No se pudo cargar el monitoreo general');
      } catch (e) {
        setError('Error de red o servidor');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Panel avanzado de administración</h1>
      {loading && <div>Cargando...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold">{stats.equipos}</span>
          <span className="text-gray-600">Equipos</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold">{stats.repuestos}</span>
          <span className="text-gray-600">Repuestos</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold">{stats.ordenes}</span>
          <span className="text-gray-600">Órdenes</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold">{stats.facturas}</span>
          <span className="text-gray-600">Facturas</span>
        </div>
        <div className="bg-white rounded shadow p-6 flex flex-col items-center">
          <span className="text-4xl font-bold">{stats.usuarios}</span>
          <span className="text-gray-600">Usuarios</span>
        </div>
      </div>
    </div>
  );
}
