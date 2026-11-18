import { listarCategorias } from '@/app/actions/productos'
import { Encabezado } from '@/app/components/ui'
import { ProductoForm } from '../ProductoForm'

export const dynamic = 'force-dynamic'

export default async function NuevoProductoPage() {
  const categorias = await listarCategorias()
  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Encabezado titulo="Nuevo producto" />
      <ProductoForm categorias={categorias} />
    </main>
  )
}
