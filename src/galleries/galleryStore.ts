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
  createdAt: string
  photos: GalleryPhoto[]
}

export type PublicGalleryPhoto = Omit<GalleryPhoto, 'storagePath'>
export type PublicPhotoGallery = Pick<PhotoGallery, 'id' | 'title' | 'clientName' | 'eventDate' | 'clientSelectedPhotoIds'> & {
  photos: PublicGalleryPhoto[]
}

export type PublishedGalleryLink = Pick<PhotoGallery, 'id' | 'title' | 'eventDate' | 'shareToken' | 'createdAt'> & {
  previewPhotos: Array<Pick<GalleryPhoto, 'id' | 'url'>>
}

type LocalGallery = Omit<PhotoGallery, 'photos'> & {
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

function mapRemotePhoto(photo: Record<string, unknown>, url: string): GalleryPhoto {
  return {
    id: String(photo.id),
    filename: String(photo.original_filename),
    priceArs: Number(photo.price_ars),
    url,
    storagePath: String(photo.storage_path),
  }
}

export async function listGalleries(): Promise<PhotoGallery[]> {
  if (!supabase && usingDemoGalleryStore) {
    return Promise.all(readLocalGalleries().map(async (gallery) => ({
      ...gallery,
      clientSelectedPhotoIds: gallery.clientSelectedPhotoIds ?? [],
      photos: await Promise.all(gallery.photos.map(async (photo) => {
        const asset = await getDemoAsset(photo.id)
        return { ...photo, url: asset ? URL.createObjectURL(asset) : '' }
      })),
    })))
  }
  ensureSupabaseConfigured()

  const { data, error } = await supabase!
    .from('photo_galleries')
    .select('id, title, client_name, event_date, status, share_token, client_selected_photo_ids, created_at, gallery_photos(id, original_filename, price_ars, storage_path)')
    .order('created_at', { ascending: false })
  if (error) throw error

  return Promise.all((data ?? []).map(async (row) => {
    const rawPhotos = (row.gallery_photos ?? []) as Array<Record<string, unknown>>
    const photos = await Promise.all(rawPhotos.map(async (photo) => {
      const { data: signed, error: signedError } = await supabase!.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(String(photo.storage_path), 1800)
      if (signedError) throw signedError
      return mapRemotePhoto(photo, signed.signedUrl)
    }))
    return {
      id: row.id,
      title: row.title,
      clientName: row.client_name,
      eventDate: row.event_date ?? '',
      status: row.status as GalleryStatus,
      shareToken: row.share_token,
      clientSelectedPhotoIds: row.client_selected_photo_ids ?? [],
      createdAt: row.created_at,
      photos,
    }
  }))
}

export async function createGallery(input: { title: string; clientName: string; eventDate: string }) {
  const shareToken = createShareToken()
  if (!supabase && usingDemoGalleryStore) {
    const gallery: LocalGallery = {
      id: crypto.randomUUID(),
      ...input,
      status: 'draft',
      shareToken,
      clientSelectedPhotoIds: [],
      createdAt: new Date().toISOString(),
      photos: [],
    }
    writeLocalGalleries([gallery, ...readLocalGalleries()])
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
  return data.id as string
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
      const id = crypto.randomUUID()
      await putDemoAsset(id, file)
      additions.push({ id, filename: file.name, priceArs, storagePath: id })
    }
    gallery.photos.push(...additions)
    writeLocalGalleries(galleries)
    return
  }
  ensureSupabaseConfigured()

  const { data: userResult, error: userError } = await supabase!.auth.getUser()
  if (userError || !userResult.user) throw userError ?? new Error('Iniciá sesión para subir fotos.')
  for (const file of files) {
    const extension = photoExtensions[file.type]
    const storagePath = `${userResult.user.id}/${galleryId}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase!.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })
    if (uploadError) throw uploadError

    const { error: insertError } = await supabase!.from('gallery_photos').insert({
      gallery_id: galleryId,
      original_filename: file.name,
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

  const { data: photos, error: photosError } = await supabase!
    .from('gallery_photos')
    .select('storage_path')
    .eq('gallery_id', galleryId)
  if (photosError) throw photosError

  const storagePaths = (photos ?? []).map((photo) => photo.storage_path)
  if (storagePaths.length) {
    const { error: storageError } = await supabase!.storage.from(STORAGE_BUCKET).remove(storagePaths)
    if (storageError) throw storageError
  }

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
    return {
      id: gallery.id,
      title: gallery.title,
      clientName: gallery.clientName,
      eventDate: gallery.eventDate,
      clientSelectedPhotoIds: gallery.clientSelectedPhotoIds ?? [],
      photos: await Promise.all(gallery.photos.map(async (photo) => {
        const asset = await getDemoAsset(photo.id)
        return {
          id: photo.id,
          filename: photo.filename,
          priceArs: photo.priceArs,
          url: asset ? URL.createObjectURL(asset) : '',
        }
      })),
    }
  }
  ensureSupabaseConfigured()

  const { data, error } = await supabase!.functions.invoke('public-gallery', { body: { token: shareToken } })
  if (error) throw error
  return (data?.gallery ?? null) as PublicPhotoGallery | null
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
        .map(async ({ id, title, eventDate, shareToken, createdAt, photos }) => ({
        id,
        title,
        eventDate,
        shareToken,
        createdAt,
        previewPhotos: await Promise.all(photos.slice(0, 4).map(async (photo) => {
          const asset = await getDemoAsset(photo.id)
          return { id: photo.id, url: asset ? URL.createObjectURL(asset) : '' }
        })),
        })),
    )
  }
  ensureSupabaseConfigured()

  const { data, error } = await supabase!.functions.invoke('public-gallery', { body: { action: 'list' } })
  if (error) throw error
  return (data?.galleries ?? []) as PublishedGalleryLink[]
}

export function galleryShareUrl(shareToken: string) {
  return `${window.location.origin}/galeria/${shareToken}`
}
