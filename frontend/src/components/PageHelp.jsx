import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const localHelpPaths = new Set([
  '/secretaria/clientes',
  '/secretaria/equipos',
  '/secretaria/diagnostico',
  '/secretaria/nueva-orden',
  '/secretaria/repuestos',
  '/secretaria/tipos-repuesto',
  '/secretaria/compras',
  '/secretaria/proveedores',
]);

const defaultHelp = {
  title: 'Mini tutorial',
  description: 'Usa esta pantalla para consultar, filtrar y dar seguimiento a la informacion del modulo.',
  steps: [
    ['1. Revisa el resumen', 'Observa los contadores o tablas principales antes de hacer cambios.'],
    ['2. Busca o filtra', 'Usa los filtros, buscadores o columnas para encontrar el registro correcto.'],
    ['3. Abre el detalle', 'Entra al registro que necesitas revisar, editar o exportar.'],
    ['4. Confirma cambios', 'Guarda solo cuando la informacion este completa y revisada.'],
  ],
};

const helpByPath = {
  '/admin': {
    title: 'Mini tutorial de administracion',
    description: 'Usa este panel para ver indicadores generales, productividad, garantias y accesos rapidos.',
    steps: [
      ['1. Revisa indicadores', 'Las tarjetas superiores resumen equipos, ordenes, facturas, usuarios y diagnosticos.'],
      ['2. Lee productividad', 'Los graficos comparan diagnosticos y ordenes cerradas por periodo.'],
      ['3. Supervisa tablas', 'Ordenes recientes, equipos y garantias ayudan a detectar pendientes.'],
      ['4. Entra al modulo', 'Usa accesos rapidos para administrar usuarios, equipos, ordenes y repuestos.'],
    ],
  },
  '/secretaria': {
    title: 'Mini tutorial de Secretaria',
    description: 'Usa este panel como punto de entrada para registrar clientes, equipos, diagnosticos, ordenes y facturas.',
    steps: [
      ['1. Revisa el periodo', 'Cambia entre todo, semana, mes o anio para ver actividad reciente.'],
      ['2. Entra al modulo', 'Las tarjetas abren clientes, equipos, diagnosticos, ordenes y facturacion.'],
      ['3. Atiende ordenes', 'La tabla inferior muestra las ordenes mas recientes para dar seguimiento.'],
      ['4. Usa flujo atencion', 'Cuando necesites contexto completo, abre el tablero de seguimiento.'],
    ],
  },
  '/admin/equipos': {
    title: 'Mini tutorial de equipos',
    description: 'Consulta, filtra y actualiza equipos registrados en taller.',
    steps: [
      ['1. Busca equipo', 'Filtra por cliente, marca, modelo, tipo o numero de serie.'],
      ['2. Revisa diagnostico', 'Verifica el ultimo estado tecnico asociado al equipo.'],
      ['3. Edita datos', 'Corrige cliente, tipo, marca, modelo o serie cuando haga falta.'],
      ['4. Abre historial', 'Usa historial para ver diagnosticos, ordenes, facturas y garantias.'],
    ],
  },
  '/admin/usuarios': {
    title: 'Mini tutorial de usuarios',
    description: 'Administra cuentas, roles y acceso al sistema.',
    steps: [
      ['1. Revisa usuarios', 'Verifica nombre, rol y estado antes de editar una cuenta.'],
      ['2. Crea con rol correcto', 'Asigna Administrador, Secretaria, Tecnico o TecnicoJefe segun corresponda.'],
      ['3. Actualiza datos', 'Usa editar para corregir correo, rol o estado de acceso.'],
      ['4. Protege credenciales', 'Cambia contrasenas solo cuando sea necesario y confirma con el usuario.'],
    ],
  },
  '/admin/clientes': {
    title: 'Mini tutorial de clientes',
    description: 'Consulta clientes y su informacion operativa desde administracion.',
    steps: [
      ['1. Busca el cliente', 'Filtra por nombre, telefono o correo para ubicarlo rapido.'],
      ['2. Revisa equipos', 'Confirma que sus equipos esten correctamente asociados.'],
      ['3. Valida contacto', 'Telefono y correo ayudan a evitar ordenes mal vinculadas.'],
      ['4. Sigue historial', 'Usa los modulos de equipos u ordenes para ver el estado del servicio.'],
    ],
  },
  '/admin/ordenes': {
    title: 'Mini tutorial de ordenes',
    description: 'Supervisa y actualiza las ordenes de trabajo del taller.',
    steps: [
      ['1. Lee el estado', 'Identifica si la orden esta pendiente, en reparacion o finalizada.'],
      ['2. Abre detalle', 'Usa Ver / Editar para revisar cliente, equipo y repuestos.'],
      ['3. Asigna tecnico', 'Selecciona el tecnico encargado cuando corresponda.'],
      ['4. Exporta repuestos', 'Descarga CSV si necesitas revisar materiales de una orden.'],
    ],
  },
  '/admin/repuestos': {
    title: 'Mini tutorial de repuestos',
    description: 'Controla inventario, costos y disponibilidad de piezas.',
    steps: [
      ['1. Revisa stock', 'Prioriza piezas con bajo inventario o solicitudes pendientes.'],
      ['2. Valida costo', 'Confirma costo y ganancia antes de usar el repuesto en facturacion.'],
      ['3. Actualiza estado', 'Marca piezas descontinuadas cuando ya no se deben vender.'],
      ['4. Consulta historial', 'Usa historial para entender compras y uso del repuesto.'],
    ],
  },
  '/admin/compras': {
    title: 'Mini tutorial de compras',
    description: 'Da seguimiento a compras y entradas de inventario.',
    steps: [
      ['1. Revisa proveedor', 'Confirma que la compra este asociada al proveedor correcto.'],
      ['2. Valida cantidad', 'La cantidad comprada impacta el stock disponible.'],
      ['3. Confirma costo', 'El costo unitario alimenta calculos de ganancia.'],
      ['4. Usa reportes', 'Compara compras recientes cuando revises inventario.'],
    ],
  },
  '/admin/ganancias': {
    title: 'Mini tutorial de ganancias',
    description: 'Analiza ingresos, costos, rentabilidad, activos y exportaciones financieras por periodo.',
    steps: [
      ['1. Define el periodo', 'Usa Semana, Mes, Trimestre, Anio o un rango manual. Periodo anterior mueve la vista al rango equivalente previo para comparar.'],
      ['2. Consulta el reporte', 'Cambia el limite de detalle y presiona Consultar para recalcular totales, alertas, graficas y tablas del periodo.'],
      ['3. Lee las tarjetas', 'Ingresos, compras de inventario, perdidas reales, ganancia neta y margen de servicios resumen la salud financiera. Toca una tarjeta para aislarla en la grafica.'],
      ['4. Cambia la etapa', 'En Balance por etapa alterna Semanal, Mensual o Anual para revisar la tendencia con la escala correcta.'],
      ['5. Revisa secciones', 'Margen por orden, control de activos, costos y perdidas, rentabilidad y movimientos recientes explican de donde salen los numeros.'],
      ['6. Exporta evidencia', 'Cada bloque con exportacion permite descargar CSV o PDF: reporte general, margen por orden, activos, costos/perdidas y rentabilidad.'],
    ],
  },
  '/admin/tecnicos': {
    title: 'Mini tutorial de tecnicos',
    description: 'Mide productividad y carga de trabajo del equipo tecnico.',
    steps: [
      ['1. Compara metricas', 'Revisa diagnosticos, ordenes cerradas y tiempos.'],
      ['2. Detecta atrasos', 'Ubica tecnicos con carga alta o trabajos demorados.'],
      ['3. Reasigna trabajo', 'Usa el panel de jefe tecnico si hace falta balancear.'],
      ['4. Evalua tendencia', 'Observa rendimiento mensual antes de tomar decisiones.'],
    ],
  },
  '/admin/inventario': {
    title: 'Mini tutorial de inventario',
    description: 'Consulta existencias y disponibilidad de piezas.',
    steps: [
      ['1. Revisa stock actual', 'Identifica piezas disponibles y agotadas.'],
      ['2. Filtra por categoria', 'Agrupa repuestos por tipo para encontrar mas rapido.'],
      ['3. Valida proveedor', 'Confirma origen antes de volver a comprar.'],
      ['4. Coordina compras', 'Registra compras para mantener inventario actualizado.'],
    ],
  },
  '/admin/visualizacion-control-facturas': {
    title: 'Mini tutorial de facturas',
    description: 'Consulta facturas emitidas y control de cobros.',
    steps: [
      ['1. Busca factura', 'Filtra por cliente, orden o fecha de emision.'],
      ['2. Revisa montos', 'Confirma repuestos, mano de obra, impuestos y total.'],
      ['3. Verifica garantia', 'Comprueba si la factura ya tiene garantia asociada.'],
      ['4. Exporta o audita', 'Usa la informacion para reportes y seguimiento administrativo.'],
    ],
  },
  '/admin/facturacion': {
    title: 'Mini tutorial de facturacion',
    description: 'Consulta facturas emitidas y control de cobros.',
    steps: [
      ['1. Busca factura', 'Filtra por cliente, orden o fecha de emision.'],
      ['2. Revisa montos', 'Confirma repuestos, mano de obra, impuestos y total.'],
      ['3. Verifica garantia', 'Comprueba si la factura ya tiene garantia asociada.'],
      ['4. Exporta o audita', 'Usa la informacion para reportes y seguimiento administrativo.'],
    ],
  },
  '/admin/ordenes-estado': {
    title: 'Mini tutorial de estado de ordenes',
    description: 'Visualiza el avance operativo de las ordenes.',
    steps: [
      ['1. Agrupa por estado', 'Distingue pendientes, reparacion, finalizadas y entregadas.'],
      ['2. Detecta bloqueos', 'Busca ordenes detenidas por repuestos o aprobaciones.'],
      ['3. Abre detalle', 'Consulta tecnico, cliente y equipo de cada orden.'],
      ['4. Da seguimiento', 'Actualiza desde el modulo de ordenes cuando haga falta.'],
    ],
  },
  '/admin/diagnosticos': {
    title: 'Mini tutorial de diagnosticos',
    description: 'Monitorea diagnosticos por estado y aprobacion.',
    steps: [
      ['1. Revisa pendientes', 'Identifica equipos que aun necesitan diagnostico.'],
      ['2. Valida completados', 'Confirma informe tecnico y presupuesto.'],
      ['3. Cambia estado', 'Actualiza solo cuando el diagnostico este listo.'],
      ['4. Crea orden', 'Los diagnosticos completados pueden pasar a orden de reparacion.'],
    ],
  },
  '/admin/garantias': {
    title: 'Mini tutorial de garantias',
    description: 'Controla garantias activas, vencimientos y renovaciones.',
    steps: [
      ['1. Revisa vencimientos', 'Prioriza garantias proximas a vencer.'],
      ['2. Consulta factura', 'Cada garantia debe estar asociada a una factura.'],
      ['3. Edita condiciones', 'Aclara cobertura y duracion cuando sea necesario.'],
      ['4. Renueva con criterio', 'Renueva solo si corresponde por politica del taller.'],
    ],
  },
  '/admin/historial-equipo': {
    title: 'Mini tutorial de historial de equipo',
    description: 'Consulta el recorrido completo de un equipo.',
    steps: [
      ['1. Busca equipo', 'Usa cliente, serie, marca o modelo para localizarlo.'],
      ['2. Revisa diagnosticos', 'Mira fallas reportadas y resultados tecnicos.'],
      ['3. Sigue ordenes', 'Consulta reparaciones y estados anteriores.'],
      ['4. Verifica postventa', 'Revisa facturas y garantias vinculadas.'],
    ],
  },
  '/admin/historial-repuesto': {
    title: 'Mini tutorial de historial de repuesto',
    description: 'Consulta movimientos y uso de una pieza.',
    steps: [
      ['1. Busca repuesto', 'Filtra por nombre, categoria o proveedor.'],
      ['2. Revisa compras', 'Confirma entradas, costos y fechas.'],
      ['3. Revisa uso', 'Identifica en que ordenes se uso la pieza.'],
      ['4. Ajusta compras', 'Usa el historial para planificar reposicion.'],
    ],
  },
  '/secretaria/facturacion': {
    title: 'Mini tutorial de facturacion',
    description: 'Emite facturas desde ordenes finalizadas.',
    steps: [
      ['1. Busca orden lista', 'Solo se facturan ordenes finalizadas o irreparables.'],
      ['2. Revisa repuestos', 'Asegurate de que las piezas esten aprobadas.'],
      ['3. Completa cobro', 'Ingresa mano de obra, impuestos y metodo de pago.'],
      ['4. Genera garantia', 'Despues de facturar, registra la garantia si aplica.'],
    ],
  },
  '/secretaria/flujo-atencion': {
    title: 'Mini tutorial de flujo de atencion',
    description: 'Sigue cada equipo desde ingreso hasta garantia.',
    steps: [
      ['1. Usa filtros', 'Cambia entre pendientes, revision, reparacion, facturacion y garantia.'],
      ['2. Busca rapido', 'Filtra por cliente, equipo, serie, orden o factura.'],
      ['3. Lee la linea', 'Cada tarjeta muestra cliente, equipo, diagnostico, orden y postventa.'],
      ['4. Decide el siguiente paso', 'Abre el modulo correspondiente para avanzar el caso.'],
    ],
  },
  '/admin/flujo-atencion': {
    title: 'Mini tutorial de flujo de atencion',
    description: 'Sigue cada equipo desde ingreso hasta garantia.',
    steps: [
      ['1. Usa filtros', 'Cambia entre pendientes, revision, reparacion, facturacion y garantia.'],
      ['2. Busca rapido', 'Filtra por cliente, equipo, serie, orden o factura.'],
      ['3. Lee la linea', 'Cada tarjeta muestra cliente, equipo, diagnostico, orden y postventa.'],
      ['4. Decide el siguiente paso', 'Abre el modulo correspondiente para avanzar el caso.'],
    ],
  },
  '/tecnico': {
    title: 'Mini tutorial del tecnico',
    description: 'Este panel ordena tu trabajo diario: revisar diagnosticos, mover ordenes y solicitar repuestos.',
    steps: [
      ['1. Filtra indicadores', 'El selector de fecha cambia los cuatro contadores superiores.'],
      ['2. Trabaja por pestanas', 'Usa diagnosticos, ordenes activas, finalizadas y piezas segun la tarea.'],
      ['3. Busca rapido', 'Cada seccion tiene buscador para filtrar por cliente, equipo, falla u orden.'],
      ['4. Cierra con cuidado', 'Al finalizar una orden se abre el formulario de cierre tecnico.'],
    ],
  },
  '/tecnico-jefe': {
    title: 'Mini tutorial del jefe tecnico',
    description: 'Usa este panel para repartir trabajo, aprobar repuestos y corregir avances antes de que se acumulen retrasos.',
    steps: [
      ['1. Revisa pendientes', 'Las tarjetas muestran diagnosticos, ordenes, repuestos y alertas abiertas.'],
      ['2. Asigna tecnicos', 'En diagnosticos y ordenes selecciona tecnico y guarda la asignacion.'],
      ['3. Aprueba repuestos', 'Valida solicitudes de piezas antes de que pasen a facturacion.'],
      ['4. Corrige a tiempo', 'La pestana de correcciones permite ajustar tecnico, estado, prioridad o pieza.'],
    ],
  },
};

