import React from 'react';
import { JefeTecnicoTablePanel } from '../../components/sections/JefeTecnicoSections';

const AlertasRetrasoPage = ({ loading, columns, data }) => (
  <section>
    <div className="mb-4 px-4">
      <h2 className="text-sm font-black uppercase tracking-tight text-slate-800">Alertas de retraso</h2>
      <p className="mt-1 text-xs font-semibold text-slate-400">Contenido del boton Alertas.</p>
    </div>
    <JefeTecnicoTablePanel loading={loading} columns={columns} data={data} />
  </section>
);

export default AlertasRetrasoPage;
