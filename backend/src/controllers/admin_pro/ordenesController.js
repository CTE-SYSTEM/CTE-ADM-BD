import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';

// 3. Monitoreo de órdenes y facturas
export const getOrdenesAvanzado = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const where = {};
    if (fecha_inicio || fecha_fin) {
      where.fecha_ingreso = {};
      if (fecha_inicio) where.fecha_ingreso.gte = new Date(`${fecha_inicio}T00:00:00`);
      if (fecha_fin) where.fecha_ingreso.lte = new Date(`${fecha_fin}T23:59:59`);
    }

    const ordenes = await prisma.ordenes.findMany({
      where,
      include: {
        diagnostico: {
          include: {
            equipo: { include: { cliente: true } }
          }
        },
        tecnico: true,
        repuestos_usados: true,
        facturas: true
      }
    });
    res.json({ data: ordenes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes avanzadas', details: error.message });
  }
};
export const updateOrdenAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, tecnico_id, resultado_final, observacion_final } = req.body;

    const data = {};
    if (estado !== undefined) data.estado = String(estado);
    if (tecnico_id !== undefined) data.tecnico_id = tecnico_id ? Number(tecnico_id) : null;
    if (resultado_final !== undefined) data.resultado_final = resultado_final;
    if (observacion_final !== undefined) data.observacion_final = observacion_final;
    if (String(estado).toUpperCase() === 'FINALIZADO') {
      data.fecha_cierre = new Date();
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT admin_pro.actualizar_orden(
        ${Number(id)},
        ${data.estado ?? null},
        ${Object.prototype.hasOwnProperty.call(data, 'tecnico_id') ? data.tecnico_id : null},
        ${Object.prototype.hasOwnProperty.call(data, 'tecnico_id')},
        ${data.resultado_final ?? null},
        ${data.observacion_final ?? null}
      ) AS data
    `);
    const orden = row?.data;

    if (orden?.error) return res.status(404).json({ error: orden.error });

    res.json({ data: orden });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.status(500).json({ error: 'Error al actualizar la orden', details: error.message });
  }
};
export const getRepuestosPorOrdenAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const repuestos = await prisma.ordenes_Repuestos.findMany({
      where: { orden_id: Number(id) },
      include: {
        repuesto: { include: { categoria: true } },
        orden: {
          include: {
            diagnostico: {
              include: {
                equipo: { include: { cliente: true } },
              },
            },
          },
        },
      },
      orderBy: { id_detalle_repuesto: 'asc' },
    });

    if (!repuestos.length) {
      return res.status(404).json({ error: 'No se encontraron repuestos para esta orden' });
    }

    const data = repuestos.map((item) => ({
      id_detalle_repuesto: item.id_detalle_repuesto,
      orden_id: item.orden_id,
      repuesto_id: item.repuesto_id,
      nombre: item.repuesto?.nombre || '-',
      categoria: item.repuesto?.categoria?.nombre_tipo || '-',
      pieza_solicitada: item.pieza_solicitada || '-',
      cantidad_usada: item.cantidad_usada ?? 0,
      estado_aprobacion: item.estado_aprobacion || '-',
      costo_unitario: item.repuesto?.costo_individual ?? 0,
      cliente: item.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
      equipo: item.orden?.diagnostico?.equipo?.modelo || '-',
    }));

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener repuestos de la orden', details: error.message });
  }
};

const escapeCsv = (value) => {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export const downloadRepuestosPorOrdenAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const repuestos = await prisma.ordenes_Repuestos.findMany({
      where: { orden_id: Number(id) },
      include: {
        repuesto: { include: { categoria: true } },
        orden: {
          include: {
            diagnostico: {
              include: {
                equipo: { include: { cliente: true } },
              },
            },
          },
        },
      },
      orderBy: { id_detalle_repuesto: 'asc' },
    });

    if (!repuestos.length) {
      return res.status(404).json({ error: 'No se encontraron repuestos para esta orden' });
    }

    const headers = [
      'Orden ID',
      'Cliente',
      'Equipo',
      'Detalle ID',
      'Repuesto',
      'Categoría',
      'Pieza solicitada',
      'Cantidad usada',
      'Estado aprobación',
      'Costo unitario',
    ];
    const rows = repuestos.map((item) => [
      item.orden_id,
      item.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
      item.orden?.diagnostico?.equipo?.modelo || '-',
      item.id_detalle_repuesto,
      item.repuesto?.nombre || '-',
      item.repuesto?.categoria?.nombre_tipo || '-',
      item.pieza_solicitada || '-',
      item.cantidad_usada ?? 0,
      item.estado_aprobacion || '-',
      item.repuesto?.costo_individual ?? 0,
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    const filename = `repuestos-orden-${id}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Error al generar reporte de repuestos', details: error.message });
  }
};
