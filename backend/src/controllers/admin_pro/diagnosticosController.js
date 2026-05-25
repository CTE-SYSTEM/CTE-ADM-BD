import prisma from '../../app/prismaClient.js';
import { Prisma } from '@prisma/client';
import { DIAGNOSTICO_ESTADOS } from '../../utils/domainValidation.js';

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

    const [row] = await prisma.$queryRaw(Prisma.sql`
      SELECT admin_pro.actualizar_estado_diagnostico(${Number(id)}, ${estado_del_diagnostico}) AS data
    `);
    const diagnostico = row?.data;

    if (diagnostico?.error) return res.status(404).json({ error: diagnostico.error });

    res.json({ data: diagnostico });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Diagnóstico no encontrado' });
    }
    res.status(500).json({ error: 'Error al actualizar estado del diagnóstico', details: error.message });
  }
};
