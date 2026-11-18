import { notFound } from 'next/navigation'
import { listarCategorias, obtenerProducto } from '@/app/actions/productos'
import { Encabezado } from '@/app/components/ui'
import { ProductoForm } from '../ProductoForm'

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [producto, categorias] = await Promise.all([obtenerProducto(Number(id)), listarCategorias()])
  if (!producto) notFound()
  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Encabezado titulo={producto.nombre} descripcion="Editar producto" />
      <ProductoForm producto={producto} categorias={categorias} />
    </main>
  )
}
