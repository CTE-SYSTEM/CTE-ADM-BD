import React, { useEffect, useMemo, useState } from 'react';
import Table from '../../components/Table';
import Autocomplete from '../../components/Autocomplete';
import {
  Plus, Search, Edit, Trash2, Tag, Info,
  Loader2, AlertCircle, Cpu, Filter, HelpCircle, X
} from 'lucide-react';
import {
  createRepuesto, deleteRepuesto, getRepuestos, updateRepuesto
} from '../../services/secretaria/repuestosService';
import { getTiposRepuesto } from '../../services/secretaria/tiposRepuestoService';

const sortCategorias = (categorias) => {
  return [...categorias].sort((a, b) => {
    const byTipo = String(a.nombre_tipo || '').localeCompare(String(b.nombre_tipo || ''), 'es', { sensitivity: 'base' });
    if (byTipo !== 0) return byTipo;
    return String(a.electronico || '').localeCompare(String(b.electronico || ''), 'es', { sensitivity: 'base' });
  });
};

const formatCategoria = (categoria) => `${categoria.nombre_tipo || 'Sin tipo'} - ${categoria.electronico || 'Sin electronico'}`;

const normalizeText = (value = '') => String(value).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();

const toTitleCase = (value = '') => (
  normalizeText(value)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
);

