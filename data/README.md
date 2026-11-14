# Datos del Inventario Mercado

Cada archivo JSON contiene `_meta` y `records`. La API CRUD se expone en
`/api/data/products` y `/api/data/categories`. En desarrollo las escrituras
crean una copia en `_backups`; en produccion el almacenamiento local es de
solo lectura (un filesystem efimero no es una base de datos de produccion).

La tabla local de usuarios vive en `users.json`. Las contrasenas se almacenan
como hashes scrypt y no en texto plano.

Usuario demo: `admin@mercado.local` / `demo`.
