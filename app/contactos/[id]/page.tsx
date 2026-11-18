import { notFound } from 'next/navigation'
import { obtenerContacto } from '@/app/actions/contactos'
import { Encabezado } from '@/app/components/ui'
import { ContactoForm } from '../ContactoForm'

export default async function EditarContactoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contacto = await obtenerContacto(Number(id))
  if (!contacto) notFound()
  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Encabezado titulo={contacto.nombre} descripcion="Editar contacto" />
      <ContactoForm contacto={contacto} />
    </main>
  )
}
