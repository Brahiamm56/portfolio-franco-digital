import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import loginBackground from '../assets/projects/hercules/01.webp'
import francoLogo from '../assets/franco-digital-logo.png'
import francoPortrait from '../assets/franco-acuna-portrait.jpg'
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
  setGalleryCoverPhoto,
  setGalleryStatus,
  uploadGalleryCoverPhoto,
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

function ReiconCart({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.299 5h14.192a1 1 0 0 1 .958 1.303l-2.057 6.172a2 2 0 0 1-1.897 1.365H8.384m-2.085-8.84L5.342 3.522A1 1 0 0 0 4.385 3H2.5m3.799 2l2.302 9.208a2 2 0 0 0 1.897 1.365h8.924M9.5 19a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0Zm10 0a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PhotoMark() {
  return <span className="photo-mark" aria-hidden="true"><i /><i /><i /><i /></span>
}

function PhotoWatermark() {
  return (
    <div className="gallery-photo-watermark" aria-hidden="true">
      <span className="gallery-photo-watermark__lines" />
      <span className="gallery-photo-watermark__badge">FRANCO DIGITAL</span>
    </div>
  )
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

function GalleryPhotoManager({
  gallery,
  onSetCover,
}: {
  gallery: PhotoGallery
  onSetCover: (photoId: string) => void
}) {
  const defaultSelected = gallery.clientSelectedPhotoIds.filter((id) => gallery.photos.some((photo) => photo.id === id))
  const clientSelectionKey = defaultSelected.join('|')
  const [selected, setSelected] = useState<string[]>(defaultSelected)
  const [prevSelectionKey, setPrevSelectionKey] = useState(clientSelectionKey)
  if (prevSelectionKey !== clientSelectionKey) {
    setPrevSelectionKey(clientSelectionKey)
    setSelected(clientSelectionKey ? clientSelectionKey.split('|') : [])
  }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const photosForDelivery = gallery.photos.filter((photo) => selected.includes(photo.id))
  const clientSelectionCount = defaultSelected.length

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
          <p>{clientSelectionCount ? `El cliente eligió ${clientSelectionCount} ${clientSelectionCount === 1 ? 'foto' : 'fotos'}.` : 'El cliente todavía no eligió fotos.'} Marcá las que querés incluir en el documento o definí cuál es la portada del evento.</p>
        </div>
        <div className="gallery-photo-manager__grid">
          {gallery.photos.map((photo, index) => {
            const isSelected = selected.includes(photo.id)
            const chosenByClient = defaultSelected.includes(photo.id)
            const isCover = gallery.coverPhotoId === photo.id || (!gallery.coverPhotoId && index === 0)
            return (
              <div key={photo.id} className="gallery-photo-manager__cell">
                <button
                  type="button"
                  className={`gallery-photo-manager__item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => toggle(photo.id)}
                  aria-pressed={isSelected}
                >
                  <img src={photo.url} alt="" loading="lazy" />
                  <span className="gallery-photo-manager__check">{isSelected ? '✓' : '+'}</span>
                  <span className="gallery-photo-manager__caption">
                    {String(index + 1).padStart(2, '0')} · {photo.filename.replace(/^\[PORTADA\]\s*/i, '')}
                    {chosenByClient && <small>Elegida por cliente</small>}
                  </span>
                </button>
                <button
                  type="button"
                  className={`gallery-photo-manager__cover-btn ${isCover ? 'is-active' : ''}`}
                  title={isCover ? 'Foto de portada actual' : 'Fijar esta foto como portada del evento'}
                  onClick={() => onSetCover(photo.id)}
                >
                  {isCover ? '★ Portada' : '☆ Hacer portada'}
                </button>
              </div>
            )
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
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const coverPreviewUrl = useMemo(() => coverFile ? URL.createObjectURL(coverFile) : null, [coverFile])
  const filePreviews = useMemo(() => files.map((file) => ({
    file,
    url: URL.createObjectURL(file),
  })), [files])

  useEffect(() => () => {
    if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl)
  }, [coverPreviewUrl])

  useEffect(() => () => {
    filePreviews.forEach(({ url }) => URL.revokeObjectURL(url))
  }, [filePreviews])

  const closeCreate = () => {
    setShowCreate(false)
    setTitle('')
    setClientName('')
    setEventDate('')
    setPrice('5000')
    setCoverFile(null)
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
    if (coverFile && !validateFiles([coverFile])) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const id = await createGallery({ title: title.trim(), clientName: clientName.trim(), eventDate, coverFile })
      if (files.length) await addGalleryPhotos(id, files, priceArs)
      setTitle('')
      setClientName('')
      setEventDate('')
      closeCreate()
      setNotice(files.length || coverFile ? 'Galería creada con sus fotos y portada.' : 'Galería creada. Ya podés cargarle fotos.')
      await refresh()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No pudimos crear la galería.'
      await refresh()
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const handleUploadCover = async (gallery: PhotoGallery, file: File) => {
    if (!validateFiles([file])) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await uploadGalleryCoverPhoto(gallery.id, file)
      await refresh()
      setNotice(`Foto de portada de “${gallery.title}” actualizada con éxito.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos actualizar la portada.')
    } finally {
      setBusy(false)
    }
  }

  const handleSetCoverPhoto = async (gallery: PhotoGallery, photoId: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await setGalleryCoverPhoto(gallery.id, photoId)
      await refresh()
      setNotice(`Foto fijada como portada de “${gallery.title}”.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos cambiar la portada.')
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
              {galleries.map((gallery, index) => {
                const coverUrl = gallery.coverPhotoUrl || gallery.photos[0]?.url
                return (
                  <article className="gallery-card" key={gallery.id}>
                    <div className="gallery-card__cover">
                      {coverUrl ? <img src={coverUrl} alt={`Portada de ${gallery.title}`} /> : <div className="gallery-card__placeholder"><PhotoMark /><span>SIN FOTOS</span></div>}
                      <span className={`gallery-status ${gallery.status === 'published' ? 'is-published' : ''}`}><i />{gallery.status === 'published' ? 'PUBLICADA' : 'BORRADOR'}</span>
                      <span className="gallery-card__number">{String(galleries.length - index).padStart(2, '0')}</span>
                      <span className="gallery-card__cover-pill">PORTADA</span>
                      <label className="gallery-card__cover-action" title="Cambiar foto de portada">
                        <span>📷 Cambiar portada</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={busy}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) void handleUploadCover(gallery, file)
                            event.target.value = ''
                          }}
                        />
                      </label>
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
                    {gallery.photos.length > 0 && (
                      <GalleryPhotoManager
                        gallery={gallery}
                        onSetCover={(photoId) => void handleSetCoverPhoto(gallery, photoId)}
                      />
                    )}
                  </article>
                )
              })}
            </div>
          )}
          <footer className="gallery-footer"><span>© 2026 FRANCO DIGITAL</span><span>ARCHIVO FOTOGRÁFICO / 01</span></footer>
        </div>
      </main>

      {showCreate && <div className="gallery-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate() }}><section className="gallery-modal" role="dialog" aria-modal="true" aria-labelledby="new-gallery-title"><header><div><p className="gallery-overline">NUEVA SERIE</p><h2 id="new-gallery-title">Crear galería</h2></div><button type="button" onClick={closeCreate} aria-label="Cerrar">×</button></header><form onSubmit={submitCreate}>
        <label>Nombre de la galería<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Final del torneo apertura" required maxLength={120} /></label>
        <div className="gallery-form-row"><label>Cliente / equipo<input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Ej. Club Hércules" required maxLength={120} /></label><label>Fecha del evento<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label></div>
        <label>Precio por foto <div className="gallery-price-field"><span>$</span><input type="number" min="0" max="2147483647" step="1" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} /><small>ARS</small></div></label>
        
        <div className="gallery-cover-field">
          <span className="gallery-field-label">Foto de portada (opcional)</span>
          <label className="gallery-cover-dropzone">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file && validateFiles([file])) setCoverFile(file)
                event.target.value = ''
              }}
            />
            {coverPreviewUrl ? (
              <div className="gallery-cover-dropzone__preview">
                <img src={coverPreviewUrl} alt="Vista previa de portada" />
                <div className="gallery-cover-dropzone__info">
                  <span>{coverFile?.name}</span>
                  <button type="button" onClick={(e) => { e.preventDefault(); setCoverFile(null) }}>Quitar portada ×</button>
                </div>
              </div>
            ) : (
              <div className="gallery-cover-dropzone__prompt">
                <span className="gallery-cover-dropzone__icon">📷</span>
                <strong>Elegí una foto de portada para este evento</strong>
                <small>Se mostrará como cabecera en el link del evento y en el panel</small>
              </div>
            )}
          </label>
        </div>

        <label className="gallery-dropzone"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { setFiles(Array.from(event.target.files ?? [])); event.target.value = '' }} /><span className="gallery-dropzone__icon">↑</span><strong>{files.length ? `${files.length} ${files.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}` : 'Elegí las fotos para esta galería'}</strong><small>JPG, PNG o WebP · hasta 6 MB por foto</small><span className="gallery-dropzone__button">Seleccionar archivos</span></label>
        {filePreviews.length > 0 && <div className="gallery-upload-previews" aria-label="Vista previa de las fotos seleccionadas">{filePreviews.map(({ file, url }, index) => <figure className="gallery-upload-preview" key={`${file.name}-${file.lastModified}-${index}`}><img src={url} alt={`Vista previa: ${file.name}`} /><figcaption title={file.name}>{file.name}</figcaption><button type="button" aria-label={`Quitar ${file.name}`} onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}>×</button></figure>)}</div>}
        <div className="gallery-modal__actions"><button type="button" className="gallery-button gallery-button--quiet" onClick={() => closeCreate()}>Cancelar</button><button type="submit" className="gallery-button gallery-button--primary" disabled={busy}>{busy ? 'Guardando…' : 'Crear galería'} <span>↗</span></button></div>
      </form></section></div>}
    </div>
  )
}

function PublicPhotoItem({
  photo,
  index,
  galleryTitle,
  isSelected,
  onOpenPreview,
  onToggle,
}: {
  photo: PublicPhotoGallery['photos'][number]
  index: number
  galleryTitle: string
  isSelected: boolean
  onOpenPreview: () => void
  onToggle: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  return (
    <article className={`gallery-client__photo ${isSelected ? 'is-selected' : ''} ${loaded ? 'is-loaded' : 'is-loading'}`}>
      <button
        type="button"
        className="gallery-client__image-button"
        onClick={onOpenPreview}
        aria-label={`Ver foto ${index + 1} en grande`}
      >
        {!loaded && !hasError && (
          <div className="gallery-client__photo-skeleton" aria-hidden="true">
            <span className="gallery-client__photo-shimmer" />
            <span className="gallery-client__photo-skeleton-num">{String(index + 1).padStart(2, '0')}</span>
          </div>
        )}
        <img
          src={photo.url}
          alt={`${galleryTitle}, foto ${index + 1}`}
          loading={index < 4 ? 'eager' : 'lazy'}
          fetchPriority={index < 2 ? 'high' : 'auto'}
          decoding="async"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          onLoad={() => setLoaded(true)}
          onError={() => setHasError(true)}
          className={`gallery-client__photo-img ${loaded ? 'is-visible' : 'is-hidden'}`}
        />
        <PhotoWatermark />
      </button>
      <button
        type="button"
        className="gallery-client__check"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        aria-pressed={isSelected}
        aria-label={`${isSelected ? 'Quitar' : 'Seleccionar'} foto ${index + 1}`}
      >
        {isSelected ? '✓' : '+'}
      </button>
      <span className="gallery-client__photo-price">
        {photo.priceArs ? currency.format(photo.priceArs) : 'Sin cargo'}
      </span>
    </article>
  )
}

const BATCH_SIZE = 12

function PublicGallery({ token }: { token: string }) {
  const [gallery, setGallery] = useState<PublicPhotoGallery | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [selectionError, setSelectionError] = useState('')
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const selectionQueue = useRef(Promise.resolve())

  useEffect(() => {
    let active = true
    getPublishedGallery(token)
      .then((result) => {
        if (active) {
          setGallery(result)
          setSelected(result?.photos.filter((photo) => result.clientSelectedPhotoIds.includes(photo.id)).map((photo) => photo.id) ?? [])
          setUnavailable(!result)
          setVisibleCount(BATCH_SIZE)
        }
      })
      .catch(() => { if (active) setUnavailable(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  // Carga progresiva fluida de lotes con IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !gallery) return
    if (visibleCount >= gallery.photos.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, gallery.photos.length))
        }
      },
      { rootMargin: '600px 0px', threshold: 0.01 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [gallery, visibleCount])

  const openPreview = (index: number) => {
    setVisibleCount((prev) => Math.max(prev, index + 1))
    setPreviewIndex(index)
  }

  const navigatePreview = useCallback((step: number) => {
    if (!gallery || !gallery.photos.length) return
    setPreviewIndex((current) => {
      if (current === null) return null
      const next = (current + step + gallery.photos.length) % gallery.photos.length
      setVisibleCount((prev) => Math.max(prev, next + 1))
      return next
    })
  }, [gallery])

  // Precarga silenciosa en lightbox de la foto anterior y siguiente para navegación instantánea
  useEffect(() => {
    if (previewIndex === null || !gallery) return
    const len = gallery.photos.length
    if (len <= 1) return
    const nextIdx = (previewIndex + 1) % len
    const prevIdx = (previewIndex - 1 + len) % len
    const nextImg = new Image()
    nextImg.src = gallery.photos[nextIdx].url
    const prevImg = new Image()
    prevImg.src = gallery.photos[prevIdx].url
  }, [previewIndex, gallery])

  useEffect(() => {
    if (previewIndex === null || !gallery) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewIndex(null)
      if (event.key === 'ArrowRight') navigatePreview(1)
      if (event.key === 'ArrowLeft') navigatePreview(-1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [gallery, previewIndex, navigatePreview])

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

            {/* Portada y encabezado del evento */}
            <header className="gallery-client__hero">
              <div className="gallery-client__hero-media">
                {gallery.coverPhotoUrl ? (
                  <img
                    src={gallery.coverPhotoUrl}
                    alt={`Portada de ${gallery.title}`}
                    className="gallery-client__hero-image"
                    draggable={false}
                    fetchPriority="high"
                    decoding="async"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                ) : (
                  <div className="gallery-client__hero-fallback">
                    <PhotoMark />
                  </div>
                )}
                <div className="gallery-client__hero-gradient" aria-hidden="true" />
                <span className="gallery-client__hero-tag">GALERÍA DE FOTOS</span>
              </div>
              <div className="gallery-client__hero-body">
                <p className="gallery-client__hero-meta">
                  <span className="gallery-client__hero-client">{gallery.clientName}</span>
                  {gallery.eventDate && (
                    <span className="gallery-client__hero-date">
                      {' · '}
                      {new Date(`${gallery.eventDate}T12:00:00`).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </p>
                <h1 className="gallery-client__hero-title">{gallery.title}</h1>
                <div className="gallery-client__hero-bar">
                  <span className="gallery-client__hero-count">
                    <strong>{gallery.photos.length}</strong> {gallery.photos.length === 1 ? 'foto disponible' : 'fotos disponibles'}
                  </span>
                  <span className="gallery-client__hero-tip">
                    Tocá una foto para ampliarla o usá <strong>＋</strong> para elegir tus fotos
                  </span>
                </div>
              </div>
            </header>

            {selectionError && <p className="gallery-client__selection-error" role="alert">{selectionError}</p>}
            {gallery.photos.length ? (
              <>
                <section className="gallery-client__grid" aria-label="Fotos disponibles">
                  {gallery.photos.slice(0, visibleCount).map((photo, index) => {
                    const isSelected = selected.includes(photo.id)
                    return (
                      <PublicPhotoItem
                        key={photo.id}
                        photo={photo}
                        index={index}
                        galleryTitle={gallery.title}
                        isSelected={isSelected}
                        onOpenPreview={() => openPreview(index)}
                        onToggle={() => togglePhoto(photo.id)}
                      />
                    )
                  })}
                </section>
                {visibleCount < gallery.photos.length && (
                  <div ref={sentinelRef} className="gallery-client__sentinel">
                    <span className="gallery-spinner" />
                    <p>Cargando más fotos ({visibleCount} de {gallery.photos.length})…</p>
                    <button
                      type="button"
                      className="gallery-button gallery-button--quiet gallery-button--small"
                      onClick={() => setVisibleCount((prev) => Math.min(prev + BATCH_SIZE * 2, gallery.photos.length))}
                    >
                      Cargar más fotos
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="gallery-client__no-photos">Todavía no hay fotos en esta galería.</div>
            )}
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
          {previewIndex !== null && gallery.photos[previewIndex] && (
            <div
              className={`gallery-lightbox ${selectedPhotos.length > 0 ? 'has-order-bar' : ''}`}
              role="presentation"
              onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewIndex(null) }}
            >
              <section className="gallery-lightbox__dialog" role="dialog" aria-modal="true" aria-label={`Vista previa de la foto ${previewIndex + 1}`}>
                <button className="gallery-lightbox__close" type="button" onClick={() => setPreviewIndex(null)} aria-label="Cerrar vista previa">×</button>
                {gallery.photos.length > 1 && (
                  <button className="gallery-lightbox__nav gallery-lightbox__nav--previous" type="button" onClick={() => navigatePreview(-1)} aria-label="Foto anterior">‹</button>
                )}
                <div className="gallery-lightbox__media">
                  <img
                    src={gallery.photos[previewIndex].url}
                    alt={`${gallery.title}, foto ${previewIndex + 1}`}
                    draggable={false}
                    decoding="async"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <PhotoWatermark />
                </div>
                <div className="gallery-lightbox__caption">
                  <span>{String(previewIndex + 1).padStart(2, '0')} / {String(gallery.photos.length).padStart(2, '0')} · {gallery.photos[previewIndex].filename.replace(/^\[PORTADA\]\s*/i, '')}</span>
                  <button
                    type="button"
                    className="gallery-lightbox__select-button"
                    aria-pressed={selected.includes(gallery.photos[previewIndex].id)}
                    onClick={() => togglePhoto(gallery.photos[previewIndex].id)}
                  >
                    <ReiconCart className="gallery-lightbox__select-icon" />
                    <span>{selected.includes(gallery.photos[previewIndex].id) ? '✓ Elegida' : '+ Elegir foto'}</span>
                  </button>
                </div>
                {gallery.photos.length > 1 && (
                  <button className="gallery-lightbox__nav gallery-lightbox__nav--next" type="button" onClick={() => navigatePreview(1)} aria-label="Foto siguiente">›</button>
                )}
              </section>
            </div>
          )}

          {selectedPhotos.length > 0 && (
            <aside
              className={`gallery-order-bar ${previewIndex !== null ? 'is-in-lightbox' : ''}`}
              aria-label="Carrito de fotos seleccionadas"
            >
              <div className="gallery-order-bar__summary">
                <div className="gallery-order-bar__icon-bubble">
                  <ReiconCart className="gallery-order-bar__cart-icon" />
                  <span className="gallery-order-bar__badge" key={selectedPhotos.length}>
                    {selectedPhotos.length}
                  </span>
                </div>
                <div className="gallery-order-bar__meta">
                  <span>{selectedPhotos.length} {selectedPhotos.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}</span>
                  <strong>{currency.format(total)}</strong>
                </div>
              </div>
              <a
                href={orderUrl}
                target="_blank"
                rel="noreferrer"
                className="gallery-order-bar__cta"
                aria-label="Pedir fotos seleccionadas por WhatsApp"
              >
                <WhatsAppLogo className="gallery-order-bar__whatsapp" />
                <span>Pedir por WhatsApp</span>
              </a>
            </aside>
          )}
        </>
      )}
    </div>
  )
}

function ReiconInstagram({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.6361 7H17.6477" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function isGalleryNew(createdAt?: string, eventDate?: string): boolean {
  const reference = createdAt || (eventDate ? `${eventDate}T12:00:00` : null)
  if (!reference) return false
  const time = new Date(reference).getTime()
  if (Number.isNaN(time)) return false
  const diffDays = (Date.now() - time) / (1000 * 60 * 60 * 24)
  // Es nuevo si fue publicado/creado en los últimos 14 días
  return diffDays >= -1 && diffDays <= 14
}

function formatEventDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(`${dateString}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).replace('.', '')
}

function DirectoryCartButton() {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      let count = 0
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.startsWith('gallery-selected-') || key.startsWith('gallery-cart-count-'))) {
          try {
            const raw = localStorage.getItem(key)
            if (raw) {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) count += parsed.length
              else if (typeof parsed === 'number') count += parsed
            }
          } catch {
            // ignore
          }
        }
      }
      setCartCount(count)
    }

    updateCount()
    window.addEventListener('storage', updateCount)
    return () => window.removeEventListener('storage', updateCount)
  }, [])

  return (
    <a
      href="#eventos"
      className="public-gallery-nav__cart"
      aria-label={cartCount ? `Carrito: ${cartCount} fotos seleccionadas` : 'Carrito'}
      title={cartCount ? `${cartCount} fotos seleccionadas` : 'Carrito'}
    >
      <ReiconCart className="public-gallery-nav__cart-icon" />
      {cartCount > 0 && <span className="public-gallery-nav__cart-badge">{cartCount}</span>}
    </a>
  )
}

