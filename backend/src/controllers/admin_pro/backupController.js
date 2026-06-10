import { createBackupNow, getBackupSummary } from '../../services/backupService.js';

export const getBackups = async (req, res) => {
  try {
    const data = await getBackupSummary();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista de backups', details: error.message });
  }
};

export const triggerBackupNow = async (req, res) => {
  try {
    const data = await createBackupNow();
    res.json({ data, message: 'Backup manual generado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar el backup manual', details: error.message });
  }
};
