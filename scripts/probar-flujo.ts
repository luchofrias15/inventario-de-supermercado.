import './load-env';
import { execFileSync } from 'node:child_process';
import {
  cerrarPool,
  crearProducto,
  listarInventario,
  obtenerProducto,
  obtenerTiendaPredeterminada,
  productosParaReordenar,
  registrarEntrada,
  registrarSalida,
} from '@/lib/dataService';
import { ErrorDeNegocio } from '@/lib/reglas/errores';
import { hoyBogota } from '@/lib/reglas/fechas';

let fallas = 0;

function reportar(etiqueta: string, correcto: boolean, detalle = ''): void {
  console.log(`${correcto ? 'OK' : 'FALLA'} ${etiqueta}${detalle ? `: ${detalle}` : ''}`);
  if (!correcto) fallas += 1;
}

function desplazarFecha(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

function codigoError(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  if (error instanceof ErrorDeNegocio) return error.codigo;
  if ('code' in error && typeof error.code === 'string') return error.code;
  return undefined;
}

async function debeRechazar(
  etiqueta: string,
  operacion: () => Promise<unknown>,
  codigoEsperado: string,
): Promise<void> {
  try {
    await operacion();
    reportar(etiqueta, false, 'la operación fue aceptada');
  } catch (error) {
    const recibido = codigoError(error);
    reportar(
      etiqueta,
      recibido === codigoEsperado,
      `esperado ${codigoEsperado}, recibido ${recibido ?? 'sin código'}`,
    );
  }
}

async function ejecutar(): Promise<void> {
  execFileSync(process.execPath, ['scripts/limpiar-prueba.mjs', '--prueba'], {
    stdio: 'inherit',
  });

  const hoy = hoyBogota();
  const storeId = await obtenerTiendaPredeterminada();
  await crearProducto({
    codigo: 'TD-TEST-1',
    nombre: 'Leche de prueba',
    categoria: 'perecedero',
    precioUnitario: 2800,
  }, storeId);
  reportar('1. Crear TD-TEST-1 con stock inicial cero', true);

  await debeRechazar(
    '2. Rechazar código duplicado',
    () =>
      crearProducto({
        codigo: 'TD-TEST-1',
        nombre: 'Leche duplicada',
        categoria: 'perecedero',
        precioUnitario: 2800,
      }, storeId),
    'PRODUCTO_DUPLICADO',
  );

  await crearProducto({
    codigo: 'TD-TEST-2',
    nombre: 'Arroz de prueba',
    categoria: 'no_perecedero',
    precioUnitario: 3200,
  }, storeId);
  reportar('3. Crear TD-TEST-2 no perecedero', true);

  await debeRechazar(
    '4. Exigir vencimiento al perecedero',
    () => registrarEntrada({ codigo: 'TD-TEST-1', cantidad: 8, fechaEntrada: hoy }, storeId),
    'DATOS_INVALIDOS',
  );

  const lechePrimera = await registrarEntrada({
    codigo: 'TD-TEST-1',
    cantidad: 8,
    fechaEntrada: hoy,
    fechaVencimiento: desplazarFecha(hoy, 3),
  }, storeId);
  reportar('5. Registrar primer lote de leche', lechePrimera.stock === 8);

  const lecheSegunda = await registrarEntrada({
    codigo: 'TD-TEST-1',
    cantidad: 5,
    fechaEntrada: hoy,
    fechaVencimiento: desplazarFecha(hoy, 20),
  }, storeId);
  reportar('6. Registrar segundo lote de leche', lecheSegunda.stock === 13);

  const arrozEntrada = await registrarEntrada({
    codigo: 'TD-TEST-2',
    cantidad: 8,
    fechaEntrada: hoy,
  }, storeId);
  reportar('7. Registrar entrada no perecedera sin vencimiento', arrozEntrada.stock === 8);

  const inventario = await listarInventario({}, storeId);
  const lecheAntes = inventario.find((producto) => producto.codigo === 'TD-TEST-1');
  const arrozAntes = inventario.find((producto) => producto.codigo === 'TD-TEST-2');
  reportar(
    '8. Consultar inventario y aplicar el umbral inclusivo de reorden',
    lecheAntes?.stockDisponible === 13 &&
      lecheAntes.paraReordenar === false &&
      arrozAntes?.stockDisponible === 8 &&
      arrozAntes.paraReordenar === true,
    'Leche 13 normal; Arroz 8 para reordenar (RN-01, aunque el texto del plan dice que 8 no alerta)',
  );

  const ventaLeche = await registrarSalida('TD-TEST-1', 10, storeId);
  const lecheDespues = await obtenerProducto('TD-TEST-1', storeId);
  const primerLote = lecheDespues.lotes.find(
    (lote) => lote.fechaVencimiento === desplazarFecha(hoy, 3),
  );
  const segundoLote = lecheDespues.lotes.find(
    (lote) => lote.fechaVencimiento === desplazarFecha(hoy, 20),
  );
  reportar(
    '9. Vender por FEFO y activar reorden',
    ventaLeche.stock === 3 &&
      ventaLeche.paraReordenar &&
      primerLote?.cantidad === 0 &&
      segundoLote?.cantidad === 3,
  );

  await debeRechazar(
    '10. Rechazar venta superior al stock',
    () => registrarSalida('TD-TEST-2', 20, storeId),
    'STOCK_INSUFICIENTE',
  );
  const arrozTrasRechazo = await obtenerProducto('TD-TEST-2', storeId);
  reportar('10. Conservar stock después del rechazo', arrozTrasRechazo.stockDisponible === 8);

  const ventaIgual = await registrarSalida('TD-TEST-2', 8, storeId);
  reportar(
    '11. Permitir venta igual al stock',
    ventaIgual.stock === 0 && ventaIgual.paraReordenar,
  );

  await debeRechazar(
    '12. Rechazar fecha de vencimiento anterior a la entrada',
    () =>
      registrarEntrada({
        codigo: 'TD-TEST-1',
        cantidad: 1,
        fechaEntrada: hoy,
        fechaVencimiento: desplazarFecha(hoy, -1),
      }, storeId),
    'FECHA_INVALIDA',
  );

  const paraReorden = await productosParaReordenar(storeId);
  const codigosReorden = new Set(paraReorden.map((producto) => producto.codigo));
  reportar(
    '13. Listar ambos productos bajo el umbral de reorden',
    codigosReorden.has('TD-TEST-1') && codigosReorden.has('TD-TEST-2'),
  );

  await registrarSalida('TD-TEST-1', 3, storeId);
  await registrarEntrada({
    codigo: 'TD-TEST-1',
    cantidad: 4,
    fechaEntrada: desplazarFecha(hoy, -10),
    fechaVencimiento: desplazarFecha(hoy, -2),
  }, storeId);
  const productoConVencido = await obtenerProducto('TD-TEST-1', storeId);
  const loteVencido = productoConVencido.lotes.find(
    (lote) => lote.fechaVencimiento === desplazarFecha(hoy, -2),
  );
  await debeRechazar(
    '14. No vender un lote vencido cuando no hay stock vigente',
    () => registrarSalida('TD-TEST-1', 1, storeId),
    'STOCK_INSUFICIENTE',
  );
  reportar(
    '14. Mantener el lote vencido fuera del stock disponible',
    productoConVencido.stockDisponible === 0 && loteVencido?.estadoVencimiento === 'vencido',
  );
}

async function main(): Promise<void> {
  try {
    await ejecutar();
  } catch (error) {
    console.error('FALLA en el flujo de integración:', error);
    fallas += 1;
  } finally {
    try {
      execFileSync(process.execPath, ['scripts/limpiar-prueba.mjs', '--prueba'], {
        stdio: 'inherit',
      });
    } catch (error) {
      console.error('FALLA al limpiar los productos de prueba:', error);
      fallas += 1;
    }
    await cerrarPool();
  }

  console.log(`\nTotal de fallas: ${fallas}`);
  if (fallas > 0) process.exitCode = 1;
}

void main().catch((error: unknown) => {
  console.error('No se pudo completar la prueba de flujo:', error);
  process.exitCode = 1;
});
