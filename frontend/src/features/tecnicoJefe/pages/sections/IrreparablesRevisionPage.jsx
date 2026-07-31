import React from 'react';
import { CorreccionesSearch, JefeTecnicoTablePanel } from '../../components/sections/JefeTecnicoSections';

const IrreparablesRevisionPage = ({ loading, columns, data, activeTab, searchTerm, onSearch }) => (
  <section>
    <div className="mb-4 px-4">
      <h2 className="text-sm font-black uppercase tracking-tight text-slate-800">Revision de irreparables</h2>
      <p className="mt-1 text-xs font-semibold text-slate-400">Contenido del boton Irreparables.</p>
    </div>
    <CorreccionesSearch activeTab={activeTab} searchTerm={searchTerm} onSearch={onSearch} />
    <JefeTecnicoTablePanel loading={loading} columns={columns} data={data} />
  </section>
);

export default IrreparablesRevisionPage;
