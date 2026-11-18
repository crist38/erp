import './globals.css'
import { cookies } from 'next/headers'
import { Navbar } from './components/Navbar'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session'

export const metadata = {
  title: 'ERP PRO WINDOWS',
  description: 'Ventas, fabricación, bodega y compras de PRO WINDOWS',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
  return (
    <html lang="es">
      <body className="bg-slate-50 min-h-screen text-slate-800 antialiased">
        {session && <Navbar usuario={{ nombre: session.nombre, rol: session.rol }} />}
        {children}
      </body>
    </html>
  )
}
