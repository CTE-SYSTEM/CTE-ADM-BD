import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import prisma from '../app/prismaClient.js';

const execFileAsync = promisify(execFile);

const CONTAINER_BACKUP_ROOT = path.join(path.sep, 'backup', 'CTE-Backup');
const BACKUP_ROOT = process.env.BACKUP_ROOT || CONTAINER_BACKUP_ROOT;
const BACKUP_DISPLAY_ROOT = process.env.BACKUP_DISPLAY_ROOT || BACKUP_ROOT;
const PRODUCT_BACKUP_NAME = 'productos';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hour}-${minute}`;
};

const getBackupMonthFolder = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return path.join(BACKUP_ROOT, `${year}-${month}`);
};

const createDirectory = async (folderPath) => {
  await fs.mkdir(folderPath, { recursive: true });
  return folderPath;
};

const runPgDump = async (outputFile) => {
  const pgDumpCommand = process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump';
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definido');
  }

  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const dbName = dbUrl.pathname?.replace(/^\//, '') || '';
    const args = [
      '--host', dbUrl.hostname || 'localhost',
      '--port', dbUrl.port || '5432',
      '--username', dbUrl.username || 'postgres',
      '--dbname', dbName,
      '--file', outputFile,
    ];

    const env = { ...process.env };
    if (dbUrl.password) {
      env.PGPASSWORD = dbUrl.password;
    }
    if (dbUrl.searchParams.get('sslmode')) {
      args.push('--sslmode', dbUrl.searchParams.get('sslmode'));
    }
    if (dbUrl.searchParams.get('schema')) {
      args.push('--schema', dbUrl.searchParams.get('schema'));
    }

    await execFileAsync(pgDumpCommand, args, { env });
    return outputFile;
  } catch (error) {
    throw new Error(`pg_dump no está disponible o falló: ${error.message}`);
  }
};

const queryAllTablesJson = async (backupFolder, timestamp) => {
  const tablesResult = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  const allTables = {};

  for (const row of tablesResult) {
    const tableName = row.table_name || row.tablename || Object.values(row)[0];
    try {
      const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "${tableName}"`);
      allTables[tableName] = rows;
    } catch (error) {
      allTables[tableName] = { error: error.message };
    }
  }

  const replacer = (_, value) => (typeof value === 'bigint' ? value.toString() : value);
  const filePath = path.join(backupFolder, `sistema_${timestamp}.json`);
  await fs.writeFile(filePath, JSON.stringify(allTables, replacer, 2), 'utf8');
  return filePath;
};

