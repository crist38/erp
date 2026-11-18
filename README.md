# ERP PRO WINDOWS

Sistema propio de PRO WINDOWS para reemplazar Odoo: ventas y CRM, fabricación, bodega y compras de termopaneles y ventanas de PVC y aluminio, para unos 15 usuarios.

## Plan

1. **Base propia** (este paso): base de datos, login con roles, clientes/proveedores, productos/insumos e importación desde Odoo.
2. **Ventas y CRM**: oportunidades, cotizaciones (integrando el cotizador de termopaneles) y ventas.
3. **Fabricación y bodega**: órdenes de taller por etapa y stock de insumos.
4. **Compras**: proveedores, órdenes de compra, recepción y alertas de stock mínimo.

Después vienen los tickets de postventa (reparación y recambio) con vista móvil para técnicos en terreno.

## Stack

- [Next.js](https://nextjs.org/) 16 (App Router, Server Actions), React 19 y TypeScript
- PostgreSQL con [Drizzle ORM](https://orm.drizzle.team/)
- Tailwind CSS 4
- Sesión propia: cookie firmada con HMAC y contraseñas con scrypt

## Puesta en marcha

1. Crea una base PostgreSQL (local, [Neon](https://neon.tech) o [Supabase](https://supabase.com)).
2. Copia `.env.example` a `.env.local` y completa `DATABASE_URL` y `SESSION_SECRET` (mínimo 32 caracteres aleatorios, por ejemplo `openssl rand -hex 32`).
3. Instala y prepara la base:
   ```bash
   npm install
   npm run db:migrate
   npm run crear-admin -- tu@correo.cl "Tu Nombre" una_clave_segura
   ```
4. Opcional, copiar datos desde Odoo (requiere las variables `ODOO_*` y que Odoo esté activo):
   ```bash
   npm run importar-odoo
   ```
   Se puede repetir: actualiza lo ya importado y no escribe en Odoo. Los usuarios importados quedan con rol Vendedor y sin contraseña; Administración les asigna rol y contraseña en **Usuarios**.
5. `npm run dev` y abre [http://localhost:3000](http://localhost:3000).

Si cambias `lib/db/schema.ts`, genera la migración con `npm run db:generate` y aplícala con `npm run db:migrate`.

En Vercel define `DATABASE_URL` y `SESSION_SECRET` en las variables de entorno del proyecto antes del primer despliegue, y corre la migración y `crear-admin` apuntando a esa base.

## Roles

| Rol | Puede |
| --- | --- |
| Administración | Todo, incluida la página Usuarios |
| Vendedor | Ver y editar clientes y proveedores; ver productos |
| Bodega | Ver y editar clientes, proveedores y productos |
| Taller | Ver clientes y productos |
| Técnico en terreno | Ver clientes y productos |

Las reglas de acceso por sección están en `lib/roles.ts` (las aplica `proxy.ts`) y cada acción del servidor revisa el rol con `requireRol`. Desactivar a un usuario corta su acceso de inmediato.

## Estructura

- `app/`: páginas y acciones del servidor (`app/actions`)
- `lib/db/`: esquema y conexión a la base; migraciones en `drizzle/`
- `lib/session.ts`, `lib/auth/`, `lib/roles.ts`: sesión, contraseñas y permisos
- `scripts/`: `crear-admin` e `importar-odoo`
