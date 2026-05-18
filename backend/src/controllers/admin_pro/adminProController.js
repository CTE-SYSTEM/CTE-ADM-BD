import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../../app/prismaClient.js';
import { DIAGNOSTICO_ESTADOS } from '../../utils/domainValidation.js';

// Historial de uso de un repuesto
export const getHistorialRepuesto = async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar todas las órdenes donde se usó este repuesto
    const usos = await prisma.ordenes_Repuestos.findMany({
      where: { repuesto_id: Number(id) },
      include: {
        orden: {
          include: {
            diagnostico: {
              include: { equipo: true }
            }
          }
        }
      },
      orderBy: { fecha_instalacion: 'desc' }
    });
    res.json({ data: usos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de repuesto', details: error.message });
  }
};
// Historial de movimientos de un equipo
export const getHistorialEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    // Buscar todos los diagnósticos y órdenes asociadas al equipo
    const diagnosticos = await prisma.diagnosticos.findMany({
      where: { equipo_id: Number(id) },
      include: {
        ordenes: true,
        tecnico: true
      },
      orderBy: { fecha_hora: 'desc' }
    });
    res.json({ data: diagnosticos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial de equipo', details: error.message });
  }
};

// Middleware para restringir acceso solo a admin_pro / Administrador
export const onlyAdminPro = (req, res, next) => {
  const allowedRoles = ['admin_pro', 'Administrador', 'Admin'];
  if (!req.user || !allowedRoles.includes(req.user.rol)) {
    return res.status(403).json({ error: 'Acceso restringido a admin_pro' });
  }
  next();
};