function PublishedEventCard({ gallery }: { gallery: PublishedGalleryLink }) {
  const isNew = isGalleryNew(gallery.createdAt, gallery.eventDate)
  const formattedDate = formatEventDate(gallery.eventDate)
  const coverUrl = gallery.coverPhotoUrl || gallery.previewPhotos[0]?.url

  return (
    <article className="public-event-card">
      <a
        href={galleryShareUrl(gallery.shareToken)}
        className="public-event-card__link"
        aria-label={`Ver fotos de ${gallery.title}`}
      >
        <div className="public-event-card__media">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`Portada de ${gallery.title}`}
              loading="lazy"
              decoding="async"
              className="public-event-card__img"
            />
          ) : (
            <div className="public-event-card__placeholder">
              <PhotoMark />
            </div>
          )}

          {/* Etiqueta Nuevo si es reciente (desaparece si ya no es nuevo) */}
          {isNew && (
            <span className="public-event-card__badge-new">
              Nuevo
            </span>
          )}

          {/* Insignia con conteo de fotos */}
          <span className="public-event-card__badge-count">
            <svg viewBox="0 0 24 24" fill="none" className="public-event-card__camera-icon" aria-hidden="true">
              <path d="M4 7H8L9.5 5H14.5L16 7H20C21.1 7 22 7.9 22 9V19C22 20.1 21.1 21 20 21H4C2.9 21 2 20.1 2 19V9C2 7.9 2.9 7 4 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>
              {gallery.photoCount
                ? `${gallery.photoCount.toLocaleString('es-AR')} fotos`
                : 'Ver fotos'}
            </span>
          </span>
        </div>

        <div className="public-event-card__body">
          <h3 className="public-event-card__title">{gallery.title}</h3>
          <p className="public-event-card__meta">
            {formattedDate}
            {gallery.clientName ? ` · ${gallery.clientName}` : ''}
          </p>
        </div>
      </a>
    </article>
  )
}

