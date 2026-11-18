import Link from 'next/link'
import { count, eq } from 'drizzle-orm'
import { Users, Package, UserCog, ShoppingCart, Hammer, Warehouse, Truck, Wrench } from 'lucide-react'
import { getDb, schema } from '@/lib/db'
import { getCurrentUser } from '@/app/actions/auth'
import { puedeAcceder } from '@/lib/roles'

export const dynamic = 'force-dynamic'

// Módulos del plan. Los que aún no existen se muestran como "Próximamente".
const PROXIMOS = [
  { label: 'Ventas y CRM', icon: ShoppingCart, paso: 'Paso 2' },
  { label: 'Fabricación', icon: Hammer, paso: 'Paso 3' },
  { label: 'Bodega', icon: Warehouse, paso: 'Paso 3' },
  { label: 'Compras', icon: Truck, paso: 'Paso 4' },
  { label: 'Postventa y reparaciones', icon: Wrench, paso: 'Fase siguiente' },
]

export default async function InicioPage() {
  const usuario = await getCurrentUser()
  const db = getDb()
  const [[clientes], [proveedores], [productos], [usuarios]] = await Promise.all([
    db.select({ n: count() }).from(schema.contactos).where(eq(schema.contactos.esCliente, true)),
    db.select({ n: count() }).from(schema.contactos).where(eq(schema.contactos.esProveedor, true)),
    db.select({ n: count() }).from(schema.productos).where(eq(schema.productos.activo, true)),
    db.select({ n: count() }).from(schema.usuarios).where(eq(schema.usuarios.activo, true)),
  ])

  const modulos = [
    { href: '/contactos', label: 'Clientes y proveedores', icon: Users, detalle: `${clientes.n} clientes · ${proveedores.n} proveedores` },
    { href: '/productos', label: 'Productos e insumos', icon: Package, detalle: `${productos.n} activos` },
    { href: '/admin/usuarios', label: 'Usuarios', icon: UserCog, detalle: `${usuarios.n} activos` },
  ].filter((m) => usuario && puedeAcceder(usuario.rol, m.href))

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-1">Hola, {usuario?.nombre.split(' ')[0]}</h1>
      <p className="text-sm text-slate-500 mb-6">ERP de PRO WINDOWS</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {modulos.map(({ href, label, icon: Icon, detalle }) => (
          <Link key={href} href={href}
            className="bg-white rounded-lg shadow-sm p-5 border border-slate-100 hover:border-marca transition-colors">
            <Icon className="text-marca mb-3" size={24} />
            <div className="font-medium">{label}</div>
            <div className="text-sm text-slate-500">{detalle}</div>
          </Link>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Próximamente</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {PROXIMOS.map(({ label, icon: Icon, paso }) => (
          <div key={label} className="rounded-lg border border-dashed border-slate-300 p-4 text-slate-400">
            <Icon size={20} className="mb-2" />
            <div className="text-sm font-medium text-slate-500">{label}</div>
            <div className="text-xs">{paso}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
