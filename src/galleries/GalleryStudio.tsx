import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import loginBackground from '../assets/projects/hercules/01.webp'
import francoLogo from '../assets/franco-digital-logo.png'
import { supabase } from './supabaseClient'
import {
  addGalleryPhotos,
  createGallery,
  deleteGallery,
  galleryShareUrl,
  getPublishedGallery,
  listPublishedGalleries,
  listGalleries,
  refreshGalleryPhotosForExport,
  saveGalleryPhotoSelections,
  setGalleryStatus,
  usingDemoGalleryStore,
  type PhotoGallery,
  type GalleryPhoto,
  type PublicPhotoGallery,
  type PublishedGalleryLink,
} from './galleryStore'
import './GalleryStudio.css'

const whatsappPhone = '5493624080801'
const maxPhotoSize = 6 * 1024 * 1024

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

function WhatsAppLogo({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.272-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
}

function PhotoMark() {
  return <span className="photo-mark" aria-hidden="true"><i /><i /><i /><i /></span>
}

function GalleryBrand({ light = false }: { light?: boolean }) {
  return (
    <a className={`gallery-brand ${light ? 'gallery-brand--light' : ''}`} href="/" aria-label="Franco Digital, volver al sitio">
      <img className="gallery-brand__logo" src={francoLogo} alt="" />
      <span><strong>FRANCO DIGITAL</strong><small>FOTOGRAFÍA</small></span>
    </a>
  )
}

function useAdminGalleries() {
  const [galleries, setGalleries] = useState<PhotoGallery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async (initialLoad = false) => {
    if (!initialLoad) {
      setLoading(true)
      setError('')
    }
    try {
      setGalleries(await listGalleries())
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos cargar las galerías.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(true) }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])
  return { galleries, loading, error, refresh, setError }
}

async function buildGalleryPdf(gallery: PhotoGallery, photos: GalleryPhoto[]) {
  const { jsPDF } = await import('jspdf')
  const document = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true })
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const margin = 38

  for (const [index, photo] of photos.entries()) {
    if (index > 0) document.addPage()
    document.setTextColor(24, 25, 27)
    document.setFont('helvetica', 'bold')
    document.setFontSize(10)
    document.text('FRANCO DIGITAL  /  FOTOGRAFÍA', margin, 42)
    document.setDrawColor(224, 34, 57)
    document.setLineWidth(2)
    document.line(margin, 54, margin + 38, 54)
    document.setFontSize(23)
    const titleLines = document.splitTextToSize(gallery.title, pageWidth - margin * 2)
    document.text(titleLines, margin, 88)
    const subtitleY = 108 + (titleLines.length - 1) * 26
    document.setFont('helvetica', 'normal')
    document.setFontSize(10)
    document.setTextColor(100, 103, 107)
    document.text(`${gallery.clientName}${gallery.eventDate ? `  ·  ${new Date(`${gallery.eventDate}T12:00:00`).toLocaleDateString('es-AR')}` : ''}`, margin, subtitleY)

    const response = await fetch(photo.url)
    if (!response.ok) throw new Error(`No se pudo descargar ${photo.filename}.`)
    const bitmap = await createImageBitmap(await response.blob())
    const scale = Math.min(1, 3000 / Math.max(bitmap.width, bitmap.height))
    const canvas = globalThis.document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo preparar una de las fotos para el PDF.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const imageData = canvas.toDataURL('image/jpeg', 0.94)
    const maxWidth = pageWidth - margin * 2
    const imageY = subtitleY + 24
    const maxHeight = pageHeight - imageY - 82
    const fit = Math.min(maxWidth / canvas.width, maxHeight / canvas.height)
    const imageWidth = canvas.width * fit
    const imageHeight = canvas.height * fit
    const imageX = (pageWidth - imageWidth) / 2
    document.addImage(imageData, 'JPEG', imageX, imageY, imageWidth, imageHeight, undefined, 'FAST')
    document.setFont('helvetica', 'normal')
    document.setFontSize(9)
    document.setTextColor(100, 103, 107)
    document.text(`${String(index + 1).padStart(2, '0')}  /  ${photos.length}     ${photo.filename}`, margin, pageHeight - 24, { maxWidth: pageWidth - margin * 2 })
  }

  const filename = gallery.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'galeria'
  document.save(`${filename}-seleccion.pdf`)
}

