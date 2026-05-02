// backend/src/controllers/Secretaria/DiagnosticoControllers.js
import prisma from '../../config/database.js';

// 1. Crear un diagnóstico (POST)
export const createDiagnostico = async (req, res) => {
  try {
    const {
      equipo_id,
      falla_reportada,
      deja_cargador,
      enciende,
      usa_corriente_ac,
    } = req.body;

    const nuevoDiagnostico = await prisma.diagnosticos.create({
      data: {
        equipo_id: Number(equipo_id),
        falla_reportada: falla_reportada || 'Sin falla reportada',
        estado_del_diagnostico: 'INGRESADO', // Default obligatorio
        Estado_aprobacion: 'Pendiente',      // Default obligatorio
        deja_cargador: Boolean(deja_cargador),
        enciende: Boolean(enciende),
        usa_corriente_ac: Boolean(usa_corriente_ac),
        fecha_hora: new Date(), // Asegura la marca de tiempo actual
      },
    });

    res.status(201).json({
      success: true,
      message: 'Diagnóstico registrado y equipo ingresado',
      data: nuevoDiagnostico,
    });
  } catch (error) {
    console.error('Error en createDiagnostico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el diagnóstico',
      error: error.message,
    });
  }
};

// 2. Obtener todos los diagnósticos (GET)
export const getDiagnosticos = async (req, res) => {
  try {
    const diagnosticos = await prisma.diagnosticos.findMany({
      include: {
        equipo: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: {
        fecha_hora: 'desc',
      },
    });

    // Mapeo para asegurar que el frontend reciba los nombres que espera
    const resultados = diagnosticos.map((d) => ({
      ...d,
      estado: d.estado_del_diagnostico,
      cliente: d.equipo?.cliente || null,
      informe_tecnico: d.diagnostico_real || 'Pendiente de revisión',
    }));

    res.json({ success: true, data: resultados });
  } catch (error) {
    console.error('Error en getDiagnosticos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la lista',
      error: error.message,
    });
  }
};

// 3. Actualizar estado (PATCH)
export const updateEstadoDiagnostico = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const actualizado = await prisma.diagnosticos.update({
      where: { id_diagnostico: Number(id) },
      data: { estado_del_diagnostico: estado },
    });

    res.json({ success: true, data: actualizado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};