// CORREGIDO: Sintaxis limpia con los corchetes [] correctos para evitar errores en el editor de código
const uniqueSorted = (values) => (
  [...new Set(values.map(toTitleCase).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
);

const roundToNearest = (value, step = 50) => Math.round(value / step) * step;

const formatMoney = (value) => `C$ ${Number(value || 0).toFixed(2)}`;

const getGananciaRule = (costo) => {
  if (!costo) return null;
  if (costo < 100) {
    const min = 150;
    const max = 200;
    return {
      rango: 'Menos de C$ 100',
      sugerida: `${formatMoney(min)} - ${formatMoney(max)}`,
      porcentaje: 'Fijo minimo',
      gananciaAplicable: min,
      justificacion: 'El costo es minimo; se cobra por identificar la pieza y tenerla disponible.',
    };
  }
  if (costo <= 500) {
    const min = roundToNearest(costo * 0.5);
    const max = roundToNearest(costo * 0.7);
    return {
      rango: 'C$ 100 - C$ 500',
      sugerida: `${formatMoney(min)} - ${formatMoney(max)}`,
      porcentaje: '50% - 70%',
      gananciaAplicable: roundToNearest(costo * 0.6),
      justificacion: 'Cubre transporte, gestion y tiempo para conseguir la pieza.',
    };
  }
  if (costo <= 1500) {
    const min = roundToNearest(costo * 0.3);
    const max = roundToNearest(costo * 0.4);
    return {
      rango: 'C$ 501 - C$ 1,500',
      sugerida: `${formatMoney(min)} - ${formatMoney(max)}`,
      porcentaje: '30% - 40%',
      gananciaAplicable: roundToNearest(costo * 0.35),
      justificacion: 'Hay mas riesgo de garantia; la ganancia ayuda a cubrir cambios.',
    };
  }
  if (costo <= 3500) {
    const min = roundToNearest(costo * 0.25);
    const max = roundToNearest(costo * 0.3);
    return {
      rango: 'C$ 1,501 - C$ 3,500',
      sugerida: `${formatMoney(min)} - ${formatMoney(max)}`,
      porcentaje: '25% - 30%',
      gananciaAplicable: roundToNearest(costo * 0.275),
      justificacion: 'El margen en dinero sube, pero el porcentaje baja para mantener un precio razonable.',
    };
  }

  const min = Math.max(1200, roundToNearest(costo * 0.2));
  return {
    rango: 'Mas de C$ 3,500',
    sugerida: `${formatMoney(min)}+`,
    porcentaje: '20% o fijo',
    gananciaAplicable: min,
    justificacion: 'Se negocia segun dificultad, disponibilidad y riesgo de conseguir la pieza.',
  };
};

const tourSteps = [
  { target: 'create', title: '1. Abrir formulario', text: 'Agregar Repuesto abre los campos para clasificar la pieza y registrar su modelo.' },
  { target: 'category', title: '2. Tipo y electronico', text: 'Puedes usar una etiqueta sugerida o escribir una combinacion nueva. Si no existe, se crea al guardar.' },
  { target: 'price', title: '3. Costo y ganancia', text: 'Ingresa el costo real. La recomendacion calcula una ganancia coherente con el porcentaje del rango.' },
  { target: 'details', title: '4. Datos finales', text: 'Modelo/Codigo es el codigo de la pieza. La descripcion sirve para notas tecnicas opcionales.' },
  { target: 'table', title: '5. Revisar inventario', text: 'La tabla muestra costo y ganancia con porcentaje para detectar precios fuera de rango.' },
  { target: 'actions', title: '6. Editar o retirar', text: 'El lapiz permite corregir datos del repuesto. El basurero lo marca como descontinuado.' },
];

const tourHighlightClass = (isActive) =>
  isActive
    ? 'relative z-[60] rounded-xl bg-white ring-4 ring-indigo-400 ring-offset-4 ring-offset-white shadow-2xl transition-all'
    : '';

const GuidedTour = ({ stepIndex, onBack, onClose, onNext }) => {
  const step = tourSteps[stepIndex];
  const isLast = stepIndex === tourSteps.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-gray-900/55" />
      <div className="fixed bottom-6 right-6 z-[70] w-[min(92vw,390px)] rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Paso {stepIndex + 1} de {tourSteps.length}</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{step.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700" title="Cerrar tutorial">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm leading-6 text-gray-600">{step.text}</p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((stepIndex + 1) / tourSteps.length) * 100}%` }} />
        </div>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={onBack} disabled={stepIndex === 0} className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40">
            Atras
          </button>
          <button type="button" onClick={onNext} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            {isLast ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
};

const RepuestoForm = ({ onSubmit, onCancel, initialData = null, categorias = [], activeTourTarget = '' }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo_repuesto_id: '',
    categoria_nombre: '',
    electronico: '',
    costo_individual: '',
    ganancia_cordobas: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        tipo_repuesto_id: initialData.tipo_repuesto_id ? String(initialData.tipo_repuesto_id) : '',
        categoria_nombre: initialData.categoria?.nombre_tipo || '',
        electronico: initialData.categoria?.electronico || '',
        costo_individual: initialData.costo_individual || '',
        ganancia_cordobas: initialData.ganancia_cordobas || '',
      });
      return;
    }

    setFormData({
      nombre: '',
      descripcion: '',
      tipo_repuesto_id: '',
      categoria_nombre: '',
      electronico: '',
      costo_individual: '',
      ganancia_cordobas: '',
    });
  }, [initialData]);

  const categoriaOptions = useMemo(() => sortCategorias(categorias), [categorias]);

  // Lista global de todos los electrónicos únicos ordenados alfabéticamente
  const electronicosSugeridos = useMemo(() => {
    const nombresUnicos = [...new Set(categorias.map((cat) => toTitleCase(cat.electronico)))].filter(Boolean);
    return nombresUnicos.sort((a, b) => a.localeCompare(b, 'es')).map(nombre => ({ nombre }));
  }, [categorias]);

  // LÓGICA CLAVE: Filtramos dinámicamente los tipos de repuesto según el electrónico que el usuario escribió o seleccionó
  const tiposSugeridosFiltrados = useMemo(() => {
    if (!formData.electronico) return []; // Si no hay electrónico seleccionado, la lista de repuestos se mantiene vacía.

    const electronicoActual = formData.electronico.toLowerCase();
    
    // Filtramos las categorías de la base de datos que coincidan exactamente con el electrónico actual
    const categoriasFiltradas = categorias.filter(
      (cat) => String(cat.electronico || '').toLowerCase() === electronicoActual
    );

    // Extraemos los nombres de tipos de repuesto únicos (ej: Pantalla, Almacenamiento) para esas categorías
    const tiposUnicos = [...new Set(categoriasFiltradas.map((cat) => toTitleCase(cat.nombre_tipo)))].filter(Boolean);
    
    return tiposUnicos.sort((a, b) => a.localeCompare(b, 'es')).map(nombre => ({ nombre }));
  }, [categorias, formData.electronico]);

  const costo = Number(formData.costo_individual || 0);
  const ganancia = Number(formData.ganancia_cordobas || 0);
  const gananciaRule = useMemo(() => getGananciaRule(costo), [costo]);
  const porcentajeGanancia = costo > 0 && ganancia > 0 ? (ganancia / costo) * 100 : 0;

  const precioVentaSugerido = useMemo(() => {
    return costo + ganancia;
  }, [costo, ganancia]);

  const findCategoriaId = (nombreTipo, electronicoValue) => {
    const tipoNormalizado = normalizeText(nombreTipo).toLowerCase();
    const electronicoNormalizado = normalizeText(electronicoValue).toLowerCase();
    const categoria = categoriaOptions.find((item) => (
      normalizeText(item.nombre_tipo).toLowerCase() === tipoNormalizado
      && normalizeText(item.electronico).toLowerCase() === electronicoNormalizado
    ));

    return categoria?.id_tipo_repuesto ? String(categoria.id_tipo_repuesto) : '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'categoria_nombre' || name === 'electronico') {
        next.tipo_repuesto_id = findCategoriaId(next.categoria_nombre, next.electronico);
      }
      return next;
    });
  };

  // Intercepta las selecciones de los componentes <Autocomplete /> personalizados
  const handleAutocompleteSelect = (name, selectedValue) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: selectedValue };
      
      // Si el usuario cambia el Electrónico, limpiamos el campo del Repuesto para obligarlo a seleccionar uno compatible
      if (name === 'electronico') {
        next.categoria_nombre = '';
      }

      next.tipo_repuesto_id = findCategoriaId(next.categoria_nombre, next.electronico);
      return next;
    });
  };

  const handleSubmitInternal = (e) => {
    e.preventDefault();
    const categoria_nombre = toTitleCase(formData.categoria_nombre);
    const electronico = toTitleCase(formData.electronico);
    const nombre = normalizeText(formData.nombre);

    if (!categoria_nombre || !electronico || !nombre) return;
    if (Number(formData.costo_individual || 0) < 0 || Number(formData.ganancia_cordobas || 0) < 0) return;

    onSubmit({
      ...formData,
      tipo_repuesto_id: formData.tipo_repuesto_id ? Number(formData.tipo_repuesto_id) : null,
      categoria_nombre,
      electronico,
      nombre,
      descripcion: normalizeText(formData.descripcion),
      costo_individual: parseFloat(formData.costo_individual || 0),
      ganancia_cordobas: parseFloat(formData.ganancia_cordobas || 0),
    });
  };

  return (
    <form onSubmit={handleSubmitInternal} className="space-y-6 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div data-tour-target="category" className={`space-y-4 p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm ${tourHighlightClass(activeTourTarget === 'category')}`}>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Tag className="w-3 h-3" /> Clasificación del Componente
          </h4>

          <div className="space-y-4">
            {/* PRIMERO: ELECTRÓNICO (Establece el dispositivo padre global) */}
            <div>
              <Autocomplete
                label="Electrónico"
                name="electronico"
                value={formData.electronico}
                onChange={(e) => handleAutocompleteSelect('electronico', e.target.value)}
                options={electronicosSugeridos}
                getOptionValue={(item) => item.nombre}
                getOptionLabel={(item) => item.nombre}
                getOptionDescription={() => 'Dispositivo compatible registrado'}
                placeholder="Ej: Laptop, Teléfono, Consola"
                emptyMessage="No se encontraron dispositivos en la base de datos"
                required
              />
            </div>

            {/* SEGUNDO: TIPO DE REPUESTO (Filtrado dinámicamente y dependiente) */}
            <div>
              <Autocomplete
                label="Tipo de repuesto"
                name="categoria_nombre"
                value={formData.categoria_nombre}
                onChange={(e) => handleAutocompleteSelect('categoria_nombre', e.target.value)}
                options={tiposSugeridosFiltrados} // Consume la lista filtrada en tiempo real
                getOptionValue={(item) => item.nombre}
                getOptionLabel={(item) => item.nombre}
                getOptionDescription={() => 'Categoría de componente'}
                placeholder={formData.electronico ? "Ej: Pantalla, Flex, Almacenamiento" : "Primero escribe o selecciona un electrónico..."}
                emptyMessage="No hay repuestos registrados para este aparato"
                required
                disabled={!formData.electronico} // Bloqueado si no hay un aparato seleccionado en el formulario
              />
            </div>
            
            {/* SE REMOVIERON LOS BOTONES EXTRA QUE CAUSABAN CONFLICTO VISUAL */}
          </div>
        </div>

        <div data-tour-target="details" className={`space-y-4 ${tourHighlightClass(activeTourTarget === 'details')}`}>
          <div className="space-y-1 text-left">
            <label className="block text-sm font-bold text-gray-700">Modelo/Código</label>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div data-tour-target="price" className={`grid grid-cols-2 gap-4 text-left ${tourHighlightClass(activeTourTarget === 'price')}`}>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Costo (C$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="costo_individual"
                value={formData.costo_individual}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-bold text-gray-700">Ganancia (C$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                name="ganancia_cordobas"
                value={formData.ganancia_cordobas}
                onChange={handleChange}
                placeholder="Ej: 250"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-left">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="block text-[10px] font-bold uppercase text-green-700">Precio de Venta Sugerido</span>
                <span className="font-mono text-lg font-black text-green-800">C$ {precioVentaSugerido.toFixed(2)}</span>
                <span className="ml-2 text-xs font-bold text-green-700">
                  {porcentajeGanancia > 0 ? `${porcentajeGanancia.toFixed(0)}% ganancia` : 'Sin ganancia'}
                </span>
              </div>
              {gananciaRule && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, ganancia_cordobas: String(gananciaRule.gananciaAplicable) }))}
                  className="rounded-md border border-green-200 bg-white px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-100 shadow-sm transition-all"
                >
                  Usar C$ {gananciaRule.gananciaAplicable}
                </button>
              )}
            </div>
            {gananciaRule && (
              <div className="mt-2 border-t border-green-200 pt-2 text-xs text-green-800">
                <div className="font-bold">{gananciaRule.rango}: {gananciaRule.sugerida} ({gananciaRule.porcentaje})</div>
                <div>{gananciaRule.justificacion}</div>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 text-left">
          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
            <Info className="w-4 h-4 text-indigo-500" /> Descripción Técnica
          </label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button type="button" onClick={onCancel} className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg transition-all">Cancelar</button>
        <button type="submit" className="px-6 py-2 text-white bg-indigo-600 font-bold rounded-lg shadow-lg active:scale-95 transition-all">
          {initialData ? 'Actualizar Repuesto' : 'Guardar Repuesto'}
        </button>
      </div>
    </form>
  );
};

