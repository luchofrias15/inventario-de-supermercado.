import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consultar } from '@/lib/db/conexion';
import { hoyBogota } from '@/lib/reglas/fechas';
import { lotesPorVencer } from './alertas';
import { reporteRotacion } from './reportes';

vi.mock('@/lib/db/conexion', () => ({ consultar: vi.fn() }));

const consultarMock = vi.mocked(consultar);

function desplazarFecha(fecha: string, dias: number): string {
  const resultado = new Date(`${fecha}T00:00:00.000Z`);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado.toISOString().slice(0, 10);
}

beforeEach(() => {
  consultarMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lotesPorVencer', () => {
  it('clasifica vencimientos con la fecha de Bogotá y conserva datos del producto', async () => {
    const hoy = hoyBogota();
    consultarMock.mockResolvedValueOnce([
      {
        id: 8,
        cantidad: 4,
        fecha_entrada: desplazarFecha(hoy, -10),
        fecha_vencimiento: desplazarFecha(hoy, -1),
        codigo: 'LECHE-1',
        nombre: 'Leche',
      },
      {
        id: 9,
        cantidad: 3,
        fecha_entrada: hoy,
        fecha_vencimiento: desplazarFecha(hoy, 5),
        codigo: 'LECHE-2',
        nombre: 'Leche',
      },
    ]);

    await expect(lotesPorVencer()).resolves.toEqual([
      {
        id: 8,
        cantidad: 4,
        fechaEntrada: desplazarFecha(hoy, -10),
        fechaVencimiento: desplazarFecha(hoy, -1),
        estadoVencimiento: 'vencido',
        codigo: 'LECHE-1',
        nombre: 'Leche',
      },
      {
        id: 9,
        cantidad: 3,
        fechaEntrada: hoy,
        fechaVencimiento: desplazarFecha(hoy, 5),
        estadoVencimiento: 'por_vencer',
        codigo: 'LECHE-2',
        nombre: 'Leche',
      },
    ]);
    expect(consultarMock.mock.calls[0]?.[1]).toEqual([hoy, 5]);
    expect(consultarMock.mock.calls[0]?.[0]).toContain('l.cantidad > 0');
  });
});

describe('reporteRotacion', () => {
  it('devuelve los productos en el orden de ventas y consulta el rango inclusivo', async () => {
    consultarMock.mockResolvedValueOnce([
      { codigo: 'A', nombre: 'Arroz', unidades_vendidas: 12 },
      { codigo: 'L', nombre: 'Leche', unidades_vendidas: 7 },
    ]);

    await expect(reporteRotacion('2026-11-01', '2026-11-14')).resolves.toEqual([
      { codigo: 'A', nombre: 'Arroz', unidadesVendidas: 12 },
      { codigo: 'L', nombre: 'Leche', unidadesVendidas: 7 },
    ]);
    expect(consultarMock.mock.calls[0]?.[1]).toEqual(['2026-11-01', '2026-11-14']);
    expect(consultarMock.mock.calls[0]?.[0]).toContain("m.tipo = 'salida'");
    expect(consultarMock.mock.calls[0]?.[0]).toContain('ORDER BY unidades_vendidas DESC');
  });
});
