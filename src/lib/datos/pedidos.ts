import { conTransaccion, consultar } from '@/lib/db/conexion';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { descontarPorFefo, hayStockSuficiente } from '@/lib/reglas/inventario';
import { hoyBogota } from '@/lib/reglas/fechas';
import type { EstadoPedido, MetodoPagoPedido, Pedido } from './tipos';

export interface DatosCrearPedido {
  items: Array<{ productId: string; cantidad: number }>;
  nombre: string;
  telefono: string;
  direccion: string;
  barrio: string;
  instrucciones: string;
  metodoPago: MetodoPagoPedido;
}

interface PedidoDb {
  id: string;
  store_id: string;
  store_name: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_neighborhood: string;
  delivery_instructions: string;
  payment_method: MetodoPagoPedido;
  status: EstadoPedido;
  subtotal: number | string;
  created_at: string;
  items: Array<{
    productId: string;
    codigo: string;
    nombre: string;
    precioUnitario: number | string;
    cantidad: number;
    total: number | string;
  }>;
}

function mapearPedido(pedido: PedidoDb): Pedido {
  return {
    id: pedido.id,
    storeId: pedido.store_id,
    tienda: pedido.store_name,
    customerId: pedido.customer_id,
    correoCliente: pedido.customer_email,
    nombreCliente: pedido.customer_name,
    telefonoCliente: pedido.customer_phone,
    direccion: pedido.delivery_address,
    barrio: pedido.delivery_neighborhood,
    instrucciones: pedido.delivery_instructions,
    metodoPago: pedido.payment_method,
    estado: pedido.status,
    subtotal: Number(pedido.subtotal),
    creadoEn: pedido.created_at,
    items: pedido.items.map((item) => ({
      productId: item.productId,
      codigo: item.codigo,
      nombre: item.nombre,
      precioUnitario: Number(item.precioUnitario),
      cantidad: item.cantidad,
      total: Number(item.total),
    })),
  };
}

const PEDIDO_SELECT = `
  SELECT orders.id, orders.store_id, stores.name AS store_name,
         orders.customer_id, orders.customer_email, orders.customer_name,
         orders.customer_phone, orders.delivery_address,
         orders.delivery_neighborhood, orders.delivery_instructions,
         orders.payment_method, orders.status, orders.subtotal,
         orders.created_at,
         COALESCE(
           jsonb_agg(jsonb_build_object(
             'productId', items.product_id,
             'codigo', items.product_code,
             'nombre', items.product_name,
             'precioUnitario', items.unit_price,
             'cantidad', items.quantity,
             'total', items.line_total
           ) ORDER BY items.id) FILTER (WHERE items.id IS NOT NULL),
           '[]'::jsonb
         ) AS items
  FROM public.store_orders AS orders
  JOIN public.stores AS stores ON stores.id = orders.store_id
  LEFT JOIN public.store_order_items AS items ON items.order_id = orders.id
`;

export async function listarPedidosCliente(customerId: string): Promise<Pedido[]> {
  const pedidos = await consultar<PedidoDb>(
    `${PEDIDO_SELECT}
     WHERE orders.customer_id = $1
     GROUP BY orders.id, stores.name
     ORDER BY orders.created_at DESC
     LIMIT 100`,
    [customerId],
  );
  return pedidos.map(mapearPedido);
}

export async function listarPedidosTienda(storeId: string): Promise<Pedido[]> {
  const pedidos = await consultar<PedidoDb>(
    `${PEDIDO_SELECT}
     WHERE orders.store_id = $1
     GROUP BY orders.id, stores.name
     ORDER BY orders.created_at DESC
     LIMIT 100`,
    [storeId],
  );
  return pedidos.map(mapearPedido);
}

interface ProductoPedidoDb {
  id: string;
  codigo: string;
  nombre: string;
  precio_unitario: number | string | null;
  activo: boolean;
  stock_disponible: number;
}

