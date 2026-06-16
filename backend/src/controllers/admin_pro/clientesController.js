import prisma from '../../app/prismaClient.js';

const normalizeNullableText = (value) => {
  if (value === undefined) return undefined;
  const text = String(value || '').trim();
  return text || null;
};

export const updateClienteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, direccion, correo, contacto_secundario, activo } = req.body;
    const data = {};

    if (nombre !== undefined) {
      const nombreLimpio = String(nombre || '').trim();
      if (!nombreLimpio) return res.status(400).json({ error: 'El nombre es obligatorio' });
      data.nombre = nombreLimpio;
    }

    if (telefono !== undefined) {
      const telefonoLimpio = String(telefono || '').trim();
      if (!telefonoLimpio) return res.status(400).json({ error: 'El telefono es obligatorio' });
      data.telefono = telefonoLimpio;
    }

    if (direccion !== undefined) data.direccion = normalizeNullableText(direccion);
    if (correo !== undefined) data.correo = normalizeNullableText(correo);
    if (contacto_secundario !== undefined) data.contacto_secundario = normalizeNullableText(contacto_secundario);
    if (activo !== undefined) data.activo = Boolean(activo);

    if (!Object.keys(data).length) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    const cliente = await prisma.clientes.update({
      where: { id_cliente: Number(id) },
      data,
    });

    res.json({ data: cliente });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Cliente no encontrado' });
    if (error.code === 'P2002') return res.status(409).json({ error: 'El telefono ya esta registrado en otro cliente' });
    res.status(500).json({ error: 'Error al actualizar cliente', details: error.message });
  }
};
