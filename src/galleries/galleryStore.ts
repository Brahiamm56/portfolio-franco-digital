import { isSupabaseConfigured, supabase } from './supabaseClient'

const STORAGE_BUCKET = 'gallery-photos'
const LOCAL_GALLERIES_KEY = 'franco-digital-galleries-v1'
const ASSET_DB_NAME = 'franco-digital-gallery-assets'
const ASSET_STORE_NAME = 'photos'
const maxPhotoSize = 6 * 1024 * 1024
const photoExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type GalleryStatus = 'draft' | 'published'

export type GalleryPhoto = {
  id: string
  filename: string
  priceArs: number
  url: string
  storagePath: string
}

export type PhotoGallery = {
  id: string
  title: string
  clientName: string
  eventDate: string
  status: GalleryStatus
  shareToken: string
  clientSelectedPhotoIds: string[]
  coverPhotoId?: string | null
  coverPhotoUrl?: string | null
  createdAt: string
  photos: GalleryPhoto[]
}

export type PublicGalleryPhoto = Omit<GalleryPhoto, 'storagePath'>
export type PublicPhotoGallery = Pick<PhotoGallery, 'id' | 'title' | 'clientName' | 'eventDate' | 'clientSelectedPhotoIds'> & {
  coverPhotoId?: string | null
  coverPhotoUrl?: string | null
  photos: PublicGalleryPhoto[]
}

export type PublishedGalleryLink = Pick<PhotoGallery, 'id' | 'title' | 'eventDate' | 'shareToken' | 'createdAt'> & {
  clientName?: string
  photoCount?: number
  coverPhotoUrl?: string | null
  previewPhotos: Array<Pick<GalleryPhoto, 'id' | 'url'>>
}

type LocalGallery = Omit<PhotoGallery, 'photos'> & {
  coverPhotoId?: string | null
  photos: Array<Omit<GalleryPhoto, 'url'>>
}

export const usingDemoGalleryStore = import.meta.env.DEV && !isSupabaseConfigured

function ensureSupabaseConfigured() {
  if (!supabase) throw new Error('El servicio de galerías no está configurado. Contactá al administrador del sitio.')
}

function openAssetDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(ASSET_DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(ASSET_STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function putDemoAsset(id: string, file: File) {
  const db = await openAssetDb()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ASSET_STORE_NAME, 'readwrite')
    transaction.objectStore(ASSET_STORE_NAME).put(file, id)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
}

async function getDemoAsset(id: string) {
  const db = await openAssetDb()
  const file = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(ASSET_STORE_NAME, 'readonly').objectStore(ASSET_STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result as Blob | undefined)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return file
}

function readLocalGalleries(): LocalGallery[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_GALLERIES_KEY) ?? '[]') as LocalGallery[]
  } catch {
    return []
  }
}

function writeLocalGalleries(galleries: LocalGallery[]) {
  localStorage.setItem(LOCAL_GALLERIES_KEY, JSON.stringify(galleries))
}

function createShareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hasExpectedImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (file.type === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (file.type === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)
  }
  if (file.type === 'image/webp') {
    return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  }
  return false
}

/**
 * Optimiza y comprime imágenes en el navegador antes de subirlas al almacenamiento.
 * Reduce fotos pesadas de cámaras/móviles a una resolución máxima para web (2200px)
 * y calidad 84%, logrando que las galerías carguen de inmediato sin pérdida perceptible.
 */
export async function optimizeImageForWeb(
  file: File,
  maxDimension = 2200,
  quality = 0.84
): Promise<File> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file
  }
  if (!file.type.startsWith('image/') || file.size < 220 * 1024) {
    return file
  }
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  try {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.src = objectUrl

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image decode failed'))
    })

    const { naturalWidth: width, naturalHeight: height } = img

    if (width <= maxDimension && height <= maxDimension && file.size < 500 * 1024) {
      URL.revokeObjectURL(objectUrl)
      return file
    }

    let targetWidth = width
    let targetHeight = height
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        targetWidth = maxDimension
        targetHeight = Math.round((height * maxDimension) / width)
      } else {
        targetHeight = maxDimension
        targetWidth = Math.round((width * maxDimension) / height)
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      URL.revokeObjectURL(objectUrl)
      return file
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
    URL.revokeObjectURL(objectUrl)

    const targetType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), targetType, quality)
    })

    if (!blob || blob.size >= file.size) {
      return file
    }

    return new File([blob], file.name, {
      type: targetType,
      lastModified: Date.now(),
    })
  } catch (err) {
    console.warn('No se pudo optimizar la imagen antes de subirla, se usará la original:', err)
    return file
  }
}