function GalleryPhotoManager({ gallery }: { gallery: PhotoGallery }) {
  const defaultSelected = gallery.clientSelectedPhotoIds.filter((id) => gallery.photos.some((photo) => photo.id === id))
  const clientSelectionKey = defaultSelected.join('|')
  const [selected, setSelected] = useState<string[]>(defaultSelected)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const photosForDelivery = gallery.photos.filter((photo) => selected.includes(photo.id))
  const clientSelectionCount = defaultSelected.length

  useEffect(() => setSelected(clientSelectionKey ? clientSelectionKey.split('|') : []), [clientSelectionKey])

  const toggle = (photoId: string) => setSelected((current) => current.includes(photoId)
    ? current.filter((id) => id !== photoId)
    : [...current, photoId])

  const generatePdf = async () => {
    if (!photosForDelivery.length) return
    setBusy(true)
    setError('')
    try {
      const freshPhotos = await refreshGalleryPhotosForExport(gallery.id)
      const freshSelection = freshPhotos.filter((photo) => selected.includes(photo.id))
      if (!freshSelection.length) throw new Error('No encontramos las fotos seleccionadas.')
      await buildGalleryPdf(gallery, freshSelection)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos generar el documento.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="gallery-photo-manager">
      <summary>Elegir fotos y preparar entrega <span>{selected.length} elegidas</span></summary>
      <div className="gallery-photo-manager__content">
        <div className="gallery-photo-manager__heading">
          <p>{clientSelectionCount ? `El cliente eligió ${clientSelectionCount} ${clientSelectionCount === 1 ? 'foto' : 'fotos'}.` : 'El cliente todavía no eligió fotos.'} Marcá las que querés incluir en el documento.</p>
        </div>
        <div className="gallery-photo-manager__grid">
          {gallery.photos.map((photo, index) => {
            const isSelected = selected.includes(photo.id)
            const chosenByClient = defaultSelected.includes(photo.id)
            return <button type="button" key={photo.id} className={`gallery-photo-manager__item ${isSelected ? 'is-selected' : ''}`} onClick={() => toggle(photo.id)} aria-pressed={isSelected}>
              <img src={photo.url} alt="" loading="lazy" />
              <span className="gallery-photo-manager__check">{isSelected ? '✓' : '+'}</span>
              <span className="gallery-photo-manager__caption">{String(index + 1).padStart(2, '0')} · {photo.filename}{chosenByClient && <small>Elegida por cliente</small>}</span>
            </button>
          })}
        </div>
        {error && <p className="gallery-photo-manager__error" role="alert">{error}</p>}
        <div className="gallery-photo-manager__footer"><span>{selected.length} {selected.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}</span><button type="button" className="gallery-button gallery-button--small gallery-button--primary" disabled={busy || !selected.length} onClick={() => void generatePdf()}>{busy ? 'Generando PDF…' : 'Generar PDF'} <span>↓</span></button></div>
      </div>
    </details>
  )
}

function AdminLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        setError('Revisá el correo y la contraseña e intentá de nuevo.')
        return
      }
      onSignedIn()
    } catch {
      setError('No pudimos verificar el acceso. Intentá nuevamente en unos minutos.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="gallery-login">
      <div className="gallery-login__visual" style={{ backgroundImage: `linear-gradient(0deg, rgba(7,8,10,.8), rgba(7,8,10,.1)), url("${loginBackground}")` }}>
        <GalleryBrand light />
        <div className="gallery-login__message"><span>01 / ARCHIVO PRIVADO</span><h1>Tus fotos.<br /><em>En un solo lugar.</em></h1><p>Creá galerías, elegí tus fotos y compartilas con cada cliente.</p></div>
        <span className="gallery-login__caption">FRANCO ACUÑA · FOTÓGRAFO</span>
      </div>
      <div className="gallery-login__form-wrap">
        <a className="gallery-back-home" href="/">← Volver al sitio</a>
        <form className="gallery-login__form" onSubmit={submit}>
          <p className="gallery-overline">PANEL DE FOTOGRAFÍA</p>
          <h2>Hola de nuevo.</h2>
          <p className="gallery-muted">Ingresá con la cuenta de administración.</p>
          <label>Correo electrónico<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="gallery-form-error" role="alert">{error}</p>}
          <button className="gallery-button gallery-button--primary" type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar al panel'}<span>↗</span></button>
          <p className="gallery-login__note">La cuenta de acceso se configura desde Supabase.</p>
        </form>
      </div>
    </main>
  )
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const { galleries, loading, error, refresh, setError } = useAdminGalleries()
  const [showCreate, setShowCreate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [title, setTitle] = useState('')
  const [clientName, setClientName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [price, setPrice] = useState('5000')
  const [files, setFiles] = useState<File[]>([])
  const filePreviews = useMemo(() => files.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  })), [files])

  useEffect(() => () => {
    filePreviews.forEach(({ url }) => URL.revokeObjectURL(url))
  }, [filePreviews])

  const closeCreate = () => {
    setShowCreate(false)
    setTitle('')
    setClientName('')
    setEventDate('')
    setPrice('5000')
    setFiles([])
  }

  const validateFiles = (selected: File[]) => {
    if (selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      setError('Usá imágenes JPG, PNG o WebP.')
      return false
    }
    if (selected.some((file) => file.size > maxPhotoSize)) {
      setError('Cada imagen puede pesar hasta 6 MB por ahora.')
      return false
    }
    setError('')
    return true
  }

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !clientName.trim()) return
    const priceArs = Number(price)
    if (files.length && (!Number.isSafeInteger(priceArs) || priceArs < 0 || priceArs > 2_147_483_647)) {
      setError('El precio por foto debe ser un importe entero válido en pesos.')
      return
    }
    if (files.length && !validateFiles(files)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const id = await createGallery({ title: title.trim(), clientName: clientName.trim(), eventDate })
      if (files.length) await addGalleryPhotos(id, files, priceArs)
      setTitle('')
      setClientName('')
      setEventDate('')
      closeCreate()
      setNotice(files.length ? 'Galería creada con sus primeras fotos.' : 'Galería creada. Ya podés cargarle fotos.')
      await refresh()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No pudimos crear la galería.'
      await refresh()
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const toggleStatus = async (gallery: PhotoGallery) => {
    const status = gallery.status === 'published' ? 'draft' : 'published'
    if (status === 'published' && gallery.photos.length === 0) {
      setError('Agregá al menos una foto antes de publicar la galería.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await setGalleryStatus(gallery.id, status)
      await refresh()
      setNotice(status === 'published' ? 'La galería ya está disponible para compartir.' : 'La galería quedó como borrador.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos actualizar la galería.')
    } finally {
      setBusy(false)
    }
  }

  const uploadMore = async (gallery: PhotoGallery, selected: File[]) => {
    if (!selected.length || !validateFiles(selected)) return
    setBusy(true)
    try {
      await addGalleryPhotos(gallery.id, selected, gallery.photos[0]?.priceArs ?? 5000)
      await refresh()
      setNotice(`${selected.length} ${selected.length === 1 ? 'foto agregada' : 'fotos agregadas'} a ${gallery.title}.`)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No pudimos subir las fotos.'
      await refresh()
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async (gallery: PhotoGallery) => {
    try {
      await navigator.clipboard.writeText(galleryShareUrl(gallery.shareToken))
      setNotice('Link copiado. Ya podés enviárselo al cliente.')
    } catch {
      setError('No pudimos copiar el link. Abrí la galería para copiarlo desde el navegador.')
    }
  }

  const removeGallery = async (gallery: PhotoGallery) => {
    const confirmed = window.confirm(`¿Eliminar por completo “${gallery.title}”? Se borrarán la galería, sus fotos y el link compartido. Esta acción no se puede deshacer.`)
    if (!confirmed) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await deleteGallery(gallery.id)
      await refresh()
      setNotice(`La galería “${gallery.title}” se eliminó por completo.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos eliminar la galería.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="gallery-admin">
      <aside className="gallery-sidebar">
        <GalleryBrand />
        <div className="gallery-sidebar__rule" />
        <p className="gallery-sidebar__label">GESTIÓN</p>
        <a className="gallery-sidebar__link is-current" href="#galerias"><span>▦</span> Galerías <i>{galleries.length.toString().padStart(2, '0')}</i></a>
        <a className="gallery-sidebar__link" href="/">↗ <span>Ver sitio</span></a>
        <div className="gallery-sidebar__bottom"><span className="gallery-avatar">FA</span><span><strong>Franco Acuña</strong><small>Fotógrafo</small></span>{supabase && <button type="button" onClick={onSignOut} aria-label="Cerrar sesión">↗</button>}</div>
      </aside>

      <main className="gallery-main" id="galerias">
        <header className="gallery-topbar"><div><span>ARCHIVO / GALERÍAS</span><strong>Panel de fotografía</strong></div><span className={`gallery-mode ${usingDemoGalleryStore ? 'is-demo' : ''}`}><i />{usingDemoGalleryStore ? 'DEMO LOCAL' : 'EN LÍNEA'}</span></header>
        <div className="gallery-content">
          {usingDemoGalleryStore && <div className="gallery-demo-banner"><span>i</span><p><strong>Estás en modo demo.</strong> Los datos se guardan en este navegador. Para compartir galerías entre dispositivos, configurá Supabase.</p></div>}
          <section className="gallery-welcome"><h1>Espacio de trabajo</h1><button type="button" className="gallery-button gallery-button--primary" onClick={() => setShowCreate(true)}>Nueva galería <span>＋</span></button></section>
          {notice && <div className="gallery-notice" role="status"><span>✓</span>{notice}<button type="button" onClick={() => setNotice('')} aria-label="Cerrar">×</button></div>}
          {error && <div className="gallery-error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Cerrar">×</button></div>}

          {loading ? <div className="gallery-empty"><span className="gallery-spinner" /><p>Cargando tus galerías…</p></div> : galleries.length === 0 ? (
            <div className="gallery-empty"><PhotoMark /><h3>El archivo empieza acá.</h3><p>Creá tu primera galería para organizar las fotos de un cliente.</p><button className="gallery-button gallery-button--outline" type="button" onClick={() => setShowCreate(true)}>Crear primera galería <span>＋</span></button></div>
          ) : (
            <div className="gallery-card-list">
              {galleries.map((gallery, index) => (
                <article className="gallery-card" key={gallery.id}>
                  <div className="gallery-card__cover">
                    {gallery.photos[0]?.url ? <img src={gallery.photos[0].url} alt="" /> : <div className="gallery-card__placeholder"><PhotoMark /><span>SIN FOTOS</span></div>}
                    <span className={`gallery-status ${gallery.status === 'published' ? 'is-published' : ''}`}><i />{gallery.status === 'published' ? 'PUBLICADA' : 'BORRADOR'}</span>
                    <span className="gallery-card__number">{String(galleries.length - index).padStart(2, '0')}</span>
                  </div>
                  <div className="gallery-card__body">
                    <div className="gallery-card__info"><p>{gallery.clientName}{gallery.eventDate ? ` · ${new Date(`${gallery.eventDate}T12:00:00`).toLocaleDateString('es-AR')}` : ''}</p><h3>{gallery.title}</h3><span>{gallery.photos.length} {gallery.photos.length === 1 ? 'foto' : 'fotos'} · {gallery.photos[0] ? currency.format(gallery.photos[0].priceArs) : 'Precio sin definir'} c/u</span></div>
                    <div className="gallery-card__actions">
                      {gallery.status === 'published' && <button type="button" className="gallery-button gallery-button--small gallery-button--outline" onClick={() => void copyLink(gallery)}>Copiar link <span>↗</span></button>}
                      <button type="button" className={`gallery-button gallery-button--small ${gallery.status === 'published' ? 'gallery-button--quiet' : 'gallery-button--primary'}`} disabled={busy} onClick={() => void toggleStatus(gallery)}>{gallery.status === 'published' ? 'Pausar link' : 'Publicar'}</button>
                      <label className="gallery-upload-more">＋<span>Agregar fotos</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { if (event.target.files) void uploadMore(gallery, Array.from(event.target.files)); event.target.value = '' }} /></label>
                      <button type="button" className="gallery-button gallery-button--small gallery-button--danger" disabled={busy} onClick={() => void removeGallery(gallery)}>Eliminar galería</button>
                    </div>
                    {gallery.status === 'published' && <a className="gallery-card__share" href={galleryShareUrl(gallery.shareToken)} target="_blank" rel="noreferrer">Abrir link de cliente <span>↗</span></a>}
                  </div>
                  {gallery.photos.length > 0 && <GalleryPhotoManager gallery={gallery} />}
                </article>
              ))}
            </div>
          )}
          <footer className="gallery-footer"><span>© 2026 FRANCO DIGITAL</span><span>ARCHIVO FOTOGRÁFICO / 01</span></footer>
        </div>
      </main>

      {showCreate && <div className="gallery-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate() }}><section className="gallery-modal" role="dialog" aria-modal="true" aria-labelledby="new-gallery-title"><header><div><p className="gallery-overline">NUEVA SERIE</p><h2 id="new-gallery-title">Crear galería</h2></div><button type="button" onClick={closeCreate} aria-label="Cerrar">×</button></header><form onSubmit={submitCreate}>
        <label>Nombre de la galería<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Final del torneo apertura" required maxLength={120} /></label>
        <div className="gallery-form-row"><label>Cliente / equipo<input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Ej. Club Hércules" required maxLength={120} /></label><label>Fecha del evento<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label></div>
        <label>Precio por foto <div className="gallery-price-field"><span>$</span><input type="number" min="0" max="2147483647" step="1" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} /><small>ARS</small></div></label>
        <label className="gallery-dropzone"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { setFiles(Array.from(event.target.files ?? [])); event.target.value = '' }} /><span className="gallery-dropzone__icon">↑</span><strong>{files.length ? `${files.length} ${files.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}` : 'Elegí las fotos para esta galería'}</strong><small>JPG, PNG o WebP · hasta 6 MB por foto</small><span className="gallery-dropzone__button">Seleccionar archivos</span></label>
        {filePreviews.length > 0 && <div className="gallery-upload-previews" aria-label="Vista previa de las fotos seleccionadas">{filePreviews.map(({ file, url }, index) => <figure className="gallery-upload-preview" key={`${file.name}-${file.lastModified}-${index}`}><img src={url} alt={`Vista previa: ${file.name}`} /><figcaption title={file.name}>{file.name}</figcaption><button type="button" aria-label={`Quitar ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>×</button></figure>)}</div>}
        <div className="gallery-modal__actions"><button type="button" className="gallery-button gallery-button--quiet" onClick={() => setShowCreate(false)}>Cancelar</button><button type="submit" className="gallery-button gallery-button--primary" disabled={busy}>{busy ? 'Guardando…' : 'Crear galería'} <span>↗</span></button></div>
      </form></section></div>}
    </div>
  )
}

