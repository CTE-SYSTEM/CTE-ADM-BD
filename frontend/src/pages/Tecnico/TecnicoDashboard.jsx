import React, { useContext, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, FileText, Package, Wrench } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import TecnicoHeader from './components/TecnicoHeader';
import DiagnosticosTable from './components/DiagnosticosTable';
import OrdenesGrid from './components/OrdenesGrid';
import RepuestosTable from './components/RepuestosTable';
import { CierreOrdenModal, DiagnosticoModal, SolicitarRepuestoModal } from './components/TecnicoModals';
import { TecnicoStatCard, TecnicoTabButton } from './components/TecnicoStats';
import { useTecnicoDashboard } from './hooks/useTecnicoDashboard';

const TecnicoDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('diagnosticos');
  const [modalRepuesto, setModalRepuesto] = useState(null);
  const [modalDiagnostico, setModalDiagnostico] = useState(null);
  const [modalCierre, setModalCierre] = useState(null);
  const [searches, setSearches] = useState({
    diagnosticosCompletados: '',
    ordenesCompletadas: '',
    repuestos: '',
  });

  const { data, state, actions } = useTecnicoDashboard(user);
  const {
    diagnosticosEnRevision,
    diagnosticosCompletados,
    ordenes,
    ordenesActivas,
    ordenesCompletadas,
    repuestosCatalogo,
    solicitudesRepuestos,
  } = data;
  const { loading, error } = state;

  const diagnosticosCompletadosFiltrados = useMemo(
    () => filterItems(diagnosticosCompletados, searches.diagnosticosCompletados, (item) => [
      item.id,
      item.cliente,
      item.equipo,
      item.falla,
      item.estado,
      item.diagnostico,
      item.presupuesto,
    ]),
    [diagnosticosCompletados, searches.diagnosticosCompletados],
  );

  const ordenesCompletadasFiltradas = useMemo(
    () => filterItems(ordenesCompletadas, searches.ordenesCompletadas, (item) => [
      item.id,
      item.cliente,
      item.equipo,
      item.falla,
      item.estado,
      item.prioridad,
      item.diagnostico,
      item.resultado_final,
      item.observacion_final,
      ...(item.repuestos_usados || []).flatMap((repuesto) => [
        repuesto.repuesto?.nombre,
        repuesto.pieza_solicitada,
        repuesto.estado_aprobacion,
      ]),
    ]),
    [ordenesCompletadas, searches.ordenesCompletadas],
  );

  const solicitudesRepuestosFiltradas = useMemo(
    () => filterItems(solicitudesRepuestos, searches.repuestos, (item) => [
      item.id,
      item.ordenId,
      item.repuesto,
      item.cantidad,
      item.estado,
      item.pendienteInventario ? 'por registrar pendiente inventario' : 'registrada inventario',
    ]),
    [solicitudesRepuestos, searches.repuestos],
  );

  const updateSearch = (key, value) => {
    setSearches((prev) => ({ ...prev, [key]: value }));
  };

  const handleEstadoChange = async (ordenId, nuevoEstado) => {
    const orden = ordenes.find((item) => item.id === ordenId);
    if (['FINALIZADO', 'IRREPARABLE'].includes(nuevoEstado)) {
      setModalCierre({ orden, estado: nuevoEstado });
      return;
    }

    actions.setOrdenes((prev) => prev.map((item) => (item.id === ordenId ? { ...item, estado: nuevoEstado } : item)));
    try {
      await actions.cambiarEstadoOrden(ordenId, { estado: nuevoEstado });
    } catch (err) {
      console.error('Error al cambiar estado de orden:', err);
      actions.setError(err?.response?.data?.error || 'No se pudo actualizar el estado de la orden.');
      await actions.loadTecnicoData();
    }
  };

  const handleCerrarOrden = async (ordenId, payload) => {
    actions.setOrdenes((prev) => prev.map((item) => (item.id === ordenId ? { ...item, estado: payload.estado } : item)));
    try {
      await actions.cambiarEstadoOrden(ordenId, payload);
    } catch (err) {
      await actions.loadTecnicoData();
      throw err;
    }
  };

  const handleSolicitarRepuesto = async (ordenId, payload) => {
    actions.setOrdenes((prev) => prev.map((item) => (item.id === ordenId ? { ...item, estado: 'ESPERANDO_PIEZA' } : item)));
    try {
      await actions.solicitarRepuesto(ordenId, payload);
    } catch (err) {
      await actions.loadTecnicoData();
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <TecnicoHeader user={user} onLogout={logout} />

      <main className="mx-auto max-w-[1840px] px-6 py-10">
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
          <TecnicoStatCard icon={<ClipboardList size={22} />} label="En revision" value={diagnosticosEnRevision.length} color="violet" />
          <TecnicoStatCard icon={<CheckCircle2 size={22} />} label="Diagnosticos completados" value={diagnosticosCompletados.length} color="emerald" />
          <TecnicoStatCard icon={<Wrench size={22} />} label="Ordenes activas" value={ordenesActivas.length} color="blue" />
          <TecnicoStatCard icon={<Package size={22} />} label="Mis piezas" value={solicitudesRepuestos.length} color="amber" />
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</div>}

        <div className="mb-8">
          <nav className="flex flex-wrap gap-3">
            <TecnicoTabButton active={activeTab === 'diagnosticos'} onClick={() => setActiveTab('diagnosticos')} icon={<ClipboardList size={16} />} label={`En Revision (${diagnosticosEnRevision.length})`} />
            <TecnicoTabButton active={activeTab === 'diagnosticos_completados'} onClick={() => setActiveTab('diagnosticos_completados')} icon={<FileText size={16} />} label={`Completados (${diagnosticosCompletados.length})`} />
            <TecnicoTabButton active={activeTab === 'ordenes'} onClick={() => setActiveTab('ordenes')} icon={<Wrench size={16} />} label={`Ordenes Activas (${ordenesActivas.length})`} />
            <TecnicoTabButton active={activeTab === 'ordenes_completadas'} onClick={() => setActiveTab('ordenes_completadas')} icon={<Wrench size={16} />} label={`Ordenes Completadas (${ordenesCompletadas.length})`} />
            <TecnicoTabButton active={activeTab === 'repuestos'} onClick={() => setActiveTab('repuestos')} icon={<Package size={16} />} label={`Mis Piezas (${solicitudesRepuestos.length})`} />
          </nav>
        </div>

        {activeTab === 'diagnosticos' && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-600">Diagnosticos en revision</h2>
            <DiagnosticosTable items={diagnosticosEnRevision} loading={loading} readOnly={false} onOpenDiagnostico={setModalDiagnostico} />
          </section>
        )}

        {activeTab === 'diagnosticos_completados' && (
          <section className="space-y-4">
            <h2 className="text-sm font-black uppercase text-slate-600">Diagnosticos completados</h2>
            <SearchBox
              value={searches.diagnosticosCompletados}
              onChange={(value) => updateSearch('diagnosticosCompletados', value)}
              placeholder="Buscar por ID, cliente, equipo, falla, informe, estado o presupuesto..."
            />
            <DiagnosticosTable items={diagnosticosCompletadosFiltrados} loading={loading} readOnly onOpenDiagnostico={setModalDiagnostico} />
          </section>
        )}

        {activeTab === 'ordenes' && (
          <OrdenesGrid items={ordenesActivas} loading={loading} onEstadoChange={handleEstadoChange} onSolicitarPieza={setModalRepuesto} />
        )}

        {activeTab === 'ordenes_completadas' && (
          <section className="space-y-4">
            <SearchBox
              value={searches.ordenesCompletadas}
              onChange={(value) => updateSearch('ordenesCompletadas', value)}
              placeholder="Buscar por orden, cliente, equipo, falla, resultado, pieza o estado..."
            />
            <OrdenesGrid items={ordenesCompletadasFiltradas} loading={loading} completed onEstadoChange={handleEstadoChange} onSolicitarPieza={setModalRepuesto} />
          </section>
        )}

        {activeTab === 'repuestos' && (
          <section className="space-y-4">
            <SearchBox
              value={searches.repuestos}
              onChange={(value) => updateSearch('repuestos', value)}
              placeholder="Buscar por orden, pieza, cantidad, estado o inventario..."
            />
            <RepuestosTable solicitudes={solicitudesRepuestosFiltradas} loading={loading} />
          </section>
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
            onSubmit={actions.guardarDiagnostico}
          />
        )}
        {modalCierre && (
          <CierreOrdenModal
            orden={modalCierre.orden}
            estado={modalCierre.estado}
            onClose={() => setModalCierre(null)}
            onSubmit={handleCerrarOrden}
          />
        )}
      </main>
    </div>
  );
};

export default TecnicoDashboard;

const filterItems = (items, term, getFields) => {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return items;

  return items.filter((item) =>
    getFields(item).some((field) => normalizeText(field).includes(normalizedTerm)),
  );
};

const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const SearchBox = ({ value, onChange, placeholder }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      placeholder={placeholder}
    />
  </div>
);
