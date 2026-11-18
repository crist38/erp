import Link from 'next/link'

export const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-marca focus:border-marca'
export const botonClass =
  'inline-flex items-center gap-2 bg-marca hover:bg-marca-oscuro text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-60'

export function Encabezado({ titulo, descripcion, accion }: {
  titulo: string
  descripcion?: string
  accion?: { href: string; label: string }
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">{titulo}</h1>
        {descripcion && <p className="text-sm text-slate-500 mt-1">{descripcion}</p>}
      </div>
      {accion && <Link href={accion.href} className={botonClass}>{accion.label}</Link>}
    </div>
  )
}

export function Campo({ label, children, className = '' }: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-slate-600 ${className}`}>
      {label}
      {children}
    </label>
  )
}

export function Casilla({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-marca" />
      {label}
    </label>
  )
}

export function Pestanas({ base, actual, opciones, q }: {
  base: string
  actual: string
  opciones: { valor: string; label: string }[]
  q: string
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {opciones.map((o) => {
        const params = new URLSearchParams()
        if (o.valor !== 'todos') params.set('tipo', o.valor)
        if (q) params.set('q', q)
        const href = params.size ? `${base}?${params}` : base
        return (
          <Link key={o.valor} href={href}
            className={`px-3 py-1.5 rounded-md text-sm ${actual === o.valor ? 'bg-marca text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}>
            {o.label}
          </Link>
        )
      })}
    </div>
  )
}

export function Buscador({ q, tipo, placeholder }: { q: string; tipo: string; placeholder: string }) {
  return (
    <form className="flex-1 min-w-[14rem]">
      {tipo !== 'todos' && <input type="hidden" name="tipo" value={tipo} />}
      <input name="q" defaultValue={q} placeholder={placeholder} className={inputClass} />
    </form>
  )
}
