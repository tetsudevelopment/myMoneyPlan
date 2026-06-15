/** Avatar del usuario: muestra la imagen si existe, o la inicial del nombre/correo. */
export function Avatar({
  src,
  nombre,
  email,
  className = '',
}: {
  src?: string | null
  nombre?: string
  email?: string | null
  className?: string
}) {
  if (src) {
    return <img src={src} alt="Foto de perfil" className={`object-cover ${className}`} />
  }
  const base = (nombre || email || '').trim()
  const inicial = base ? base[0].toUpperCase() : '🙂'
  return (
    <span
      className={`grid place-items-center bg-verde-claro font-bold text-verde-medio ${className}`}
    >
      {inicial}
    </span>
  )
}
