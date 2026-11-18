import Link from 'next/link'
import { listarProductos, type FiltroProducto } from '@/app/actions/productos'
import { getCurrentUser } from '@/app/actions/auth'
import { Buscador, Encabezado, Pestanas } from '@/app/components/ui'

export const dynamic = 'force-dynamic'

const TIPOS: { valor: FiltroProducto; label: string }[] = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'venta', label: 'De venta' },
  { valor: 'insumos', label: 'Insumos' },
  { valor: 'servicios', label: 'Servicios' },
]

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 2 })

export default async function ProductosPage({ searchParams }: {
  searchParams: Promise<{ q?: string; tipo?: string }>
}) {
  const { q = '', tipo: tipoParam } = await searchParams
  const tipo = TIPOS.some((t) => t.valor === tipoParam) ? (tipoParam as FiltroProducto) : 'todos'
  const [filas, usuario] = await Promise.all([listarProductos(q, tipo), getCurrentUser()])
  const puedeEditar = usuario && ['bodega', 'administracion'].includes(usuario.rol)

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6">
      <Encabezado titulo="Productos e insumos"
        descripcion="Un insumo es un producto que se compra y no se vende."
        accion={puedeEditar ? { href: '/productos/nuevo', label: 'Nuevo producto' } : undefined} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Buscador q={q} tipo={tipo} placeholder="Buscar por nombre o código..." />
        <Pestanas base="/productos" actual={tipo} opciones={TIPOS} q={q} />
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Código</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Categoría</th>
              <th className="px-4 py-2 font-medium">Unidad</th>
              <th className="px-4 py-2 font-medium text-right">Precio venta</th>
              <th className="px-4 py-2 font-medium text-right">Costo</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ producto: p, categoria }) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-600">{p.codigo ?? '—'}</td>
                <td className="px-4 py-2">
                  {puedeEditar
                    ? <Link href={`/productos/${p.id}`} className="text-marca hover:underline">{p.nombre}</Link>
                    : p.nombre}
                  {!p.seVende && p.seCompra && <span className="ml-2 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs">Insumo</span>}
                  {p.esServicio && <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">Servicio</span>}
                </td>
                <td className="px-4 py-2 text-slate-600">{categoria ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600">{p.unidad}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">{p.seVende ? clp.format(Number(p.precioVenta)) : '—'}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap text-slate-600">{clp.format(Number(p.costo))}</td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No hay productos que coincidan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
