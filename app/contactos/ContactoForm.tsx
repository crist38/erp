'use client'

import { useActionState } from 'react'
import { enviarSinBorrar } from '@/app/components/enviarSinBorrar'
import Link from 'next/link'
import { guardarContacto, type FormState } from '@/app/actions/contactos'
import type { Contacto } from '@/lib/db/schema'
import { botonClass, Campo, Casilla, inputClass } from '@/app/components/ui'

export function ContactoForm({ contacto }: { contacto?: Contacto }) {
  const [state, action, pending] = useActionState<FormState, FormData>(guardarContacto, {})
  const c = contacto

  return (
    <form onSubmit={enviarSinBorrar(action)} className="bg-white rounded-lg shadow-sm p-5 space-y-5">
      {c && <input type="hidden" name="id" value={c.id} />}
      {state.error && <div className="text-sm p-3 rounded bg-red-50 text-red-600">{state.error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre o razón social *" className="sm:col-span-2">
          <input name="nombre" required defaultValue={c?.nombre} className={inputClass} />
        </Campo>
        <Campo label="RUT"><input name="rut" defaultValue={c?.rut ?? ''} placeholder="76.123.456-7" className={inputClass} /></Campo>
        <Campo label="Giro"><input name="giro" defaultValue={c?.giro ?? ''} className={inputClass} /></Campo>
        <Campo label="Email"><input name="email" type="email" defaultValue={c?.email ?? ''} className={inputClass} /></Campo>
        <Campo label="Teléfono"><input name="telefono" defaultValue={c?.telefono ?? ''} className={inputClass} /></Campo>
        <Campo label="Dirección" className="sm:col-span-2"><input name="direccion" defaultValue={c?.direccion ?? ''} className={inputClass} /></Campo>
        <Campo label="Comuna"><input name="comuna" defaultValue={c?.comuna ?? ''} className={inputClass} /></Campo>
        <Campo label="Región"><input name="region" defaultValue={c?.region ?? ''} className={inputClass} /></Campo>
        <Campo label="Notas" className="sm:col-span-2">
          <textarea name="notas" rows={3} defaultValue={c?.notas ?? ''} className={inputClass} />
        </Campo>
      </div>

      <div className="flex flex-wrap gap-5">
        <Casilla name="esCliente" label="Cliente" defaultChecked={c ? c.esCliente : true} />
        <Casilla name="esProveedor" label="Proveedor" defaultChecked={c?.esProveedor} />
        <Casilla name="esEmpresa" label="Es empresa" defaultChecked={c?.esEmpresa} />
        {c && <Casilla name="activo" label="Activo" defaultChecked={c.activo} />}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={botonClass}>{pending ? 'Guardando...' : 'Guardar'}</button>
        <Link href="/contactos" className="text-sm text-slate-600 hover:underline">Cancelar</Link>
      </div>
    </form>
  )
}
