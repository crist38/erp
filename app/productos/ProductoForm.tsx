'use client'

import { useActionState } from 'react'
import { enviarSinBorrar } from '@/app/components/enviarSinBorrar'
import Link from 'next/link'
import { guardarProducto, type FormState } from '@/app/actions/productos'
import type { Producto } from '@/lib/db/schema'
import { botonClass, Campo, Casilla, inputClass } from '@/app/components/ui'

export function ProductoForm({ producto, categorias }: {
  producto?: Producto
  categorias: { id: number; nombre: string }[]
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(guardarProducto, {})
  const p = producto

  return (
    <form onSubmit={enviarSinBorrar(action)} className="bg-white rounded-lg shadow-sm p-5 space-y-5">
      {p && <input type="hidden" name="id" value={p.id} />}
      {state.error && <div className="text-sm p-3 rounded bg-red-50 text-red-600">{state.error}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre *" className="sm:col-span-2">
          <input name="nombre" required defaultValue={p?.nombre} className={inputClass} />
        </Campo>
        <Campo label="Código"><input name="codigo" defaultValue={p?.codigo ?? ''} className={inputClass} /></Campo>
        <Campo label="Unidad de medida">
          <input name="unidad" defaultValue={p?.unidad ?? 'Unidad'} list="unidades" className={inputClass} />
          <datalist id="unidades">
            {['Unidad', 'm²', 'm', 'ml', 'kg', 'Plancha', 'Rollo', 'Caja'].map((u) => <option key={u} value={u} />)}
          </datalist>
        </Campo>
        <Campo label="Categoría">
          <select name="categoriaId" defaultValue={p?.categoriaId ?? ''} className={inputClass}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </Campo>
        <Campo label="O crear categoría nueva">
          <input name="nuevaCategoria" placeholder="Ej: Cristales" className={inputClass} />
        </Campo>
        <Campo label="Precio de venta (CLP, neto)">
          <input name="precioVenta" type="number" min="0" step="any" defaultValue={p ? Number(p.precioVenta) : 0} className={inputClass} />
        </Campo>
        <Campo label="Costo (CLP, neto)">
          <input name="costo" type="number" min="0" step="any" defaultValue={p ? Number(p.costo) : 0} className={inputClass} />
        </Campo>
      </div>

      <div className="flex flex-wrap gap-5">
        <Casilla name="seVende" label="Se vende" defaultChecked={p ? p.seVende : true} />
        <Casilla name="seCompra" label="Se compra" defaultChecked={p?.seCompra} />
        <Casilla name="esServicio" label="Es servicio (no se guarda en bodega)" defaultChecked={p?.esServicio} />
        {p && <Casilla name="activo" label="Activo" defaultChecked={p.activo} />}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={botonClass}>{pending ? 'Guardando...' : 'Guardar'}</button>
        <Link href="/productos" className="text-sm text-slate-600 hover:underline">Cancelar</Link>
      </div>
    </form>
  )
}
