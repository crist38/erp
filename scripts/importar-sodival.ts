// Copia clientes, proveedores, categorías y productos desde la base Access antigua
// (SODIVALBD.mdb) a la base propia. Lee el archivo directamente, sin Access ni ODBC.
//
// Se puede correr varias veces:
// - Contactos se cruzan por RUT. Si el RUT ya existe (por ejemplo, importado desde Odoo),
//   solo se completan los campos vacíos y se marcan como cliente o proveedor; no se pisa nada.
// - Categorías y productos se cruzan por sodival_id y se actualizan.
// No importa usuarios (la base antigua guarda contraseñas en texto plano) ni el historial
// de ventas, compras o cheques: eso queda para cuando existan esos módulos.
//
// Uso: npm run importar-sodival -- ruta/a/SODIVALBD.mdb [--activos-desde=2019]
//   --activos-desde=AÑO  productos sin ventas desde ese año quedan inactivos (por defecto 2019).
//                        Con --activos-desde=0 todos quedan activos.
// Necesita DATABASE_URL.
import { readFileSync } from 'node:fs'
import MDBReader from 'mdb-reader'
import { sql } from 'drizzle-orm'
import { closeDb, getDb, schema } from '../lib/db'
import { formatearRut, limpiarRut, rutValido } from '../lib/rut'

const LOTE = 500
type Fila = Record<string, any>

// Numeración antigua de regiones usada en la tabla Ciudades
const REGIONES: Record<number, string> = {
  1: 'Tarapacá', 2: 'Antofagasta', 3: 'Atacama', 4: 'Coquimbo', 5: 'Valparaíso',
  6: "O'Higgins", 7: 'Maule', 8: 'Biobío', 9: 'La Araucanía', 10: 'Los Lagos',
  11: 'Aysén', 12: 'Magallanes', 13: 'Metropolitana', 14: 'Los Ríos', 15: 'Arica y Parinacota', 16: 'Ñuble',
}

const txt = (v: unknown): string | null => {
  if (v === null || v === undefined) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  return s && s !== '0' ? s : null
}

function args() {
  const pos = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const flag = process.argv.find((a) => a.startsWith('--activos-desde='))
  const archivo = pos[0] ?? process.env.SODIVAL_MDB
  if (!archivo) throw new Error('Indica la ruta del archivo: npm run importar-sodival -- ruta/SODIVALBD.mdb')
  return { archivo, activosDesde: flag ? Number(flag.split('=')[1]) : 2019 }
}

function leerTabla(mdb: MDBReader, nombre: string): Fila[] {
  return mdb.getTableNames().includes(nombre) ? mdb.getTable(nombre).getData() as Fila[] : []
}

function porId<T extends Fila>(filas: T[], campo = 'ID'): Map<any, T> {
  return new Map(filas.map((f) => [f[campo], f]))
}

