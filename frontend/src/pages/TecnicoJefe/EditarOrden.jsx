// frontend/src/pages/TecnicoJefe/EditarOrden.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { diagnosticoService } from '../../services/JefeTecnico/DiagnosticoService';

const EditarOrden = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchOrden();
  }, [id]);

  const fetchOrden = async () => {
    setLoading(true);
    try {
      const res = await diagnosticoService.getOrdenById(id);
      const ordenData = res.data?.data;
      setOrden(ordenData);
      setFormData({
        prioridad: ordenData?.prioridad || 'NORMAL',
        estado: ordenData?.estado || 'PENDIENTE',
        tipo_equipo: ordenData?.tipo_equipo || '',
        tecnico_id: ordenData?.tecnico_id || '',
      });
    } catch (error) {
      console.error("Error al cargar orden:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await diagnosticoService.updateOrden(id, formData);
      navigate('/tecnico-jefe');
    } catch (error) {
      console.error("Error al actualizar orden:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black text-slate-800 mb-6">Editar Orden #{id}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Prioridad</label>
            <select 
              name="prioridad" 
              value={formData.prioridad} 
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
            >
              <option value="NORMAL">Normal</option>
              <option value="ALTA">Alta</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Estado</label>
            <select 
              name="estado" 
              value={formData.estado} 
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500"
            >
              <option value="PENDIENTE">Pendiente</option>
              <option value="REVISION">Revision</option>
              <option value="EN_REPARACION">En Reparación</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
          </div>
          <div className="flex gap-4">
            <button 
              type="submit" 
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black hover:bg-indigo-700 transition-colors"
            >
              Guardar Cambios
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/tecnico-jefe')}
              className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-black hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarOrden;
