// services/JefeTecnico/jefeService.js
import api from '../api';

export const jefeService = {
    // --- GESTIÓN DE DIAGNÓSTICOS ---
    getDiagnosticosPendientes: () => api.get('/diagnosticos/pendientes-asignar'),
    
    // Actualizar diagnóstico (Edición)
    updateDiagnostico: (id, data) => api.patch(`/diagnosticos/${id}`, data),

    // --- GESTIÓN DE ÓRDENES ---
    getOrdenesPendientes: () => api.get('/jefe-tecnico/ordenes-pendientes'),
    
    asignarTecnico: async (id_orden, id_tecnico) => {
        try {
            const res = await api.post('/jefe-tecnico/asignar-tecnico', { id_orden, id_tecnico });
            return res.data;
        } catch (error) {
            console.error("Error al asignar técnico:", error);
            throw error;
        }
    },

    // --- GESTIÓN DE REPUESTOS ---
    getRepuestosSolicitados: () => api.get('/jefe-tecnico/repuestos-pendientes'),
    setEstadoRepuesto: (id_detalle, estado) => 
        api.put(`/jefe-tecnico/repuestos/${id_detalle}`, { estado }),

    // --- AUXILIARES ---
    getTecnicosDisponibles: () => api.get('/jefe-tecnico/lista-tecnicos'),
};