import React from 'react';
import DiagnosticosTable from '../DiagnosticosTable';
import OrdenesGrid from '../OrdenesGrid';
import RepuestosTable from '../RepuestosTable';
import SearchBox from '../SearchBox';

export const TecnicoTabContent = ({
  activeTab,
  searches,
  loading,
  diagnosticosEnRevision,
  diagnosticosCompletados,
  ordenesActivas,
  ordenesCompletadas,
  solicitudesRepuestos,
  onSearch,
  onOpenDiagnostico,
  onEstadoChange,
  onSolicitarPieza,
}) => (
  <>
    {activeTab === 'diagnosticos' && (
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-slate-600 text-left">Diagnosticos activos</h2>
        <SearchBox
          value={searches.diagnosticosEnRevision}
          onChange={(value) => onSearch('diagnosticosEnRevision', value)}
          placeholder="Buscar por ID, cliente, equipo o falla..."
        />
        <DiagnosticosTable items={diagnosticosEnRevision} loading={loading} readOnly={false} onOpenDiagnostico={onOpenDiagnostico} />
      </section>
    )}

    {activeTab === 'diagnosticos_completados' && (
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-slate-600 text-left">Diagnosticos completados</h2>
        <SearchBox
          value={searches.diagnosticosCompletados}
          onChange={(value) => onSearch('diagnosticosCompletados', value)}
          placeholder="Buscar por ID, cliente, equipo, falla..."
        />
        <DiagnosticosTable items={diagnosticosCompletados} loading={loading} readOnly onOpenDiagnostico={onOpenDiagnostico} />
      </section>
    )}

    {activeTab === 'ordenes' && (
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-slate-600 text-left">Ordenes de reparacion activas</h2>
        <SearchBox
          value={searches.ordenesActivas}
          onChange={(value) => onSearch('ordenesActivas', value)}
          placeholder="Buscar por orden, cliente, equipo..."
        />
        <OrdenesGrid items={ordenesActivas} loading={loading} onEstadoChange={onEstadoChange} onSolicitarPieza={onSolicitarPieza} />
      </section>
    )}

    {activeTab === 'ordenes_completadas' && (
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-slate-600 text-left">Ordenes de reparacion finalizadas</h2>
        <SearchBox
          value={searches.ordenesCompletadas}
          onChange={(value) => onSearch('ordenesCompletadas', value)}
          placeholder="Buscar por orden, cliente, equipo..."
        />
        <OrdenesGrid items={ordenesCompletadas} loading={loading} completed onEstadoChange={onEstadoChange} onSolicitarPieza={onSolicitarPieza} />
      </section>
    )}

    {activeTab === 'repuestos' && (
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase text-slate-600 text-left">Historial de piezas y repuestos</h2>
        <SearchBox
          value={searches.repuestos}
          onChange={(value) => onSearch('repuestos', value)}
          placeholder="Buscar por orden o pieza..."
        />
        <RepuestosTable solicitudes={solicitudesRepuestos} loading={loading} />
      </section>
    )}
  </>
);
