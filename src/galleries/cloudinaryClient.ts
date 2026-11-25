const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined)?.trim() ?? ''
const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined)?.trim() ?? ''

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset)

export const cloudinaryConfig = {
  cloudName,
  uploadPreset,
}

export interface CloudinaryUploadResult {
  secureUrl: string
  publicId: string
  format: string
  width: number
  height: number
  bytes: number
}

/**
 * Sube una imagen a Cloudinary usando el endpoint de carga unsigned de la API REST.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  options: {
    folder?: string
    publicId?: string
    tags?: string[]
  } = {}
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary no está configurado. Verificá VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  if (options.folder) {
    formData.append('folder', options.folder)
  }
  if (options.publicId) {
    formData.append('public_id', options.publicId)
  }
  if (options.tags && options.tags.length > 0) {
    formData.append('tags', options.tags.join(','))
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    const message = errorBody?.error?.message || `Error al subir imagen a Cloudinary (status ${response.status})`
    throw new Error(message)
  }

  const data = await response.json()
  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    width: data.width,
    height: data.height,
    bytes: data.bytes,
  }
}

/**
 * Construye una URL optimizada de Cloudinary para una imagen dada su ruta o public_id.
 * Aplica transformaciones automáticas de formato y calidad (f_auto, q_auto) por defecto.
 */
export function buildCloudinaryUrl(
  pathOrPublicId: string,
  transformations = 'f_auto,q_auto'
): string {
  if (!pathOrPublicId) return ''
  if (pathOrPublicId.startsWith('http://') || pathOrPublicId.startsWith('https://')) {
    return pathOrPublicId
  }
  if (!cloudName) return pathOrPublicId

  const cleanPath = pathOrPublicId.replace(/^\/+/, '')
  const transform = transformations ? `${transformations}/` : ''
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}${cleanPath}`
}
