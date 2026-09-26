# Secretaría: paginación e índices

Las tablas de Secretaría usan páginas de 20 filas. El backend ordena por los registros más recientes (`id DESC`) y devuelve `meta.hasMore`; el frontend conserva las filas ya cargadas y solicita la siguiente página cuando el desplazamiento interno llega cerca del final.

La búsqueda se realiza en el backend para que escribir un criterio no descargue la tabla completa. Esto aplica a clientes, equipos, diagnósticos, tipos de repuesto, proveedores, compras, repuestos, facturas y garantías.

## Índices incluidos

`backend/scripts/modules/Secretaria/PaginacionIndices.sql` agrega índices para:

- estado activo y búsquedas básicas de clientes, proveedores y categorías;
- relaciones de equipos, diagnósticos, compras, repuestos y órdenes de repuestos;
- orden temporal de compras y órdenes;
- filtros de técnico, estado e inventario.

Los índices B-tree funcionan bien para igualdad y búsquedas por prefijo. Las búsquedas actuales usan `LIKE '%texto%'`; si la base supera muchas decenas de miles de filas, conviene habilitar `pg_trgm` y crear índices GIN para los campos de texto realmente consultados. No se recomienda crear índices trigram para todas las columnas desde el inicio porque aumentan el espacio y el costo de escritura.