async function importarContactos(mdb: MDBReader) {
  const db = getDb()
  const giros = porId(leerTabla(mdb, 'Giros'))
  const ciudades = porId(leerTabla(mdb, 'Ciudades'))
  const clientes = leerTabla(mdb, 'Clientes')
  const proveedores = leerTabla(mdb, 'Proveedores')

  // Un mismo RUT puede ser cliente y proveedor: se juntan en una sola ficha
  type Nuevo = typeof schema.contactos.$inferInsert
  const porRut = new Map<string, Nuevo>()
  let invalidos = 0
  const agregar = (f: Fila, tipo: 'cliente' | 'proveedor') => {
    const rut = limpiarRut(`${f.ID ?? ''}${f.dv ?? ''}`)
    if (!rutValido(rut)) { invalidos++; return }
    const ciudad = ciudades.get(f.IDciudad)
    const giro = txt(giros.get(f.IDgiro)?.nombre)
    const telefono = [f.fono1, f.celular, f.fono2].map(txt).filter(Boolean).join(' / ') || null
    const notas = [txt(f.contacto) && `Contacto: ${txt(f.contacto)}`, txt(f.comentario)].filter(Boolean).join('\n') || null
    const previo = porRut.get(rut)
    const ficha: Nuevo = {
      nombre: txt(f.nombre) ?? previo?.nombre ?? `RUT ${formatearRut(rut)}`,
      rut: formatearRut(rut),
      email: txt(f.email)?.toLowerCase() ?? previo?.email ?? null,
      telefono: telefono ?? previo?.telefono ?? null,
      direccion: [txt(f.direccion), txt(f.poblacion)].filter(Boolean).join(', ') || previo?.direccion || null,
      comuna: txt(ciudad?.nombre) ?? previo?.comuna ?? null,
      region: (ciudad?.region && REGIONES[ciudad.region]) || previo?.region || null,
      giro: giro && !/^(n\/a|particular)$/i.test(giro) ? giro : previo?.giro ?? null,
      // RUT de 50 millones hacia arriba corresponde a personas jurídicas
      esEmpresa: Number(rut.slice(0, -1)) >= 50_000_000,
      esCliente: tipo === 'cliente' || !!previo?.esCliente,
      esProveedor: tipo === 'proveedor' || !!previo?.esProveedor,
      notas: notas ?? previo?.notas ?? null,
    }
    porRut.set(rut, ficha)
  }
  clientes.forEach((f) => agregar(f, 'cliente'))
  proveedores.forEach((f) => agregar(f, 'proveedor'))

  const existentes = new Map(
    (await db.select().from(schema.contactos)).filter((c) => c.rut).map((c) => [limpiarRut(c.rut!), c]),
  )

  const nuevos: Nuevo[] = []
  let completados = 0
  for (const [rut, ficha] of porRut) {
    const actual = existentes.get(rut)
    if (!actual) { nuevos.push(ficha); continue }
    // Ya existe: solo se rellenan campos vacíos y se suman las marcas cliente/proveedor
    const cambios: Partial<Nuevo> = {}
    for (const campo of ['email', 'telefono', 'direccion', 'comuna', 'region', 'giro', 'notas'] as const) {
      if (!actual[campo] && ficha[campo]) cambios[campo] = ficha[campo]
    }
    if (ficha.esCliente && !actual.esCliente) cambios.esCliente = true
    if (ficha.esProveedor && !actual.esProveedor) cambios.esProveedor = true
    if (Object.keys(cambios).length) {
      await db.update(schema.contactos).set({ ...cambios, actualizadoEn: new Date() })
        .where(sql`${schema.contactos.id} = ${actual.id}`)
      completados++
    }
  }
  for (let i = 0; i < nuevos.length; i += LOTE) {
    await db.insert(schema.contactos).values(nuevos.slice(i, i + LOTE))
  }
  console.log(`Contactos: ${nuevos.length} nuevos, ${completados} existentes completados, `
    + `${invalidos} omitidos por RUT inválido (de ${clientes.length} clientes y ${proveedores.length} proveedores).`)
}

