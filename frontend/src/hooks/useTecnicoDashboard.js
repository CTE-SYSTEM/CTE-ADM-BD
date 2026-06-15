import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { estadosDiagnosticoCompletado, estadosOrdenCerrada } from '../components/Tecnico/TecnicoBadges';
import { mapDiagnostico, mapOrden } from '../utils/tecnicoMappers';

const isInList = (value, list) => list.includes(String(value || '').toUpperCase());

const extractResponseData = (response) => {
  if (!response?.data) return [];
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data.data)) return response.data.data;
  if (Array.isArray(response.data.diagnosticos)) return response.data.diagnosticos;
  if (Array.isArray(response.data.data?.data)) return response.data.data.data;
  return [];
};

export const useTecnicoDashboard = (user) => {
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [repuestosCatalogo, setRepuestosCatalogo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTecnicoData = useCallback(async () => {
    if (!user?.username) return;

    setLoading(true);
    setError('');
    try {
      const username = encodeURIComponent(user.username);
      const [diagnosticosRes, ordenesRes, repuestosRes] = await Promise.all([
        api.get(`/tecnicos/mis-diagnosticos/${username}`),
        api.get(`/tecnicos/mis-ordenes/${username}`),
        api.get('/repuestos', { params: { disponibles: 1 } }),
      ]);

      setDiagnosticos(extractResponseData(diagnosticosRes).map(mapDiagnostico));
      setOrdenes(extractResponseData(ordenesRes).map(mapOrden));
      setRepuestosCatalogo(extractResponseData(repuestosRes));
    } catch (err) {
      console.error('Error al cargar datos del tecnico:', err);
      setError('No se pudo cargar el circuito del tecnico.');
      setDiagnosticos([]);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadTecnicoData();
  }, [loadTecnicoData]);

  const diagnosticosEnRevision = useMemo(
    () => diagnosticos.filter((diag) => !isInList(diag.estado, estadosDiagnosticoCompletado)),
    [diagnosticos],
  );

  const diagnosticosCompletados = useMemo(
    () => diagnosticos.filter((diag) => isInList(diag.estado, estadosDiagnosticoCompletado)),
    [diagnosticos],
  );

  const ordenesActivas = useMemo(
    () => ordenes.filter((orden) => !isInList(orden.estado, estadosOrdenCerrada)),
    [ordenes],
  );

  const ordenesCompletadas = useMemo(
    () => ordenes.filter((orden) => isInList(orden.estado, estadosOrdenCerrada)),
    [ordenes],
  );

  const solicitudesRepuestos = useMemo(
    () => ordenes.flatMap((orden) => (orden.repuestos_usados || []).map((solicitud) => ({
      id: solicitud.id_detalle_repuesto,
      ordenId: orden.id,
      repuesto: solicitud.repuesto?.nombre || solicitud.pieza_solicitada || 'Pieza pendiente de registrar',
      cantidad: solicitud.cantidad_usada || 1,
      estado: solicitud.estado_aprobacion,
      pendienteInventario: !solicitud.repuesto_id,
      fecha_ingreso: orden.fecha_ingreso || null,
      fecha_finalizacion: orden.fecha_finalizacion || orden.fecha_cierre || null,
      fecha: solicitud.fecha_entrega || orden.fecha_asignacion || orden.fecha_ingreso || null,
    }))),
    [ordenes],
  );

  const cambiarEstadoOrden = async (ordenId, data) => {
    await api.patch(`/tecnicos/ordenes/${ordenId}/estado`, data);
    await loadTecnicoData();
  };

  const guardarDiagnostico = async (diagnosticoId, data) => {
    await api.put(`/tecnicos/diagnosticos/${diagnosticoId}`, {
      diagnostico_real: `${data.diagnostico}\n\nSolucion: ${data.solucion}`.trim(),
      presupuesto_estimado: data.presupuesto || undefined,
      estado_del_diagnostico: 'COMPLETADO',
    });
    await loadTecnicoData();
  };

  const solicitarRepuesto = async (ordenId, data) => {
    await api.post(`/tecnicos/ordenes/${ordenId}/repuestos`, data);
    await loadTecnicoData();
  };

  return {
    data: {
      diagnosticosEnRevision,
      diagnosticosCompletados,
      ordenes,
      ordenesActivas,
      ordenesCompletadas,
      repuestosCatalogo,
      solicitudesRepuestos,
    },
    state: { loading, error },
    actions: {
      cambiarEstadoOrden,
      guardarDiagnostico,
      loadTecnicoData,
      setError,
      setOrdenes,
      solicitarRepuesto,
    },
  };
};
