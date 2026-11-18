import { startTransition, type FormEvent } from 'react'

/**
 * Envía el formulario a una acción de useActionState sin que React lo vacíe.
 * Con <form action={...}> React 19 limpia los campos al terminar, y si la
 * acción devuelve un error la persona pierde lo que había escrito.
 */
export function enviarSinBorrar(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => action(fd))
  }
}
