import { Encabezado } from '@/app/components/ui'
import { ContactoForm } from '../ContactoForm'

export default function NuevoContactoPage() {
  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Encabezado titulo="Nuevo contacto" />
      <ContactoForm />
    </main>
  )
}
