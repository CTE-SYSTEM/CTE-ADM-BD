import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

const columns = [
  { 
    header: 'Fecha / Hora', 
    accessor: 'fecha_hora',
    render: (row) => row.fecha_hora ? new Date(row.fecha_hora).toLocaleString() : '-'
  },
  { header: 'Técnico asignado', accessor: 'tecnico' },
  { header: 'Diagnóstico real', accessor: 'diagnostico_real' },
  { 
    header: 'Estado', 
    accessor: 'estado_del_diagnostico',
    render: (row) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
        {row.estado_del_diagnostico || '-'}
      </span>
    )
  },
  { 
    header: 'Órdenes Relacionadas', 
    accessor: 'ordenes',
    render: (row) => (
      <span className={`inline-flex items-center justify-center px-2 py-0.5 min-w-[24px] text-xs font-bold rounded-md ${
        row.ordenes > 0 ? 'bg-indigo-50 text-indigo-700 font-bold' : 'bg-slate-100 text-gray-400'
      }`}>
        {row.ordenes}
      </span>
    )
  },
];

export default function HistorialEquipo() {
  const [equipos, setEquipos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedEquipoId, setSelectedEquipoId] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carga inicial de los equipos para el catálogo del datalist
  useEffect(() => {
    api.get('/admin_pro/equipos')
      .then((res) => {
        const data = res.data?.data || [];
        setEquipos(
          data.map((equipo) => ({
            id_equipo: equipo.id_equipo,
            label: `ID: #${equipo.id_equipo} - ${equipo.marca || 'Genérico'} ${equipo.modelo || ''}`.trim(),
          }))
        );
      })
      .catch(() => {
        setError('No se pudo sincronizar la lista de equipos disponibles.');
      });
  }, []);

  // Maneja el cambio del input y detecta si el texto coincide exactamente con una opción del datalist
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Buscamos si lo escrito coincide con el label de algún equipo de la lista
    const equipoEncontrado = equipos.find((eq) => eq.label === value);
    
    if (equipoEncontrado) {
      setSelectedEquipoId(equipoEncontrado.id_equipo);
    } else if (value === '') {
      setSelectedEquipoId('');
    }
  };

  // Consulta el historial cada vez que detectamos un ID válido seleccionado
  useEffect(() => {
    if (!selectedEquipoId) {
      setHistorial([]);
      return;
    }
    setLoading(true);
    setError('');
    
    api.get(`/admin_pro/equipos/${selectedEquipoId}/historial`)
      .then((res) => {
        const data = res.data?.data || [];
        setHistorial(
          data.map((d) => ({
            fecha_hora: d.fecha_hora || null,
            tecnico: d.tecnico?.nombre || 'No asignado',
            diagnostico_real: d.diagnostico_real || 'Sin observaciones',
            estado_del_diagnostico: d.estado_del_diagnostico || 'Indefinido',
            ordenes: d.ordenes?.length || 0,
          }))
        );
      })
      .catch(() => {
        setError('Error en la comunicación con el servidor al extraer la bitácora.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedEquipoId]);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado de Módulo */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Historial clínico de equipos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Busca un dispositivo por su ID, marca o modelo para desplegar su trazabilidad completa.</p>
      </div>

      {/* Panel de Control Central */}
      <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-6">
        
        {/* Input con DataList Inteligente */}
        <div className="max-w-md">
          <label htmlFor="equipo-search" className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Buscar y seleccionar dispositivo
          </label>
          <input
            id="equipo-search"
            type="text"
            list="equipos-datalist"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Escribe el ID, marca o modelo (ej. Dell, HP...)"
            className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />

          {/* Opciones ocultas del Datalist filtradas por el navegador */}
          <datalist id="equipos-datalist">
            {equipos.map((equipo) => (
              <option key={equipo.id_equipo} value={equipo.label} />
            ))}
          </datalist>
        </div>

        {/* Zona Dinámica de Resultados */}
        <div className="pt-2 border-t border-gray-50">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-100">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-gray-400 text-center py-12 text-sm">
              Escaneando órdenes de servicio y diagnósticos pasados...
            </div>
          )}

          {!loading && !error && (
            <>
              {!selectedEquipoId ? (
                <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-xs">
                  Escribe y selecciona un dispositivo en la barra superior para desplegar su línea de tiempo operacional.
                </div>
              ) : historial.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-xs">
                  Este equipo no cuenta con antecedentes de mantenimiento ni diagnósticos registrados en el sistema.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table columns={columns} data={historial} sortable />
                </div>
              )}
            </>
          )}
        </div>
      </section>

    </div>
  );
}