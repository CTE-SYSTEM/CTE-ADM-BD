import { createBackupNow, getBackupSummaryWithRoot, getBackupFilePath, saveUploadedBackup } from '../../services/backupService.js';

export const getBackups = async (req, res) => {
  try {
    const data = await getBackupSummaryWithRoot();
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

export const downloadBackup = async (req, res) => {
  const { file } = req.params;
  try {
    const p = await getBackupFilePath(file);
    res.download(p);
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
};

export const uploadBackup = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const allowed = ['.tar', '.gz', '.tgz', '.tar.gz', '.enc', '.sql', '.json'];
    const name = req.file.originalname || 'upload_backup';
    const ext = (name.includes('.') ? name.slice(name.lastIndexOf('.')) : '').toLowerCase();
    if (!allowed.some((a) => name.toLowerCase().endsWith(a))) {
      return res.status(400).json({ error: 'Archivo no permitido. Use .tar.gz, .enc, .sql o .json' });
    }
    const saved = await saveUploadedBackup(req.file.buffer, name);
    const summary = await getBackupSummaryWithRoot();
    res.json({ message: 'Backup subido correctamente', file: saved.name, data: summary });
  } catch (error) {
    res.status(500).json({ error: 'Error al subir el archivo', details: error.message });
  }
};
