import './load-env';
import { execFileSync } from 'node:child_process';
import { cerrarPool, crearProducto, registrarEntrada } from '@/lib/dataService';
import { hoyBogota } from '@/lib/reglas/fechas';

function desplazarFecha(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

async function cargarDemo(): Promise<void> {
  execFileSync(process.execPath, ['scripts/limpiar-prueba.mjs'], { stdio: 'inherit' });
  const hoy = hoyBogota();

  await crearProducto({
    codigo: 'DEMO-LECHE',
    nombre: 'Leche fresca (demo)',
    categoria: 'perecedero',
    proveedor: 'Proveedor de demostración',
  });
  await crearProducto({
    codigo: 'DEMO-ARROZ',
    nombre: 'Arroz (demo)',
    categoria: 'no_perecedero',
    proveedor: 'Proveedor de demostración',
  });

  await registrarEntrada({
    codigo: 'DEMO-LECHE',
    cantidad: 5,
    fechaEntrada: hoy,
    fechaVencimiento: desplazarFecha(hoy, 3),
  });
  await registrarEntrada({
    codigo: 'DEMO-LECHE',
    cantidad: 5,
    fechaEntrada: hoy,
    fechaVencimiento: desplazarFecha(hoy, 30),
  });
  await registrarEntrada({
    codigo: 'DEMO-LECHE',
    cantidad: 2,
    fechaEntrada: desplazarFecha(hoy, -10),
    fechaVencimiento: desplazarFecha(hoy, -2),
  });
  await registrarEntrada({
    codigo: 'DEMO-ARROZ',
    cantidad: 6,
    fechaEntrada: hoy,
  });

  console.log('Datos demo cargados: DEMO-LECHE y DEMO-ARROZ.');
}

async function main(): Promise<void> {
  try {
    await cargarDemo();
  } finally {
    await cerrarPool();
  }
}

void main().catch((error: unknown) => {
  console.error('No se pudieron cargar los datos demo:', error);
  process.exitCode = 1;
});
