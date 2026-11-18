'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { requireRol } from '@/app/actions/auth'

export type FiltroProducto = 'todos' | 'venta' | 'insumos' | 'servicios'

export async function listarProductos(q: string, tipo: FiltroProducto, inactivos = false) {
  await requireRol('vendedor', 'taller', 'bodega', 'tecnico')
  const { productos, categoriasProducto } = schema
  const filtros: SQL[] = []
  const texto = q.trim()
  if (texto) filtros.push(or(ilike(productos.nombre, `%${texto}%`), ilike(productos.codigo, `%${texto}%`))!)
  if (tipo === 'venta') filtros.push(eq(productos.seVende, true))
  if (tipo === 'insumos') filtros.push(and(eq(productos.seCompra, true), eq(productos.seVende, false))!)
  if (tipo === 'servicios') filtros.push(eq(productos.esServicio, true))
  if (!inactivos) filtros.push(eq(productos.activo, true))

  return getDb()
    .select({ producto: productos, categoria: categoriasProducto.nombre })
    .from(productos)
    .leftJoin(categoriasProducto, eq(productos.categoriaId, categoriasProducto.id))
    .where(filtros.length ? and(...filtros) : undefined)
    .orderBy(asc(productos.nombre))
    .limit(300)
}

export async function obtenerProducto(id: number) {
  await requireRol('vendedor', 'taller', 'bodega', 'tecnico')
  const [p] = await getDb().select().from(schema.productos).where(eq(schema.productos.id, id)).limit(1)
  return p ?? null
}

export async function listarCategorias() {
  await requireRol('vendedor', 'taller', 'bodega', 'tecnico')
  return getDb().select().from(schema.categoriasProducto).orderBy(asc(schema.categoriasProducto.nombre))
}

export interface FormState {
  error?: string
}

function monto(valor: FormDataEntryValue | null): string | null {
  const s = String(valor ?? '').trim().replace(',', '.')
  if (!s) return '0'
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? n.toFixed(2) : null
}

/** Crea o actualiza un producto. Solo Bodega y Administración editan el catálogo. */
export async function guardarProducto(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireRol('bodega')
  const id = Number(fd.get('id')) || null
  const nombre = String(fd.get('nombre') ?? '').trim()
  if (!nombre) return { error: 'El nombre es obligatorio.' }

  const precioVenta = monto(fd.get('precioVenta'))
  const costo = monto(fd.get('costo'))
  if (precioVenta === null || costo === null) return { error: 'Precio y costo deben ser números positivos.' }

  const seVende = fd.get('seVende') === 'on'
  const seCompra = fd.get('seCompra') === 'on'
  if (!seVende && !seCompra) return { error: 'Marque si se vende, se compra o ambos.' }

  const db = getDb()
  let categoriaId: number | null = Number(fd.get('categoriaId')) || null
  const nuevaCategoria = String(fd.get('nuevaCategoria') ?? '').trim()
  if (nuevaCategoria) {
    const [cat] = await db.insert(schema.categoriasProducto).values({ nombre: nuevaCategoria })
      .returning({ id: schema.categoriasProducto.id })
    categoriaId = cat.id
  }

  const valores = {
    codigo: String(fd.get('codigo') ?? '').trim() || null,
    nombre,
    categoriaId,
    esServicio: fd.get('esServicio') === 'on',
    seVende,
    seCompra,
    unidad: String(fd.get('unidad') ?? '').trim() || 'Unidad',
    precioVenta,
    costo,
    activo: id ? fd.get('activo') === 'on' : true,
    actualizadoEn: new Date(),
  }

  if (valores.codigo) {
    const [repetido] = await db.select({ id: schema.productos.id, nombre: schema.productos.nombre })
      .from(schema.productos).where(eq(schema.productos.codigo, valores.codigo)).limit(1)
    if (repetido && repetido.id !== id) return { error: `El código ya lo usa ${repetido.nombre}.` }
  }

  if (id) {
    await db.update(schema.productos).set(valores).where(eq(schema.productos.id, id))
  } else {
    await db.insert(schema.productos).values(valores)
  }
  revalidatePath('/productos')
  redirect('/productos')
}