const resolveHelp = (pathname) => {
  if (localHelpPaths.has(pathname)) return null;
  return helpByPath[pathname] || defaultHelp;
};

const PageHelp = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const help = useMemo(() => resolveHelp(pathname), [pathname]);

  useEffect(() => {
    Promise.resolve().then(() => {
      setOpen(false);
      setStepIndex(0);
    });
  }, [pathname]);

  if (!help) return null;

  const isLast = stepIndex === help.steps.length - 1;
  const [stepTitle, stepText] = help.steps[stepIndex];
  const progress = `${stepIndex + 1}/${help.steps.length}`;

  const startTour = () => {
    setStepIndex(0);
    setOpen(true);
  };

  const closeTour = () => {
    setOpen(false);
    setStepIndex(0);
  };

  const nextStep = () => {
    if (isLast) {
      closeTour();
      return;
    }
    setStepIndex((value) => value + 1);
  };

  return (
    <section className="mb-6">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={startTour}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 shadow-sm transition hover:bg-gray-50"
          title="Iniciar tutorial guiado"
        >
          <HelpCircle className="h-4 w-4" />
          Ayuda
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px]" onClick={closeTour} />
          <div className="fixed right-6 top-24 z-50 w-[min(380px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Paso {progress}</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{stepTitle}</h2>
              </div>
              <button
                type="button"
                onClick={closeTour}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Cerrar ayuda"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-3 text-sm font-semibold text-slate-500">{help.description}</p>
            <p className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-medium leading-6 text-slate-700">
              {stepText}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
                disabled={stepIndex === 0}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Atras
              </button>
              <div className="flex gap-1.5">
                {help.steps.map((step, index) => (
                  <span
                    key={step[0]}
                    className={`h-2 w-2 rounded-full ${index === stepIndex ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={nextStep}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                {isLast ? 'Finalizar' : 'Siguiente'}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default PageHelp;
