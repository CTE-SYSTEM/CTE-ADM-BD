import React from 'react';
import { ClipboardList, FileText, Package, Wrench } from 'lucide-react';
import { TecnicoTabButton } from '../TecnicoStats';

export const TecnicoTabs = ({
  activeTab,
  diagnosticosEnRevision,
  diagnosticosCompletados,
  ordenesActivas,
  ordenesCompletadas,
  solicitudesRepuestos,
  onChange,
}) => (
  <div className="mb-8">
    <nav className="flex flex-wrap gap-3">
      <TecnicoTabButton active={activeTab === 'diagnosticos'} onClick={() => onChange('diagnosticos')} icon={<ClipboardList size={16} />} label={`Diagnosticos activos (${diagnosticosEnRevision.length})`} />
      <TecnicoTabButton active={activeTab === 'diagnosticos_completados'} onClick={() => onChange('diagnosticos_completados')} icon={<FileText size={16} />} label={`Completados (${diagnosticosCompletados.length})`} />
      <TecnicoTabButton active={activeTab === 'ordenes'} onClick={() => onChange('ordenes')} icon={<Wrench size={16} />} label={`Ordenes Activas (${ordenesActivas.length})`} />
      <TecnicoTabButton active={activeTab === 'ordenes_completadas'} onClick={() => onChange('ordenes_completadas')} icon={<Wrench size={16} />} label={`Ordenes Completadas (${ordenesCompletadas.length})`} />
      <TecnicoTabButton active={activeTab === 'repuestos'} onClick={() => onChange('repuestos')} icon={<Package size={16} />} label={`Mis Piezas (${solicitudesRepuestos.length})`} />
    </nav>
  </div>
);
