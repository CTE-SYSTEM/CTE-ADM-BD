import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Package, Wrench, X, FileText, ClipboardList, Eye } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const estadosDiagnosticoCompletado = ['COMPLETADO', 'DIAGNOSTICADO', 'APROBADO', 'RECHAZADO'];

const PrioridadBadge = ({ prioridad }) => {
  const key = String(prioridad || '').toUpperCase();
  const styles = {
    URGENTE: 'bg-red-100 text-red-700 border-red-200',
    ALTA: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIA: 'bg-blue-100 text-blue-700 border-blue-200',
    NORMAL: 'bg-blue-100 text-blue-700 border-blue-200',
    BAJA: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[key] || styles.BAJA}`}>
      {prioridad || 'NORMAL'}
    </span>
  );
};

const EstadoBadge = ({ estado }) => {
  const key = String(estado || '').toUpperCase();
  const styles = {
    PENDIENTE: 'bg-gray-100 text-gray-600 border-gray-200',
    EN_REVISION: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    EN_REPARACION: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    ESPERANDO_REPUESTO: 'bg-amber-50 text-amber-700 border-amber-100',
    ESPERANDO_PIEZA: 'bg-amber-50 text-amber-700 border-amber-100',
    FINALIZADO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    COMPLETADO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    DIAGNOSTICADO: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    APROBADO: 'bg-green-50 text-green-700 border-green-100',
    RECHAZADO: 'bg-red-50 text-red-700 border-red-100',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${styles[key] || 'bg-gray-50 text-gray-600'}`}>
      {key || 'PENDIENTE'}
    </span>
  );
};