export async function crearPedido(
  customerId: string,
  customerEmail: string,
  storeId: string,
  datos: DatosCrearPedido,
): Promise<{ id: string; subtotal: number }> {
  return conTransaccion(async (transaccion) => {
    const ids = datos.items.map((item) => item.productId);
    const productos = await transaccion.query<ProductoPedidoDb>(
      `SELECT productos.id, productos.codigo, productos.nombre,
              productos.precio_unitario, productos.activo,
              COALESCE((
                SELECT SUM(lotes.cantidad)
                FROM public.lotes AS lotes
                WHERE lotes.producto_id = productos.id
                  AND (lotes.fecha_vencimiento IS NULL OR lotes.fecha_vencimiento >= $3::date)
              ), 0)::integer AS stock_disponible
       FROM public.productos AS productos
       WHERE productos.id = ANY($1::uuid[])
         AND productos.store_id = $2
       ORDER BY productos.id
       FOR UPDATE`,
      [ids, storeId, hoyBogota()],
    );
    if (productos.rows.length !== ids.length) {
      throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Uno o más productos ya no están disponibles.');
    }

    const productosPorId = new Map(productos.rows.map((producto) => [producto.id, producto]));
    let subtotal = 0;
    const lineas = datos.items.map((item) => {
      const producto = productosPorId.get(item.productId);
      if (!producto?.activo || producto.precio_unitario === null) {
        throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Un producto no tiene precio o dejó de estar disponible.');
      }
      if (!hayStockSuficiente(producto.stock_disponible, item.cantidad)) {
        throw new ErrorDeNegocio('STOCK_INSUFICIENTE', undefined, {
          producto: producto.nombre,
          disponible: producto.stock_disponible,
        });
      }
      const precioUnitario = Number(producto.precio_unitario);
      if (!Number.isSafeInteger(precioUnitario) || precioUnitario <= 0) {
        throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Un producto tiene un precio inválido.');
      }
      const total = precioUnitario * item.cantidad;
      subtotal += total;
      if (!Number.isSafeInteger(subtotal) || subtotal > 999999999999.99) {
        throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El total del pedido supera el límite permitido.');
      }
      return { item, producto, precioUnitario, total };
    });

    const pedido = await transaccion.query<{ id: string }>(
      `INSERT INTO public.store_orders (
         store_id, customer_id, customer_email, customer_name,
         customer_phone, delivery_address, delivery_neighborhood,
         delivery_instructions, payment_method, subtotal
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        storeId,
        customerId,
        customerEmail,
        datos.nombre,
        datos.telefono,
        datos.direccion,
        datos.barrio,
        datos.instrucciones,
        datos.metodoPago,
        subtotal,
      ],
    );
    const orderId = pedido.rows[0]?.id;
    if (!orderId) throw new Error('La base de datos no devolvió el pedido creado.');

    for (const linea of lineas) {
      await transaccion.query(
        `INSERT INTO public.store_order_items (
           order_id, product_id, product_code, product_name,
           unit_price, quantity, line_total
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          linea.producto.id,
          linea.producto.codigo,
          linea.producto.nombre,
          linea.precioUnitario,
          linea.item.cantidad,
          linea.total,
        ],
      );
    }
    return { id: orderId, subtotal };
  });
}

