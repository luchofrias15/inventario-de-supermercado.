# Inventario de Tienda · Plan técnico de implementación

> Sistema de inventario para tienda de barrio · versión técnica 1.0, derivada del plan funcional de Luis Rodríguez
> Asignatura: Lógica y Programación (SIST0200) · Universidad Sergio Arboleda, Santa Marta · Docente: Jhonatan Castro Polo
> Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Postgres · Despliegue en Vercel
> Ejecución: GitHub Copilot en modo Agente, con los prompts de `doc/PROMPTS_TIENDA.md`

---

## Índice

0. [Cómo se usa este documento](#0-cómo-se-usa-este-documento)
1. [Punto de partida y conciliación](#1-punto-de-partida-y-conciliación)
2. [Advertencia de seguridad previa](#2-advertencia-de-seguridad-previa)
3. [Traducción del stack del plan funcional](#3-traducción-del-stack-del-plan-funcional)
4. [Alcance](#4-alcance)
5. [Acceso](#5-acceso)
6. [Estados derivados](#6-estados-derivados)
7. [Reglas de negocio](#7-reglas-de-negocio)
8. [Lotes, stock y vencimiento](#8-lotes-stock-y-vencimiento)
9. [Casos de uso](#9-casos-de-uso)
10. [Modelo de datos](#10-modelo-de-datos)
11. [Arquitectura del código](#11-arquitectura-del-código)
12. [Contratos de API](#12-contratos-de-api)
13. [Pantallas](#13-pantallas)
14. [Identidad visual](#14-identidad-visual)
15. [Números, fechas y zona horaria](#15-números-fechas-y-zona-horaria)
16. [Seguridad e integridad](#16-seguridad-e-integridad)
17. [Pruebas](#17-pruebas)
18. [Plan de ejecución](#18-plan-de-ejecución)
19. [Funcionalidades opcionales](#19-funcionalidades-opcionales)
20. [Glosario](#20-glosario)

---

## 0. Cómo se usa este documento

Este plan es el documento rector del proyecto. Copilot lo lee antes de cada tarea y los prompts remiten a sus secciones por número. Si un prompt y este plan no coinciden, prevalece el plan.

El plan funcional describe un programa en Python + SQLite por consola. Este plan técnico conserva todas sus reglas (reorden, vencimiento, stock no negativo, con sus casos límite) y las traduce al stack del curso. El primer prompt (P00) concilia lo que exista; si se parte de cero, antes está el P-INIT de fundación en los prompts.

| Archivo en el repositorio | Función |
|---|---|
| `doc/PLAN_TIENDA.md` | Este documento |
| `doc/PROMPTS_TIENDA.md` | Prompts en orden de ejecución |
| `doc/ESTADO_ACTUAL.md` | Radiografía del repositorio antes de empezar (lo crea P00) |
| `doc/DICTAMEN.md` | Qué existe, qué falta y qué se crea o adapta |
| `doc/ESTADO_EJECUCION.md` | Avance prompt por prompt |
| `doc/checkpoints/FASE_N_COMPLETADA.md` | Evidencia del cierre de cada fase |
| `.github/copilot-instructions.md` | Reglas permanentes que Copilot aplica en todas las conversaciones |

---

## 1. Punto de partida y conciliación

### 1.1 Lo que el proyecto necesita

- Proyecto Next.js con TypeScript, desplegado en Vercel.
- Proyecto Supabase para la base de datos.
- Un login como puerta de acceso.

P00 verifica qué hay y el dictamen marca cada pieza como existe / falta / se crea. Si no hay proyecto todavía, el P-INIT de los prompts lo levanta.

### 1.2 Lo que P00 verifica (y el dictamen resuelve)

| Aspecto | Qué decide |
|---|---|
| Si existe el proyecto Next.js con TypeScript y compila | Si hay base o hay que crearla (P-INIT) |
| Si existe conexión a Postgres en `.env.local` (copiada desde Vercel) | Confirma el nombre de la variable que usará `lib/db/conexion.ts` |
| Si hay login | Si se envuelve (sin reescribir) o se agrega uno mínimo |
| Mecanismo de migraciones | Si existe se usa; si no, se crea `npm run db:migrar` |
| Versión de Tailwind | Define dónde se declaran los colores (sección 14) |
| Qué del dominio ya está construido | Para adaptarlo en vez de rehacerlo |

### 1.3 Regla sobre el login

El plan funcional es de un solo operador (el dueño) y deja el control de acceso fuera. En el stack del curso la aplicación queda publicada en una URL de Vercel; se usa un login como puerta única de acceso, sin roles. El login no se reescribe; solo se agrega el adaptador `lib/auth/sesion.ts` (`obtenerSesion`, `exigirSesion`), la protección de `/tienda/*` y `/api/tienda/*`, y la redirección posterior al login hacia `/tienda`.

---

## 2. Advertencia de seguridad previa

El plan funcional entregado incluía al final un bloque `.env` con credenciales reales de Supabase: la `SERVICE_ROLE_KEY`, la `SECRET_KEY`, el `JWT_SECRET` y la contraseña de la base de datos. Antes de ejecutar estos prompts:

1. **Rotar las llaves de Supabase:** Settings, API, "Roll" de la `anon key` y la `service_role key`.
2. **Cambiar la contraseña de la base de datos:** Settings, Database, "Reset database password".
3. **Actualizar `.env.local` y las variables de Vercel** con los valores nuevos.
4. **Confirmar que `.env.local` está en `.gitignore`** y que ningún archivo del repositorio ni de la entrega contiene valores de variables de entorno.
5. **No volver a pegar un archivo `.env` en un documento.**

La `SERVICE_ROLE_KEY` salta toda la seguridad de la base de datos: mientras no se rote, cualquiera que haya visto el documento puede leer y modificar los datos. Este paso es obligatorio y previo a todo lo demás.

---

## 3. Traducción del stack del plan funcional

El plan funcional elige Python + SQLite por consola. Ese stack no es el del curso y el archivo `.db` local no persiste en Vercel (serverless, sistema de archivos efímero). La lógica no cambia; cambia dónde viven los datos y cómo se interactúa.

| Pieza del plan funcional | En este plan técnico | Motivo |
|---|---|---|
| Python por consola (CLI) | Next.js (App Router) + TypeScript, interfaz web | Es el stack del curso |
| SQLite (`.db` local) | Supabase Postgres | El `.db` no persiste en Vercel; Postgres da el mismo valor (transacciones, integridad) |
| Validaciones en la capa de lógica | Igual, en `lib/reglas/` (funciones puras) | El plan ya decide centralizar las reglas en una capa; se conserva y se prueba con Vitest |
| Lotes de entrada con su vencimiento | Tabla `lotes`; el stock del producto es la suma de sus lotes | El plan ya modela el lote; permite evaluar vencimiento por lote |
| Movimientos (entrada/salida) | Tabla `movimientos` | Igual; sostiene el reporte de rotación (opcional) |

Lo que **no cambia**: productos y su categoría, el punto de reorden fijo (10), las reglas de vencimiento (5 días) y de stock no negativo con sus casos límite, y el reporte de rotación.

---

## 4. Alcance

### 4.1 Módulo mínimo (el del plan funcional)

| ID | Funcionalidad (plan funcional) | Casos de uso | Prompts |
|---|---|---|---|
| F1 | Registrar entrada de mercancía (suma al stock; lote con vencimiento si es perecedero) | CU-02 | P02, P04, P05, P07 |
| F2 | Registrar salida por venta (valida vencido y stock; descuenta) | CU-03 | P02, P04, P05, P08 |
| F3 | Consultar el stock de un producto o de todo el inventario | CU-04 | P04, P06 |
| F4 | Alertar cuando el stock baja del punto de reorden (≤ 10) | CU-05 | P02, P06, P08 |

El módulo mínimo necesita también registrar los productos (su catálogo), que el plan asume; se incluye como soporte (CU-01).

### 4.2 Funcionalidades opcionales

| ID | Funcionalidad | Casos de uso | Prompts |
|---|---|---|---|
| F5 | Alertar productos próximos a vencer y vencidos | CU-06 | P02, P08, P09 |
| F6 | Reporte de rotación: productos más vendidos en un periodo | CU-07 | P09 |

Se construyen solo con la fase 5 cerrada. (El vencido se evalúa desde el módulo mínimo, porque bloquea la venta; la pantalla de alertas de vencimiento es opcional.)

### 4.3 Fuera de alcance

Se mantiene la lista del plan funcional: múltiples locales, facturación electrónica o DIAN, gestión de proveedores más allá del nombre, descuentos o promociones, roles de usuario, cálculo automático del punto de reorden por producto, e interfaz gráfica compleja.

### 4.4 Decisiones de alcance de esta versión técnica

| Decisión | Motivo |
|---|---|
| Los datos viven en Supabase Postgres | Para que persistan en producción (el `.db` no sirve en Vercel) |
| El stock de un producto es la suma de las cantidades disponibles de sus lotes | El plan modela lotes con vencimiento; el stock derivado evita descuadres |
| La salida descuenta por lotes, del que vence primero (FEFO) | Vender primero lo que caduca antes reduce la pérdida por vencimiento, que es el problema del plan |
| El estado (para reorden, por vencer, vencido) se calcula al leer, no se guarda | Depende del stock y de la fecha de hoy, que cambia cada día |
| Un producto vencido (tiene lotes vencidos con stock) no puede venderse de esos lotes; la venta solo toma lotes no vencidos | Regla 2 del plan |
| El punto de reorden es fijo en 10 para todos | Regla 1 del plan |
| Montos (si se usan en el reporte) y cantidades en enteros | El plan trabaja con unidades enteras |
| Un producto no se elimina; se puede desactivar | Un producto con movimientos debe seguir en el historial |

---

## 5. Acceso

| Actor | Acceso | Puede hacer |
|---|---|---|
| Dueño | Login como puerta | Registrar productos, entradas y salidas; consultar stock; ver alertas de reorden; (opcional) alertas de vencimiento y reporte de rotación |
| Sistema | Interno | Valida entradas, suma y descuenta stock por lotes, deriva los estados y las alertas |

| Ruta | Sin sesión | Con sesión |
|---|:-:|:-:|
| `/` | Redirige al login | Redirige a `/tienda` |
| `/tienda/*` | Redirige al login | Sí |
| `/api/tienda/*` | 401 | Sí |

---

## 6. Estados derivados

Ningún estado se guarda como campo editable; todos se calculan al leer.

### 6.1 Estado de stock del producto

| Condición | Estado |
|---|---|
| Stock disponible (suma de lotes no vencidos) ≤ 10 | Para reordenar (RN-01) |
| Stock disponible > 10 | Normal |

### 6.2 Estado de vencimiento de un lote perecedero

| Condición | Estado |
|---|---|
| La fecha de vencimiento ya pasó | Vencido (no vendible, RN-02) |
| Faltan 5 días o menos | Por vencer (RN-02) |
| Faltan más de 5 días | Vigente |

Un producto no perecedero no tiene vencimiento (RN-04).

---

## 7. Reglas de negocio

| ID | Regla | Origen | Dónde se aplica |
|---|---|---|---|
| RN-01 | Punto de reorden fijo: un producto se marca para reordenar cuando su stock disponible es ≤ 10 (10 inclusive) | Regla 1 | `lib/reglas/alertas.ts` `paraReordenar` |
| RN-02 | Un lote perecedero está "por vencer" si faltan 5 días o menos (5 inclusive); "vencido" si la fecha ya pasó, y un lote vencido no se puede vender | Regla 2 | `lib/reglas/vencimiento.ts`; servicio de venta |
| RN-03 | No se permite stock negativo: una salida mayor al stock disponible se rechaza por completo; una salida igual al stock se permite (queda en 0) | Regla 3 | `lib/reglas/inventario.ts`; transacción |
| RN-04 | Solo los productos perecederos exigen fecha de vencimiento al registrar una entrada; los no perecederos no la exigen ni se evalúan por vencimiento | Regla 4 | `lib/reglas/lote.ts`; servicio de entrada |
| RN-05 | Una entrada suma la cantidad al stock registrando un lote; si es perecedero, el lote lleva su fecha de vencimiento | Sección 4.1 del plan | Servicio `registrarEntrada` |
| RN-06 | El stock disponible de un producto es la suma de las cantidades de sus lotes no vencidos | Agregada (coherencia con lotes) | `lib/datos/productos.ts`; vista |
| RN-07 | La salida descuenta de los lotes no vencidos, empezando por el que vence primero (FEFO) | Agregada (reduce pérdida por vencimiento) | Servicio `registrarSalida` |
| RN-08 | La cantidad de una entrada o salida es un entero mayor que 0 | Agregada | `lib/reglas/inventario.ts`; Zod; BD CHECK |
| RN-09 | El código del producto es único; nombre y categoría obligatorios; categoría es perecedero o no perecedero | Sección 5 | BD UNIQUE, CHECK; Zod |
| RN-10 | Todo movimiento (entrada/salida) queda registrado con su producto, tipo, cantidad y fecha | Sección 5 | Servicio; tabla `movimientos` |
| RN-11 | Los movimientos y los lotes no se editan ni se borran; un producto se desactiva, no se elimina | Agregada | Servicio; BD `ON DELETE RESTRICT` |
| RN-12 | La fecha de vencimiento de un lote no puede ser anterior a su fecha de entrada | Agregada | `lib/reglas/lote.ts`; BD CHECK |

### 7.1 Casos límite (del plan)

| Caso | Resultado |
|---|---|
| Stock 10 | Para reordenar (RN-01, inclusivo) |
| Stock 11 | Normal |
| Lote con 5 días para vencer | Por vencer (RN-02, inclusivo) |
| Lote cuya fecha ya pasó | Vencido; no vendible |
| Venta de cantidad igual al stock | Permitida; queda en 0 (RN-03) |
| Venta de cantidad mayor al stock | Rechazo total (`STOCK_INSUFICIENTE`); no descuenta nada (RN-03) |
| Entrada de perecedero sin fecha de vencimiento | Rechazo (`DATOS_INVALIDOS`, RN-04) |
| Entrada de no perecedero con fecha de vencimiento | Se ignora la fecha o se rechaza según el plan; este plan la ignora y no la guarda (RN-04) |
| Venta cuando solo quedan lotes vencidos | Rechazo (`STOCK_INSUFICIENTE`): el stock vendible excluye lo vencido |

---

## 8. Lotes, stock y vencimiento

El plan introduce el lote (cada entrada es un lote, y un perecedero lleva su fecha de vencimiento). De ahí se derivan tres cosas:

- **Stock disponible** de un producto = suma de las cantidades de sus lotes **no vencidos** (RN-06). Un lote vencido no cuenta como vendible.
- **Venta por FEFO** (first expired, first out): la salida descuenta de los lotes no vencidos empezando por el de fecha de vencimiento más próxima; los no perecederos se descuentan por orden de entrada (RN-07). Así se despacha primero lo que caduca antes.
- **Estado de vencimiento** por lote (sección 6.2), con la fecha de hoy.

```ts
// lib/reglas/vencimiento.ts
export type EstadoVencimiento = 'vigente' | 'por_vencer' | 'vencido';
export function estadoVencimiento(fechaVencimiento: string, hoy: string, diasAviso: number): EstadoVencimiento {
  const dias = diasEntre(hoy, fechaVencimiento);
  if (dias < 0) return 'vencido';           // RN-02
  if (dias <= diasAviso) return 'por_vencer';  // RN-02 (5 inclusive)
  return 'vigente';
}

// lib/reglas/inventario.ts
export function validarCantidad(cantidad: number): void;   // entero > 0 (RN-08)
export function hayStockSuficiente(disponible: number, cantidad: number): boolean {
  return cantidad <= disponible;   // RN-03 (igual permite)
}

// lib/reglas/alertas.ts
export function paraReordenar(stockDisponible: number, puntoReorden: number): boolean {
  return stockDisponible <= puntoReorden;   // RN-01 (<= 10)
}
```

La venta se resuelve en una transacción: se leen y bloquean los lotes no vencidos del producto, se comprueba que su suma cubre la cantidad (si no, `STOCK_INSUFICIENTE` y no se toca nada), y se descuenta por FEFO.

Ejemplos (reorden 10, aviso 5 días, hoy 2026-06-15): stock 10 → reordenar; stock 11 → normal; lote vence 2026-06-20 (5 días) → por vencer; vence 2026-06-14 → vencido; venta 5 con stock 5 → permite (queda 0); venta 6 con stock 5 → rechazo.

---

## 9. Casos de uso

| ID | Entrada | Precondición | Efecto | Errores posibles |
|---|---|---|---|---|
| CU-01 Registrar producto | código, nombre, categoría, proveedor | código no repetido | Producto creado (stock 0) | `DATOS_INVALIDOS`, `PRODUCTO_DUPLICADO` |
| CU-02 Registrar entrada | código, cantidad, fecha de entrada, fecha de vencimiento (si perecedero) | el producto existe; perecedero exige vencimiento | Lote creado; stock sumado; movimiento de entrada | `PRODUCTO_NO_ENCONTRADO`, `DATOS_INVALIDOS`, `FECHA_INVALIDA` |
| CU-03 Registrar salida (venta) | código, cantidad | el producto existe; hay stock no vencido suficiente | Stock descontado por FEFO; movimiento de salida | `PRODUCTO_NO_ENCONTRADO`, `STOCK_INSUFICIENTE`, `DATOS_INVALIDOS` |
| CU-04 Consultar stock | código (o ninguno) | — | Stock de un producto, o tabla de todos ordenados por nombre | `PRODUCTO_NO_ENCONTRADO` |
| CU-05 Ver productos para reordenar | — | — | Productos con stock disponible ≤ 10 | — |
| CU-06 Ver vencimientos (opcional) | — | — | Lotes por vencer (≤ 5 días) y vencidos | — |
| CU-07 Reporte de rotación (opcional) | rango de fechas | — | Productos ordenados por unidades vendidas en el periodo | — |

### 9.1 Secuencia de CU-03 (registrar salida)

Todo ocurre dentro de `conTransaccion`:

1. `validarCantidad(cantidad)` (entero > 0).
2. Obtener el producto; si no existe, `PRODUCTO_NO_ENCONTRADO`.
3. Leer y bloquear los lotes no vencidos del producto (`FOR UPDATE`), ordenados por fecha de vencimiento (FEFO; los no perecederos por fecha de entrada).
4. Sumar su stock disponible; si es menor a la cantidad, `STOCK_INSUFICIENTE` y se revierte (RN-03; no descuenta nada).
5. Descontar la cantidad recorriendo los lotes por FEFO (RN-07).
6. Registrar el movimiento de salida (RN-10).
7. Confirmar y devolver el nuevo stock y si quedó para reordenar.

```ts
export async function registrarSalida(codigo: string, cantidad: number): Promise<ResultadoSalida> {
  validarCantidad(cantidad);
  return conTransaccion(async (tx) => {
    const prod = await obtenerProducto(tx, codigo);                 // PRODUCTO_NO_ENCONTRADO
    const lotes = await bloquearLotesVendibles(tx, prod.id, hoyBogota());  // no vencidos, FEFO
    const disponible = lotes.reduce((s, l) => s + l.cantidad, 0);
    if (!hayStockSuficiente(disponible, cantidad)) throw new ErrorDeNegocio('STOCK_INSUFICIENTE', undefined, { disponible });  // RN-03
    descontarPorFefo(tx, lotes, cantidad);                          // RN-07
    await registrarMovimiento(tx, prod.id, 'salida', cantidad);     // RN-10
    const nuevo = disponible - cantidad;
    return { stock: nuevo, paraReordenar: paraReordenar(nuevo, prod.puntoReorden) };  // RN-01
  });
}
```

---

## 10. Modelo de datos

### 10.1 Relaciones

```text
productos 1 ──── N lotes        (cada entrada un lote; perecedero con vencimiento)
productos 1 ──── N movimientos  (entradas y salidas)

v_productos = productos + stock disponible (suma de lotes no vencidos) + estado para reordenar
```

Las migraciones se guardan en `supabase/migrations/`. En este documento se nombran M1 y M2. P00 confirma la numeración.

### 10.2 M1 · Tablas

```sql
-- M1: tablas del inventario de tienda

CREATE TABLE IF NOT EXISTS productos (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo         VARCHAR(40)   NOT NULL,
  nombre         VARCHAR(160)  NOT NULL,
  categoria      VARCHAR(16)   NOT NULL,                 -- 'perecedero' | 'no_perecedero' (RN-04)
  proveedor      VARCHAR(120),
  punto_reorden  INTEGER       NOT NULL DEFAULT 10,      -- fijo (RN-01)
  activo         BOOLEAN       NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT productos_codigo_unico  UNIQUE (codigo),                       -- RN-09
  CONSTRAINT productos_nombre_minimo CHECK (char_length(btrim(nombre)) >= 1),
  CONSTRAINT productos_categoria_valida CHECK (categoria IN ('perecedero', 'no_perecedero')),  -- RN-09
  CONSTRAINT productos_reorden_no_neg CHECK (punto_reorden >= 0)
);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos (activo);

CREATE TABLE IF NOT EXISTS lotes (
  id                 BIGSERIAL     PRIMARY KEY,
  producto_id        UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,  -- RN-11
  cantidad           INTEGER       NOT NULL,                 -- stock restante de este lote
  fecha_entrada      DATE          NOT NULL,
  fecha_vencimiento  DATE,                                   -- solo perecederos (RN-04)
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT lotes_cantidad_no_neg CHECK (cantidad >= 0),    -- se descuenta hasta 0 (RN-03)
  CONSTRAINT lotes_fechas_coherentes CHECK (
    fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_entrada)  -- RN-12
);
CREATE INDEX IF NOT EXISTS idx_lotes_producto ON lotes (producto_id, fecha_vencimiento);

CREATE TABLE IF NOT EXISTS movimientos (
  id           BIGSERIAL     PRIMARY KEY,
  producto_id  UUID          NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  tipo         VARCHAR(8)    NOT NULL,                     -- 'entrada' | 'salida'
  cantidad     INTEGER       NOT NULL,
  fecha        DATE          NOT NULL,                     -- RN-10
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT mov_tipo_valido        CHECK (tipo IN ('entrada', 'salida')),
  CONSTRAINT mov_cantidad_positiva  CHECK (cantidad > 0)   -- RN-08
);
CREATE INDEX IF NOT EXISTS idx_mov_producto ON movimientos (producto_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_mov_tipo     ON movimientos (tipo, fecha);

CREATE OR REPLACE FUNCTION tienda_actualizar_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_productos_updated_at ON productos;
CREATE TRIGGER trg_productos_updated_at BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION tienda_actualizar_updated_at();
```

### 10.3 M2 · Vista de productos y seguridad

```sql
-- M2: vista con stock disponible y estado de reorden; cierre de acceso público

CREATE OR REPLACE VIEW v_productos
WITH (security_invoker = true) AS
SELECT
  p.*,
  COALESCE((SELECT SUM(l.cantidad) FROM lotes l
            WHERE l.producto_id = p.id
              AND (l.fecha_vencimiento IS NULL OR l.fecha_vencimiento >= CURRENT_DATE)), 0) AS stock_disponible,  -- RN-06 (apoyo)
  COALESCE((SELECT SUM(l.cantidad) FROM lotes l WHERE l.producto_id = p.id), 0) AS stock_total
FROM productos p;

ALTER TABLE productos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON productos, lotes, movimientos FROM anon, authenticated;
REVOKE ALL ON v_productos FROM anon, authenticated;
```

La vista usa `CURRENT_DATE` como apoyo; el stock vendible oficial y el estado "para reordenar" se calculan en el servidor con `hoyBogota()` para no depender de la zona del servidor de base de datos. Las tablas quedan sin políticas: todo el acceso ocurre en el servidor con la conexión directa a Postgres.

### 10.4 Traducción de errores de la base de datos

| Código Postgres | Restricción | Código de negocio |
|---|---|---|
| `23505` | `productos_codigo_unico` | `PRODUCTO_DUPLICADO` |
| `23503` | llaves foráneas (`ON DELETE RESTRICT`) | `TIENE_DEPENDENCIAS` |
| `23514` | `lotes_fechas_coherentes` | `FECHA_INVALIDA` |
| `23514` | `lotes_cantidad_no_neg` | `STOCK_INSUFICIENTE` (una salida no deja negativo) |
| `23514` | cualquier otro CHECK | `DATOS_INVALIDOS` |
| Otro | | `ERROR_INTERNO` (se registra en consola, no se muestra al usuario) |

---

## 11. Arquitectura del código

### 11.1 Capas

```text
Pantallas (app/tienda/*) ────┐
                             ├──► Rutas API (app/api/tienda/*) ──► lib/dataService.ts ──► lib/datos/* ──► Postgres
Componentes (components/*) ──┘          │                              │
                                        └──── lib/validacion (Zod)     └──── lib/reglas/* (funciones puras)
```

- `lib/reglas/`: reorden, vencimiento, validación de cantidad y de lote, FEFO (la parte pura del cálculo de descuento). No importan la base, ni red, ni el reloj (salvo `fechas.ts`). Se prueban con Vitest.
- `lib/datos/`: consultas SQL y casos de uso con transacciones. Solo este directorio importa `lib/db/conexion.ts`.
- `lib/dataService.ts`: fachada única.
- Rutas API: validan con Zod, verifican sesión, llaman a `dataService`, y al devolver productos les agregan el estado con `lib/reglas/` y `hoyBogota()`.

### 11.2 Árbol de archivos nuevos

```text
.github/copilot-instructions.md
doc/ESTADO_ACTUAL.md
doc/DICTAMEN.md
doc/ESTADO_EJECUCION.md
doc/checkpoints/FASE_N_COMPLETADA.md

supabase/migrations/NNNN_tienda_tablas.sql
supabase/migrations/NNNN_tienda_vista_seguridad.sql

scripts/migrar.mjs                 (solo si no existe mecanismo de migraciones)
scripts/verificar-bd.mjs
scripts/probar-flujo.ts
scripts/limpiar-prueba.mjs
scripts/cargar-demo.ts

lib/config/tienda.ts
lib/reglas/errores.ts
lib/reglas/fechas.ts
lib/reglas/vencimiento.ts
lib/reglas/inventario.ts
lib/reglas/alertas.ts
lib/reglas/producto.ts
lib/reglas/lote.ts
lib/validacion/esquemas.ts
lib/db/conexion.ts
lib/auth/sesion.ts
lib/http/respuestas.ts
lib/formato.ts
lib/datos/tipos.ts
lib/datos/productos.ts
lib/datos/entradas.ts
lib/datos/salidas.ts
lib/datos/reportes.ts              (opcional)
lib/dataService.ts

tests/reglas/ayudas.ts
tests/reglas/vencimiento.test.ts
tests/reglas/inventario.test.ts
tests/reglas/alertas.test.ts
tests/reglas/fefo.test.ts
vitest.config.ts

app/page.tsx                                  (redirige a /tienda)
app/tienda/layout.tsx
app/tienda/page.tsx                           (inventario y alertas)
app/tienda/productos/nuevo/page.tsx
app/tienda/productos/[codigo]/page.tsx        (detalle: lotes y movimientos)
app/tienda/entrada/page.tsx
app/tienda/venta/page.tsx
app/tienda/vencimientos/page.tsx              (opcional, F5)
app/tienda/rotacion/page.tsx                  (opcional, F6)

app/api/tienda/sesion/route.ts
app/api/tienda/productos/route.ts
app/api/tienda/productos/[codigo]/route.ts
app/api/tienda/entradas/route.ts
app/api/tienda/salidas/route.ts
app/api/tienda/alertas/route.ts
app/api/tienda/vencimientos/route.ts          (opcional, F5)
app/api/tienda/rotacion/route.ts              (opcional, F6)

components/ui/*  (Boton, Campo, Selector, Tarjeta, Insignia, Aviso, EstadoVacio)
components/tienda/NavegacionTienda.tsx
components/tienda/InsigniaEstado.tsx
components/tienda/TablaInventario.tsx
components/tienda/FormularioProducto.tsx
components/tienda/FormularioEntrada.tsx
components/tienda/FormularioVenta.tsx
components/tienda/PanelAlertas.tsx
components/tienda/TablaLotes.tsx
components/tienda/TablaRotacion.tsx            (opcional)
```

### 11.3 Responsabilidades y prohibiciones

| Regla de código | Motivo |
|---|---|
| Identificadores, comentarios y mensajes en español | Coherencia con el dominio |
| El stock disponible se deriva de los lotes no vencidos; no se guarda un stock aparte | RN-06; evita descuadres |
| La venta descuenta por FEFO en una transacción con los lotes bloqueados | RN-03, RN-07 |
| El reorden y el vencimiento se calculan al leer con `hoyBogota()` | Dependen de la fecha |
| Cantidades enteras; nunca negativas en la base | RN-08; CHECK |
| Solo `lib/datos/` importa `lib/db/conexion.ts` | Las rutas no escriben SQL |
| Las rutas solo importan datos desde `lib/dataService.ts` | Fachada única |
| Las rutas `/api/tienda/*` llaman `exigirSesion()` como primera instrucción | Sección 5 |
| Fechas como texto `YYYY-MM-DD`; "hoy" solo con `hoyBogota()` | Sección 15 |
| `params` de rutas dinámicas se obtiene con `await params` | Next.js entrega `params` como Promise |
| No modificar archivos del login salvo la redirección indicada en P03 | Sección 1.3 |

### 11.4 Configuración

```ts
// lib/config/tienda.ts
export const PUNTO_REORDEN = 10;          // RN-01, fijo para todos
export const DIAS_AVISO_VENCIMIENTO = 5;  // RN-02
export const CATEGORIAS = ['perecedero', 'no_perecedero'] as const;
export const ZONA_HORARIA = 'America/Bogota';
export const LIMITE_LISTADO = 500;
```

### 11.5 Firmas de las reglas puras

```ts
// lib/reglas/errores.ts
export type CodigoError =
  | 'DATOS_INVALIDOS' | 'NO_AUTORIZADO'
  | 'PRODUCTO_DUPLICADO' | 'PRODUCTO_NO_ENCONTRADO'
  | 'STOCK_INSUFICIENTE' | 'FECHA_INVALIDA'
  | 'TIENE_DEPENDENCIAS' | 'ERROR_INTERNO';
export const MENSAJES: Record<CodigoError, string>;     // sección 12.2
export const ESTADO_HTTP: Record<CodigoError, number>;  // sección 12.2
export class ErrorDeNegocio extends Error {
  constructor(public codigo: CodigoError, mensaje?: string, public detalles?: unknown);
}

// lib/reglas/fechas.ts
export function hoyBogota(reloj?: Date): string;                 // 'YYYY-MM-DD'
export function esFechaValida(fecha: string): boolean;
export function diasEntre(desde: string, hasta: string): number;

// lib/reglas/vencimiento.ts
export type EstadoVencimiento = 'vigente' | 'por_vencer' | 'vencido';
export function estadoVencimiento(fechaVencimiento: string, hoy: string, diasAviso: number): EstadoVencimiento;  // RN-02
export function estaVencido(fechaVencimiento: string, hoy: string): boolean;

// lib/reglas/inventario.ts
export type TipoMovimiento = 'entrada' | 'salida';
export function validarCantidad(cantidad: number): void;        // entero > 0 (RN-08)
export function hayStockSuficiente(disponible: number, cantidad: number): boolean;  // cantidad <= disponible (RN-03)
export function descontarPorFefo(lotes: Lote[], cantidad: number): Array<{ loteId: number; descuento: number }>;  // RN-07; lotes ya ordenados

// lib/reglas/alertas.ts
export function paraReordenar(stockDisponible: number, puntoReorden: number): boolean;  // <= (RN-01)

// lib/reglas/producto.ts
export type Categoria = 'perecedero' | 'no_perecedero';
export function validarProducto(d: { codigo: string; nombre: string; categoria: string }): void;  // RN-09

// lib/reglas/lote.ts
export function validarEntrada(d: {
  cantidad: number; categoria: Categoria; fechaEntrada: string; fechaVencimiento?: string | null;
}): void;  // cantidad > 0; perecedero exige vencimiento (RN-04); vencimiento >= entrada (RN-12)
```

### 11.6 Firmas de `dataService`

```ts
// Sesión
obtenerSesion(): Promise<{ email: string } | null>

// Productos
listarInventario(f?: { soloReorden?: boolean; busqueda?: string }): Promise<FilaInventario[]>   // con stock y estado
crearProducto(d: DatosProducto): Promise<{ id: string; codigo: string }>
obtenerProducto(codigo: string): Promise<DetalleProducto>   // datos + lotes + movimientos
desactivarProducto(codigo: string): Promise<void>

// Movimientos
registrarEntrada(d: DatosEntrada): Promise<{ stock: number }>          // CU-02; crea lote
registrarSalida(codigo: string, cantidad: number): Promise<ResultadoSalida>  // CU-03; FEFO, RN-03

// Alertas y reportes
productosParaReordenar(): Promise<FilaInventario[]>                    // CU-05
lotesPorVencer(): Promise<{ porVencer: FilaLote[]; vencidos: FilaLote[] }>  // CU-06 (opcional)
reporteRotacion(desde: string, hasta: string): Promise<FilaRotacion[]>  // CU-07 (opcional)
```

Tipos (`lib/datos/tipos.ts`): `FilaInventario { codigo, nombre, categoria, stockDisponible, paraReordenar }`; `Lote { id, cantidad, fechaEntrada, fechaVencimiento, estadoVencimiento }`; `DetalleProducto`, `DatosProducto`, `DatosEntrada { codigo, cantidad, fechaEntrada, fechaVencimiento? }`; `ResultadoSalida { stock, paraReordenar }`; `FilaLote`, `FilaRotacion`.

### 11.7 Conexión y transacciones

```ts
// lib/db/conexion.ts
import { Pool, types, type PoolClient } from 'pg';

types.setTypeParser(1082, (v) => v);                 // DATE → 'YYYY-MM-DD'
types.setTypeParser(1114, (v) => v);                 // TIMESTAMP → texto
types.setTypeParser(1184, (v) => v);                 // TIMESTAMPTZ → texto
types.setTypeParser(20, (v) => parseInt(v, 10));     // BIGINT (ids, COUNT, SUM) → number

const globalParaPool = globalThis as unknown as { poolTienda?: Pool };

export const pool = globalParaPool.poolTienda ?? new Pool({
  connectionString: process.env.DATABASE_URL,        // el nombre real lo confirma P00
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 10_000,
});
if (process.env.NODE_ENV !== 'production') globalParaPool.poolTienda = pool;

export async function consultar<T>(sql: string, valores: unknown[] = []): Promise<T[]> { /* pool.query */ }
export async function conTransaccion<T>(trabajo: (tx: PoolClient) => Promise<T>): Promise<T> { /* BEGIN/COMMIT/ROLLBACK */ }
```

`SUM(cantidad)` sobre `INTEGER` devuelve `BIGINT`; el parser lo pasa a número. Como todo es entero, no hace falta parser para `NUMERIC`.

---

## 12. Contratos de API

### 12.1 Formato de respuesta

```json
{ "ok": true, "datos": { } }
```

```json
{ "ok": false, "error": { "codigo": "STOCK_INSUFICIENTE", "mensaje": "No hay stock suficiente para la venta.", "detalles": { "disponible": 3 } } }
```

Todas las respuestas llevan `Cache-Control: no-store`.

### 12.2 Códigos de error

| Código | HTTP | Mensaje para el usuario |
|---|---|---|
| `DATOS_INVALIDOS` | 400 | Revise los datos ingresados. |
| `NO_AUTORIZADO` | 401 | Debe iniciar sesión. |
| `PRODUCTO_DUPLICADO` | 409 | Ya existe un producto con ese código. |
| `PRODUCTO_NO_ENCONTRADO` | 404 | El producto no existe. |
| `STOCK_INSUFICIENTE` | 409 | No hay stock suficiente para la venta. |
| `FECHA_INVALIDA` | 422 | La fecha de vencimiento no puede ser anterior a la de entrada. |
| `TIENE_DEPENDENCIAS` | 409 | No se puede eliminar: tiene movimientos o lotes. |
| `ERROR_INTERNO` | 500 | Ocurrió un error inesperado. Intente de nuevo. |

### 12.3 Endpoints (todos requieren sesión)

| Método y ruta | Cuerpo o parámetros | Respuesta `datos` |
|---|---|---|
| `GET /api/tienda/sesion` | | `{ email }` |
| `GET /api/tienda/productos?soloReorden=&busqueda=` | | `FilaInventario[]` |
| `POST /api/tienda/productos` | `{ codigo, nombre, categoria, proveedor? }` | `{ id, codigo }` (201) |
| `GET /api/tienda/productos/[codigo]` | | `DetalleProducto` |
| `POST /api/tienda/entradas` | `{ codigo, cantidad, fechaEntrada, fechaVencimiento? }` | `{ stock }` (201) |
| `POST /api/tienda/salidas` | `{ codigo, cantidad }` | `ResultadoSalida` (201) |
| `GET /api/tienda/alertas` | | `FilaInventario[]` (para reordenar) |
| `GET /api/tienda/vencimientos` | | `{ porVencer, vencidos }` (opcional, F5) |
| `GET /api/tienda/rotacion?desde=&hasta=` | | `FilaRotacion[]` (opcional, F6) |

### 12.4 Esquemas Zod (`lib/validacion/esquemas.ts`)

| Esquema | Reglas |
|---|---|
| `esquemaProducto` | codigo (1 a 40), nombre (1 a 160), categoria enum, proveedor opcional |
| `esquemaEntrada` | codigo, cantidad entero ≥ 1, fechaEntrada (fecha), fechaVencimiento opcional (fecha) |
| `esquemaSalida` | codigo, cantidad entero ≥ 1 |
| `esquemaFiltros` | soloReorden, busqueda opcionales |
| `esquemaRango` | desde, hasta (fechas) (F6) |

La exigencia de vencimiento para perecederos, el orden FEFO y la suficiencia de stock se resuelven en `lib/reglas/` y en el servicio; la base refuerza con CHECK.

---

## 13. Pantallas

| Ruta | Contenido |
|---|---|
| `/` | Redirige a `/tienda`. |
| Layout `/tienda` | Verifica la sesión; sin sesión redirige al login. Barra con "Mi Tienda", navegación (Inventario, Entrada, Venta; Vencimientos y Rotación cuando estén activos) y cerrar sesión. Mobile-First (se usa en el mostrador con el celular). |
| `/tienda` · Inventario | `TablaInventario`: código, nombre, categoría, stock disponible, estado (`InsigniaEstado`: Para reordenar en ámbar cuando ≤ 10). Buscador y filtro "solo para reordenar". `PanelAlertas` arriba con los productos para reordenar. Botón "Nuevo producto". `EstadoVacio` si no hay. |
| `/tienda/productos/nuevo` · Nuevo producto | `FormularioProducto`: código, nombre, categoría (perecedero / no perecedero), proveedor. Código duplicado muestra el mensaje. |
| `/tienda/productos/[codigo]` · Detalle | Datos del producto, su stock, `TablaLotes` (cantidad, fecha de entrada, fecha de vencimiento, estado del lote) y los movimientos recientes. |
| `/tienda/entrada` · Registrar entrada | `FormularioEntrada`: producto (selector o código), cantidad, fecha de entrada (por defecto hoy) y, si el producto es perecedero, fecha de vencimiento (obligatoria). Al guardar, muestra el nuevo stock. Perecedero sin vencimiento muestra el mensaje. |
| `/tienda/venta` · Registrar venta | `FormularioVenta`: producto, cantidad. Muestra el stock disponible; al vender, descuenta por FEFO y muestra el nuevo stock, o el rechazo (`STOCK_INSUFICIENTE`). Si el producto quedó para reordenar, lo indica. |
| `/tienda/vencimientos` · Vencimientos (opcional) | Lotes por vencer (≤ 5 días) y vencidos, con su producto y fecha. |
| `/tienda/rotacion` · Rotación (opcional) | Productos ordenados por unidades vendidas en un rango de fechas. |

### 13.1 Textos fijos

Alerta de reorden:

> {producto}: quedan {stock} unidades (punto de reorden: 10).

Rechazo de venta:

> No hay stock suficiente de {producto}: disponible {disponible}.

Lote por vencer / vencido:

> {producto}: lote vence el {fecha} (faltan {dias} días) · Vencido: no se puede vender.

---

## 14. Identidad visual

| Token | Valor | Uso |
|---|---|---|
| `--color-primario` | `#1F6F8B` | Azul tienda: botones principales, barra superior |
| `--color-primario-suave` | `#E3EEF2` | Fondos de selección, hover |
| `--color-normal` | `#2F7D4F` | Stock normal, lote vigente |
| `--color-reorden` | `#B7791F` | Para reordenar, por vencer |
| `--color-vencido` | `#B83232` | Vencido, errores |
| `--color-inactivo` | `#5B6770` | Producto inactivo |
| `--color-fondo` | `#F5F7F8` | Fondo de página |
| `--color-superficie` | `#FFFFFF` | Tarjetas, tablas |
| `--color-texto` | `#1F2933` | Texto principal |
| `--color-texto-suave` | `#52606D` | Texto secundario |
| `--color-borde` | `#D9DEE4` | Bordes y divisores |

Los tokens se agregan a `app/globals.css` sin borrar estilos existentes. Con Tailwind 4 se declaran en `@theme`; con Tailwind 3, en `tailwind.config`.

Criterios: Mobile-First (se usa en el mostrador); el estado y las alertas con color y texto (nunca solo color); cantidades con fuente tabular; fechas con `Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' })`; los productos para reordenar y los lotes por vencer resaltados arriba; sin emojis; tablas en tarjetas apiladas bajo 640 px.

---

## 15. Números, fechas y zona horaria

| Regla | Implementación |
|---|---|
| Cantidades | Enteros; nunca negativas en la base |
| "Hoy" (reorden, vencimiento) | Con `hoyBogota()` |
| Fechas | Texto `YYYY-MM-DD`; vencimiento ≥ entrada (RN-12) |
| Vencimiento | `estadoVencimiento` con `hoyBogota()` y `DIAS_AVISO_VENCIMIENTO` |
| Lectura desde BD | Parsers de `pg` devuelven texto para fechas (sección 11.7) |

Vercel corre en UTC; Colombia es UTC-5 sin horario de verano. El reorden y el vencimiento se calculan con `hoyBogota()` para que coincidan con el día real de la tienda: así un lote no se marca "vencido" un día antes de tiempo.

---

## 16. Seguridad e integridad

| Medida | Detalle |
|---|---|
| Rotación de credenciales expuestas | Obligatoria y previa (sección 2) |
| Acceso solo con sesión | Login como puerta y `exigirSesion()` en cada ruta de `/api/tienda` |
| Base de datos cerrada al público | RLS activo sin políticas y permisos revocados a `anon` y `authenticated` |
| Venta atómica y sin stock negativo | La venta se resuelve en una transacción con los lotes bloqueados; `cantidad >= 0` en la base impide stock negativo (RN-03) |
| Stock derivado de lotes | No hay un campo de stock que pueda contradecir los lotes; se suma de los lotes no vencidos (RN-06) |
| Vencido no vendible | El stock vendible excluye los lotes vencidos (RN-02) |
| Datos inmutables | Movimientos y lotes no se editan; un producto se desactiva, no se elimina |
| Validación en tres puntos | Formulario (Zod y reglas), API (Zod y reglas) y base (CHECK, UNIQUE, llaves foráneas) |
| SQL parametrizado | Ningún valor se concatena |
| Errores internos | Se registran con `console.error`; el usuario recibe `ERROR_INTERNO` sin detalles técnicos |

---

## 17. Pruebas

### 17.1 Pruebas unitarias de reglas (Vitest)

Fecha de referencia: `hoy = '2026-06-15'`, aviso 5 días, reorden 10.

| ID | Función | Entrada | Resultado esperado |
|---|---|---|---|
| T-01 | `paraReordenar` | 11, 10 | `false` |
| T-02 | `paraReordenar` | 10, 10 | `true` (inclusivo, RN-01) |
| T-03 | `paraReordenar` | 9, 10 | `true` |
| T-04 | `paraReordenar` | 0, 10 | `true` |
| T-05 | `estadoVencimiento` | "2026-06-21" | vigente (6 días) |
| T-06 | `estadoVencimiento` | "2026-06-20" | por_vencer (5 días exactos, RN-02) |
| T-07 | `estadoVencimiento` | "2026-06-16" | por_vencer (1 día) |
| T-08 | `estadoVencimiento` | "2026-06-15" | por_vencer (hoy) |
| T-09 | `estadoVencimiento` | "2026-06-14" | vencido (RN-02) |
| T-10 | `estaVencido` | "2026-06-14", hoy | `true` |
| T-11 | `estaVencido` | "2026-06-15", hoy | `false` |
| T-12 | `validarCantidad` | 0 | `DATOS_INVALIDOS` |
| T-13 | `validarCantidad` | -1 | `DATOS_INVALIDOS` |
| T-14 | `validarCantidad` | 2.5 | `DATOS_INVALIDOS` |
| T-15 | `validarCantidad` | 3 | sin error |
| T-16 | `hayStockSuficiente` | disponible 5, cantidad 5 | `true` (igual permite, RN-03) |
| T-17 | `hayStockSuficiente` | disponible 5, cantidad 6 | `false` |
| T-18 | `hayStockSuficiente` | disponible 0, cantidad 1 | `false` |
| T-19 | `validarEntrada` | perecedero sin fechaVencimiento | `DATOS_INVALIDOS` (RN-04) |
| T-20 | `validarEntrada` | perecedero con vencimiento < entrada | `FECHA_INVALIDA` (RN-12) |
| T-21 | `validarEntrada` | no_perecedero sin vencimiento | sin error (RN-04) |
| T-22 | `validarEntrada` | perecedero con vencimiento ≥ entrada | sin error |
| T-23 | `descontarPorFefo` | lotes [{id1, 3, vence 06-18}, {id2, 5, vence 06-25}], cantidad 4 | descuenta 3 de id1 y 1 de id2 (el que vence primero) |
| T-24 | `descontarPorFefo` | mismos lotes, cantidad 3 | descuenta 3 de id1, nada de id2 |
| T-25 | `validarProducto` | categoría "otra" | `DATOS_INVALIDOS` |
| T-26 | `validarProducto` | datos válidos | sin error |

Comando: `npm test`. Las 26 pruebas deben pasar antes de continuar con la fase 3.

### 17.2 Prueba de flujo contra la base de datos

`scripts/probar-flujo.ts` (`npm run probar:flujo`) usa `dataService` con códigos `TD-TEST-*` y fechas relativas a hoy. Imprime `OK` o `FALLA` por paso y limpia al final.

| Paso | Operación | Esperado |
|---|---|---|
| 1 | Crear producto TD-TEST-1 "Leche" (perecedero) | Creado, stock 0 |
| 2 | Crear TD-TEST-1 otra vez | `PRODUCTO_DUPLICADO` |
| 3 | Crear TD-TEST-2 "Arroz" (no perecedero) | Creado |
| 4 | Entrada de 8 a Leche sin fecha de vencimiento | `DATOS_INVALIDOS` (perecedero exige vencimiento) |
| 5 | Entrada de 8 a Leche, vence hoy+3 | stock 8 |
| 6 | Entrada de 5 a Leche, vence hoy+20 (segundo lote) | stock 13 |
| 7 | Entrada de 8 a Arroz sin vencimiento | stock 8 (no perecedero, válido) |
| 8 | Consultar inventario | Leche 13 (normal), Arroz 8 (para reordenar porque 8 ≤ 10, RN-01) |
| 9 | Venta de 10 de Leche | stock 3; descuenta primero del lote que vence hoy+3 (8) y 2 del de hoy+20; queda para reordenar (3 ≤ 10) |
| 10 | Venta de 20 de Arroz | `STOCK_INSUFICIENTE`; Arroz sigue 8 |
| 11 | Venta de 8 de Arroz | stock 0 (igual al disponible, permitido); para reordenar |
| 12 | Entrada a Leche con vencimiento anterior a la entrada | `FECHA_INVALIDA` |
| 13 | Ver productos para reordenar | Leche y Arroz |
| 14 | (Vencimiento) crear lote de Leche ya vencido e intentar vender | La venta no toma el lote vencido; si no hay otro stock, `STOCK_INSUFICIENTE` |

### 17.3 Aceptación (criterio de terminado)

Se ejecuta en el despliegue de Vercel y se documenta en `doc/ACEPTACION.md`.

| ID | Acción | Resultado esperado |
|---|---|---|
| A-01 | Abrir `/tienda` sin sesión | Redirección al login |
| A-02 | Crear "Leche" (perecedero) y "Arroz" (no perecedero) | Aparecen en el inventario |
| A-03 | Intentar otro producto con el mismo código | Rechazo por duplicado |
| A-04 | Registrar una entrada de Leche sin fecha de vencimiento | Rechazo (perecedero exige vencimiento) |
| A-05 | Registrar una entrada de Leche con vencimiento | El stock sube |
| A-06 | Registrar una entrada de Arroz sin vencimiento | Se permite (no perecedero) |
| A-07 | Vender una cantidad mayor al stock | Rechazo; el stock no cambia |
| A-08 | Vender una cantidad igual al stock | Se permite; queda en 0 |
| A-09 | Dejar un producto con stock ≤ 10 | Aparece en "para reordenar" |
| A-10 | Consultar el inventario completo | Tabla con todos y su stock |
| A-11 | (Opcional) Ver lotes por vencer y vencidos | Lista los próximos a vencer y los vencidos |
| A-12 | (Opcional) Ver el reporte de rotación | Productos ordenados por unidades vendidas |
| A-13 | Cerrar el navegador y volver a entrar | Los datos persisten |

A-11 y A-12 corresponden a las opcionales; se verifican tras P09.

---

## 18. Plan de ejecución

| Fase | Prompt | Resultado | Cierre |
|---|---|---|---|
| Fundación (si parte de cero) | P-INIT | Proyecto Next, Supabase, login y despliegue | `FASE_INIT_COMPLETADA.md` |
| 0 · Conciliación | P00 | Credenciales rotadas; `ESTADO_ACTUAL.md`, `DICTAMEN.md`, `copilot-instructions.md`, `ESTADO_EJECUCION.md` | `FASE_0_COMPLETADA.md` |
| 1 · Base de datos | P01 | M1 y M2 aplicadas; `npm run db:verificar` sin fallas | `FASE_1_COMPLETADA.md` |
| 2 · Reglas | P02 | `lib/config`, `lib/reglas` (vencimiento, FEFO, reorden), 26 pruebas en verde | `FASE_2_COMPLETADA.md` |
| 3 · Servidor | P03 | Conexión, sesión, respuestas, esquemas, formato; sesión protegida | `FASE_3_COMPLETADA.md` |
| 4 · Datos y API | P04, P05 | `lib/datos/*`, `dataService`, rutas; `npm run probar:flujo` sin fallas | `FASE_4_COMPLETADA.md` |
| 5 · Interfaz | P06, P07, P08 | Componentes base, inventario, productos, entrada, venta, alertas | `FASE_5_COMPLETADA.md` |
| 6 · Aceptación | (en P08) | `ACEPTACION.md` con A-01 a A-10 y A-13; README | `FASE_6_COMPLETADA.md` |
| 7 · Opcionales | P09 | Alertas de vencimiento y reporte de rotación | `FASE_7_COMPLETADA.md` |

Condiciones entre fases: no se inicia una fase sin el archivo de cierre de la anterior; `npm run build` sin errores al final de cada prompt; `npm test` en verde desde P02; cada prompt termina con commit y push, y un fallo de despliegue en Vercel se corrige antes del siguiente prompt.

---

## 19. Funcionalidades opcionales

Se construyen solo con la fase 6 cerrada.

| Prompt | Funcionalidad | Implementación |
|---|---|---|
| P09 | F5 · Alertas de vencimiento | `lotesPorVencer()`: lotes con `estadoVencimiento` por_vencer (≤ 5 días) y vencidos, con su producto y fecha. Ruta `/api/tienda/vencimientos`; pantalla `/tienda/vencimientos` |
| P09 | F6 · Reporte de rotación | `reporteRotacion(desde, hasta)`: suma las salidas por producto en el periodo, de mayor a menor. Ruta `/api/tienda/rotacion`; pantalla `/tienda/rotacion` con selector de rango |

---

## 20. Glosario

| Término | Definición |
|---|---|
| Producto | Artículo del inventario, perecedero o no perecedero |
| Lote | Una entrada de mercancía, con su cantidad y, si es perecedero, su fecha de vencimiento |
| Stock disponible | Suma de las cantidades de los lotes no vencidos de un producto |
| Movimiento | Una entrada o una salida de inventario |
| Punto de reorden | Umbral (10) bajo el cual un producto se marca para reordenar |
| FEFO | First expired, first out: se vende primero el lote que vence antes |
| Por vencer | Lote perecedero con 5 días o menos para su vencimiento |
| Vencido | Lote cuya fecha de vencimiento ya pasó; no se puede vender |
| Rotación | Qué tanto se vendió un producto en un periodo |
| Regla pura | Función de `lib/reglas/` que solo depende de sus parámetros |
| Transacción | Conjunto de escrituras que se confirma completo o se revierte completo |
| Copilot en modo Agente | Modo de GitHub Copilot Chat que lee el repositorio, edita varios archivos y ejecuta comandos de terminal con aprobación |
