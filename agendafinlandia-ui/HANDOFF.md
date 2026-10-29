# AgendaFinlandia — Handoff del rediseño de UI

Objetivo: actualizar **solo la capa visual** de la app al rediseño aprobado. No cambiar la lógica de negocio, los endpoints, la autenticación ni el modelo de datos. Si alguna parte del diseño necesita datos que hoy no existen (por ejemplo, la "próxima reunión"), se calculan en el front con los datos que ya llegan, o se deja anotado como TODO.

Archivos de este paquete:
- `tokens.css`: colores claro/oscuro, fuentes, radios, colores por empresa y patrones rayados. Es la fuente de verdad.
- `reference/*.dc.html`: las pantallas del diseño (HTML + lógica de ejemplo). Se usan solo como **referencia visual y de comportamiento**; no se copian a la app tal cual.
  - `Main.dc.html`: agenda del usuario, escritorio
  - `Mobile.dc.html`: agenda del usuario, iPhone 16
  - `Admin.dc.html`: panel de organización (Calendario, Reuniones, Usuarios), escritorio
  - `AdminMobile.dc.html`: panel de organización, iPhone 16
  - `DesktopDark` / `MobileDark` / `AdminDark`: las mismas pantallas en modo oscuro

---

## 1. Fundamentos

- **Fuentes:** Manrope (UI y texto) y Outfit (títulos, fechas y números grandes). Pesos livianos: H1 en Outfit 400 a 34px (28px en móvil), números de KPI en Outfit 300 a 40px, texto de UI en Manrope 400/500 y como máximo 600 para énfasis.
- **Tema:** claro/oscuro con la clase `.dark`. Todo color sale de las variables de `tokens.css`; no se usan hex sueltos en componentes.
- **Radios:** 8px en celdas y tarjetas de reunión, 10px en botones e inputs, 16px en tarjetas y paneles.
- **Íconos:** de trazo, a 1.6px de grosor (estilo Lucide). Sin emojis.
- **Bloques:** 30 minutos, de 10:00 a 18:30 (18 por día). Evento: miércoles 18, jueves 19 y viernes 20 de noviembre de 2026.

## 2. Layout

- **Sidebar:** 264px, colapsable a 76px (solo íconos) con el botón hamburguesa del topbar. Fondo `--surface` con borde derecho. El logo "AF" es un cuadrado de 40px en `--logo`. Ítem activo: fondo `--brand-soft` y texto `--brand-text`.
  - Usuario: un solo ítem ("Agenda"), y abajo una tarjeta con datos del evento.
  - Admin: Calendario, Reuniones (con contador), Usuarios y Agenda pública (con ícono de enlace externo). Abajo, una tarjeta con el % de la sala reservada.
- **Topbar:** 68px de alto. Contiene hamburguesa, breadcrumb ("Expocorma 2026 › Agenda" o "Panel de organización › {vista}"), botón de tema, avatar con nombre y correo, y botón "Cerrar sesión".
- **Contenido:** padding de 32px arriba y 40px a los lados. Cada página arranca con H1, subtítulo en `--muted` y las acciones a la derecha.

## 3. Responsive

| Ancho | Comportamiento |
|---|---|
| ≥ 1440px (monitores de 20″ a 32″) | Calendario y panel derecho de 320–360px lado a lado. Las columnas de día crecen con el ancho. |
| 1024–1439px | El panel derecho pasa debajo del calendario. Sidebar expandido. |
| 768–1023px | Sidebar colapsado a íconos. La grilla hace scroll horizontal dentro de su tarjeta (mínimo 640px en vista de 3 días y 1040px en vista semana). |
| < 768px (iPhone 16 = 393px) | Layout móvil: el sidebar pasa a menú lateral (300px, con overlay), los días se eligen con 3 pestañas, la grilla se reemplaza por una lista vertical de bloques (filas de 60px) y los modales pasan a ser paneles que suben desde abajo. Los inputs van a 16px para que iOS no haga zoom. |

## 4. Componentes

**Celda de bloque (grilla de escritorio, alto de 52px y padding interno de 4px 6px).** Hay 5 estados:

