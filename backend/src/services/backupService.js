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

export const createBackupNow = async () => {
  const result = await runBackup();
  return { root: BACKUP_DISPLAY_ROOT, months: await listBackupFiles(), latestBackup: result };
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
