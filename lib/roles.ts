// Roles del sistema y qué secciones puede abrir cada uno.
// Este archivo lo usa también proxy.ts, así que no debe importar la base de datos.

export const ROLES = ['vendedor', 'taller', 'bodega', 'administracion', 'tecnico'] as const
export type Rol = (typeof ROLES)[number]

export const ROL_LABELS: Record<Rol, string> = {
  vendedor: 'Vendedor',
  taller: 'Taller',
  bodega: 'Bodega',
  administracion: 'Administración',
  tecnico: 'Técnico en terreno',
}

export function isRol(value: unknown): value is Rol {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

const TODOS: Rol[] = [...ROLES]

// Prefijo de ruta → roles que pueden entrar. Administración entra a todo.
// Se usa la primera regla cuyo prefijo coincide; '/' (inicio) va al final.
// Los módulos de los pasos siguientes (ventas, fabricación, bodega, compras)
// agregan aquí su regla.
const RUTAS: { prefijo: string; roles: Rol[] }[] = [
  { prefijo: '/admin', roles: [] },
  { prefijo: '/contactos', roles: TODOS },
  { prefijo: '/productos', roles: TODOS },
  { prefijo: '/', roles: TODOS },
]

function coincide(pathname: string, prefijo: string): boolean {
  if (prefijo === '/') return true
  return pathname === prefijo || pathname.startsWith(prefijo + '/')
}

export function puedeAcceder(rol: Rol, pathname: string): boolean {
  if (rol === 'administracion') return true
  const regla = RUTAS.find((r) => coincide(pathname, r.prefijo))
  return regla ? regla.roles.includes(rol) : false
}
