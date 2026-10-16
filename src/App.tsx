import './App.css'

const projects = [
  {
    number: '01',
    title: 'Dirección visual',
    type: 'Branding / Art direction',
    tone: 'project-card--lime',
  },
  {
    number: '02',
    title: 'Materia y luz',
    type: 'Photography / Editorial',
    tone: 'project-card--violet',
  },
  {
    number: '03',
    title: 'Forma en movimiento',
    type: 'Digital / Motion',
    tone: 'project-card--orange',
  },
]

function App() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Franco Digital, inicio">
          <span>FRANCO</span>
          <span>DIGITAL</span>
        </a>

        <nav className="main-nav" aria-label="Navegación principal">
          <a href="#work">Trabajo</a>
          <a href="#about">Sobre mí</a>
          <a href="#contact">Contacto</a>
        </nav>

        <a className="header-index" href="#contact">
          <span className="status-dot" aria-hidden="true" /> Disponible para proyectos
        </a>
      </header>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-meta eyebrow">
          <span>Diseñador & fotógrafo digital</span>
          <span>Buenos Aires / Remoto</span>
        </div>

        <div className="hero-copy">
          <p className="hero-kicker">Portfolio 2026</p>
          <h1 id="hero-title">
            Diseño que <em>se mueve.</em>
            <br />
            Imágenes que quedan.
          </h1>
          <p className="hero-intro">
            Una selección de identidades, experiencias y fotografías construidas para
            marcas que quieren dejar una impresión clara.
          </p>
          <a className="text-link" href="#work">
            <span>Explorar proyectos</span>
            <span className="link-arrow" aria-hidden="true">↘</span>
          </a>
        </div>

        <div className="hero-index" aria-hidden="true">01 / 04</div>
        <div className="hero-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </section>

      <section className="work-section section-frame" id="work" aria-labelledby="work-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Selección de trabajo</p>
            <h2 id="work-title">Proyectos que hablan<br />por sí solos.</h2>
          </div>
          <p className="section-note">01—03 / Casos seleccionados</p>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <a className={`project-card ${project.tone}`} href="#contact" key={project.number}>
              <div className="project-art" aria-hidden="true">
                <span className="art-shape art-shape--one" />
                <span className="art-shape art-shape--two" />
                <span className="art-label">{project.number}</span>
              </div>
              <div className="project-info">
                <span>{project.type}</span>
                <h3>{project.title}</h3>
                <span className="project-arrow" aria-hidden="true">↗</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="about-section section-frame" id="about" aria-labelledby="about-title">
        <div className="section-heading section-heading--about">
          <p className="eyebrow">El enfoque</p>
          <span className="section-note">02—04 / Método</span>
        </div>
        <div className="about-content">
          <h2 id="about-title">Ideas con intención,<br /><em>detalles con carácter.</em></h2>
          <div className="about-copy">
            <p>
              Trabajo entre el diseño y la fotografía para construir universos visuales
              que se sienten propios, simples de reconocer y difíciles de olvidar.
            </p>
            <a className="text-link" href="#contact">
              <span>Conocer el proceso</span>
              <span className="link-arrow" aria-hidden="true">↘</span>
            </a>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact" aria-labelledby="contact-title">
        <div className="contact-inner">
          <p className="eyebrow">¿Hacemos algo?</p>
          <h2 id="contact-title">Tu próxima idea<br /><em>empieza acá.</em></h2>
          <a className="contact-link" href="mailto:hola@francodigital.com">
            hola@francodigital.com <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="contact-footer">
          <span>© 2026 Franco Digital</span>
          <div className="social-links">
            <a href="#contact">Instagram</a>
            <a href="#contact">Behance</a>
            <a href="#contact">LinkedIn</a>
          </div>
          <span>Volver arriba ↑</span>
        </div>
      </section>
    </main>
  )
}

export default App
