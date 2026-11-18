'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Package, UserCog, LogOut, Menu, X } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { puedeAcceder, ROL_LABELS, type Rol } from '@/lib/roles'

const ITEMS = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/contactos', label: 'Clientes y proveedores', icon: Users },
  { href: '/productos', label: 'Productos', icon: Package },
  { href: '/admin/usuarios', label: 'Usuarios', icon: UserCog },
]

export function Navbar({ usuario }: { usuario: { nombre: string; rol: Rol } }) {
  const pathname = usePathname()
  const [abierto, setAbierto] = useState(false)
  const items = ITEMS.filter((i) => puedeAcceder(usuario.rol, i.href))
  const activo = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const enlaces = (movil: boolean) => items.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} onClick={() => setAbierto(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        activo(href) ? 'bg-marca-oscuro text-white' : 'text-white/80 hover:bg-marca-claro hover:text-white'
      } ${movil ? 'w-full' : 'whitespace-nowrap'}`}>
      <Icon size={16} /> {label}
    </Link>
  ))

  const cuenta = (
    <form action={logout} className="flex items-center gap-2 text-sm">
      <span className="text-white/90 truncate max-w-[14rem]">
        {usuario.nombre} <span className="text-white/60">· {ROL_LABELS[usuario.rol]}</span>
      </span>
      <button type="submit" title="Cerrar sesión" aria-label="Cerrar sesión"
        className="p-2 rounded-md text-white/80 hover:bg-marca-claro hover:text-white">
        <LogOut size={16} />
      </button>
    </form>
  )

  return (
    <nav className="bg-marca text-white shadow-md sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <img src="/logo-texto.png" alt="PRO WINDOWS" className="h-8 object-contain bg-white/95 px-2 py-1 rounded" />
        <div className="hidden lg:flex items-center gap-1">{enlaces(false)}</div>
        <div className="hidden lg:block">{cuenta}</div>
        <button type="button" className="lg:hidden p-2 rounded-md hover:bg-marca-claro"
          aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
          {abierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {abierto && (
        <div className="lg:hidden border-t border-white/10 px-2 py-2 space-y-1">
          {enlaces(true)}
          <div className="px-3 pt-2 border-t border-white/10">{cuenta}</div>
        </div>
      )}
    </nav>
  )
}