function PublicGalleryDirectory() {
  const [galleries, setGalleries] = useState<PublishedGalleryLink[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [search, setSearch] = useState('')

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

  const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim()
  const normalizedQuery = normalizeSearch(search)
  const visibleGalleries = galleries.filter((gallery) => {
    if (!normalizedQuery) return true
    const date = gallery.eventDate ? new Date(`${gallery.eventDate}T12:00:00`).toLocaleDateString('es-AR') : ''
    const client = gallery.clientName ?? ''
    return normalizeSearch(`${gallery.title} ${gallery.eventDate} ${date} ${client}`).includes(normalizedQuery)
  })

  return (
    <div className="public-gallery-directory route-view">
      {/* Hero superior con fondo de Franco, perfil centrado y barra de nav */}
      <header className="public-gallery-hero">
        <img
          src={francoPortrait}
          alt="Franco Digital Fotografía"
          className="public-gallery-hero__bg"
          decoding="async"
        />
        <div className="public-gallery-hero__overlay" aria-hidden="true" />

        {/* Barra superior: Volver a la izquierda y Carrito a la derecha */}
        <nav className="public-gallery-nav" aria-label="Navegación de galerías">
          <a href="/" className="public-gallery-nav__back" aria-label="Volver al inicio" title="Volver al inicio">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <DirectoryCartButton />
        </nav>

        {/* Perfil central: avatar con logo, nombre y red social */}
        <div className="public-gallery-hero__content">
          <div className="public-gallery-hero__avatar">
            <img src={francoLogo} alt="Logo Franco Digital" className="public-gallery-hero__logo" />
          </div>
          <h1 className="public-gallery-hero__title">francodigital</h1>
          <a
            href="https://www.instagram.com/francodigital__/"
            target="_blank"
            rel="noreferrer"
            className="public-gallery-hero__instagram"
            aria-label="Instagram @francodigital__"
          >
            <ReiconInstagram className="public-gallery-hero__instagram-icon" />
            <span>@francodigital__</span>
          </a>
        </div>

        {/* Buscador de eventos anclado al borde inferior del hero */}
        <div className="public-gallery-search-wrap">
          <label className="public-gallery-search">
            <svg viewBox="0 0 24 24" fill="none" className="public-gallery-search__icon" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscá tu evento"
              autoComplete="off"
              aria-label="Buscar tu evento"
            />
            {search && (
              <button
                type="button"
                className="public-gallery-search__clear"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </label>
        </div>
      </header>

      {/* Listado de eventos */}
      <main className="public-gallery-main" id="eventos">
        <div className="public-gallery-heading">
          <h2>Eventos</h2>
          <span className="public-gallery-count">{visibleGalleries.length}</span>
        </div>

        {loading ? (
          <div className="public-gallery-state">
            <span className="gallery-spinner" />
            <p>Cargando eventos…</p>
          </div>
        ) : failed ? (
          <div className="public-gallery-state">
            <p>No pudimos cargar los eventos ahora. Volvé a intentarlo en unos minutos.</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="public-gallery-state">
            <p>Todavía no hay eventos publicados.</p>
          </div>
        ) : visibleGalleries.length === 0 ? (
          <div className="public-gallery-state">
            <p>No encontramos eventos con esa búsqueda.</p>
            <button
              type="button"
              className="gallery-button gallery-button--quiet"
              onClick={() => setSearch('')}
            >
              Ver todos los eventos
            </button>
          </div>
        ) : (
          <div className="public-gallery-grid">
            {visibleGalleries.map((gallery) => (
              <PublishedEventCard key={gallery.id} gallery={gallery} />
            ))}
          </div>
        )}
      </main>
    </div>
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
