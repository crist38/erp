// Utilidades para el RUT chileno.

/** Quita puntos, guion y espacios, y deja la K en mayúscula. */
export function limpiarRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

function digitoVerificador(cuerpo: string): string {
  let suma = 0
  let factor = 2
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const dv = 11 - (suma % 11)
  return dv === 11 ? '0' : dv === 10 ? 'K' : String(dv)
}

export function rutValido(rut: string): boolean {
  const limpio = limpiarRut(rut)
  if (limpio.length < 2) return false
  const cuerpo = limpio.slice(0, -1)
  if (!/^\d+$/.test(cuerpo)) return false
  return digitoVerificador(cuerpo) === limpio.slice(-1)
}

/** 761234567 → 76.123.456-7 */
export function formatearRut(rut: string): string {
  const limpio = limpiarRut(rut)
  if (limpio.length < 2) return rut.trim()
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${cuerpo}-${limpio.slice(-1)}`
}