const generateProductsExcel = async (backupFolder, products, timestamp) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Productos');

  sheet.columns = [
    { header: 'ID', key: 'id_repuesto', width: 10 },
    { header: 'Nombre', key: 'nombre', width: 35 },
    { header: 'Descripción', key: 'descripcion', width: 50 },
    { header: 'Categoria', key: 'categoria', width: 25 },
    { header: 'Proveedor', key: 'proveedor', width: 30 },
    { header: 'Costo', key: 'costo_individual', width: 15 },
    { header: 'Stock', key: 'stock', width: 10 },
    { header: 'Activo', key: 'activo', width: 10 },
    { header: 'Descontinuado', key: 'descontinuada', width: 15 },
  ];

  products.forEach((product) => {
    sheet.addRow({
      id_repuesto: product.id_repuesto,
      nombre: product.nombre || '',
      descripcion: product.descripcion || '',
      categoria: product.categoria?.nombre_tipo || '',
      proveedor: product.proveedor?.nombre || '',
      costo_individual: product.costo_individual ? String(product.costo_individual) : '0',
      stock: product.stock_actual ?? 0,
      activo: product.activo ? 'SI' : 'NO',
      descontinuada: product.descontinuada ? 'SI' : 'NO',
    });
  });

  const filePath = path.join(backupFolder, `${PRODUCT_BACKUP_NAME}_${timestamp}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

const generateProductsPdf = async (backupFolder, products, timestamp) => {
  const filePath = path.join(backupFolder, `${PRODUCT_BACKUP_NAME}_${timestamp}.pdf`);
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const writeStream = createWriteStream(filePath);
  doc.pipe(writeStream);

  doc.fontSize(18).text('Backup de Productos - Repuestos', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('gray').text(`Fecha de backup: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1);

  const columns = ['ID', 'Nombre', 'Categoria', 'Proveedor', 'Costo', 'Stock', 'Activo', 'Descontinuado'];
  const columnWidths = [40, 150, 100, 100, 60, 40, 40, 60];

  doc.font('Helvetica-Bold').fontSize(9);
  columns.forEach((column, index) => {
    doc.text(column, { continued: index !== columns.length - 1, width: columnWidths[index], underline: false });
  });
  doc.moveDown(0.3);
  doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#cccccc').stroke();
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(8);

  for (const product of products) {
    const row = [
      String(product.id_repuesto),
      product.nombre || '-',
      product.categoria?.nombre_tipo || '-',
      product.proveedor?.nombre || '-',
      product.costo_individual ? String(product.costo_individual) : '0',
      String(product.stock_actual ?? 0),
      product.activo ? 'SI' : 'NO',
      product.descontinuada ? 'SI' : 'NO',
    ];

    row.forEach((value, index) => {
      doc.text(value, { continued: index !== row.length - 1, width: columnWidths[index] });
    });
    doc.moveDown(0.4);

    if (doc.y > doc.page.height - 80) {
      doc.addPage();
      doc.font('Helvetica').fontSize(8);
    }
  }

  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    doc.on('error', reject);
  });

  return filePath;
};

const queryProducts = async () => {
  return prisma.repuestos.findMany({
    include: {
      categoria: true,
      proveedor: true,
    },
    orderBy: { id_repuesto: 'asc' },
  });
};

const createReportFile = async (backupFolder, fileName, lines) => {
  const filePath = path.join(backupFolder, fileName);
  await fs.writeFile(filePath, lines.join('\n'), 'utf8');
  return filePath;
};

