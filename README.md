# Inventario Mercado

MVP fullstack Next.js + TypeScript para administrar productos, categorias y
existencias de un mercado. Incluye JSON DB local tipada, API REST, alertas de
stock, login demo y CI.

## Ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:3000/dashboard` o usa el acceso demo
`admin@mercado.local` / `demo`. Validaciones: `npm run type-check`,
`npm run lint`, `npm test` y `npm run build`.

## API

- `GET /api/health`
- `GET|POST|PUT|DELETE /api/data/products`
- `GET|POST|PUT|DELETE /api/data/categories`
- `POST /api/auth/login`

La persistencia JSON es adecuada para desarrollo y demos. En produccion,
`NODE_ENV=production` bloquea escrituras porque los filesystems de plataformas
serverless son efimeros; usar una base externa para despliegues reales.
