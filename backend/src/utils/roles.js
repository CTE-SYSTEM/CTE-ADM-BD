export const normalizeRole = (role) =>
  String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]/g, '')
    .toLowerCase();
