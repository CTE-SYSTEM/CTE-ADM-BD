// frontend/src/pages/Secretaria/Nuevaorden.jsx
import React, { useEffect, useState } from 'react';
import { Loader2, Search, CheckCircle, XCircle, FileText, User, Monitor } from 'lucide-react';
import { getDiagnosticos, updateEstadoDiagnostico } from '../../services/secretaria/diagnosticoService';
import { createOrden } from '../../services/secretaria/ordenesService';

const NuevaOrden = () => {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const loadDiagnosticos = async () => {
    setLoading(true);
    try {
      const response = await getDiagnosticos();
      // Filtramos solo los que ya tienen diagnóstico técnico pero no son orden aún
      const pendientes = response.data.data.filter(d => (d.estado_del_diagnostico || d.estado) === 'DIAGNOSTICADO');
      setDiagnosticos(pendientes);
    } catch (error) {
      console.error("Error al cargar diagnósticos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDiagnosticos(); }, []);

  const diagnosticosFiltrados = diagnosticos.filter((diag) => {
    const term = filter.toLowerCase();
    return [
      diag.equipo?.cliente?.nombre,
      diag.equipo?.marca,
      diag.equipo?.modelo,
      diag.equipo?.tipo,
      diag.diagnostico_real,
      diag.falla_reportada,
      String(diag.id_diagnostico),
    ].some((value) => String(value || '').toLowerCase().includes(term));
  });

  const handleAprobar = async (diagnostico) => {
    if (!window.confirm('¿El cliente ha aprobado el presupuesto? Se generará la orden de reparación.')) return;
    
    try {
      setLoading(true);
      // 1. Creamos la orden oficial
      await createOrden({
        diagnostico_id: diagnostico.id_diagnostico,
        monto_acordado: diagnostico.presupuesto_estimado,
        estado: 'EN_REPARACION'
      });
      // 2. Actualizamos el estado del diagnóstico original
      await updateEstadoDiagnostico(diagnostico.id_diagnostico, 'APROBADO');
      loadDiagnosticos();
    } catch (error) {
      alert("Error al generar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async (id) => {
    if (!window.confirm('¿El cliente rechazó el presupuesto?')) return;
    try {
      await updateEstadoDiagnostico(id, 'RECHAZADO');
      loadDiagnosticos();
    } catch (error) {
      alert("Error al actualizar estado");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Generar Órdenes</h2>
          <p className="text-gray-500 font-medium">Equipos diagnosticados esperando respuesta del cliente.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar cliente o equipo..." 
            className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin w-10 h-10 text-indigo-600" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {diagnosticosFiltrados.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed text-gray-400">
              No hay diagnósticos pendientes de aprobación por el cliente.
            </div>
          ) : (
            diagnosticosFiltrados.map((diag) => (
              <div key={diag.id_diagnostico} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4 overflow-hidden">
                
                <div className="flex gap-4 items-start w-full min-w-0">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 break-words">{diag.equipo?.marca} {diag.equipo?.modelo}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1 min-w-0"><User className="w-4 h-4 shrink-0"/> <span className="truncate">{diag.equipo?.cliente?.nombre}</span></span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">
                        Presupuesto: {diag.presupuesto_estimado ? `C$ ${Number(diag.presupuesto_estimado).toFixed(2)}` : 'Sin monto'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 italic break-words">
                      Informe Técnico: {diag.diagnostico_real || "Sin informe detallado"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto shrink-0">
                  <button 
                    onClick={() => handleRechazar(diag.id_diagnostico)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold whitespace-nowrap"
                  >
                    <XCircle className="w-5 h-5" /> Rechazar
                  </button>
                  <button 
                    onClick={() => handleAprobar(diag)}
                    className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold whitespace-nowrap"
                  >
                    <CheckCircle className="w-5 h-5" /> Aprobar y Crear Orden
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NuevaOrden;