function PublicGallery({ token }: { token: string }) {
  const [gallery, setGallery] = useState<PublicPhotoGallery | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [selectionError, setSelectionError] = useState('')
  const selectionQueue = useRef(Promise.resolve())

  useEffect(() => {
    let active = true
    getPublishedGallery(token)
      .then((result) => {
        if (active) {
          setGallery(result)
          setSelected(result?.photos.filter((photo) => result.clientSelectedPhotoIds.includes(photo.id)).map((photo) => photo.id) ?? [])
          setUnavailable(!result)
        }
      })
      .catch(() => { if (active) setUnavailable(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (previewIndex === null || !gallery) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewIndex(null)
      if (event.key === 'ArrowRight') setPreviewIndex((current) => current === null ? current : (current + 1) % gallery.photos.length)
      if (event.key === 'ArrowLeft') setPreviewIndex((current) => current === null ? current : (current - 1 + gallery.photos.length) % gallery.photos.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [gallery, previewIndex])

  const selectedPhotos = useMemo(() => gallery?.photos.filter((photo) => selected.includes(photo.id)) ?? [], [gallery, selected])
  const total = selectedPhotos.reduce((sum, photo) => sum + photo.priceArs, 0)
  const message = gallery && selectedPhotos.length
    ? `Hola Franco, quiero pedir estas fotos de la galería "${gallery.title}": ${selectedPhotos.map((photo) => photo.filename).join(', ')}. Total: ${currency.format(total)}. Link: ${window.location.href}`
    : ''
  const orderUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`

  const togglePhoto = (id: string) => {
    const next = selected.includes(id) ? selected.filter((photoId) => photoId !== id) : [...selected, id]
    setSelected(next)
    setSelectionError('')
    selectionQueue.current = selectionQueue.current
      .catch(() => undefined)
      .then(() => saveGalleryPhotoSelections(token, next))
      .then(() => setSelectionError(''))
      .catch(() => setSelectionError('No pudimos guardar tus favoritas. Revisá tu conexión e intentá marcar una foto de nuevo.'))
  }

  return (
    <div className="gallery-client">
      {loading ? <div className="gallery-client__state"><span className="gallery-spinner" /><p>Preparando tus fotos…</p></div> : unavailable || !gallery ? (
        <main className="gallery-client__state"><span className="gallery-client__empty-mark">×</span><p className="gallery-overline">LINK NO DISPONIBLE</p><h1>Esta galería<br /><em>no está disponible.</em></h1><p>El link puede haber vencido o todavía no fue publicado. Escribile a Franco para pedir acceso.</p><a className="gallery-button gallery-button--primary" href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent('Hola Franco, necesito ayuda con el link de una galería.')}`} target="_blank" rel="noreferrer">Escribir por WhatsApp <span>↗</span></a></main>
      ) : (
        <>
          <main className="gallery-client__main">
            <a className="gallery-client__back" href="/galerias"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g clipPath="url(#gallery-back-arrow-clip)"><path d="M13.5303 8.53033C13.8232 8.23744 13.8232 7.76256 13.5303 7.46967C13.2374 7.17678 12.7626 7.17678 12.4697 7.46967L8.46967 11.4697C8.32902 11.6103 8.25 11.8011 8.25 12C8.25 12.1989 8.32902 12.3897 8.46967 12.5303L12.4697 16.5303C12.7626 16.8232 13.2374 16.8232 13.5303 16.5303C13.8232 16.2374 13.8232 15.7626 13.5303 15.4697L10.0607 12L13.5303 8.53033Z" fill="currentColor" /><path fillRule="evenodd" clipRule="evenodd" d="M12 .25C5.51065 .25 .25 5.51065 .25 12S5.51065 23.75 12 23.75 23.75 18.4893 23.75 12 18.4893 .25 12 .25ZM1.75 12C1.75 6.33908 6.33908 1.75 12 1.75S22.25 6.33908 22.25 12 17.6609 22.25 12 22.25 1.75 17.6609 1.75 12Z" fill="currentColor" /></g><defs><clipPath id="gallery-back-arrow-clip"><rect width="24" height="24" fill="currentColor" /></clipPath></defs></svg>Volver a galerías</a>
            {selectionError && <p className="gallery-client__selection-error" role="alert">{selectionError}</p>}
            {gallery.photos.length ? <section className="gallery-client__grid" aria-label="Fotos disponibles">{gallery.photos.map((photo, index) => {
              const isSelected = selected.includes(photo.id)
              return <article key={photo.id} className={`gallery-client__photo ${isSelected ? 'is-selected' : ''}`}>
                <button type="button" className="gallery-client__image-button" onClick={() => setPreviewIndex(index)} aria-label={`Ver foto ${index + 1} en grande`}><img src={photo.url} alt={`${gallery.title}, foto ${index + 1}`} loading={index < 3 ? 'eager' : 'lazy'} /></button>
                <button type="button" className="gallery-client__check" onClick={() => togglePhoto(photo.id)} aria-pressed={isSelected} aria-label={`${isSelected ? 'Quitar' : 'Seleccionar'} foto ${index + 1}`}>{isSelected ? '✓' : '+'}</button>
                <span className="gallery-client__photo-price">{photo.priceArs ? currency.format(photo.priceArs) : 'Sin cargo'}</span>
              </article>
            })}</section> : <div className="gallery-client__no-photos">Todavía no hay fotos en esta galería.</div>}
            <section className="gallery-client__contact" aria-label="Contacto">
              <h2>Comunicate conmigo</h2>
              <div className="gallery-client__contact-actions">
                <a className="gallery-client__contact-whatsapp" href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hola Franco, tengo una consulta sobre la galería "${gallery.title}".`)}`} target="_blank" rel="noreferrer">
                  <WhatsAppLogo className="gallery-client__contact-whatsapp-icon" />
                  <span>Hablar con Franco Digital</span>
                  <i aria-hidden="true">↗</i>
                </a>
                <a className="gallery-client__contact-logo" href="/" aria-label="Franco Digital, ir al inicio"><img src={francoLogo} alt="Logo FD" /></a>
              </div>
            </section>
          </main>
          {selectedPhotos.length > 0 && <aside className="gallery-order-bar"><div><span>{selectedPhotos.length} {selectedPhotos.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}</span><strong>{currency.format(total)}</strong></div><a href={orderUrl} target="_blank" rel="noreferrer"><WhatsAppLogo className="gallery-order-bar__whatsapp" /><span>Pedir por WhatsApp</span></a></aside>}
          {previewIndex !== null && gallery.photos[previewIndex] && <div className="gallery-lightbox" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewIndex(null) }}><section className="gallery-lightbox__dialog" role="dialog" aria-modal="true" aria-label={`Vista previa de la foto ${previewIndex + 1}`}><button className="gallery-lightbox__close" type="button" onClick={() => setPreviewIndex(null)} aria-label="Cerrar vista previa">×</button>{gallery.photos.length > 1 && <button className="gallery-lightbox__nav gallery-lightbox__nav--previous" type="button" onClick={() => setPreviewIndex((previewIndex - 1 + gallery.photos.length) % gallery.photos.length)} aria-label="Foto anterior">‹</button>}<img src={gallery.photos[previewIndex].url} alt={`${gallery.title}, foto ${previewIndex + 1}`} /><div className="gallery-lightbox__caption"><span>{String(previewIndex + 1).padStart(2, '0')} / {String(gallery.photos.length).padStart(2, '0')} · {gallery.photos[previewIndex].filename}</span><button type="button" aria-pressed={selected.includes(gallery.photos[previewIndex].id)} onClick={() => togglePhoto(gallery.photos[previewIndex].id)}>{selected.includes(gallery.photos[previewIndex].id) ? '✓ Elegida' : '+ Elegir foto'}</button></div>{gallery.photos.length > 1 && <button className="gallery-lightbox__nav gallery-lightbox__nav--next" type="button" onClick={() => setPreviewIndex((previewIndex + 1) % gallery.photos.length)} aria-label="Foto siguiente">›</button>}</section></div>}
        </>
      )}
    </div>
  )
}

