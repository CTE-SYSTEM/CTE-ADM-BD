export const mapEquipo = (equipo) =>
  `${equipo?.tipo || 'Equipo'} ${equipo?.marca || ''} ${equipo?.modelo || ''}`.trim();

export const mapDiagnostico = (diagnostico) => ({
  id: diagnostico.id_diagnostico,
  cliente: diagnostico.equipo?.cliente?.nombre || 'Sin cliente',
  equipo: mapEquipo(diagnostico.equipo),
  equipoTipo: diagnostico.equipo?.tipo || '',
  falla: diagnostico.falla_reportada || 'Sin falla reportada',
  prioridad: diagnostico.prioridad || 'MEDIA',
  estado: diagnostico.estado_del_diagnostico || 'PENDIENTE',
  diagnostico: diagnostico.diagnostico_real || '',
  solucion: '',
  presupuesto: diagnostico.presupuesto_estimado || '',
  fecha_hora: diagnostico.fecha_completado || diagnostico.fecha_hora || diagnostico.createdAt || null,
  fecha_asignacion: diagnostico.fecha_asignacion || null,
  fecha_completado: diagnostico.fecha_completado || null,
  updatedAt: diagnostico.updatedAt || null,
});

export const mapOrden = (orden) => {
  const diagnostico = orden.diagnostico || {};
  return {
    id: orden.id_orden,
    cliente: diagnostico.equipo?.cliente?.nombre || 'Sin cliente',
    equipo: mapEquipo(diagnostico.equipo),
    equipoTipo: diagnostico.equipo?.tipo || '',
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
    justificacion_irreparable: orden.justificacion_irreparable || '',
    irreparable_estado: orden.irreparable_estado || 'PENDIENTE',
    requiere_piezas: orden.requiere_piezas !== false,
    fecha_ingreso: orden.fecha_ingreso || null,
    fecha_asignacion: orden.fecha_asignacion || null,
    fecha_finalizacion: orden.fecha_finalizacion || orden.fecha_cierre || null,
    fecha_cierre: orden.fecha_cierre || null,
    updatedAt: orden.updatedAt || null,
  };
};