1. **Libre:** botón sin fondo. Con hover o foco muestra "+ Agendar HH:MM" (en admin: "+ Agendar o bloquear") sobre `--brand-soft`. Nunca escribir "Libre" en cada celda.
2. **Mi empresa (usuario):** tarjeta `--own-bg` con borde `--own-bd`. Título en 12px/600 y rango horario en 11px, ambos en `--brand-text`.
3. **Reservado (usuario):** tarjeta `--taken-bg` con el texto "Reservado" y la hora. No se muestran datos de otras empresas.
4. **No disponible / bloqueado:** patrón `.hatch` con el texto en `--muted`.
5. **Día fuera del evento (vista semana):** la columna entera con `.col-off`, al 55% del ancho de un día activo y sin interacción.

En admin, la reunión es un botón `.co-X` con "Empresa X" (12px/600) y "con Empresa Y · HH:MM". Al hacer clic abre la gestión.

**Encabezado de día:** número en un círculo de 40px (Outfit 400, 20px). El día actual o seleccionado lleva el círculo en `--brand`. Debajo va el nombre del día y la cantidad de bloques libres.

**Línea de "ahora":** 2px en `--now` con un punto de 10px. Solo aparece en el día actual y durante el evento.

**Selector "3 días | Semana":** control segmentado (contenedor `--surface-2`, opción activa en `--surface` con sombra). En vista semana, las flechas de navegación quedan deshabilitadas.

**Leyenda:** Disponible (borde punteado `--brand`), Tu empresa, Reservado, No disponible.

**Botones:** alto de 40px (48px en móvil).
- Primario: `--brand` con texto blanco.
- Secundario: `--surface` con borde.
- Peligro: texto `--danger`, borde `--danger-bd` y hover en `--danger-soft`. Se usa para "Quitar" y "Cancelar reunión".

**Badge de empresa:** píldora de 24px con punto de color y clase `.co-X`.

**Tarjeta KPI (admin):** label en `--muted` 14px, ícono en un cuadrado de 36px `--brand-soft`, número en Outfit 300 a 40px y un subtexto. "Ocupación" lleva una barra de progreso. "Empresas con reunión" muestra 6 círculos A–F que se encienden según corresponda.

**Pestañas de día (admin):** botones de dos líneas ("Mié 18 nov" / "6 reuniones · 10 libres"). La pestaña activa va en `--brand`. Controlan los KPIs, el resaltado del día en la grilla y la lista "Reuniones del día".

**Modal / panel inferior:** ancho máximo de 480px y radio de 16px; en móvil sube desde abajo con radio de 20px arriba.
- Usuario: muestra día y hora confirmados en `--brand-soft`, más los campos "Empresa con la que te reúnes" y "Asunto (opcional)".
- Admin, bloque libre: selector "Agendar reunión | Bloquear horario".
- Admin, reunión: "Cancelar reunión".
- Admin, bloqueado: "Desbloquear".

**Usuarios (admin):** formulario a la izquierda con barra "N de 30", tipo de acceso como control segmentado y empresa como select. A la derecha, una tabla con búsqueda, filtro por empresa, avatar con el color de la empresa, @usuario, badge de rol, badge de empresa y "Quitar" en estilo de peligro.

**Panel derecho (usuario):** tarjetas de Próxima reunión, Mis reuniones (con contador) y Ocupación de la sala por día (barras).

## 5. Accesibilidad

- Elementos clicables siempre como `<button>` o `<a>`, nunca un `div` con onClick.
- `aria-label` en los botones de solo ícono y en cada celda (por ejemplo, "Agendar Miércoles 18 a las 11:30").
- Contraste mínimo de 4.5:1 en texto (los tokens ya lo cumplen).
- Áreas táctiles de al menos 44px en móvil.
- `focus-visible` con un outline de 2px en `--brand`.

## 6. Orden de implementación sugerido

1. Incorporar `tokens.css` y las fuentes; migrar los colores existentes a variables.
2. Layout base: sidebar colapsable, topbar y contenedor de página.
3. Grilla de agenda del usuario: estados de celda, encabezados, leyenda, selector 3 días/semana y línea de "ahora".
4. Panel derecho del usuario y modal de reserva.
5. Layout móvil del usuario.
6. Admin: Calendario (pestañas, KPIs, grilla con colores por empresa y gestión), Reuniones y Usuarios.
7. Admin móvil.
8. Revisión visual en 393px, 1280px, 1920px y 2560px, en modo claro y oscuro.