async function importarProductos(mdb: MDBReader, activosDesde: number) {
  const db = getDb()
  const grupos = porId(leerTabla(mdb, 'GrupoProd'), 'Id')
  const unidades = porId(leerTabla(mdb, 'Unidades'))
  const colores = porId(leerTabla(mdb, 'Colores'), 'Id')
  const lineas = leerTabla(mdb, 'Lineas')

  // Categoría = "Grupo / Línea", por ejemplo "Quincallería / Bisagras"
  if (lineas.length) {
    await db.insert(schema.categoriasProducto).values(lineas.map((l) => ({
      sodivalId: String(l.ID),
      nombre: [txt(grupos.get(l.IDgrupoprod)?.Nombre), txt(l.nombre)].filter(Boolean).join(' / ') || String(l.ID),
    }))).onConflictDoUpdate({ target: schema.categoriasProducto.sodivalId, set: { nombre: sql`excluded.nombre` } })
  }
  const mapaCategorias = new Map(
    (await db.select().from(schema.categoriasProducto)).filter((c) => c.sodivalId).map((c) => [c.sodivalId, c.id]),
  )
  const lineaPorId = porId(lineas)

  // Último año en que se vendió cada producto, para dejar inactivos los que ya no se mueven
  const fechaVenta = new Map<number, number>()
  for (const v of leerTabla(mdb, 'Ventas')) {
    if (v.estactiva && v.fecha instanceof Date) fechaVenta.set(v.ID, v.fecha.getUTCFullYear())
  }
  const ultimoAnio = new Map<number, number>()
  for (const d of leerTabla(mdb, 'VenDetalle')) {
    const anio = fechaVenta.get(d.IDventa)
    if (anio && anio > (ultimoAnio.get(d.IDproducto) ?? 0)) ultimoAnio.set(d.IDproducto, anio)
  }

  const filas = leerTabla(mdb, 'Productos')
  const valores = filas.map((p) => {
    const linea = lineaPorId.get(p.IDlinea)
    const grupo = grupos.get(linea?.IDgrupoprod)
    const color = txt(colores.get(p.IDcolor)?.Nombre)
    let codigo = txt(p.IDcodigo)
    // El mismo código se repite en varios colores: se agrega el color para distinguirlos
    if (codigo && p.IDcolor && !codigo.toUpperCase().endsWith(String(p.IDcolor).toUpperCase())) codigo += String(p.IDcolor)
    let nombre = txt(p.nombre) ?? `Producto ${p.ID}`
    if (color && !nombre.toLowerCase().includes(color.toLowerCase())) nombre += ` ${color}`
    const vendido = ultimoAnio.get(p.ID) ?? 0
    // Grupo 100 = "Otro - no afecta stock" (servicios y conceptos varios)
    const esServicio = grupo?.Id === 100
    // En la base antigua los perfiles (tiras) tienen precio por kilo y las planchas de cristal
    // por m²; el campo peso trae los kilos de la tira o los m² de la plancha. Aquí se guarda
    // el precio de la tira o plancha completa.
    const factor = ['t', 'pl'].includes(linea?.IDunidad) && Number(p.peso) > 0 ? Number(p.peso) : 1
    const porUnidad = (valor: number) => Math.round(valor * factor)
    return {
      sodivalId: p.ID as number,
      codigo,
      nombre,
      categoriaId: mapaCategorias.get(String(p.IDlinea)) ?? null,
      esServicio,
      seVende: true,
      seCompra: !esServicio,
      unidad: txt(unidades.get(linea?.IDunidad)?.nombre) ?? 'Unidades',
      precioVenta: String(porUnidad(Number(p.valorlista) || Number(p.valorcontado) || 0)),
      costo: String(porUnidad(Number(p.costoultimo) || Number(p.costopromedio) || 0)),
      activo: p.estactivo !== false && (activosDesde === 0 || vendido >= activosDesde),
      actualizadoEn: new Date(),
    }
  })
  for (let i = 0; i < valores.length; i += LOTE) {
    await db.insert(schema.productos).values(valores.slice(i, i + LOTE)).onConflictDoUpdate({
      target: schema.productos.sodivalId,
      set: {
        codigo: sql`excluded.codigo`, nombre: sql`excluded.nombre`, categoriaId: sql`excluded.categoria_id`,
        esServicio: sql`excluded.es_servicio`, seVende: sql`excluded.se_vende`, seCompra: sql`excluded.se_compra`,
        unidad: sql`excluded.unidad`, precioVenta: sql`excluded.precio_venta`, costo: sql`excluded.costo`,
        activo: sql`excluded.activo`, actualizadoEn: sql`excluded.actualizado_en`,
      },
    })
  }
  const activos = valores.filter((v) => v.activo).length
  console.log(`Productos: ${valores.length} importados (${activos} activos`
    + `${activosDesde ? `, con ventas desde ${activosDesde}` : ''}), ${lineas.length} categorías.`)
}

async function main() {
  const { archivo, activosDesde } = args()
  console.log(`Leyendo ${archivo}...`)
  const mdb = new MDBReader(readFileSync(archivo))
  await importarContactos(mdb)
  await importarProductos(mdb, activosDesde)
  console.log('Importación terminada. Los precios son los últimos de la base antigua: revísalos antes de cotizar.')
}

main()
  .catch((err) => { console.error('La importación falló:', err?.message ?? err); process.exitCode = 1 })
  .finally(() => closeDb())