function mapRemotePhoto(photo: Record<string, unknown>, url: string): GalleryPhoto {
  return {
    id: String(photo.id),
    filename: String(photo.original_filename),
    priceArs: Number(photo.price_ars),
    url,
    storagePath: String(photo.storage_path),
  }
}

export function resolveGalleryCoverPhoto<T extends { id: string; url: string; filename?: string }>(
  photos: T[],
  coverPhotoId?: string | null
): T | undefined {
  if (coverPhotoId) {
    const found = photos.find((photo) => photo.id === coverPhotoId)
    if (found) return found
  }
  const byPrefix = photos.find((photo) => photo.filename?.startsWith('[PORTADA]'))
  if (byPrefix) return byPrefix
  return photos[0]
}

export async function listGalleries(): Promise<PhotoGallery[]> {
  if (!supabase && usingDemoGalleryStore) {
    return Promise.all(readLocalGalleries().map(async (gallery) => {
      const photos = await Promise.all(gallery.photos.map(async (photo) => {
        const asset = await getDemoAsset(photo.id)
        return { ...photo, url: asset ? URL.createObjectURL(asset) : '' }
      }))
      const coverPhoto = resolveGalleryCoverPhoto(photos, gallery.coverPhotoId)
      return {
        ...gallery,
        clientSelectedPhotoIds: gallery.clientSelectedPhotoIds ?? [],
        coverPhotoId: coverPhoto?.id ?? null,
        coverPhotoUrl: coverPhoto?.url ?? null,
        photos,
      }
    }))
  }
  ensureSupabaseConfigured()

  let data: Array<Record<string, unknown>> | null = null
  const withCoverQuery = await supabase!
    .from('photo_galleries')
    .select('id, title, client_name, event_date, status, share_token, client_selected_photo_ids, cover_photo_id, created_at, gallery_photos(id, original_filename, price_ars, storage_path, created_at)')
    .order('created_at', { ascending: false })

  if (!withCoverQuery.error) {
    data = withCoverQuery.data as unknown as Array<Record<string, unknown>>
  } else {
    const fallbackQuery = await supabase!
      .from('photo_galleries')
      .select('id, title, client_name, event_date, status, share_token, client_selected_photo_ids, created_at, gallery_photos(id, original_filename, price_ars, storage_path, created_at)')
      .order('created_at', { ascending: false })
    if (fallbackQuery.error) throw fallbackQuery.error
    data = fallbackQuery.data as unknown as Array<Record<string, unknown>>
  }

  return Promise.all((data ?? []).map(async (row) => {
    const rawPhotos = (row.gallery_photos ?? []) as Array<Record<string, unknown>>
    const photos = await Promise.all(rawPhotos.map(async (photo) => {
      const { data: signed, error: signedError } = await supabase!.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(String(photo.storage_path), 1800)
      if (signedError) throw signedError
      return mapRemotePhoto(photo, signed.signedUrl)
    }))
    const localCover = typeof window !== 'undefined' ? localStorage.getItem(`gallery-cover-${row.id}`) : null
    const coverPhoto = resolveGalleryCoverPhoto(photos, (row.cover_photo_id as string) || localCover)
    return {
      id: String(row.id),
      title: String(row.title),
      clientName: String(row.client_name),
      eventDate: (row.event_date as string) ?? '',
      status: row.status as GalleryStatus,
      shareToken: String(row.share_token),
      clientSelectedPhotoIds: (row.client_selected_photo_ids as string[]) ?? [],
      coverPhotoId: coverPhoto?.id ?? null,
      coverPhotoUrl: coverPhoto?.url ?? null,
      createdAt: String(row.created_at),
      photos,
    }
  }))
}

