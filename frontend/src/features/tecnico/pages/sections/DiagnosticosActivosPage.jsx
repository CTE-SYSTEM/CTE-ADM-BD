import React from 'react';
import DiagnosticosTable from '../../components/DiagnosticosTable';
import SearchBox from '../../components/SearchBox';

const DiagnosticosActivosPage = ({ search, loading, items, onSearch, onOpenDiagnostico }) => (
  <section className="space-y-4">
    <h2 className="text-sm font-black uppercase text-slate-600 text-left">Diagnosticos activos</h2>
    <SearchBox
      value={search}
      onChange={(value) => onSearch('diagnosticosEnRevision', value)}
      placeholder="Buscar por ID, cliente, equipo o falla..."
    />
    <DiagnosticosTable items={items} loading={loading} readOnly={false} onOpenDiagnostico={onOpenDiagnostico} />
  </section>
);

export default DiagnosticosActivosPage;
