import React from 'react';
import RepuestosTable from '../../components/RepuestosTable';
import SearchBox from '../../components/SearchBox';

const RepuestosTecnicoPage = ({ search, loading, solicitudes, onSearch }) => (
  <section className="space-y-4">
    <h2 className="text-sm font-black uppercase text-slate-600 text-left">Historial de piezas y repuestos</h2>
    <SearchBox
      value={search}
      onChange={(value) => onSearch('repuestos', value)}
      placeholder="Buscar por orden o pieza..."
    />
    <RepuestosTable solicitudes={solicitudes} loading={loading} />
  </section>
);

export default RepuestosTecnicoPage;
