import { z } from 'zod';
import { CATEGORIAS } from '@/lib/config/tienda';
import { esFechaValida } from '@/lib/reglas/fechas';

const esquemaFecha = z.string().refine(esFechaValida, 'Use una fecha válida en formato YYYY-MM-DD.');

export const esquemaProducto = z.object({
  codigo: z.string().trim().min(1).max(40),
  nombre: z.string().trim().min(1).max(160),
  categoria: z.enum(CATEGORIAS),
  precioUnitario: z.number().int().positive().max(999999999999),
  proveedor: z.string().trim().max(120).optional(),
});

export const esquemaEntrada = z.object({
  codigo: z.string().trim().min(1).max(40),
  cantidad: z.number().int().min(1),
  fechaEntrada: esquemaFecha,
  fechaVencimiento: esquemaFecha.optional(),
});

export const esquemaSalida = z.object({
  codigo: z.string().trim().min(1).max(40),
  cantidad: z.number().int().min(1),
});

export const esquemaCrearPedido = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    cantidad: z.number().int().min(1).max(100),
  })).min(1).max(30).superRefine((items, contexto) => {
    if (new Set(items.map((item) => item.productId)).size !== items.length) {
      contexto.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El carrito contiene productos repetidos.',
      });
    }
  }),
  nombre: z.string().trim().min(1).max(120),
  telefono: z.string().trim().min(7).max(30),
  direccion: z.string().trim().min(5).max(240),
  barrio: z.string().trim().min(2).max(120),
  instrucciones: z.string().trim().max(500).default(''),
  metodoPago: z.enum(['transferencia', 'efectivo']),
});

export const esquemaRevisionPedido = z.object({
  id: z.string().uuid(),
  decision: z.enum(['accepted', 'rejected']),
});

export const esquemaEditarPedido = esquemaCrearPedido.extend({
  pedidoId: z.string().uuid(),
});

export const esquemaCancelarPedido = z.object({
  pedidoId: z.string().uuid(),
});

export const esquemaFiltros = z.object({
  soloReorden: z
    .enum(['true', 'false'])
    .transform((valor) => valor === 'true')
    .optional(),
  busqueda: z.string().trim().max(120).optional(),
});

export const esquemaRango = z
  .object({
    desde: esquemaFecha,
    hasta: esquemaFecha,
  })
  .refine((rango) => rango.desde <= rango.hasta, {
    path: ['hasta'],
    message: 'La fecha final debe ser igual o posterior a la inicial.',
  });

export type DatosProductoValidado = z.infer<typeof esquemaProducto>;
export type DatosEntradaValidada = z.infer<typeof esquemaEntrada>;
export type DatosSalidaValidada = z.infer<typeof esquemaSalida>;
export type FiltrosValidados = z.infer<typeof esquemaFiltros>;
export type RangoValidado = z.infer<typeof esquemaRango>;
