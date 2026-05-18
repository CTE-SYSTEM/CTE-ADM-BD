import prisma from '../../app/prismaClient.js';
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