export async function createGallery(input: {
  title: string
  clientName: string
  eventDate: string
  coverFile?: File | null
}) {
  const shareToken = createShareToken()
  if (!supabase && usingDemoGalleryStore) {
    const galleryId = crypto.randomUUID()
    let coverPhotoId: string | null = null
    const initialPhotos: LocalGallery['photos'] = []

    if (input.coverFile) {
      if (!photoExtensions[input.coverFile.type] || input.coverFile.size === 0 || input.coverFile.size > maxPhotoSize) {
        throw new Error('La portada debe ser una imagen JPG, PNG o WebP de hasta 6 MB.')
      }
      coverPhotoId = crypto.randomUUID()
      await putDemoAsset(coverPhotoId, input.coverFile)
      initialPhotos.push({
        id: coverPhotoId,
        filename: `[PORTADA] ${input.coverFile.name}`,
        priceArs: 0,
        storagePath: coverPhotoId,
      })
    }

    const gallery: LocalGallery = {
      id: galleryId,
      title: input.title,
      clientName: input.clientName,
      eventDate: input.eventDate,
      status: 'draft',
      shareToken,
      clientSelectedPhotoIds: [],
      coverPhotoId,
      createdAt: new Date().toISOString(),
      photos: initialPhotos,
    }
    writeLocalGalleries([gallery, ...readLocalGalleries()])
    if (coverPhotoId && typeof window !== 'undefined') {
      localStorage.setItem(`gallery-cover-${galleryId}`, coverPhotoId)
    }
    return gallery.id
  }
  ensureSupabaseConfigured()

  const { data: userResult, error: userError } = await supabase!.auth.getUser()
  if (userError || !userResult.user) throw userError ?? new Error('Iniciá sesión para crear una galería.')
  const { data, error } = await supabase!.from('photo_galleries').insert({
    owner_id: userResult.user.id,
    title: input.title,
    client_name: input.clientName,
    event_date: input.eventDate || null,
    status: 'draft',
    share_token: shareToken,
  }).select('id').single()
  if (error) throw error
  const galleryId = data.id as string

  if (input.coverFile) {
    try {
      await uploadGalleryCoverPhoto(galleryId, input.coverFile)
    } catch (coverError) {
      console.warn('Error al subir foto de portada inicial:', coverError)
    }
  }

  return galleryId
}

export async function setGalleryCoverPhoto(galleryId: string, photoId: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`gallery-cover-${galleryId}`, photoId)
  }
  if (!supabase && usingDemoGalleryStore) {
    const galleries = readLocalGalleries()
    const gallery = galleries.find((item) => item.id === galleryId)
    if (!gallery) throw new Error('No encontramos esta galería.')
    gallery.coverPhotoId = photoId
    writeLocalGalleries(galleries)
    return
  }
  ensureSupabaseConfigured()

  try {
    const { error } = await supabase!
      .from('photo_galleries')
      .update({ cover_photo_id: photoId } as unknown as never)
      .eq('id', galleryId)
    if (error) {
      console.warn('No se pudo actualizar cover_photo_id en la base de datos:', error.message)
    }
  } catch (err) {
    console.warn('Error al actualizar cover_photo_id:', err)
  }
}

