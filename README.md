# Franco Digital

Portfolio personal para un diseñador y fotógrafo digital.

## Stack

- React 19 + TypeScript
- Vite
- CSS nativo para layout, interacciones y animaciones ligeras
- Componentes visuales de React Bits cuando aporten valor a la experiencia

## Estructura inicial

```text
src/
├── assets/       # Imágenes y recursos del portfolio
├── components/   # Componentes reutilizables
├── data/         # Contenido estructurado de proyectos y servicios
├── sections/     # Secciones grandes de la página
├── App.tsx
├── App.css
└── index.css
```

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

El contenido de la pantalla actual es provisional: sirve como dirección visual inicial hasta definir identidad, proyectos, textos, imágenes y datos de contacto definitivos.

## Galerías para clientes

El panel está disponible en `/admin` y las galerías compartibles usan `/galeria/<token>`. Solo en desarrollo local, si faltan las credenciales de Supabase, funciona el modo demo del navegador con datos en `localStorage` e IndexedDB. En producción la conexión ausente bloquea el panel y las operaciones de galerías.

### Supabase configurado

El proyecto `franco-digital-galerias` ya está creado en la región de São Paulo. El esquema, el bucket privado y la función Edge `public-gallery` ya están aplicados. La configuración local está en `.env.local` (ignorada por Git); para publicar el sitio, cargá `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` como variables de entorno en Vercel.

Antes de usar el panel:

1. Creá el usuario administrador en Supabase Auth y desactivá los registros públicos.
2. En el SQL Editor, autorizá su UUID en la lista cerrada de administradores (en el esquema interno `private`, no expuesto por la API):

   ```sql
   insert into private.gallery_admins (user_id)
   select id from auth.users where email = 'correo-admin@ejemplo.com'
   on conflict (user_id) do nothing;
   ```

El panel ofrece inicio de sesión, no registro. La allowlist vive en un esquema privado; las políticas RLS y los permisos explícitos de Postgres restringen lectura y cambios a administradores autorizados, aunque alguien manipule el JavaScript desde las herramientas del navegador. La clave publishable de Supabase puede estar en el navegador; nunca agregues claves `service_role` al frontend. Si necesitás reconstruir el backend, [`supabase/setup.sql`](supabase/setup.sql) contiene el esquema completo, restricciones e índices; después desplegá `supabase/functions/public-gallery/index.ts` como la función `public-gallery`.

El bucket de fotos es privado. La función solo devuelve galerías publicadas cuando recibe su token aleatorio y genera enlaces temporales. La selección y el pedido por WhatsApp ya funcionan; el cobro directo desde la web todavía no está integrado y requiere elegir una pasarela de pago. La carga actual acepta JPG, PNG y WebP de hasta 6 MB por foto.
