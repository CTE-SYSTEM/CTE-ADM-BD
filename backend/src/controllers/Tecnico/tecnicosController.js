import prisma from '../../app/prismaClient.js';

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

    const [tecnico, rows] = await Promise.all([
      prisma.tecnicos.findFirst({
        where: {
          usuario: { nombre_usuario: username },
          activo: true,
        },
      }),
      prisma.$queryRaw`SELECT data FROM get_mis_ordenes_tecnico(${username})`,
    ]);

    if (!tecnico) {
      return res.json({ data: [], tecnico: null });
    }

    res.json({ data: getRowsData(rows), tecnico });
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
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: 'El estado es obligatorio' });
    }

    const rows = await prisma.$queryRaw`
      SELECT data FROM actualizar_estado_orden_tecnico_proc(${Number(req.params.id)}, ${estado})
    `;
    const orden = rows[0]?.data;

    res.json({ data: orden });
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    if (error.code === 'P2010') {
      return res.status(409).json({ error: getDatabaseMessage(error) });
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

    res.status(201).json({ data: solicitud, message: 'Solicitud de pieza enviada al jefe tecnico' });
  } catch (error) {
    console.error('Error al solicitar repuesto:', error);
    if (error.code === 'P2010') {
      return res.status(409).json({ error: getDatabaseMessage(error) });
    }
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};