const EstadoSolicitudBadge = ({ estado }) => {
  const key = String(estado || '').toUpperCase();
  const styles = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    APROBADO: 'bg-green-100 text-green-800',
    DENEGADO: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[key] || 'bg-gray-100 text-gray-800'}`}>
      {key || 'PENDIENTE'}
    </span>
  );
};

const SolicitarRepuestoModal = ({ orden, repuestos, onClose, onSubmit }) => {
  const [repuesto, setRepuesto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(orden.id, { repuesto, cantidad });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || 'No se pudo solicitar la pieza.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Solicitar Pieza</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs mb-4">
            <span className="font-black text-indigo-600">ORDEN #{orden.id}</span>
            <p className="font-bold text-gray-700">{orden.equipo}</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Pieza solicitada</label>
            <input
              required
              list="repuestos-disponibles"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={repuesto}
              onChange={(e) => setRepuesto(e.target.value)}
              placeholder="Puede ser una pieza nueva o existente"
            />
            <datalist id="repuestos-disponibles">
              {repuestos.map((item) => (
                <option key={item.id_repuesto} value={item.nombre || ''} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Cantidad</label>
            <input type="number" min="1" className="w-full px-3 py-2 border rounded-lg text-sm" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Si la pieza aun no existe en inventario, quedara pedida por nombre. Cuando se compre y se registre, se puede repetir/regularizar la solicitud con el repuesto ya creado.
          </p>
          {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">{error}</div>}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-gray-500">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase">
              {loading ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DiagnosticoModal = ({ orden, readOnly = false, onClose, onSubmit }) => {
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico || '');
  const [solucion, setSolucion] = useState(orden.solucion || '');
  const [presupuesto, setPresupuesto] = useState(orden.presupuesto || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(orden.id, { diagnostico, solucion, presupuesto });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo guardar el diagnostico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">
              {readOnly ? 'Detalle Diagnostico' : 'Completar Diagnostico'}
            </h3>
            <EstadoBadge estado={orden.estado} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Equipo</label>
            <div className="p-3 bg-gray-50 border rounded-lg text-sm font-bold text-gray-700">
              #{orden.id} - {orden.equipo}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Falla reportada</label>
            <div className="p-3 bg-gray-50 border rounded-lg text-sm text-gray-600">{orden.falla}</div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Hallazgos</label>
            <textarea readOnly={readOnly} required rows="3" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 read-only:bg-gray-50" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Accion / Solucion</label>
            <textarea readOnly={readOnly} required={!readOnly} rows="2" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 read-only:bg-gray-50" value={solucion} onChange={(e) => setSolucion(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Presupuesto estimado</label>
            <input readOnly={readOnly} type="number" min="0" step="0.01" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 read-only:bg-gray-50" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} />
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div>}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-gray-500">Cerrar</button>
            {!readOnly && (
              <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold uppercase">
                {loading ? 'Guardando...' : 'Marcar Completado'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const TecnicoDashboard = () => {
  const { user } = useContext(AuthContext);
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [repuestosCatalogo, setRepuestosCatalogo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('diagnosticos');
  const [modalRepuesto, setModalRepuesto] = useState(null);
  const [modalDiagnostico, setModalDiagnostico] = useState(null);

  const mapEquipo = (equipo) =>
    `${equipo?.tipo || 'Equipo'} ${equipo?.marca || ''} ${equipo?.modelo || ''}`.trim();

  const mapDiagnostico = (diagnostico) => ({
    id: diagnostico.id_diagnostico,
    cliente: diagnostico.equipo?.cliente?.nombre || 'Sin cliente',
    equipo: mapEquipo(diagnostico.equipo),
    falla: diagnostico.falla_reportada || 'Sin falla reportada',
    prioridad: diagnostico.prioridad || 'MEDIA',
    estado: diagnostico.estado_del_diagnostico || 'PENDIENTE',
    diagnostico: diagnostico.diagnostico_real || '',
    solucion: '',
    presupuesto: diagnostico.presupuesto_estimado || '',
  });

  const mapOrden = (orden) => {
    const diagnostico = orden.diagnostico || {};
    return {
      id: orden.id_orden,
      cliente: diagnostico.equipo?.cliente?.nombre || 'Sin cliente',
      equipo: mapEquipo(diagnostico.equipo),
      falla: diagnostico.falla_reportada || 'Sin falla reportada',
      prioridad: orden.prioridad || diagnostico.prioridad || 'NORMAL',
      estado: orden.estado || 'PENDIENTE',
      diagnostico: diagnostico.diagnostico_real || '',
      presupuesto: diagnostico.presupuesto_estimado || '',
      repuestos_usados: orden.repuestos_usados || [],
      puedeEditarCompletada: orden.puede_editar_completada !== false,
    };
  };

  const diagnosticosEnRevision = useMemo(
    () => diagnosticos.filter((diag) => !estadosDiagnosticoCompletado.includes(String(diag.estado || '').toUpperCase())),
    [diagnosticos],
  );

  const diagnosticosCompletados = useMemo(
    () => diagnosticos.filter((diag) => estadosDiagnosticoCompletado.includes(String(diag.estado || '').toUpperCase())),
    [diagnosticos],
  );

  const solicitudesRepuestos = useMemo(
    () => ordenes.flatMap((orden) => (orden.repuestos_usados || []).map((solicitud) => ({
      id: solicitud.id_detalle_repuesto,
      ordenId: orden.id,
      repuesto: solicitud.repuesto?.nombre || solicitud.pieza_solicitada || 'Pieza pendiente de registrar',
      cantidad: solicitud.cantidad_usada || 1,
      estado: solicitud.estado_aprobacion,
      pendienteInventario: !solicitud.repuesto_id,
    }))),
    [ordenes],
  );

  const ordenesActivas = useMemo(
    () => ordenes.filter((orden) => String(orden.estado || '').toUpperCase() !== 'FINALIZADO'),
    [ordenes],
  );

  const ordenesCompletadas = useMemo(
    () => ordenes.filter((orden) => String(orden.estado || '').toUpperCase() === 'FINALIZADO'),
    [ordenes],
  );

  const loadTecnicoData = async () => {
    if (!user?.username) return;

    setLoading(true);
    setError('');
    try {
      const username = encodeURIComponent(user.username);
      const [diagnosticosRes, ordenesRes, repuestosRes] = await Promise.all([
        api.get(`/tecnicos/mis-diagnosticos/${username}`),
        api.get(`/tecnicos/mis-ordenes/${username}`),
        api.get('/repuestos'),
      ]);

      setDiagnosticos((diagnosticosRes.data.data || []).map(mapDiagnostico));
      setOrdenes((ordenesRes.data.data || []).map(mapOrden));
      setRepuestosCatalogo(repuestosRes.data.data || []);
    } catch (err) {
      console.error('Error al cargar datos del tecnico:', err);
      setError('No se pudo cargar el circuito del tecnico.');
      setDiagnosticos([]);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTecnicoData();
  }, [user?.username]);

  const handleEstadoChange = async (ordenId, nuevoEstado) => {
    setOrdenes((prev) => prev.map((o) => (o.id === ordenId ? { ...o, estado: nuevoEstado } : o)));
    try {
      await api.patch(`/tecnicos/ordenes/${ordenId}/estado`, { estado: nuevoEstado });
      await loadTecnicoData();
    } catch (err) {
      console.error('Error al cambiar estado de orden:', err);
      setError(err?.response?.data?.error || 'No se pudo actualizar el estado de la orden.');
      await loadTecnicoData();
    }
  };

  const handleGuardarDiagnostico = async (diagnosticoId, data) => {
    await api.put(`/tecnicos/diagnosticos/${diagnosticoId}`, {
      diagnostico_real: `${data.diagnostico}\n\nSolucion: ${data.solucion}`.trim(),
      presupuesto_estimado: data.presupuesto || undefined,
      estado_del_diagnostico: 'COMPLETADO',
    });
    await loadTecnicoData();
  };

  const handleSolicitarRepuesto = async (ordenId, data) => {
    await api.post(`/tecnicos/ordenes/${ordenId}/repuestos`, data);
    await loadTecnicoData();
  };

  const renderDiagnosticosTable = (items, { readOnly }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr className="text-[10px] font-black text-gray-400 uppercase text-left">
            <th className="px-6 py-4">Diagnostico</th>
            <th className="px-6 py-4">Equipo</th>
            <th className="px-6 py-4">Estado</th>
            <th className="px-6 py-4">Presupuesto</th>
            <th className="px-6 py-4">Informe</th>
            <th className="px-6 py-4 text-right">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((o) => (
            <tr key={o.id} className="text-sm">
              <td className="px-6 py-4 font-black text-purple-600">#{o.id}</td>
              <td className="px-6 py-4 font-bold text-gray-800">{o.equipo}</td>
              <td className="px-6 py-4"><EstadoBadge estado={o.estado} /></td>
              <td className="px-6 py-4 font-bold text-emerald-700">
                {o.presupuesto ? `C$ ${Number(o.presupuesto).toFixed(2)}` : 'Sin presupuesto'}
              </td>
              <td className="px-6 py-4 text-gray-500 italic">{o.diagnostico || 'Sin diagnostico registrado...'}</td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => setModalDiagnostico({ ...o, readOnly })}
                  className={`p-2 rounded-lg transition-all ${readOnly ? 'bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white'}`}
                  title={readOnly ? 'Ver detalle' : 'Completar diagnostico'}
                >
                  {readOnly ? <Eye size={18} /> : <FileText size={18} />}
                </button>
              </td>
            </tr>
          ))}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                {readOnly ? 'No tienes diagnosticos completados.' : 'No tienes diagnosticos en revision.'}
              </td>
            </tr>
          )}
          {loading && (
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-purple-500 font-bold">Cargando diagnosticos...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderOrdenesGrid = (items, { completed = false } = {}) => (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((orden) => {
        const tienePiezasPendientes = (orden.repuestos_usados || []).some((item) => item.estado_aprobacion === 'PENDIENTE');
        const puedeEditar = !completed || orden.puedeEditarCompletada;

        return (
          <div key={orden.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-indigo-600">#{orden.id}</span>
                  <PrioridadBadge prioridad={orden.prioridad} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{orden.equipo}</h3>
              </div>
              <EstadoBadge estado={orden.estado} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <span className="text-[9px] font-black text-gray-400 uppercase">Falla Reportada</span>
              <p className="text-xs text-gray-600 italic">"{orden.falla}"</p>
            </div>
            {tienePiezasPendientes && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                Tiene piezas pendientes de aprobacion. No puede finalizarse todavia.
              </div>
            )}
            {completed && !puedeEditar && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                Edicion bloqueada: ya paso el dia o no esta entre las ultimas 5 completadas.
              </div>
            )}
            <div className="flex gap-2">
              <select
                disabled={!puedeEditar}
                className="flex-1 px-3 py-2 border rounded-lg text-[10px] font-black uppercase disabled:bg-gray-100 disabled:text-gray-400"
                value={orden.estado}
                onChange={(e) => handleEstadoChange(orden.id, e.target.value)}
              >
                <option value="EN_REPARACION">EN REPARACION</option>
                <option value="ESPERANDO_PIEZA">ESPERANDO PIEZA</option>
                <option value="FINALIZADO" disabled={tienePiezasPendientes}>FINALIZADO</option>
              </select>
              <button
                onClick={() => setModalRepuesto(orden)}
                disabled={!puedeEditar || completed}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Package size={14} /> Pieza
              </button>
            </div>
          </div>
        );
      })}
      {!loading && items.length === 0 && (
        <div className="md:col-span-2 rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-400 italic">
          {completed ? 'No tienes ordenes completadas.' : 'No tienes ordenes de reparacion activas.'}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-800 tracking-tight text-left">PANEL TECNICO</h1>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          <button onClick={() => setActiveTab('diagnosticos')} className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center ${activeTab === 'diagnosticos' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>
            <ClipboardList size={16} className="mr-2" /> En Revision ({diagnosticosEnRevision.length})
          </button>
          <button onClick={() => setActiveTab('diagnosticos_completados')} className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center ${activeTab === 'diagnosticos_completados' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400'}`}>
            <FileText size={16} className="mr-2" /> Completados ({diagnosticosCompletados.length})
          </button>
          <button onClick={() => setActiveTab('ordenes')} className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center ${activeTab === 'ordenes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
            <Wrench size={16} className="mr-2" /> Ordenes Activas ({ordenesActivas.length})
          </button>
          <button onClick={() => setActiveTab('ordenes_completadas')} className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center ${activeTab === 'ordenes_completadas' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400'}`}>
            <Wrench size={16} className="mr-2" /> Ordenes Completadas ({ordenesCompletadas.length})
          </button>
          <button onClick={() => setActiveTab('repuestos')} className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest flex items-center ${activeTab === 'repuestos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400'}`}>
            <Package size={16} className="mr-2" /> Mis Piezas ({solicitudesRepuestos.length})
          </button>
        </nav>
      </div>

      {activeTab === 'diagnosticos' && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-gray-400 uppercase">Diagnosticos en revision</h2>
          {renderDiagnosticosTable(diagnosticosEnRevision, { readOnly: false })}
        </div>
      )}

      {activeTab === 'diagnosticos_completados' && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-gray-400 uppercase">Diagnosticos completados</h2>
          {renderDiagnosticosTable(diagnosticosCompletados, { readOnly: true })}
        </div>
      )}

      {activeTab === 'ordenes' && (
        renderOrdenesGrid(ordenesActivas)
      )}

      {activeTab === 'ordenes_completadas' && (
        renderOrdenesGrid(ordenesCompletadas, { completed: true })
      )}

      {activeTab === 'repuestos' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr className="text-[10px] font-black text-gray-400 uppercase text-left">
                <th className="px-6 py-4">Orden</th>
                <th className="px-6 py-4">Pieza</th>
                <th className="px-6 py-4">Cantidad</th>
                <th className="px-6 py-4">Inventario</th>
                <th className="px-6 py-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {solicitudesRepuestos.map((r) => (
                <tr key={r.id} className="text-sm">
                  <td className="px-6 py-4 font-black text-indigo-600">#{r.ordenId}</td>
                  <td className="px-6 py-4 font-bold">{r.repuesto}</td>
                  <td className="px-6 py-4 font-bold text-gray-600">{r.cantidad}</td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-1 text-[10px] font-black uppercase ${r.pendienteInventario ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {r.pendienteInventario ? 'Por registrar' : 'Registrada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center"><EstadoSolicitudBadge estado={r.estado} /></td>
                </tr>
              ))}
              {!loading && solicitudesRepuestos.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">No has solicitado piezas todavia.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalRepuesto && (
        <SolicitarRepuestoModal
          orden={modalRepuesto}
          repuestos={repuestosCatalogo}
          onClose={() => setModalRepuesto(null)}
          onSubmit={handleSolicitarRepuesto}
        />
      )}
      {modalDiagnostico && (
        <DiagnosticoModal
          orden={modalDiagnostico}
          readOnly={modalDiagnostico.readOnly}
          onClose={() => setModalDiagnostico(null)}
          onSubmit={handleGuardarDiagnostico}
        />
      )}
    </div>
  );
};

export default TecnicoDashboard;
