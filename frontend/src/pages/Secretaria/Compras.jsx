import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { Plus, Search } from 'lucide-react';
import { createCompra, getCompras } from '../../services/secretaria/comprasService';
import { getProveedores } from '../../services/secretaria/proveedoresService';
import { getRepuestos } from '../../services/secretaria/repuestosService';

const CompraForm = ({ onSubmit, onCancel, proveedores = [], repuestos = [] }) => {
  const [formData, setFormData] = useState({
    proveedor_id: '',
    repuesto_id: '',
    documento: '',
    fecha_obtencion: '',
    cantidad: '',
    costo_unitario: '',
    metodo_pago: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const fieldValue = String(value);

    if (name === 'repuesto_id') {
      const repuestoId = Number.parseInt(fieldValue, 10);
      const repuestoSel = repuestos.find(r => r.id_repuesto === repuestoId);
      setFormData((prev) => ({
        ...prev,
        [name]: fieldValue,
        costo_unitario: repuestoSel ? String(repuestoSel.costo_individual ?? '') : prev.costo_unitario
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Proveedor" name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} required>
          <option value="">Seleccione un proveedor</option>
          {proveedores.map((p) => <option key={p.id_proveedor} value={String(p.id_proveedor)}>{p.nombre}</option>)}
        </Select>

        <Select label="Repuesto" name="repuesto_id" value={formData.repuesto_id} onChange={handleChange} required>
          <option value="">Seleccione un repuesto</option>
          {repuestos.map((r) => <option key={r.id_repuesto} value={String(r.id_repuesto)}>{r.nombre}</option>)}
        </Select>

        <Field label="Documento" name="documento" value={formData.documento} onChange={handleChange} placeholder="Factura o recibo" />
        <Field label="Fecha de obtención" name="fecha_obtencion" type="date" value={formData.fecha_obtencion} onChange={handleChange} />
        <Field label="Cantidad" name="cantidad" type="number" min="1" value={formData.cantidad} onChange={handleChange} required />
        
        <Field 
          label="Costo unitario" 
          name="costo_unitario" 
          type="number" 
          step="0.01" 
          value={formData.costo_unitario} 
          onChange={handleChange} 
          required 
        />

        <Select label="Método de pago" name="metodo_pago" value={formData.metodo_pago} onChange={handleChange}>
          <option value="">Seleccione método</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Guardar Compra</button>
      </div>
    </form>
  );
};

// Componentes Auxiliares
const Field = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all">
      {children}
    </select>
  </div>
);

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resC, resP, resR] = await Promise.all([getCompras(), getProveedores(), getRepuestos()]);
      setCompras(resC.data.data || []);
      setProveedores(resP.data.data || []);
      setRepuestos(resR.data.data || []);
    } catch (err) {
      setError('Error al sincronizar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const columnas = [
    { header: 'ID', accessor: 'id_compra' },
    { header: 'Proveedor', accessor: 'proveedor', render: (row) => row.proveedor?.nombre },
    { header: 'Repuesto', accessor: 'repuesto', render: (row) => row.repuesto?.nombre },
    { header: 'Documento', accessor: 'documento' },
    { header: 'Fecha', accessor: 'fecha_obtencion', render: (row) => row.fecha_obtencion ? new Date(row.fecha_obtencion).toLocaleDateString() : '-' },
    { header: 'Cantidad', accessor: 'cantidad' },
    { header: 'Costo', accessor: 'costo_unitario', render: (row) => `C$ ${Number(row.costo_unitario).toFixed(2)}` },
    { header: 'Pago', accessor: 'metodo_pago' },
  ];

  const filteredCompras = compras.filter((c) => {
    const t = searchTerm.toLowerCase();
    return [c.proveedor?.nombre, c.repuesto?.nombre, c.documento].some(v => String(v || '').toLowerCase().includes(t));
  });

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      await createCompra(data);
      setShowForm(false);
      loadData();
    } catch (err) {
      setError('No se pudo procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Módulo de Compras (Entradas)</h2>
        <p className="text-gray-500 text-sm">Registro de adquisición de repuestos para inventario del CTE.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por proveedor, repuesto o documento..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
          />
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center justify-center gap-2 px-5 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" /> {showForm ? 'Cerrar Formulario' : 'Nueva Compra'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Registrar Entrada de Mercancía</h3>
          <CompraForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} proveedores={proveedores} repuestos={repuestos} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading && !compras.length ? (
          <div className="p-12 text-center text-gray-400">Actualizando registros...</div>
        ) : (
          <Table columns={columnas} data={filteredCompras} />
        )}
      </div>
    </div>
  );
};

export default Compras;