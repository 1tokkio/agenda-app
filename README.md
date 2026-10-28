# AgendaFinlandia · EXPOCORMA 2026

Agendamiento de reuniones para el stand de Finlandia. Los visitantes reservan un bloque de 30 minutos
desde el tótem o desde su celular, y el personal de las empresas administra la agenda desde `/admin`.

- **Agenda pública:** `/` (tótem y dispositivos de visitantes).
- **Panel de organización:** `/admin` (calendario, reuniones, usuarios y bloqueos). Requiere PIN.
- **Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Supabase) · Drizzle ORM · Resend.

## Desarrollo local

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local      # en Windows: copy .env.example .env.local
npm run db:migrate              # crea las tablas en la base local (PGlite, carpeta ./data/pglite)
npm run db:seed                 # empresas y sala del evento
npm run db:demo                 # opcional: reuniones, bloqueos y usuarios de ejemplo
npm run dev                     # http://localhost:3000
npm test                        # pruebas de reglas de reserva
```

Sin `DATABASE_URL`, la app usa la base local. Con `MAIL_PROVIDER=console` (valor por defecto en
desarrollo), los correos se muestran en la consola y se guardan en `OUTBOX_DIR`.

## Configuración del evento

Todo lo que puede cambiar vive en [`config/event.ts`](config/event.ts): nombre de la app, subtítulo,
días y horarios, sala, empresas, máximo de usuarios y colores del tema. Al arrancar, la configuración
se valida y un error de formato se reporta con un mensaje claro.

## Base de datos: Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito).
2. En **Project Settings → Database → Connection string**, elige **Transaction pooler** (puerto 6543)
   y copia la cadena. Reemplaza `[YOUR-PASSWORD]` por la contraseña de la base.
3. Aplica el esquema y los datos de referencia desde tu máquina:

   ```bash
   # PowerShell
   $env:DATABASE_URL="postgresql://..."; npm run db:migrate; npm run db:seed
   # bash
   DATABASE_URL="postgresql://..." npm run db:migrate && DATABASE_URL="postgresql://..." npm run db:seed
   ```

Las migraciones están en la carpeta [`drizzle/`](drizzle). Para cambiar el esquema, edita
[`src/db/schema.ts`](src/db/schema.ts) y ejecuta `npm run db:generate`.

## Correo: Resend con remitente administrativo

1. Crea una cuenta en [resend.com](https://resend.com).
2. En **Domains**, agrega el dominio desde el que enviarás (por ejemplo `tudominio.cl`) y configura
   los registros DNS que indica Resend. Espera a que el estado sea *Verified*.
3. Crea una **API Key** con permiso de envío.
4. Define el remitente administrativo, con una dirección de ese dominio, por ejemplo
   `AgendaFinlandia <agenda@tudominio.cl>`. Esa dirección debe existir como buzón o alias para recibir respuestas.

Variables: `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, `MAIL_FROM`. Si faltan, la reserva se guarda igual
y el correo queda marcado como no enviado.

## Despliegue en Vercel

1. Sube el repositorio a GitHub (o usa `vercel` desde la terminal).
2. En Vercel, **Add New → Project** e importa el repositorio. El framework se detecta como Next.js.
3. En **Settings → Environment Variables** define, para *Production*:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | Cadena del pooler de Supabase |
   | `ADMIN_PIN` | PIN del panel (largo y difícil de adivinar) |
   | `ADMIN_NAME` / `ADMIN_EMAIL` | Datos del perfil del panel (opcionales) |
   | `MAIL_PROVIDER` | `resend` |
   | `RESEND_API_KEY` | API Key de Resend |
   | `MAIL_FROM` | `AgendaFinlandia <agenda@tudominio.cl>` |

4. Despliega. Las migraciones ya deben estar aplicadas en Supabase (paso anterior).
5. Verifica `https://tu-proyecto.vercel.app/api/agenda` (debe responder JSON) y entra a `/admin`.

## Estructura

```
config/event.ts          configuración del evento (fechas, empresas, sala, tema)
src/db/                  esquema Postgres, cliente, migraciones y seed
src/lib/bookings.ts      reglas de la agenda (reservas, bloqueos, usuarios)
src/lib/booking-rules.ts validaciones compartidas
src/mail/                proveedores de correo (Resend y consola) y plantilla
src/app/api/             API pública (/api/agenda) y de administración (/api/admin)
src/agenda/              interfaz del calendario, formularios y panel
scripts/                 seed de referencia y datos de demostración
tests/                   pruebas de reglas (Vitest, sobre PGlite en memoria)
```

## Pendiente antes del evento

- Dominio y verificación de Resend para el remitente administrativo.
- Empresas, nombres y correos reales (hoy son de ejemplo).
- PIN de producción y datos del perfil del panel.
