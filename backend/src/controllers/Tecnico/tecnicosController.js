import prisma from '../../app/prismaClient.js';
import { ORDEN_ESTADOS, RESULTADOS_ORDEN, assertInList } from '../../utils/domainValidation.js';
import { notifyJefeTecnico } from '../../services/notifications.js';

const ordenInclude = {
  tecnico: true,
  diagnostico: {
    include: {
      equipo: { include: { cliente: true } },
      tecnico: true,
    },
  },
  repuestos_usados: {
    include: { repuesto: true },
    orderBy: { id_detalle_repuesto: 'desc' },
  },
};

const getRowsData = (rows) => rows.map((row) => row.data);

const getDatabaseMessage = (error) => {
  const message = error?.meta?.message || error?.message || '';
  const match = message.match(/ERROR:\s*(.*)$/m);
  return match?.[1] || message;
};

export const getTecnicos = async (req, res) => {
  try {
    const tecnicos = await prisma.tecnicos.findMany();
    res.json({ data: tecnicos });
  } catch (error) {
    console.error('Error al obtener tecnicos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createTecnico = async (req, res) => {
  try {
    const tecnico = await prisma.tecnicos.create({
      data: req.body
    });
    res.status(201).json({ data: tecnico });
  } catch (error) {
    console.error('Error al crear tecnico:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getMisDiagnosticos = async (req, res) => {
  try {
    const { username } = req.params;

    const [tecnico, rows] = await Promise.all([
      prisma.tecnicos.findFirst({
        where: {
          usuario: { nombre_usuario: username },
          activo: true,
        },
      }),
      prisma.$queryRaw`SELECT data FROM get_mis_diagnosticos_tecnico(${username})`,
    ]);

    if (!tecnico) {
      return res.json({ data: [], tecnico: null });
    }

    res.json({ data: getRowsData(rows), tecnico });
  } catch (error) {
    console.error('Error al obtener diagnósticos del técnico:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const getMisOrdenes = async (req, res) => {
  try {
    const { username } = req.params;

    const tecnico = await prisma.tecnicos.findFirst({
      where: {
        usuario: { nombre_usuario: username },
        activo: true,
      },
    });

    if (!tecnico) {
      return res.json({ data: [], tecnico: null });
    }

    const ordenes = await prisma.ordenes.findMany({
      where: {
        tecnico_id: tecnico.id_tecnico,
      },
      include: ordenInclude,
      orderBy: [
        { fecha_ingreso: 'desc' },
        { id_orden: 'desc' },
      ],
    });

    const ordenesFinalizadas = ordenes.filter((orden) => (orden.estado || '').toUpperCase() === 'FINALIZADO');
    const rankFinalizadas = new Map(ordenesFinalizadas.map((orden, index) => [orden.id_orden, index + 1]));
    const ayer = Date.now() - 24 * 60 * 60 * 1000;

    const data = ordenes.map((orden) => {
      const estado = (orden.estado || '').toUpperCase();
      const fechaIngreso = orden.fecha_ingreso ? new Date(orden.fecha_ingreso).getTime() : 0;
      return {
        ...orden,
        puede_editar_completada:
          !['FINALIZADO', 'IRREPARABLE', 'ENTREGADO'].includes(estado)
          || ((rankFinalizadas.get(orden.id_orden) || 999) <= 5 && fechaIngreso >= ayer),
      };
    });

    res.json({ data, tecnico });
  } catch (error) {
    console.error('Error al obtener ordenes del tecnico:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const actualizarDiagnosticoAsignado = async (req, res) => {
  try {
    const { diagnostico_real, presupuesto_estimado, estado_del_diagnostico } = req.body;

    if (!String(diagnostico_real || '').trim()) {
      return res.status(400).json({ error: 'El informe tecnico es obligatorio' });
    }

    const rows = await prisma.$queryRaw`
      SELECT data FROM completar_diagnostico_tecnico_proc(
        ${Number(req.params.id)},
        ${String(diagnostico_real).trim()},
        ${presupuesto_estimado ? Number(presupuesto_estimado) : null}
      )
    `;
    const diagnostico = rows[0]?.data;

    notifyJefeTecnico({
      type: 'diagnostico_completado',
      title: 'Diagnostico completado',
      message: `Diagnostico #${req.params.id} quedo listo para revision/aprobacion`,
      severity: 'success',
      entity: { kind: 'diagnostico', id: Number(req.params.id) },
    });

    res.json({ data: diagnostico });
  } catch (error) {
    console.error('Error al actualizar diagnostico asignado:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnostico no encontrado' });
    }
    if (error.code === 'P2010') {
      return res.status(409).json({ error: getDatabaseMessage(error) });
    }
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const actualizarEstadoOrden = async (req, res) => {
  try {
    const { estado, resultado_final, enciende_salida, usa_corriente_ac_salida, observacion_final } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'El estado es obligatorio' });
    }

    const estadoNuevo = assertInList(String(estado).toUpperCase(), ORDEN_ESTADOS, 'Estado de la orden');
    const estadoCierre = ['FINALIZADO', 'IRREPARABLE'].includes(estadoNuevo);

    const ordenActual = await prisma.ordenes.findUnique({
      where: { id_orden: Number(req.params.id) },
      include: { repuestos_usados: true },
    });

    if (!ordenActual) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (['FINALIZADO', 'ENTREGADO', 'IRREPARABLE'].includes((ordenActual.estado || '').toUpperCase())) {
      return res.status(409).json({ error: 'Esta orden ya esta cerrada' });
    }

    if (estadoNuevo === 'FINALIZADO') {
      const pendientes = ordenActual.repuestos_usados.some((item) => item.estado_aprobacion === 'PENDIENTE');
      if (pendientes) {
        return res.status(409).json({ error: 'No se puede finalizar: hay piezas pendientes de aprobacion' });
      }
    }

    const data = { estado: estadoNuevo };

    if (estadoCierre) {
      const resultado = assertInList(resultado_final || (estadoNuevo === 'IRREPARABLE' ? 'IRREPARABLE' : 'REPARADO'), RESULTADOS_ORDEN, 'Resultado final');
      const observacion = String(observacion_final || '').trim();

      if (!observacion) {
        return res.status(400).json({ error: 'La observacion final es obligatoria para cerrar la orden' });
      }

      data.resultado_final = resultado;
      data.enciende_salida = enciende_salida === true || enciende_salida === 'true';
      data.usa_corriente_ac_salida = usa_corriente_ac_salida === true || usa_corriente_ac_salida === 'true';
      data.observacion_final = observacion;
      data.fecha_cierre = new Date();
    }

    const orden = await prisma.ordenes.update({
      where: { id_orden: Number(req.params.id) },
      data,
      include: ordenInclude,
    });

    notifyJefeTecnico({
      type: estadoCierre ? 'orden_cerrada' : 'orden_estado',
      title: estadoCierre ? 'Orden cerrada' : 'Cambio de estado',
      message: `Orden #${orden.id_orden} cambio a ${orden.estado}`,
      severity: estadoNuevo === 'IRREPARABLE' ? 'warning' : 'info',
      entity: { kind: 'orden', id: orden.id_orden },
    });

    res.json({ data: orden });
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    if (error.message?.includes('no es valido')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const solicitarRepuesto = async (req, res) => {
  try {
    const { repuesto_id, repuesto, cantidad } = req.body;
    const cantidadUsada = Math.max(Number(cantidad) || 1, 1);
    const nombreSolicitado = String(repuesto || '').trim();

    const orden = await prisma.ordenes.findUnique({ where: { id_orden: Number(req.params.id) } });

    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (!nombreSolicitado && !Number(repuesto_id)) {
      return res.status(400).json({ error: 'Indique que pieza necesita solicitar' });
    }

    const piezaSolicitada = nombreSolicitado || String(repuesto_id);
    const rows = await prisma.$queryRaw`
      SELECT data FROM solicitar_pieza_orden_tecnico_proc(${Number(req.params.id)}, ${piezaSolicitada}, ${cantidadUsada})
    `;
    const solicitud = rows[0]?.data;

    notifyJefeTecnico({
      type: 'repuesto_solicitado',
      title: 'Solicitud de repuesto',
      message: `Nueva solicitud de pieza para orden #${req.params.id}`,
      severity: 'warning',
      entity: { kind: 'orden', id: Number(req.params.id) },
    });

    res.status(201).json({ data: solicitud, message: 'Solicitud de pieza enviada al jefe tecnico' });
  } catch (error) {
    console.error('Error al solicitar repuesto:', error);
    if (error.code === 'P2010') {
      return res.status(409).json({ error: getDatabaseMessage(error) });
    }
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};
