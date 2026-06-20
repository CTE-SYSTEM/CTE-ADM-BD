export const transformGarantias = (garantias) =>
  garantias.map((g) => {
    const fechaVencimiento = g.fecha_vencimiento ? new Date(g.fecha_vencimiento) : null;
    const isExpired = fechaVencimiento ? fechaVencimiento < new Date() : true;
    return {
      id_garantia: g.id_garantia,
      factura_id: g.factura_id,
      orden_id: g.factura?.orden?.id_orden || '-',
      cliente: g.factura?.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
      equipo: g.factura?.orden?.diagnostico?.equipo?.modelo || '-',
      fecha_inicio: g.fecha_inicio ? new Date(g.fecha_inicio).toLocaleDateString() : '-',
      fecha_vencimiento: g.fecha_vencimiento ? new Date(g.fecha_vencimiento).toLocaleDateString() : '-',
      duracion_meses: g.duracion_meses ?? '-',
      condiciones: g.condiciones || '-',
      estado: isExpired ? 'Vencida' : 'Vigente',
      isExpired,
      duracion_actual: g.duracion_meses ?? 12,
    };
  });

export const sectionOptions = [
  { id: 'todos', label: 'Todos los apartados', hint: 'Vista completa del modulo de garantias' },
  { id: 'revalidacion', label: 'Revalidacion por equipo', hint: 'Revalida o asigna garantias a equipos' },
  { id: 'manual', label: 'Registro manual', hint: 'Genera una poliza desde una factura' },
  { id: 'global', label: 'Listado global', hint: 'Revisa todas las garantias registradas' },
];

export const normalizeSearchText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const getFacturaEquipoId = (factura) => factura?.orden?.diagnostico?.equipo?.id_equipo;

export const getEquipoLabel = (equipo) =>
  [equipo.marca, equipo.modelo, equipo.tipo].filter(Boolean).join(' ') || `Equipo #${equipo.id_equipo}`;