export async function uploadGalleryCoverPhoto(galleryId: string, file: File) {
  if (!photoExtensions[file.type] || file.size === 0 || file.size > maxPhotoSize) {
    throw new Error('La foto de portada debe ser JPG, PNG o WebP de hasta 6 MB.')
  }
  if (!await hasExpectedImageSignature(file)) {
    throw new Error('El contenido del archivo no coincide con el formato de imagen indicado.')
  }

  if (!supabase && usingDemoGalleryStore) {
    const galleries = readLocalGalleries()
    const gallery = galleries.find((item) => item.id === galleryId)
    if (!gallery) throw new Error('No encontramos esta galería.')
    const photoId = crypto.randomUUID()
    await putDemoAsset(photoId, file)
    const newPhoto = { id: photoId, filename: `[PORTADA] ${file.name}`, priceArs: 0, storagePath: photoId }
    gallery.photos.unshift(newPhoto)
    gallery.coverPhotoId = photoId
    writeLocalGalleries(galleries)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`gallery-cover-${galleryId}`, photoId)
    }
    return photoId
  }
  ensureSupabaseConfigured()

  const { data: userResult, error: userError } = await supabase!.auth.getUser()
  if (userError || !userResult.user) throw userError ?? new Error('Iniciá sesión para subir fotos.')

  const optimized = await optimizeImageForWeb(file)
  const extension = photoExtensions[optimized.type] ?? 'jpg'
  const storagePath = `${userResult.user.id}/${galleryId}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase!.storage.from(STORAGE_BUCKET).upload(storagePath, optimized, {
    contentType: optimized.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: photoData, error: insertError } = await supabase!.from('gallery_photos').insert({
    gallery_id: galleryId,
    original_filename: `[PORTADA] ${optimized.name}`,
    storage_path: storagePath,
    price_ars: 0,
  }).select('id').single()

  if (insertError) {
    await supabase!.storage.from(STORAGE_BUCKET).remove([storagePath])
    throw insertError
  }

  const photoId = photoData.id as string
  await setGalleryCoverPhoto(galleryId, photoId)
  return photoId
}

export async function addGalleryPhotos(galleryId: string, files: File[], priceArs: number) {
  if (!Number.isInteger(priceArs) || priceArs < 0 || priceArs > 2_147_483_647) {
    throw new Error('El precio debe ser un importe entero válido en pesos.')
  }
  for (const file of files) {
    if (!photoExtensions[file.type] || file.size === 0 || file.size > maxPhotoSize) {
      throw new Error('Cada archivo debe ser una imagen JPG, PNG o WebP de hasta 6 MB.')
    }
    if (Array.from(file.name.trim()).length < 1 || Array.from(file.name).length > 255) {
      throw new Error('El nombre del archivo debe tener entre 1 y 255 caracteres.')
    }
    if (!await hasExpectedImageSignature(file)) {
      throw new Error('El contenido del archivo no coincide con el formato de imagen indicado.')
    }
  }

  if (!supabase && usingDemoGalleryStore) {
    const galleries = readLocalGalleries()
    const gallery = galleries.find((item) => item.id === galleryId)
    if (!gallery) throw new Error('No encontramos esta galería.')
    const additions: LocalGallery['photos'] = []
    for (const file of files) {
      const optimized = await optimizeImageForWeb(file)
      const id = crypto.randomUUID()
      await putDemoAsset(id, optimized)
      additions.push({ id, filename: optimized.name, priceArs, storagePath: id })
    }
    gallery.photos.push(...additions)
    writeLocalGalleries(galleries)
    return
  }
  ensureSupabaseConfigured()

  const { data: userResult, error: userError } = await supabase!.auth.getUser()
  if (userError || !userResult.user) throw userError ?? new Error('Iniciá sesión para subir fotos.')
  for (const file of files) {
    const optimized = await optimizeImageForWeb(file)
    const extension = photoExtensions[optimized.type] ?? 'jpg'
    const storagePath = `${userResult.user.id}/${galleryId}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase!.storage.from(STORAGE_BUCKET).upload(storagePath, optimized, {
      contentType: optimized.type,
      cacheControl: '31536000',
      upsert: false,
    })
    if (uploadError) throw uploadError

    const { error: insertError } = await supabase!.from('gallery_photos').insert({
      gallery_id: galleryId,
      original_filename: optimized.name,
      storage_path: storagePath,
      price_ars: priceArs,
    })
    if (insertError) {
      await supabase!.storage.from(STORAGE_BUCKET).remove([storagePath])
      throw insertError
    }
  }
}

export async function setGalleryStatus(galleryId: string, status: GalleryStatus) {
  if (!supabase && usingDemoGalleryStore) {
    const galleries = readLocalGalleries()
    const gallery = galleries.find((item) => item.id === galleryId)
    if (!gallery) throw new Error('No encontramos esta galería.')
    gallery.status = status
    writeLocalGalleries(galleries)
    return
  }
  ensureSupabaseConfigured()

  const { error } = await supabase!.from('photo_galleries').update({ status }).eq('id', galleryId)
  if (error) throw error
}

