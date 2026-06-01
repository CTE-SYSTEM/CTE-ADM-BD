const parseList = (value, fallback = []) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/^\\?["']|\\?["']$/g, ''))
    .filter(Boolean)
    .concat(fallback)
    .filter((item, index, list) => list.indexOf(item) === index);

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && (!jwtSecret || jwtSecret === 'tu_secreto_super_seguro')) {
  throw new Error('JWT_SECRET debe configurarse con un valor seguro en produccion.');
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  jwtSecret: jwtSecret || 'tu_secreto_super_seguro',
  allowedOrigins: parseList(
    process.env.CORS_ORIGIN || process.env.FRONTEND_URL,
    isProduction ? [] : ['http://localhost:5173']
  ),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '1mb',
};