export async function editarPedidoCliente(
  pedidoId: string,
  customerId: string,
  datos: DatosCrearPedido,
): Promise<{ id: string; subtotal: number }> {
  return conTransaccion(async (transaccion) => {
    const pedido = await transaccion.query<{ id: string; store_id: string; status: EstadoPedido }>(
      `SELECT id, store_id, status
       FROM public.store_orders
       WHERE id = $1 AND customer_id = $2
       FOR UPDATE`,
      [pedidoId, customerId],
    );
    const actual = pedido.rows[0];
    if (!actual) throw new ErrorDeNegocio('DATOS_INVALIDOS', 'No se encontró el pedido.');
    if (actual.status !== 'pending') {
      throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Solo puedes editar pedidos pendientes.');
    }

    const ids = datos.items.map((item) => item.productId);
    const productos = await transaccion.query<ProductoPedidoDb>(
      `SELECT productos.id, productos.codigo, productos.nombre,
              productos.precio_unitario, productos.activo,
              COALESCE((
                SELECT SUM(lotes.cantidad)
                FROM public.lotes AS lotes
                WHERE lotes.producto_id = productos.id
                  AND (lotes.fecha_vencimiento IS NULL OR lotes.fecha_vencimiento >= $3::date)
              ), 0)::integer AS stock_disponible
       FROM public.productos AS productos
       WHERE productos.id = ANY($1::uuid[])
         AND productos.store_id = $2
       ORDER BY productos.id
       FOR UPDATE`,
      [ids, actual.store_id, hoyBogota()],
    );
    if (productos.rows.length !== ids.length) {
      throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Uno o más productos ya no están disponibles en esta tienda.');
    }

    const productosPorId = new Map(productos.rows.map((producto) => [producto.id, producto]));
    let subtotal = 0;
    const lineas = datos.items.map((item) => {
      const producto = productosPorId.get(item.productId);
      if (!producto?.activo || producto.precio_unitario === null) {
        throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Un producto no tiene precio o dejó de estar disponible.');
      }
      if (!hayStockSuficiente(producto.stock_disponible, item.cantidad)) {
        throw new ErrorDeNegocio('STOCK_INSUFICIENTE', undefined, {
          producto: producto.nombre,
          disponible: producto.stock_disponible,
        });
      }
      const precioUnitario = Number(producto.precio_unitario);
      if (!Number.isSafeInteger(precioUnitario) || precioUnitario <= 0) {
        throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Un producto tiene un precio inválido.');
      }
      const total = precioUnitario * item.cantidad;
      subtotal += total;
      if (!Number.isSafeInteger(subtotal) || subtotal > 999999999999.99) {
        throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El total del pedido supera el límite permitido.');
      }
      return { item, producto, precioUnitario, total };
    });

    await transaccion.query(
      `UPDATE public.store_orders
       SET customer_name = $3,
           customer_phone = $4,
           delivery_address = $5,
           delivery_neighborhood = $6,
           delivery_instructions = $7,
           payment_method = $8,
           subtotal = $9
       WHERE id = $1 AND customer_id = $2`,
      [
        pedidoId,
        customerId,
        datos.nombre,
        datos.telefono,
        datos.direccion,
        datos.barrio,
        datos.instrucciones,
        datos.metodoPago,
        subtotal,
      ],
    );
    await transaccion.query(
      'DELETE FROM public.store_order_items WHERE order_id = $1',
      [pedidoId],
    );
    for (const linea of lineas) {
      await transaccion.query(
        `INSERT INTO public.store_order_items (
           order_id, product_id, product_code, product_name,
           unit_price, quantity, line_total
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          pedidoId,
          linea.producto.id,
          linea.producto.codigo,
          linea.producto.nombre,
          linea.precioUnitario,
          linea.item.cantidad,
          linea.total,
        ],
      );
    }
    return { id: pedidoId, subtotal };
  });
}

export async function cancelarPedidoCliente(pedidoId: string, customerId: string): Promise<void> {
  const pedidos = await consultar<{ id: string }>(
    `UPDATE public.store_orders
     SET status = 'cancelled', reviewed_at = now()
     WHERE id = $1 AND customer_id = $2 AND status = 'pending'
     RETURNING id`,
    [pedidoId, customerId],
  );
  if (pedidos.length === 0) {
    throw new ErrorDeNegocio(
      'DATOS_INVALIDOS',
      'No se encontró un pedido pendiente que puedas cancelar.',
    );
  }
}

interface ItemParaAceptarDb {
  product_id: string;
  quantity: number;
}

interface ProductoParaAceptarDb {
  id: string;
  store_id: string;
  activo: boolean;
}

interface LoteParaAceptarDb {
  id: number;
  cantidad: number;
}

export async function revisarPedido(
  pedidoId: string,
  storeId: string,
  administradorId: string,
  decision: 'accepted' | 'rejected',
): Promise<void> {
  await conTransaccion(async (transaccion) => {
    const pedido = await transaccion.query<{ status: EstadoPedido }>(
      `SELECT status
       FROM public.store_orders
       WHERE id = $1 AND store_id = $2
       FOR UPDATE`,
      [pedidoId, storeId],
    );
    if (!pedido.rows[0]) throw new ErrorDeNegocio('DATOS_INVALIDOS', 'No se encontró el pedido.');
    if (pedido.rows[0].status !== 'pending') {
      throw new ErrorDeNegocio('DATOS_INVALIDOS', 'El pedido ya fue revisado.');
    }

    if (decision === 'accepted') {
      const items = await transaccion.query<ItemParaAceptarDb>(
        `SELECT product_id, quantity
         FROM public.store_order_items
         WHERE order_id = $1
         ORDER BY product_id`,
        [pedidoId],
      );
      const productos = await transaccion.query<ProductoParaAceptarDb>(
        `SELECT id, store_id, activo
         FROM public.productos
         WHERE id = ANY($1::uuid[])
           AND store_id = $2
         ORDER BY id
         FOR UPDATE`,
        [items.rows.map((item) => item.product_id), storeId],
      );
      if (productos.rows.length !== items.rows.length || productos.rows.some((p) => !p.activo)) {
        throw new ErrorDeNegocio('DATOS_INVALIDOS', 'Un producto del pedido ya no está disponible.');
      }

      for (const item of items.rows) {
        const lotes = await transaccion.query<LoteParaAceptarDb>(
          `SELECT id, cantidad
           FROM public.lotes
           WHERE producto_id = $1
             AND cantidad > 0
             AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= $2::date)
           ORDER BY fecha_vencimiento ASC NULLS LAST, fecha_entrada ASC, id ASC
           FOR UPDATE`,
          [item.product_id, hoyBogota()],
        );
        const disponible = lotes.rows.reduce((total, lote) => total + lote.cantidad, 0);
        if (!hayStockSuficiente(disponible, item.quantity)) {
          throw new ErrorDeNegocio('STOCK_INSUFICIENTE', undefined, { disponible });
        }

        const descuentos = descontarPorFefo(lotes.rows, item.quantity);
        for (const descuento of descuentos) {
          const resultado = await transaccion.query(
            `UPDATE public.lotes
             SET cantidad = cantidad - $2
             WHERE id = $1 AND cantidad >= $2`,
            [descuento.loteId, descuento.descuento],
          );
          if (resultado.rowCount !== 1) throw new Error('Un lote cambió durante la aceptación del pedido.');
        }
        await transaccion.query(
          `INSERT INTO public.movimientos (producto_id, tipo, cantidad, fecha)
           VALUES ($1, 'salida', $2, $3)`,
          [item.product_id, item.quantity, hoyBogota()],
        );
      }
    }

    await transaccion.query(
      `UPDATE public.store_orders
       SET status = $3, reviewed_at = now(), reviewed_by = $4
       WHERE id = $1 AND store_id = $2`,
      [pedidoId, storeId, decision, administradorId],
    );
  });
}