export async function deleteGallery(galleryId: string) {
  if (!supabase && usingDemoGalleryStore) {
    const galleries = readLocalGalleries()
    const gallery = galleries.find((item) => item.id === galleryId)
    if (!gallery) throw new Error('No encontramos esta galería.')

    const db = await openAssetDb()
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(ASSET_STORE_NAME, 'readwrite')
      gallery.photos.forEach((photo) => transaction.objectStore(ASSET_STORE_NAME).delete(photo.id))
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
    db.close()
    writeLocalGalleries(galleries.filter((item) => item.id !== galleryId))
    return
  }
  ensureSupabaseConfigured()

  // 1. Desvincular portada para evitar conflictos de clave foránea circular
  try {
    await supabase!
      .from('photo_galleries')
      .update({ cover_photo_id: null } as unknown as never)
      .eq('id', galleryId)
  } catch (cause) {
    console.warn('Advertencia al desvincular cover_photo_id:', cause)
  }

  // 2. Obtener y remover archivos del storage
  const { data: photos } = await supabase!
    .from('gallery_photos')
    .select('storage_path')
    .eq('gallery_id', galleryId)

  const storagePaths = (photos ?? []).map((photo) => photo.storage_path).filter(Boolean)
  if (storagePaths.length) {
    try {
      const { error: storageError } = await supabase!.storage.from(STORAGE_BUCKET).remove(storagePaths)
      if (storageError) {
        console.warn('Advertencia al remover archivos de storage:', storageError)
      }
    } catch (storageErr) {
      console.warn('Error capturado al remover archivos de storage:', storageErr)
    }
  }

  // 3. Eliminar fotos de la base de datos explícitamente
  try {
    await supabase!
      .from('gallery_photos')
      .delete()
      .eq('gallery_id', galleryId)
  } catch (cause) {
    console.warn('Advertencia al eliminar fotos de gallery_photos:', cause)
  }

  // 4. Eliminar el registro de la galería
  const { error: galleryError } = await supabase!
    .from('photo_galleries')
    .delete()
    .eq('id', galleryId)
  if (galleryError) throw galleryError
}

export async function getPublishedGallery(shareToken: string): Promise<PublicPhotoGallery | null> {
  if (!supabase && usingDemoGalleryStore) {
    const gallery = readLocalGalleries().find((item) => item.shareToken === shareToken && item.status === 'published')
    if (!gallery) return null
    const photos = await Promise.all(gallery.photos.map(async (photo) => {
      const asset = await getDemoAsset(photo.id)
      return {
        id: photo.id,
        filename: photo.filename.replace(/^\[PORTADA\]\s*/i, ''),
        priceArs: photo.priceArs,
        url: asset ? URL.createObjectURL(asset) : '',
      }
    }))
    const coverPhoto = resolveGalleryCoverPhoto(photos, gallery.coverPhotoId)
    return {
      id: gallery.id,
      title: gallery.title,
      clientName: gallery.clientName,
      eventDate: gallery.eventDate,
      clientSelectedPhotoIds: gallery.clientSelectedPhotoIds ?? [],
      coverPhotoId: coverPhoto?.id ?? null,
      coverPhotoUrl: coverPhoto?.url ?? null,
      photos,
    }
  }
  ensureSupabaseConfigured()

  const { data, error } = await supabase!.functions.invoke('public-gallery', { body: { token: shareToken } })
  if (error) throw error
  const rawGallery = data?.gallery
  if (!rawGallery) return null

  const rawPhotos = (rawGallery.photos ?? []) as Array<{ id: string; filename: string; priceArs: number; url: string }>
  const photos = rawPhotos.map((p) => ({
    ...p,
    filename: String(p.filename ?? '').replace(/^\[PORTADA\]\s*/i, ''),
  }))

  const localCover = typeof window !== 'undefined' ? localStorage.getItem(`gallery-cover-${rawGallery.id}`) : null
  const coverPhoto = resolveGalleryCoverPhoto(photos, (rawGallery.coverPhotoId as string) || localCover)

  return {
    ...rawGallery,
    coverPhotoId: coverPhoto?.id ?? null,
    coverPhotoUrl: coverPhoto?.url ?? null,
    photos,
  } as PublicPhotoGallery
}

