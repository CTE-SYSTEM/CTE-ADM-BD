import test from 'node:test';
import assert from 'node:assert/strict';

const runApiFlowTests = process.env.CTE_RUN_API_FLOW_TESTS === '1';
const baseUrl = process.env.CTE_TEST_API_BASE_URL || 'http://localhost:4000/api';

const requestJson = async (path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  assert.ok(
    response.ok,
    `${method} ${path} fallo con ${response.status}: ${text}`
  );

  return payload;
};

const getToken = async () => {
  if (process.env.CTE_TEST_TOKEN) return process.env.CTE_TEST_TOKEN;

  const username = process.env.CTE_TEST_USERNAME;
  const password = process.env.CTE_TEST_PASSWORD;
  assert.ok(username && password, 'Defina CTE_TEST_TOKEN o CTE_TEST_USERNAME/CTE_TEST_PASSWORD');

  const login = await requestJson('/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  return login.token;
};

const idFrom = (payload, key) => {
  const data = payload?.data || payload;
  return data?.[key] || data?.id || data?.id_cliente || data?.id_equipo || data?.id_diagnostico || data?.id_orden || data?.id_factura;
};

test('flujo completo cliente -> equipo -> diagnostico -> orden -> factura -> garantia', { skip: !runApiFlowTests }, async () => {
  const token = await getToken();
  const suffix = Date.now();

  const cliente = await requestJson('/clientes', {
    method: 'POST',
    token,
    body: {
      nombre: `Cliente API ${suffix}`,
      telefono: `505${String(suffix).slice(-8)}`,
      direccion: 'Entorno de prueba',
      correo: `api-${suffix}@cte.test`,
    },
  });
  const clienteId = idFrom(cliente, 'id_cliente');
  assert.ok(clienteId, 'El cliente debe devolver id_cliente');

  const equipo = await requestJson('/equipos', {
    method: 'POST',
    token,
    body: {
      cliente_id: clienteId,
      tipo: 'Laptop',
      marca: 'Lenovo',
      modelo: `ThinkPad API ${suffix}`,
      numero_serie: `API-${suffix}`,
    },
  });
  const equipoId = idFrom(equipo, 'id_equipo');
  assert.ok(equipoId, 'El equipo debe devolver id_equipo');

  const diagnostico = await requestJson('/secretaria/diagnostico/create', {
    method: 'POST',
    token,
    body: {
      equipo_id: equipoId,
      falla_reportada: 'No enciende',
      diagnostico_real: 'Falla de fuente interna',
      presupuesto_estimado: 1200,
      prioridad: 'Normal',
      estado_del_diagnostico: 'COMPLETADO',
    },
  });
  const diagnosticoId = idFrom(diagnostico, 'id_diagnostico');
  assert.ok(diagnosticoId, 'El diagnostico debe devolver id_diagnostico');

  await requestJson(`/secretaria/diagnostico/${diagnosticoId}/estado`, {
    method: 'PATCH',
    token,
    body: { estado: 'COMPLETADO' },
  });

  const orden = await requestJson('/ordenes', {
    method: 'POST',
    token,
    body: {
      diagnostico_id: diagnosticoId,
      prioridad: 'Normal',
      estado: 'PENDIENTE',
    },
  });
  const ordenId = idFrom(orden, 'id_orden');
  assert.ok(ordenId, 'La orden debe devolver id_orden');

  await requestJson(`/ordenes/${ordenId}`, {
    method: 'PUT',
    token,
    body: { estado: 'FINALIZADO' },
  });

  const factura = await requestJson('/facturas', {
    method: 'POST',
    token,
    body: {
      orden_id: ordenId,
      mano_obra: 1200,
      impuestos: 0,
      metodo_pago: 'Efectivo',
    },
  });
  const facturaId = idFrom(factura, 'id_factura');
  assert.ok(facturaId, 'La factura debe devolver id_factura');

  const garantia = await requestJson('/garantias', {
    method: 'POST',
    token,
    body: {
      factura_id: facturaId,
      duracion_meses: 3,
      condiciones: 'Garantia generada por prueba de API',
    },
  });
  assert.ok(idFrom(garantia, 'id_garantia'), 'La garantia debe devolver id_garantia');

  const flujo = await requestJson('/flujo-atencion', { token });
  const item = flujo.data.find((row) => row.diagnostico?.id_diagnostico === diagnosticoId);

  assert.equal(item?.factura?.id_factura, facturaId);
  assert.ok(item?.garantia?.id_garantia);
});
