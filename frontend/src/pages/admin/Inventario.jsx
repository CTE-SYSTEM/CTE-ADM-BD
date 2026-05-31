import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Table from '../../components/Table';
import api from '../../services/api';

// Extraído fuera del componente para evitar recreaciones redundantes en memoria
const columns = [
  { header: 'ID', accessor: 'id_repuesto' },
  { header: 'Nombre', accessor: 'nombre' },
  { header: 'Descripción', accessor: 'descripcion' },
  { 
    header: 'Precio', 
    accessor: 'precio',
    render: (row) => row.precio ? `C$ ${Number(row.precio).toFixed(2)}` : 'C$ 0.00'
  },
  { 
    header: 'Stock', 
    accessor: 'stock',
    render: (row) => {
      const stock = row.stock ?? 0;
      const minimo = row.minimoStock ?? 0;
      const esBajo = stock <= minimo;
      return (
        <span className={`font-bold ${esBajo ? 'text-red-600' : 'text-slate-700'}`}>
          {stock} {esBajo && '⚠️'}
        </span>
      );
    }
  },
  { header: 'Mínimo Stock', accessor: 'minimoStock' },
];

export default function Inventario() {
  const [repuestos, setRepuestos] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    minimoStock: '',
    proveedorId: ''
  });
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sincronización con la API centralizada
  const fetchInventario = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin_pro/repuestos');
      const data = res.data?.data || [];
      setRepuestos(data);
    } catch (err) {
      setError('No se pudo sincronizar el inventario con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventario();
  }, [fetchInventario]);

  // Manejador del formulario de inserción
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!form.nombre || !form.precio || !form.stock) {
      setError('Por favor completa los campos requeridos (Nombre, Precio y Stock).');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.post('/admin_pro/repuestos', {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio),
        stock: Number(form.stock),
        minimoStock: Number(form.minimoStock) || 0,
        proveedor_id: form.proveedorId ? Number(form.proveedorId) : null
      });

      setSuccessMessage(res.data?.message || 'Componente registrado correctamente.');
      setForm({ nombre: '', descripcion: '', precio: '', stock: '', minimoStock: '', proveedorId: '' });
      await fetchInventario();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar el nuevo repuesto.');
    } finally {
      setIsProcessing(false);
    }
  };

  // KPIs de control interno rápidos
  const totalItems = repuestos.length;
  const stockBajoCount = useMemo(() => (
    repuestos.filter((r) => (r.stock ?? 0) <= (r.minimoStock ?? 0)).length
  ), [repuestos]);

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      
      {/* Encabezado del Módulo */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Inventario de repuestos</h1>
        <p className="text-gray-400 text-sm mt-0.5">Controla las existencias de componentes físicos, alertas de stock bajo y suministros.</p>
      </div>

      {/* Mini Resumen de KPIs */}
      {!loading && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 max-w-md">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Líneas de Producto</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{totalItems} componentes</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Alertas críticas</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{stockBajoCount} reposiciones necesarias</p>
          </div>
        </div>
      )}

      {/* Panel Dual */}
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        
        {/* Formulario de registro directo */}
        <section className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5 h-fit space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Registro de componente</h2>
            <p className="text-xs text-gray-400">Introduce las especificaciones de la nueva pieza para su control contable.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block">Nombre del repuesto *</span>
              <input 
                type="text"
                placeholder="Ej. Pantalla LCD Huawei Y9" 
                value={form.nombre} 
                onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
                className="mt-1 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              />
            </div>

            <div>
              <span className="text-xs font-bold text-gray-500 uppercase block">Descripción</span>
              <input 
                type="text"
                placeholder="Ej. Reemplazo táctil original" 
                value={form.descripcion} 
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })} 
                className="mt-1 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase block">Precio (C$) *</span>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00" 
                  value={form.precio} 
                  onChange={(e) => setForm({ ...form, precio: e.target.value })} 
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase block">Stock inicial *</span>
                <input 
                  type="number"
                  min="0"
                  placeholder="0" 
                  value={form.stock} 
                  onChange={(e) => setForm({ ...form, stock: e.target.value })} 
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase block">Mínimo Stock</span>
                <input 
                  type="number"
                  min="0"
                  placeholder="Ej. 3" 
                  value={form.minimoStock} 
                  onChange={(e) => setForm({ ...form, minimoStock: e.target.value })} 
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase block">Proveedor ID</span>
                <input 
                  type="number"
                  placeholder="Ej. 1" 
                  value={form.proveedorId} 
                  onChange={(e) => setForm({ ...form, proveedorId: e.target.value })} 
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full mt-2 px-4 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-900 transition shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Guardando componente...' : 'Agregar Repuesto'}
            </button>
          </form>
        </section>

        {/* Listado Principal del Inventario */}
        <section className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Existencias físicas globales</h2>
            <p className="text-sm text-gray-400">Listado totalizado de repuestos asignables a las hojas de servicio mecánico.</p>
          </div>

          {/* Mensajes informativos de API */}
          {successMessage && <div className="rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700">{successMessage}</div>}
          {error && <div className="rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700">{error}</div>}

          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-gray-400 text-center py-10 text-sm">Consultando anaqueles del taller...</div>
            ) : repuestos.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-slate-50 rounded-xl border border-dashed border-gray-200 text-sm">
                No hay componentes registrados en el inventario actual.
              </div>
            ) : (
              <Table columns={columns} data={repuestos} sortable />
            )}
          </div>
        </section>

      </div>
    </div>
  );
}