function ReiconGalleryArrow({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 4.25C19.4142 4.25 19.75 4.58579 19.75 5V13C19.75 13.4142 19.4142 13.75 19 13.75C18.5858 13.75 18.25 13.4142 18.25 13V6.81066L5.53033 19.5303C5.23744 19.8232 4.76256 19.8232 4.46967 19.5303C4.17678 19.2374 4.17678 18.7626 4.46967 18.4697L17.1893 5.75H11C10.5858 5.75 10.25 5.41421 10.25 5C10.25 4.58579 10.5858 4.25 11 4.25H19Z" fill="currentColor" /></svg>
}

function PublishedGalleryCard({ gallery, index }: { gallery: PublishedGalleryLink; index: number }) {
  const [activePhoto, setActivePhoto] = useState(0)
  const [shareFeedback, setShareFeedback] = useState('')

  useEffect(() => {
    if (gallery.previewPhotos.length < 2) return
    const timer = window.setInterval(() => {
      setActivePhoto((current) => (current + 1) % gallery.previewPhotos.length)
    }, 3200)
    return () => window.clearInterval(timer)
  }, [gallery.id, gallery.previewPhotos.length])

  const copyShareLink = async (url: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
      return
    }
    const input = document.createElement('textarea')
    input.value = url
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    const copied = document.execCommand('copy')
    input.remove()
    if (!copied) throw new Error('No se pudo copiar el enlace')
  }

  const shareGallery = async () => {
    const url = galleryShareUrl(gallery.shareToken)
    try {
      if (navigator.share) {
        await navigator.share({ title: gallery.title, text: `Galería de fotos: ${gallery.title}`, url })
        setShareFeedback('Compartido')
      } else {
        await copyShareLink(url)
        setShareFeedback('Enlace copiado')
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      try {
        await copyShareLink(url)
        setShareFeedback('Enlace copiado')
      } catch {
        setShareFeedback('No se pudo compartir')
      }
    }
    window.setTimeout(() => setShareFeedback(''), 2200)
  }

  return (
    <article className="public-gallery-directory__card">
      <a className="public-gallery-directory__card-link" href={galleryShareUrl(gallery.shareToken)}>
        <span className="public-gallery-directory__cover" aria-hidden="true">
          {gallery.previewPhotos.length ? gallery.previewPhotos.map((photo, photoIndex) => <img className={photoIndex === activePhoto ? 'is-active' : ''} src={photo.url} alt="" loading="lazy" decoding="async" key={photo.id} />) : <span className="public-gallery-directory__cover-empty">FD</span>}
          <span className="public-gallery-directory__cover-label">FOTOS · {String(index + 1).padStart(2, '0')}</span>
        </span>
        <span className="public-gallery-directory__details"><small>{gallery.eventDate ? `EVENTO · ${new Date(`${gallery.eventDate}T12:00:00`).toLocaleDateString('es-AR')}` : 'GALERÍA PUBLICADA'}</small><strong>{gallery.title}</strong></span>
        <span className="public-gallery-directory__action">Abrir galería <ReiconGalleryArrow className="public-gallery-directory__open-icon" /></span>
      </a>
      <button className="public-gallery-directory__share" type="button" onClick={() => void shareGallery()} aria-label={`Compartir galería ${gallery.title}`} title="Compartir galería">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M16.5 2.25C14.7051 2.25 13.25 3.70507 13.25 5.5C13.25 5.69591 13.2673 5.88776 13.3006 6.07412L8.56991 9.38558C8.54587 9.4024 8.52312 9.42038 8.50168 9.43939C7.94993 9.00747 7.25503 8.75 6.5 8.75C4.70507 8.75 3.25 10.2051 3.25 12C3.25 13.7949 4.70507 15.25 6.5 15.25C7.25503 15.25 7.94993 14.9925 8.50168 14.5606C8.52312 14.5796 8.54587 14.5976 8.56991 14.6144L13.3006 17.9259C13.2673 18.1122 13.25 18.3041 13.25 18.5C13.25 20.2949 14.7051 21.75 16.5 21.75C18.2949 21.75 19.75 20.2949 19.75 18.5C19.75 16.7051 18.2949 15.25 16.5 15.25C15.4472 15.25 14.5113 15.7506 13.9174 16.5267L9.43806 13.3911C9.63809 12.9694 9.75 12.4978 9.75 12C9.75 11.5022 9.63809 11.0306 9.43806 10.6089L13.9174 7.4733C14.5113 8.24942 15.4472 8.75 16.5 8.75C18.2949 8.75 19.75 7.29493 19.75 5.5C19.75 3.70507 18.2949 2.25 16.5 2.25ZM14.75 5.5C14.75 4.5335 15.5335 3.75 16.5 3.75C17.4665 3.75 18.25 4.5335 18.25 5.5C18.25 6.4665 17.4665 7.25 16.5 7.25C15.5335 7.25 14.75 6.4665 14.75 5.5ZM6.5 10.25C5.5335 10.25 4.75 11.0335 4.75 12C4.75 12.9665 5.5335 13.75 6.5 13.75C7.4665 13.75 8.25 12.9665 8.25 12C8.25 11.0335 7.4665 10.25 6.5 10.25ZM16.5 16.75C15.5335 16.75 14.75 17.5335 14.75 18.5C14.75 19.4665 15.5335 20.25 16.5 20.25C17.4665 20.25 18.25 19.4665 18.25 18.5C18.25 17.5335 17.4665 16.75 16.5 16.75Z" fill="currentColor" /></svg>
      </button>
      {shareFeedback && <span className="public-gallery-directory__share-feedback" role="status">{shareFeedback}</span>}
    </article>
  )
}

function PublicGalleryDirectory() {
  const [galleries, setGalleries] = useState<PublishedGalleryLink[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState('')
  const [searchVisible, setSearchVisible] = useState(true)

  useEffect(() => {
    let active = true
    listPublishedGalleries()
      .then((result) => { if (active) setGalleries(result) })
      .catch(() => { if (active) setFailed(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => () => {
    galleries.flatMap((gallery) => gallery.previewPhotos)
      .filter((photo) => photo.url.startsWith('blob:'))
      .forEach((photo) => URL.revokeObjectURL(photo.url))
  }, [galleries])

  useEffect(() => {
    let previousY = window.scrollY
    const onScroll = () => {
      const currentY = Math.max(0, window.scrollY)
      const delta = currentY - previousY
      if (currentY < 80 || delta < -3) setSearchVisible(true)
      else if (delta > 4) setSearchVisible(false)
      previousY = currentY
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim()
  const normalizedQuery = normalizeSearch(search)
  const visibleGalleries = galleries.filter((gallery) => {
    if (!normalizedQuery) return true
    const date = gallery.eventDate ? new Date(`${gallery.eventDate}T12:00:00`).toLocaleDateString('es-AR') : ''
    return normalizeSearch(`${gallery.title} ${gallery.eventDate} ${date}`).includes(normalizedQuery)
  })

  return (
    <section className="public-gallery-directory route-view">
      <div className={`public-gallery-directory__search-dock ${searchVisible ? 'is-visible' : ''}`}>
        <label className="public-gallery-directory__search">
          <span className="public-gallery-directory__search-icon" aria-hidden="true">⌕</span>
          <span className="sr-only">Buscar fotos públicas</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscá por evento o fecha" autoComplete="off" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">×</button>}
        </label>
      </div>
      <div className="public-gallery-directory__content">
        <a className="gallery-client__back public-gallery-directory__back" href="/" aria-label="Volver al inicio"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g clipPath="url(#gallery-directory-back-clip)"><path d="M13.5303 8.53033C13.8232 8.23744 13.8232 7.76256 13.5303 7.46967C13.2374 7.17678 12.7626 7.17678 12.4697 7.46967L8.46967 11.4697C8.32902 11.6103 8.25 11.8011 8.25 12C8.25 12.1989 8.32902 12.3897 8.46967 12.5303L12.4697 16.5303C12.7626 16.8232 13.2374 16.8232 13.5303 16.5303C13.8232 16.2374 13.8232 15.7626 13.5303 15.4697L10.0607 12L13.5303 8.53033Z" fill="currentColor" /><path fillRule="evenodd" clipRule="evenodd" d="M12 .25C5.51065 .25 .25 5.51065 .25 12S5.51065 23.75 12 23.75 23.75 18.4893 23.75 12 18.4893 .25 12 .25ZM1.75 12C1.75 6.33908 6.33908 1.75 12 1.75S22.25 6.33908 22.25 12 17.6609 22.25 12 22.25 1.75 17.6609 1.75 12Z" fill="currentColor" /></g><defs><clipPath id="gallery-directory-back-clip"><rect width="24" height="24" fill="currentColor" /></clipPath></defs></svg>Volver al inicio</a>
        <h1>Fotos públicas</h1>
        <p className="public-gallery-directory__subtitle">Buscá tus fotos acá.</p>
        {loading ? <div className="public-gallery-directory__state"><span className="gallery-spinner" />Cargando fotos…</div> : failed ? (
          <div className="public-gallery-directory__state">No pudimos cargar las fotos ahora. Volvé a intentarlo en unos minutos.</div>
        ) : galleries.length === 0 ? (
          <div className="public-gallery-directory__state">Todavía no hay fotos públicas.</div>
        ) : visibleGalleries.length === 0 ? (
          <div className="public-gallery-directory__state"><span>No encontramos galerías con esa búsqueda.</span><button type="button" onClick={() => setSearch('')}>Limpiar búsqueda</button></div>
        ) : (
          <div className="public-gallery-directory__list">{visibleGalleries.map((gallery, index) => <PublishedGalleryCard gallery={gallery} index={visibleGalleries.length - index} key={gallery.id} />)}</div>
        )}
      </div>
    </section>
  )
}

export default function GalleryStudio({ mode, token = '' }: { mode: 'admin' | 'gallery' | 'directory'; token?: string }) {
  const [authReady, setAuthReady] = useState(usingDemoGalleryStore)
  const [signedIn, setSignedIn] = useState(usingDemoGalleryStore)

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSignedIn(Boolean(data.session))
        setAuthReady(true)
      }
    })
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session))
      setAuthReady(true)
    })
    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (mode === 'gallery') return <PublicGallery token={token} />
  if (mode === 'directory') return <PublicGalleryDirectory />
  if (!supabase && !usingDemoGalleryStore) {
    return <main className="gallery-client__state"><h1>Panel no disponible</h1><p>La conexión segura no está configurada. Contactá al administrador del sitio.</p></main>
  }
  if (!authReady) return <div className="gallery-client__state"><span className="gallery-spinner" /><p>Abriendo el panel…</p></div>
  if (!signedIn) return <AdminLogin onSignedIn={() => setSignedIn(true)} />

  const signOut = async () => {
    await supabase?.auth.signOut()
    setSignedIn(false)
  }
  return <AdminDashboard onSignOut={() => void signOut()} />
}
