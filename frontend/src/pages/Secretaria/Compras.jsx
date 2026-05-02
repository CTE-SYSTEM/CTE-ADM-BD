import React, { useEffect, useState } from 'react';
import Table from '../../components/Table';
import { Plus, Search } from 'lucide-react';
import { createCompra, getCompras } from '../../services/comprasService';
import { getProveedores } from '../../services/proveedoresService';
import { getRepuestos } from '../../services/repuestosService';

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

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Proveedor" name="proveedor_id" value={formData.proveedor_id} onChange={handleChange} required>
          <option value="">Seleccione un proveedor</option>
          {proveedores.map((proveedor) => <option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>{proveedor.nombre}</option>)}
        </Select>
        <Select label="Repuesto" name="repuesto_id" value={formData.repuesto_id} onChange={handleChange} required>
          <option value="">Seleccione un repuesto</option>
          {repuestos.map((repuesto) => <option key={repuesto.id_repuesto} value={repuesto.id_repuesto}>{repuesto.nombre}</option>)}
        </Select>
        <Field label="Documento" name="documento" value={formData.documento} onChange={handleChange} placeholder="Factura o recibo" />
        <Field label="Fecha de obtencion" name="fecha_obtencion" type="date" value={formData.fecha_obtencion} onChange={handleChange} />
        <Field label="Cantidad" name="cantidad" type="number" min="1" value={formData.cantidad} onChange={handleChange} />
        <Field label="Costo unitario" name="costo_unitario" type="number" min="0" step="0.01" value={formData.costo_unitario} onChange={handleChange} />
        <Select label="Metodo de pago" name="metodo_pago" value={formData.metodo_pago} onChange={handleChange}>
          <option value="">Seleccione metodo</option>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
        </Select>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
        <button type="submit" className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Guardar</button>
      </div>
    </form>
  );
};

const Field = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select {...props} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">{children}</select>
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
    setError(null);
    try {
      const [comprasResponse, proveedoresResponse, repuestosResponse] = await Promise.all([getCompras(), getProveedores(), getRepuestos()]);
      setCompras(comprasResponse.data.data || []);
      setProveedores(proveedoresResponse.data.data || []);
      setRepuestos(repuestosResponse.data.data || []);
    } catch {
      setError('No se pudieron cargar las compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columnas = [
    { header: 'ID', accessor: 'id_compra' },
    { header: 'Proveedor', accessor: 'proveedor', render: (row) => row.proveedor?.nombre || '' },
    { header: 'Repuesto', accessor: 'repuesto', render: (row) => row.repuesto?.nombre || '' },
    { header: 'Documento', accessor: 'documento' },
    { header: 'Fecha', accessor: 'fecha_obtencion', render: (row) => row.fecha_obtencion ? new Date(row.fecha_obtencion).toLocaleDateString() : '' },
    { header: 'Cantidad', accessor: 'cantidad' },
    { header: 'Costo', accessor: 'costo_unitario', render: (row) => row.costo_unitario ? `C$ ${Number(row.costo_unitario).toFixed(2)}` : '' },
    { header: 'Pago', accessor: 'metodo_pago' },
  ];

  const filteredCompras = compras.filter((compra) => {
    const term = searchTerm.toLowerCase();
    return [compra.proveedor?.nombre, compra.repuesto?.nombre, compra.documento, compra.metodo_pago].some((value) =>
      String(value || '').toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await createCompra(data);
      setShowForm(false);
      await loadData();
    } catch {
      setError('Error al guardar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Gestion de Compras</h2>
        <p className="text-gray-500">Campos reales: proveedor, repuesto, documento, fecha, cantidad, costo y metodo de pago.</p>
      </div>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar compras..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Nueva Compra
        </button>
      </div>
      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold mb-4">Nueva Compra</h3>
          <CompraForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} proveedores={proveedores} repuestos={repuestos} />
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-500">Cargando...</div> : <Table columns={columnas} data={filteredCompras} />}
      </div>
    </div>
  );
};

export default Compras;
