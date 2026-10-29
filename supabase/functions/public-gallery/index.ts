import { withSupabase } from 'npm:@supabase/server@1.9.2'
import { corsHeaders as sdkCorsHeaders } from 'npm:@supabase/supabase-js@2.118.0/cors'

const corsHeaders = {
  ...sdkCorsHeaders,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Type': 'application/json',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

class PayloadTooLargeError extends Error {}

async function readJsonBody(request: Request, maxBytes = 128 * 1024): Promise<unknown> {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Solicitud sin contenido.')

  const chunks: Uint8Array[] = []
  let totalBytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    totalBytes += value.byteLength
    if (totalBytes > maxBytes) {
      await reader.cancel()
      throw new PayloadTooLargeError()
    }
    chunks.push(value)
  }

  const body = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return JSON.parse(new TextDecoder().decode(body))
}

const handleRequest = withSupabase({ auth: 'publishable' }, async (request, context) => {
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

  let token = ''
  let listPublished = false
  let saveSelections: string[] | null = null
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (Number.isFinite(contentLength) && contentLength > 128 * 1024) {
      return json({ error: 'Solicitud demasiado grande.' }, 413)
    }
    const body = await readJsonBody(request)
    listPublished = body && typeof body === 'object' && 'action' in body && body.action === 'list'
    token = body && typeof body === 'object' && 'token' in body && typeof body.token === 'string'
      ? body.token
      : ''
    if (body && typeof body === 'object' && 'action' in body && body.action === 'save-selections') {
      if (!('photoIds' in body) || !Array.isArray(body.photoIds)
        || body.photoIds.length > 2000
        || body.photoIds.some((id) => typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        return json({ error: 'La selección de fotos no es válida.' }, 400)
      }
      saveSelections = [...new Set(body.photoIds as string[])]
    }
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return json({ error: 'Solicitud demasiado grande.' }, 413)
    return json({ error: 'Solicitud inválida.' }, 400)
  }

  if (listPublished) {
    const { data: galleries, error } = await context.supabaseAdmin
      .from('photo_galleries')
      .select('id, title, event_date, share_token, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return json({ error: 'No pudimos cargar las galerías.' }, 500)
    const galleriesWithPreviews = await Promise.all((galleries ?? []).map(async (gallery) => {
      const { data: photos, error: photosError } = await context.supabaseAdmin
        .from('gallery_photos')
        .select('id, storage_path')
        .eq('gallery_id', gallery.id)
        .order('created_at', { ascending: true })
        .limit(4)

      if (photosError) return null
      const previewPhotos = await Promise.all((photos ?? []).map(async (photo) => {
        const { data, error: urlError } = await context.supabaseAdmin.storage
          .from('gallery-photos')
          .createSignedUrl(photo.storage_path, 1800)
        return urlError ? null : { id: photo.id, url: data.signedUrl }
      }))

      return {
        id: gallery.id,
        title: gallery.title,
        eventDate: gallery.event_date ?? '',
        shareToken: gallery.share_token,
        createdAt: gallery.created_at,
        previewPhotos: previewPhotos.filter((photo) => photo !== null),
      }
    }))

    if (galleriesWithPreviews.some((gallery) => gallery === null)) {
      return json({ error: 'No pudimos preparar las portadas.' }, 500)
    }
    return json({ galleries: galleriesWithPreviews })
  }

  if (!/^[a-f0-9]{48}$/.test(token)) return json({ error: 'Galería no encontrada.' }, 404)

  const { data: gallery, error: galleryError } = await context.supabaseAdmin
    .from('photo_galleries')
    .select('id, title, client_name, event_date, client_selected_photo_ids')
    .eq('share_token', token)
    .eq('status', 'published')
    .maybeSingle()

  if (galleryError) return json({ error: 'No pudimos cargar la galería.' }, 500)
  if (!gallery) return json({ error: 'Galería no encontrada o no publicada.' }, 404)

  if (saveSelections !== null) {
    const { data: galleryPhotos, error: galleryPhotosError } = await context.supabaseAdmin
      .from('gallery_photos')
      .select('id')
      .eq('gallery_id', gallery.id)
    if (galleryPhotosError) return json({ error: 'No pudimos validar las fotos.' }, 500)
    const availablePhotoIds = new Set((galleryPhotos ?? []).map((photo) => photo.id))
    if (saveSelections.some((photoId) => !availablePhotoIds.has(photoId))) {
      return json({ error: 'La selección contiene fotos que no pertenecen a esta galería.' }, 400)
    }

    const { error: updateError } = await context.supabaseAdmin
      .from('photo_galleries')
      .update({ client_selected_photo_ids: saveSelections })
      .eq('id', gallery.id)
      .eq('status', 'published')
    if (updateError) return json({ error: 'No pudimos guardar tus fotos elegidas.' }, 500)
    return json({ saved: saveSelections.length })
  }

  const { data: photos, error: photosError } = await context.supabaseAdmin
    .from('gallery_photos')
    .select('id, original_filename, storage_path, price_ars')
    .eq('gallery_id', gallery.id)
    .order('created_at', { ascending: true })
  if (photosError) return json({ error: 'No pudimos cargar las fotos.' }, 500)

  const signedPhotos = await Promise.all((photos ?? []).map(async (photo) => {
    const { data, error } = await context.supabaseAdmin.storage
      .from('gallery-photos')
      .createSignedUrl(photo.storage_path, 1800)
    if (error) return null
    return {
      id: photo.id,
      filename: photo.original_filename,
      priceArs: photo.price_ars,
      url: data.signedUrl,
    }
  }))

  if (signedPhotos.some((photo) => photo === null)) return json({ error: 'No pudimos preparar las fotos.' }, 500)
  return json({
    gallery: {
      id: gallery.id,
      title: gallery.title,
      clientName: gallery.client_name,
      eventDate: gallery.event_date ?? '',
      clientSelectedPhotoIds: gallery.client_selected_photo_ids ?? [],
      photos: signedPhotos,
    },
  })
})

Deno.serve((request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { ...corsHeaders, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
    })
  }
  return handleRequest(request)
})