const Repuestos = () => {
  const [repuestos, setRepuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRepuesto, setEditingRepuesto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterNombre, setFilterNombre] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [response, tiposResponse] = await Promise.all([getRepuestos(), getTiposRepuesto()]);
      setRepuestos(response.data.data || []);
      setCategorias(sortCategorias(tiposResponse.data.data || []));
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const activeTourTarget = showHelp ? tourSteps[tourStep].target : '';

  useEffect(() => {
    if (!showHelp || !activeTourTarget) return;
    const scrollTimer = window.setTimeout(() => {
      document
        ?.querySelector(`[data-tour-target="${activeTourTarget}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [activeTourTarget, showHelp]);

  const startTour = () => {
    setEditingRepuesto(null);
    setShowForm(true);
    setTourStep(0);
    setShowHelp(true);
  };

  const closeTour = () => {
    setShowHelp(false);
    setTourStep(0);
    setShowForm(false);
    setEditingRepuesto(null);
  };

  const handleTourNext = () => {
    if (tourStep === tourSteps.length - 1) {
      closeTour();
      return;
    }
    if (tourSteps[tourStep + 1]?.target === 'table') {
      setShowForm(false);
      setEditingRepuesto(null);
    }
    setTourStep((step) => step + 1);
  };

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (editingRepuesto) {
        await updateRepuesto(editingRepuesto.id_repuesto, data);
      } else {
        await createRepuesto(data);
      }
      setShowForm(false);
      setEditingRepuesto(null);
      await loadData();
    } catch (err) {
      setError('Error al procesar solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este repuesto?')) return;
    try {
      await deleteRepuesto(id);
      await loadData();
    } catch (err) {
      setError('Error al eliminar');
    }
  };

  const filteredRepuestos = repuestos.filter((repuesto) => {
    const matchNombre = repuesto.nombre?.toLowerCase().includes(filterNombre.toLowerCase());
    const categoriaCompleta = `${repuesto.categoria?.nombre_tipo || ''} ${repuesto.categoria?.electronico || ''} ${repuesto.proveedor?.nombre || ''}`.toLowerCase();
    const matchCat = categoriaCompleta.includes(filterCategoria.toLowerCase());
    return matchNombre && matchCat;
  });

  const columnas = [
    { header: 'Info Repuesto', render: (row) => (
      <div className="flex items-center gap-3 text-left">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Cpu className="w-5 h-5" /></div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 leading-tight">{row.nombre}</span>
          <span className="text-[11px] text-gray-400 italic">{row.descripcion || 'Sin detalles'}</span>
          <span className="text-[10px] font-bold uppercase text-slate-500">{row.proveedor?.nombre || 'Sin proveedor asignado'}</span>
        </div>
      </div>
    ) },
    { header: 'Categoria', render: (row) => (
      <div className="flex flex-col text-left">
        <span className="text-sm font-semibold text-gray-700">{row.categoria?.nombre_tipo}</span>
        <span className="text-[10px] text-indigo-500 font-bold uppercase">{row.categoria?.electronico}</span>
      </div>
    ) },
    { header: 'Costo', render: (row) => <span className="font-mono text-gray-600">C$ {Number(row.costo_individual || 0).toFixed(2)}</span> },
    { header: 'Ganancia', render: (row) => (
      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-black">
        C$ {Number(row.ganancia_cordobas || 0).toFixed(2)}
        {Number(row.costo_individual || 0) > 0 ? ` (${((Number(row.ganancia_cordobas || 0) / Number(row.costo_individual || 0)) * 100).toFixed(0)}%)` : ''}
      </span>
    ) },
    { header: 'Acciones', render: (row) => (
      <div data-tour-target="actions" className={`flex gap-1 ${tourHighlightClass(activeTourTarget === 'actions')}`}>
        <button onClick={() => { setEditingRepuesto(row); setShowForm(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(row.id_repuesto)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showHelp && (
        <GuidedTour
          stepIndex={tourStep}
          onBack={() => setTourStep((step) => Math.max(step - 1, 0))}
          onClose={closeTour}
          onNext={handleTourNext}
        />
      )}

      <div className="flex justify-between items-end mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Inventario de Repuestos</h2>
          <p className="text-gray-500 font-medium italic text-sm">Gestión de componentes para CTE</p>
        </div>
        <div data-tour-target="create" className={`flex flex-wrap gap-3 ${tourHighlightClass(activeTourTarget === 'create')}`}>
          <button
            type="button"
            onClick={startTour}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm font-bold transition-all"
            title="Iniciar tutorial guiado"
          >
            <HelpCircle className="w-5 h-5" /> Ayuda
          </button>
          <button
            onClick={() => { setEditingRepuesto(null); setShowForm(true); }}
            className="flex items-center gap-2 px-6 py-3 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xl font-bold transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Agregar Repuesto
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-2 rounded"><AlertCircle className="w-5 h-5" /> {error}</div>}

      {showForm && (
        <div className="mb-8 bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 animate-in fade-in zoom-in duration-200">
          <RepuestoForm categorias={categorias} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditingRepuesto(null); }} initialData={editingRepuesto} activeTourTarget={activeTourTarget} />
        </div>
      )}

      <div data-tour-target="table" className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6 ${tourHighlightClass(activeTourTarget === 'table')}`}>
        <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-500 mr-2"><Filter className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Filtros:</span></div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por Modelo/Codigo..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none" value={filterNombre} onChange={(e) => setFilterNombre(e.target.value)} />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Filtrar por Categoria..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm outline-none" value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="p-12 flex justify-center items-center gap-3 text-indigo-600"><Loader2 className="w-6 h-6 animate-spin" /><span className="font-bold">Sincronizando...</span></div> : <Table columns={columnas} data={filteredRepuestos} />}
      </div>
    </div>
  );
};

export default Repuestos;