export async function refreshGalleryPhotosForExport(galleryId: string): Promise<GalleryPhoto[]> {
  if (!supabase && usingDemoGalleryStore) {
    const gallery = await listGalleries().then((galleries) => galleries.find((item) => item.id === galleryId))
    if (!gallery) throw new Error('No encontramos esta galería.')
    return gallery.photos
  }
  ensureSupabaseConfigured()

  const { data, error } = await supabase!
    .from('gallery_photos')
    .select('id, original_filename, price_ars, storage_path')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: true })
  if (error) throw error

  return Promise.all((data ?? []).map(async (photo) => {
    const { data: signed, error: signedError } = await supabase!.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(photo.storage_path, 3600)
    if (signedError) throw signedError
    return mapRemotePhoto(photo, signed.signedUrl)
  }))
}

export async function saveGalleryPhotoSelections(shareToken: string, photoIds: string[]) {
  const uniquePhotoIds = [...new Set(photoIds)]
  if (!/^[a-f0-9]{48}$/.test(shareToken) || uniquePhotoIds.length > 2000
    || uniquePhotoIds.some((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    throw new Error('La selección de fotos no es válida.')
  }

  if (!supabase && usingDemoGalleryStore) {
    const galleries = readLocalGalleries()
    const gallery = galleries.find((item) => item.shareToken === shareToken && item.status === 'published')
    if (!gallery) throw new Error('No encontramos esta galería publicada.')
    if (uniquePhotoIds.some((id) => !gallery.photos.some((photo) => photo.id === id))) {
      throw new Error('La selección contiene fotos que no pertenecen a esta galería.')
    }
    gallery.clientSelectedPhotoIds = uniquePhotoIds
    writeLocalGalleries(galleries)
    return
  }
  ensureSupabaseConfigured()

  const { error } = await supabase!.functions.invoke('public-gallery', {
    body: { action: 'save-selections', token: shareToken, photoIds: uniquePhotoIds },
  })
  if (error) throw error
}

export async function listPublishedGalleries(): Promise<PublishedGalleryLink[]> {
  if (!supabase && usingDemoGalleryStore) {
    return Promise.all(
      readLocalGalleries()
        .filter((gallery) => gallery.status === 'published')
        .map(async ({ id, title, clientName, eventDate, shareToken, createdAt, photos, coverPhotoId }) => {
          const loadedPhotos = await Promise.all(photos.map(async (photo) => {
            const asset = await getDemoAsset(photo.id)
            return { id: photo.id, url: asset ? URL.createObjectURL(asset) : '', filename: photo.filename }
          }))
          const cover = resolveGalleryCoverPhoto(loadedPhotos, coverPhotoId)
          const previewPhotos = cover
            ? [cover, ...loadedPhotos.filter((p) => p.id !== cover.id)].slice(0, 4)
            : loadedPhotos.slice(0, 4)
          return {
            id,
            title,
            clientName,
            eventDate,
            shareToken,
            createdAt,
            photoCount: photos.length,
            coverPhotoUrl: cover?.url ?? null,
            previewPhotos,
          }
        }),
    )
  }
  ensureSupabaseConfigured()

  const { data, error } = await supabase!.functions.invoke('public-gallery', { body: { action: 'list' } })
  if (error) throw error
  const galleries = (data?.galleries ?? []) as Array<PublishedGalleryLink & Record<string, unknown>>
  return galleries.map((gallery) => {
    const localCover = typeof window !== 'undefined' ? localStorage.getItem(`gallery-cover-${gallery.id}`) : null
    const cover = resolveGalleryCoverPhoto(gallery.previewPhotos, localCover)
    const previewPhotos = cover
      ? [cover, ...gallery.previewPhotos.filter((p) => p.id !== cover.id)]
      : gallery.previewPhotos
    return {
      ...gallery,
      clientName: gallery.clientName || (gallery.client_name as string) || undefined,
      photoCount: typeof gallery.photoCount === 'number' ? gallery.photoCount : (typeof gallery.photo_count === 'number' ? gallery.photo_count : undefined),
      coverPhotoUrl: cover?.url ?? previewPhotos[0]?.url ?? null,
      previewPhotos,
    }
  })
}

export function galleryShareUrl(shareToken: string) {
  return `${window.location.origin}/galeria/${shareToken}`
}
