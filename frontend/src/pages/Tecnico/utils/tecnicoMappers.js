export const mapEquipo = (equipo) =>
  `${equipo?.tipo || 'Equipo'} ${equipo?.marca || ''} ${equipo?.modelo || ''}`.trim();

export const mapDiagnostico = (diagnostico) => ({
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

export const mapOrden = (orden) => {
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
    resultado_final: orden.resultado_final || '',
    enciende_salida: orden.enciende_salida,
    usa_corriente_ac_salida: orden.usa_corriente_ac_salida,
    observacion_final: orden.observacion_final || '',
  };
};