const runBackup = async () => {
  const timestamp = formatDate(new Date());
  const backupFolder = await createDirectory(getBackupMonthFolder());
  const reportLines = [`Backup generado: ${new Date().toLocaleString()}`, `Directorio: ${backupFolder}`, 'Archivos creados:'];

  try {
    const dbDumpFile = path.join(backupFolder, `db_dump_${timestamp}.sql`);
    try {
      await runPgDump(dbDumpFile);
      reportLines.push(`- Dump SQL de base de datos: ${dbDumpFile}`);
    } catch (pgError) {
      reportLines.push(`- pg_dump no estuvo disponible: ${pgError.message}`);
      const snapshotFile = await queryAllTablesJson(backupFolder, timestamp);
      reportLines.push(`- Snapshot JSON de la base de datos: ${snapshotFile}`);
    }

    const products = await queryProducts();
    const excelFile = await generateProductsExcel(backupFolder, products, timestamp);
    reportLines.push(`- Excel de productos: ${excelFile}`);
    const pdfFile = await generateProductsPdf(backupFolder, products, timestamp);
    reportLines.push(`- PDF de productos: ${pdfFile}`);

    const reportFile = await createReportFile(backupFolder, `backup_report_${timestamp}.txt`, reportLines);
    reportLines.push(`- Informe de backup: ${reportFile}`);

    // Crear un tar.gz con todo el contenido del folder de backup
    const archiveName = `cte_backup_${timestamp}.tar.gz`;
    const archivePath = path.join(BACKUP_ROOT, archiveName);
    try {
      // `tar` está disponible en la mayoría de imágenes base (alpine/busybox)
      await execFileAsync('tar', ['-czf', archivePath, '-C', backupFolder, '.']);
      reportLines.push(`- Archivo comprimido: ${archivePath}`);
    } catch (tarErr) {
      reportLines.push(`- Falló creación de tar.gz: ${tarErr.message}`);
    }

    // Calcular checksum SHA256 del archivo (si existe)
    const manifest = { timestamp: new Date().toISOString(), files: [], archive: null };
    try {
      const filesInFolder = await fs.readdir(backupFolder);
      for (const f of filesInFolder) {
        const p = path.join(backupFolder, f);
        const stat = await fs.stat(p);
        manifest.files.push({ name: f, size: stat.size });
      }

      if (await fileExists(archivePath)) {
        const hash = await sha256File(archivePath);
        const stat = await fs.stat(archivePath);
        manifest.archive = { name: path.basename(archivePath), size: stat.size, sha256: hash };

        // Encriptar archivo si se proporciona passphrase
        if (process.env.BACKUP_PASSPHRASE) {
          const encPath = `${archivePath}.enc`;
          try {
            await execFileAsync('openssl', ['enc', '-aes-256-cbc', '-pbkdf2', '-salt', '-in', archivePath, '-out', encPath, '-pass', `pass:${process.env.BACKUP_PASSPHRASE}`]);
            const encHash = await sha256File(encPath);
            const encStat = await fs.stat(encPath);
            manifest.archive_encrypted = { name: path.basename(encPath), size: encStat.size, sha256: encHash };
            reportLines.push(`- Archivo encriptado: ${encPath}`);
            // opcional: eliminar el archivo sin encriptar
            await fs.unlink(archivePath);
            manifest.archive = null;
          } catch (encErr) {
            reportLines.push(`- Error en encriptado: ${encErr.message}`);
          }
        }
      }
    } catch (mErr) {
      reportLines.push(`- Error generando manifest: ${mErr.message}`);
    }

    // Guardar manifest
    try {
      const manifestPath = path.join(BACKUP_ROOT, `manifest_${timestamp}.json`);
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      reportLines.push(`- Manifest guardado: ${manifestPath}`);
    } catch (wErr) {
      reportLines.push(`- No se pudo guardar manifest: ${wErr.message}`);
    }

      // Ejecutar limpieza por retención si está configurada
      try {
        const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || '0');
        if (retentionDays > 0) {
          await purgeOldBackups(retentionDays);
          reportLines.push(`- Retención aplicada: archivos más antiguos a ${retentionDays} días eliminados`);
        }
      } catch (retErr) {
        reportLines.push(`- Error aplicando retención: ${retErr.message}`);
      }

    console.log('[BackupService] Backup mensual completado correctamente.');
    reportLines.forEach((line) => console.log(line));

    return { backupFolder, timestamp, reportLines };
  } catch (error) {
    const errorFile = path.join(backupFolder, `backup_error_${timestamp}.txt`);
    await createReportFile(backupFolder, `backup_error_${timestamp}.txt`, [`Error al generar backup: ${error.message}`, error.stack || '']);
    console.error('[BackupService] Error al generar backup mensual:', error);
    throw error;
  }
};

const purgeOldBackups = async (days) => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const removed = [];

  // scan root files
  try {
    await createDirectory(BACKUP_ROOT);
    const entries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(BACKUP_ROOT, e.name);
      if (e.isFile()) {
        const stat = await fs.stat(p);
        if (stat.mtimeMs < cutoff) {
          await fs.unlink(p);
          removed.push(p);
        }
      } else if (e.isDirectory()) {
        // scan month folder
        const monthFiles = await fs.readdir(p, { withFileTypes: true });
        for (const mf of monthFiles) {
          if (mf.isFile()) {
            const mfPath = path.join(p, mf.name);
            const stat = await fs.stat(mfPath);
            if (stat.mtimeMs < cutoff) {
              await fs.unlink(mfPath);
              removed.push(mfPath);
            }
          }
        }
        // try remove empty dir
        const remaining = await fs.readdir(p);
        if (remaining.length === 0) {
          await fs.rmdir(p);
        }
      }
    }
  } catch (err) {
    throw new Error(`Error purgando backups: ${err.message}`);
  }

  return removed;
};

