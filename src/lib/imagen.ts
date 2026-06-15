// Utilidad para leer una imagen y redimensionarla.
// Devuelve un data URL (para mostrar/guardar local) y un Blob (para subir a Storage).
// Evita guardar imágenes enormes (las de cámara pesan varios MB).

export interface ImagenProcesada {
  dataUrl: string
  blob: Blob
}

/** Lee un archivo de imagen y lo redimensiona (máx `max` px de lado). */
export function procesarImagen(file: File, max = 256): Promise<ImagenProcesada> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo no es una imagen'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagen inválida'))
      img.onload = () => {
        const escala = Math.min(1, max / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * escala))
        const h = Math.max(1, Math.round(img.height * escala))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas no disponible'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ dataUrl, blob })
            else reject(new Error('No se pudo generar la imagen'))
          },
          'image/jpeg',
          0.85,
        )
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
