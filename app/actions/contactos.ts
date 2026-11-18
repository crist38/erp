'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, asc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { requireRol } from '@/app/actions/auth'
import { formatearRut, limpiarRut, rutValido } from '@/lib/rut'

export type FiltroTipo = 'todos' | 'clientes' | 'proveedores'

export async function listarContactos(q: string, tipo: FiltroTipo, inactivos = false) {
  await requireRol('vendedor', 'taller', 'bodega', 'tecnico')
  const filtros: SQL[] = []
  const texto = q.trim()
  if (texto) {
    const patron = `%${texto}%`
    const rut = limpiarRut(texto)
    filtros.push(or(
      ilike(schema.contactos.nombre, patron),
      ilike(schema.contactos.email, patron),
      // Busca el RUT sin importar puntos ni guion
      rut ? sql`regexp_replace(upper(coalesce(${schema.contactos.rut}, '')), '[^0-9K]', '', 'g') like ${'%' + rut + '%'}` : undefined,
    )!)
  }
  if (tipo === 'clientes') filtros.push(eq(schema.contactos.esCliente, true))
  if (tipo === 'proveedores') filtros.push(eq(schema.contactos.esProveedor, true))
  if (!inactivos) filtros.push(eq(schema.contactos.activo, true))

  return getDb().select().from(schema.contactos)
    .where(filtros.length ? and(...filtros) : undefined)
    .orderBy(asc(schema.contactos.nombre))
    .limit(200)
}

export async function obtenerContacto(id: number) {
  await requireRol('vendedor', 'taller', 'bodega', 'tecnico')
  const [c] = await getDb().select().from(schema.contactos).where(eq(schema.contactos.id, id)).limit(1)
  return c ?? null
}

export interface FormState {
  error?: string
}

const texto = (fd: FormData, campo: string) => String(fd.get(campo) ?? '').trim() || null

/** Crea o actualiza un contacto desde el formulario. Con id actualiza; sin id crea. */
export async function guardarContacto(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireRol('vendedor', 'bodega')
  const id = Number(fd.get('id')) || null
  const nombre = texto(fd, 'nombre')
  if (!nombre) return { error: 'El nombre es obligatorio.' }

  let rut = texto(fd, 'rut')
  if (rut) {
    if (!rutValido(rut)) return { error: 'El RUT no es válido. Revise el dígito verificador.' }
    rut = formatearRut(rut)
  }
  const esCliente = fd.get('esCliente') === 'on'
  const esProveedor = fd.get('esProveedor') === 'on'
  if (!esCliente && !esProveedor) return { error: 'Marque si es cliente, proveedor o ambos.' }

  const valores = {
    nombre,
    rut,
    email: texto(fd, 'email')?.toLowerCase() ?? null,
    telefono: texto(fd, 'telefono'),
    direccion: texto(fd, 'direccion'),
    comuna: texto(fd, 'comuna'),
    region: texto(fd, 'region'),
    giro: texto(fd, 'giro'),
    notas: texto(fd, 'notas'),
    esEmpresa: fd.get('esEmpresa') === 'on',
    esCliente,
    esProveedor,
    activo: id ? fd.get('activo') === 'on' : true,
    actualizadoEn: new Date(),
  }

  const db = getDb()
  if (rut) {
    const [repetido] = await db.select({ id: schema.contactos.id, nombre: schema.contactos.nombre })
      .from(schema.contactos).where(eq(schema.contactos.rut, rut)).limit(1)
    if (repetido && repetido.id !== id) return { error: `Ese RUT ya está registrado para ${repetido.nombre}.` }
  }

  if (id) {
    await db.update(schema.contactos).set(valores).where(eq(schema.contactos.id, id))
  } else {
    await db.insert(schema.contactos).values(valores)
  }
  revalidatePath('/contactos')
  redirect('/contactos')
}
