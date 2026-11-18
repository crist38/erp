import Link from 'next/link'
import { listarContactos, type FiltroTipo } from '@/app/actions/contactos'
import { getCurrentUser } from '@/app/actions/auth'
import { Buscador, Encabezado, Pestanas } from '@/app/components/ui'

export const dynamic = 'force-dynamic'

const TIPOS: { valor: FiltroTipo; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'clientes', label: 'Clientes' },
  { valor: 'proveedores', label: 'Proveedores' },
]

export default async function ContactosPage({ searchParams }: {
  searchParams: Promise<{ q?: string; tipo?: string }>
}) {
  const { q = '', tipo: tipoParam } = await searchParams
  const tipo = TIPOS.some((t) => t.valor === tipoParam) ? (tipoParam as FiltroTipo) : 'todos'
  const [contactos, usuario] = await Promise.all([listarContactos(q, tipo), getCurrentUser()])
  const puedeEditar = usuario && ['vendedor', 'bodega', 'administracion'].includes(usuario.rol)

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <Encabezado titulo="Clientes y proveedores"
        descripcion="Busca por nombre, email o RUT."
        accion={puedeEditar ? { href: '/contactos/nuevo', label: 'Nuevo contacto' } : undefined} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Buscador q={q} tipo={tipo} placeholder="Buscar..." />
        <Pestanas base="/contactos" actual={tipo} opciones={TIPOS} q={q} />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">RUT</th>
              <th className="px-4 py-2 font-medium">Contacto</th>
              <th className="px-4 py-2 font-medium">Comuna</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {contactos.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  {puedeEditar
                    ? <Link href={`/contactos/${c.id}`} className="text-marca hover:underline">{c.nombre}</Link>
                    : c.nombre}
                </td>
                <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{c.rut ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">{[c.email, c.telefono].filter(Boolean).join(' · ') || '—'}</td>
                <td className="px-4 py-2 text-slate-600">{c.comuna ?? '—'}</td>
                <td className="px-4 py-2 space-x-1">
                  {c.esCliente && <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-xs">Cliente</span>}
                  {c.esProveedor && <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">Proveedor</span>}
                </td>
              </tr>
            ))}
            {contactos.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay contactos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {contactos.length === 200 && <p className="text-xs text-slate-500 mt-2">Se muestran los primeros 200. Afina la búsqueda para ver más.</p>}
    </main>
  )
}