const fileExists = async (p) => {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
};

const sha256File = async (filePath) => {
  const { createHash } = await import('node:crypto');
  const stream = (await import('node:fs')).createReadStream(filePath);
  return await new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
};

const listBackupFiles = async () => {
  await createDirectory(BACKUP_ROOT);
  const monthEntries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true });
  const months = [];

  for (const entry of monthEntries.filter((folder) => folder.isDirectory())) {
    const monthPath = path.join(BACKUP_ROOT, entry.name);
    const fileEntries = await fs.readdir(monthPath, { withFileTypes: true });
    const files = fileEntries
      .filter((file) => file.isFile())
      .map((file) => file.name)
      .sort((a, b) => b.localeCompare(a));
    months.push({ month: entry.name, files, fileCount: files.length });
  }

  months.sort((a, b) => b.month.localeCompare(a.month));
  return months;
};

export const getBackupSummary = async () => ({ root: BACKUP_DISPLAY_ROOT, months: await listBackupFiles() });

const listRootFiles = async () => {
  await createDirectory(BACKUP_ROOT);
  const entries = await fs.readdir(BACKUP_ROOT, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.isFile()) {
      const p = path.join(BACKUP_ROOT, e.name);
      const stat = await fs.stat(p);
      files.push({ name: e.name, size: stat.size, mtime: stat.mtime.toISOString() });
    }
  }
  files.sort((a, b) => b.mtime.localeCompare(a.mtime));
  return files;
};

export const getBackupFilePath = async (fileName) => {
  // prevent path traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    throw new Error('Invalid file name');
  }
  const p = path.join(BACKUP_ROOT, fileName);
  try {
    await fs.access(p);
    return p;
  } catch {
    throw new Error('File not found');
  }
};

export const getBackupSummaryWithRoot = async () => ({ root: BACKUP_DISPLAY_ROOT, months: await listBackupFiles(), rootFiles: await listRootFiles() });

export const createBackupNow = async () => {
  const result = await runBackup();
  return { root: BACKUP_DISPLAY_ROOT, months: await listBackupFiles(), latestBackup: result };
};

export const saveUploadedBackup = async (buffer, originalName) => {
  // sanitize name
  if (originalName.includes('..') || originalName.includes('/') || originalName.includes('\\')) {
    throw new Error('Invalid file name');
  }
  await createDirectory(BACKUP_ROOT);
  const destPath = path.join(BACKUP_ROOT, originalName);
  // avoid overwrite: if exists, append timestamp
  let finalPath = destPath;
  if (await fileExists(destPath)) {
    const ts = formatDate(new Date());
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    finalPath = path.join(BACKUP_ROOT, `${base}_${ts}${ext}`);
  }
  await fs.writeFile(finalPath, buffer);
  return { path: finalPath, name: path.basename(finalPath) };
};

const scheduleNextBackup = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 2, 0, 0, 0);
  const delayMs = nextMonth.getTime() - now.getTime();

  setTimeout(async () => {
    try {
      await runBackup();
    } catch (error) {
      console.error('[BackupService] Error en backup programado:', error);
    } finally {
      scheduleNextBackup();
    }
  }, delayMs);
};

const ensureCurrentMonthBackup = async () => {
  const now = new Date();
  const monthFolder = getBackupMonthFolder(now);
  try {
    await fs.access(monthFolder);
  } catch {
    if (now.getDate() === 1) {
      await runBackup();
    }
  }
};

export const initializeBackupService = async () => {
  try {
    await createDirectory(BACKUP_ROOT);
    await ensureCurrentMonthBackup();
    scheduleNextBackup();
    console.log(`[BackupService] Programado backup mensual en: ${BACKUP_ROOT}`);
  } catch (error) {
    console.error('[BackupService] No se pudo inicializar el servicio de backup:', error);
  }
};