// 1. Monitoreo de equipos con historial y estado
export const getEquiposAvanzado = async (req, res) => {
  try {
    const search = req.query.search?.trim();
    const where = {};

    if (search) {
      const isNumeric = /^\d+$/.test(search);
      where.OR = [
        ...(isNumeric ? [{ id_equipo: Number(search) }] : []),
        { tipo: { contains: search, mode: 'insensitive' } },
        { marca: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
        { numero_serie: { contains: search, mode: 'insensitive' } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        {
          diagnosticos: {
            some: {
              estado_del_diagnostico: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    const equipos = await prisma.equipos.findMany({
      where,
      include: {
        cliente: true,
        diagnosticos: {
          include: {
            ordenes: true
          }
        }
      }
    });
    res.json({ data: equipos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener equipos avanzados', details: error.message });
  }
};

// 2. Monitoreo de repuestos con historial y proveedor
export const getRepuestosAvanzado = async (req, res) => {
  try {
    const repuestos = await prisma.repuestos.findMany({
      include: {
        categorias_Repuestos: true,
        proveedor: true,
        ordenes_repuestos: true
      }
    });
    res.json({ data: repuestos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener repuestos avanzados', details: error.message });
  }
};

// 3. Monitoreo de órdenes y facturas
export const getOrdenesAvanzado = async (req, res) => {
  try {
    const ordenes = await prisma.ordenes.findMany({
      include: {
        diagnostico: {
          include: {
            equipo: true
          }
        },
        repuestos_usados: true,
        facturas: true
      }
    });
    res.json({ data: ordenes });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes avanzadas', details: error.message });
  }
};

// 4. Monitoreo de facturas
export const getFacturasAvanzado = async (req, res) => {
  try {
    const facturas = await prisma.facturas.findMany({
      include: {
        orden: {
          include: {
            diagnostico: {
              include: {
                equipo: true
              }
            }
          }
        }
      }
    });
    res.json({ data: facturas });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener facturas avanzadas', details: error.message });
  }
};

export const getGarantiasAdmin = async (req, res) => {
  try {
    const garantias = await prisma.garantias.findMany({
      include: {
        factura: {
          include: {
            orden: {
              include: {
                diagnostico: {
                  include: {
                    equipo: {
                      include: { cliente: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { fecha_vencimiento: 'asc' }
    });

    res.json({ data: garantias });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener garantías', details: error.message });
  }
};

export const createGarantiaAdmin = async (req, res) => {
  try {
    const { factura_id, condiciones, duracion_meses } = req.body;
    if (!factura_id || !duracion_meses) {
      return res.status(400).json({ error: 'factura_id y duracion_meses son obligatorios' });
    }

    const fecha_inicio = new Date();
    const fecha_vencimiento = new Date();
    fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + parseInt(duracion_meses, 10));

    const nuevaGarantia = await prisma.garantias.create({
      data: {
        factura_id: parseInt(factura_id, 10),
        condiciones,
        duracion_meses: parseInt(duracion_meses, 10),
        fecha_inicio,
        fecha_vencimiento
      },
      include: {
        factura: true
      }
    });

    res.status(201).json({ message: 'Garantía registrada exitosamente', data: nuevaGarantia });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'La factura especificada no existe' });
    }
    res.status(500).json({ error: 'Error al crear garantía', details: error.message });
  }
};

export const updateGarantiaAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { condiciones, duracion_meses } = req.body;

    const garantiaActual = await prisma.garantias.findUnique({
      where: { id_garantia: Number(id) }
    });

    if (!garantiaActual) {
      return res.status(404).json({ error: 'Garantía no encontrada' });
    }

    const updatedData = { condiciones };
    if (duracion_meses !== undefined && duracion_meses !== null) {
      updatedData.duracion_meses = parseInt(duracion_meses, 10);
      const fecha_inicio = garantiaActual.fecha_inicio || new Date();
      const fecha_vencimiento = new Date(fecha_inicio);
      fecha_vencimiento.setMonth(fecha_vencimiento.getMonth() + parseInt(duracion_meses, 10));
      updatedData.fecha_inicio = fecha_inicio;
      updatedData.fecha_vencimiento = fecha_vencimiento;
    }

    const garantia = await prisma.garantias.update({
      where: { id_garantia: Number(id) },
      data: updatedData
    });

    res.json({ data: garantia });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar garantía', details: error.message });
  }
};

// 5. Gestión de usuarios y roles (solo admin_pro)
export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany();
    res.json({ data: usuarios });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const { nombre_usuario, correo_electronico, rol, password, contrasena_hash, activo, especialidad, horario, contacto } = req.body;
    if (!nombre_usuario || !rol || (!password && !contrasena_hash)) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const hash = password ? await bcrypt.hash(password, 10) : contrasena_hash;

    const result = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuarios.create({
        data: {
          nombre_usuario,
          contrasena_hash: hash,
          correo_electronico,
          rol,
          activo: activo !== undefined ? activo : true,
        },
      });

      if (rol === 'Tecnico') {
        const tecnico = await tx.tecnicos.create({
          data: {
            usuario_id: usuario.id_usuario,
            nombre: nombre_usuario,
            especialidad: especialidad || null,
            horario: horario || null,
            contacto: contacto || correo_electronico || null,
            activo: true,
          },
        });

        return { usuario, tecnico };
      }

      return { usuario };
    });

    res.status(201).json({ data: result.usuario, tecnico: result.tecnico });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('nombre_usuario')) {
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_usuario, correo_electronico, rol, activo } = req.body;
    const usuario = await prisma.usuarios.update({
      where: { id_usuario: Number(id) },
      data: { nombre_usuario, correo_electronico, rol, activo }
    });
    res.json({ data: usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar usuario', details: error.message });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.usuarios.update({
      where: { id_usuario: Number(id) },
      data: { activo: false }
    });
    res.json({ data: usuario });
  } catch (error) {
    res.status(500).json({ error: 'Error al desactivar usuario', details: error.message });
  }
};

// 6. Monitoreo general
export const getMonitoreoGeneral = async (req, res) => {
  try {
    const [equipos, repuestos, ordenes, facturas, usuarios] = await Promise.all([
      prisma.equipos.count(),
      prisma.repuestos.count(),
      prisma.ordenes.count(),
      prisma.facturas.count(),
      prisma.usuarios.count(),
    ]);
    res.json({ data: { equipos, repuestos, ordenes, facturas, usuarios } });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener monitoreo general', details: error.message });
  }
};

export const getDashboardResumen = async (req, res) => {
  try {
    const hoy = new Date();
    const limitePorVencer = new Date(hoy);
    limitePorVencer.setDate(limitePorVencer.getDate() + 30);

    const countsPromise = Promise.all([
      prisma.equipos.count(),
      prisma.repuestos.count(),
      prisma.ordenes.count(),
      prisma.facturas.count(),
      prisma.usuarios.count(),
      prisma.diagnosticos.count({ where: { estado_del_diagnostico: 'PENDIENTE' } }),
      prisma.ordenes.count({ where: { estado: 'REPARACION' } }),
    ]);

    const latestOrdersPromise = prisma.ordenes.findMany({
      take: 5,
      orderBy: { fecha_ingreso: 'desc' },
      include: {
        diagnostico: {
          include: {
            equipo: { include: { cliente: true } },
          },
        },
        tecnico: true,
        facturas: true,
      },
    });

    const upcomingGarantiasPromise = prisma.garantias.findMany({
      where: { fecha_vencimiento: { lte: limitePorVencer } },
      include: {
        factura: {
          include: {
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
        },
      },
      orderBy: { fecha_vencimiento: 'asc' },
      take: 5,
    });

    const [
      [equipos, repuestos, ordenes, facturas, usuarios, diagnosticosPendientes, ordenesEnReparacion],
      latestOrders,
      upcomingGarantias,
    ] = await Promise.all([countsPromise, latestOrdersPromise, upcomingGarantiasPromise]);

    res.json({
      data: {
        totals: {
          equipos,
          repuestos,
          ordenes,
          facturas,
          usuarios,
          diagnosticosPendientes,
          ordenesEnReparacion,
        },
        latestOrders: latestOrders.map((orden) => ({
          id_orden: orden.id_orden,
          estado: orden.estado || 'N/A',
          cliente: orden.diagnostico?.equipo?.cliente?.nombre || '-',
          equipo: orden.diagnostico?.equipo?.modelo || '-',
          prioridad: orden.prioridad || '-',
          tecnico: orden.tecnico?.nombre || 'Sin asignar',
          facturas: orden.facturas?.length || 0,
          fecha_ingreso: orden.fecha_ingreso ? new Date(orden.fecha_ingreso).toLocaleDateString() : '-',
        })),
        upcomingGarantias: upcomingGarantias.map((garantia) => ({
          id_garantia: garantia.id_garantia,
          factura_id: garantia.factura_id,
          orden_id: garantia.factura?.orden?.id_orden || '-',
          cliente: garantia.factura?.orden?.diagnostico?.equipo?.cliente?.nombre || '-',
          equipo: garantia.factura?.orden?.diagnostico?.equipo?.modelo || '-',
          fecha_vencimiento: garantia.fecha_vencimiento ? new Date(garantia.fecha_vencimiento).toLocaleDateString() : '-',
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el resumen del dashboard', details: error.message });
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

    const orden = await prisma.ordenes.update({
      where: { id_orden: Number(id) },
      data,
    });

    res.json({ data: orden });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    res.status(500).json({ error: 'Error al actualizar la orden', details: error.message });
  }
};

export const updateRepuestoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, costo_individual, porcentaje_de_ganacia, activo, descontinuada } = req.body;

    const data = {};
    if (nombre !== undefined) data.nombre = String(nombre);
    if (descripcion !== undefined) data.descripcion = String(descripcion);
    if (costo_individual !== undefined) data.costo_individual = Number(costo_individual);
    if (porcentaje_de_ganacia !== undefined) data.porcentaje_de_ganacia = Number(porcentaje_de_ganacia);
    if (activo !== undefined) data.activo = Boolean(activo);
    if (descontinuada !== undefined) data.descontinuada = Boolean(descontinuada);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const repuesto = await prisma.repuestos.update({
      where: { id_repuesto: Number(id) },
      data,
    });

    res.json({ data: repuesto });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar el repuesto', details: error.message });
  }
};

export const getEquipoUltimoDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const diagnostico = await prisma.diagnosticos.findFirst({
      where: { equipo_id: Number(id) },
      include: {
        tecnico: true,
        ordenes: true,
      },
      orderBy: { fecha_hora: 'desc' },
    });

    if (!diagnostico) {
      return res.status(404).json({ error: 'No se encontró diagnóstico para este equipo' });
    }

    res.json({ data: diagnostico });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el diagnóstico del equipo', details: error.message });
  }
};

export const updateDiagnosticoEstadoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_del_diagnostico } = req.body;

    if (!estado_del_diagnostico || !DIAGNOSTICO_ESTADOS.includes(estado_del_diagnostico)) {
      return res.status(400).json({
        error: 'Estado de diagnóstico inválido',
        estados_validos: DIAGNOSTICO_ESTADOS,
      });
    }

    const diagnostico = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data: { estado_del_diagnostico },
    });

    res.json({ data: diagnostico });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar estado del diagnóstico', details: error.message });
  }
};

export const getRepuestosPorOrdenAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const repuestos = await prisma.ordenes_Repuestos.findMany({
      where: { orden_id: Number(id) },
      include: {
        repuesto: true,
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
        repuesto: true,
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

const normalizeReportRows = (rows) =>
  JSON.parse(JSON.stringify(rows, (_, value) => (typeof value === 'bigint' ? Number(value) : value)));

const adminReportQueries = {
  resumen: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.resumen_general(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  repuestos_usados: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.repuestos_usados_por_periodo(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  repuestos_por_proveedor: ({ proveedorId, fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.repuestos_usados_por_proveedor(CAST(${proveedorId} AS INT), CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  compras: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.compras_por_periodo(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  facturacion: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.facturacion_por_periodo(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  tecnicos: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.rendimiento_tecnicos(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  ordenes_estado: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.ordenes_por_estado(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  diagnosticos_estado: ({ fechaInicio, fechaFin }) =>
    Prisma.sql`SELECT * FROM admin_pro.diagnosticos_por_estado(CAST(${fechaInicio} AS DATE), CAST(${fechaFin} AS DATE))`,

  equipos_cliente: () =>
    Prisma.sql`SELECT * FROM admin_pro.equipos_por_cliente()`,

  garantias_vencer: ({ dias }) =>
    Prisma.sql`SELECT * FROM admin_pro.garantias_por_vencer(CAST(${dias} AS INT))`,

  inventario: () =>
    Prisma.sql`SELECT * FROM admin_pro.inventario_repuestos()`,
};

export const getReporteAdminPro = async (req, res) => {
  try {
    const { tipo } = req.params;
    const buildQuery = adminReportQueries[tipo];

    if (!buildQuery) {
      return res.status(400).json({
        error: 'Reporte no soportado',
        reportes_disponibles: Object.keys(adminReportQueries)
      });
    }

    const params = {
      fechaInicio: req.query.fecha_inicio || null,
      fechaFin: req.query.fecha_fin || null,
      proveedorId: req.query.proveedor_id ? Number(req.query.proveedor_id) : null,
      dias: req.query.dias ? Number(req.query.dias) : 30,
    };

    const data = await prisma.$queryRaw(buildQuery(params));
    res.json({ data: normalizeReportRows(data) });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reporte admin_pro', details: error.message });
  }
};
