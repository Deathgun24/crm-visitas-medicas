# CRM de visitas médicas — Medical Store Asociados

Formulario web responsive, preparado para usarse desde celular y publicarse en GitHub Pages. Creado a partir de la hoja `FRONT` del archivo `Targeting. CRM.xlsx`.

## Lo que incluye

- Los 8 subtítulos de `FRONT`, distribuidos en 7 apartados de ficha del médico y 1 de visitas.
- Campos de texto y desplegables conforme a los comentarios de Excel.
- Categorías `A1`–`C4` calculadas automáticamente según potencial y adopción.
- Búsqueda por nombre o CMP, ficha única reutilizable y edición de perfil.
- Una nueva fila de `visitas` por visita: fecha/hora, representante, mensaje, objeciones, compromiso y plan.
- Historial por médico y snapshot de segmentación guardado junto a cada visita.
- Inicio de sesión con Supabase Auth, políticas Row Level Security (RLS) y vista previa local con datos ficticios.
- Soporte para importar **por separado y de forma privada** los 420 médicos de `TOTAL`.

## Archivos del proyecto

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Página de acceso y formulario. |
| `styles.css` | Diseño para celulares y computadora. |
| `app.js` | Campos, flujos, búsqueda y conexión a Supabase. |
| `config.js` | URL y clave pública del proyecto. |
| `supabase.sql` | Crea tablas, índices, RLS y políticas de acceso. |
| `.nojekyll` | Compatibilidad con GitHub Pages. |

## 1. Crear la base de datos

1. Entra a [supabase.com](https://supabase.com), crea o abre un proyecto.
2. Ve a **SQL Editor**, pega el contenido completo de `supabase.sql` y ejecútalo.
3. Verifica en **Table Editor** la existencia de las tablas `medicos` y `visitas`.
4. En **Authentication**, deshabilita el registro público de usuarios; crea o invita únicamente a representantes autorizados. Para probar, crea una cuenta de acceso con correo/contraseña en Auth > Users. No uses cuentas compartidas.
5. Comprueba que **RLS está habilitado** para ambas tablas; el script lo activa. Las políticas permiten que los usuarios autenticados de tu equipo vean las fichas y visitas; no están pensadas para clientes externos.

## 2. Conectar la página

Edita `config.js`:

```js
window.CRM_CONFIG = {
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "TU_CLAVE_PUBLICA"
};
```

La URL y la **publishable key** (o la **anon key** en proyectos que aún la utilicen) están en **Project Settings > API / API Keys**, según tu consola. Son valores públicos, pero deben protegerse los datos con RLS y autenticación. **Nunca coloques la `service_role`, una secret key, contraseñas ni cadenas de conexión de PostgreSQL en estos archivos.**

Mientras `config.js` tenga los marcadores `TU_...`, verás el modo demostración, con médicos inventados. Ese modo **no almacena nada permanentemente**.

## 3. Publicar en GitHub Pages

1. Crea un repositorio de GitHub (por ejemplo, `crm-visitas-medicas`).
2. Sube el **contenido de la carpeta del proyecto**, de forma que `index.html` esté en la raíz del repositorio (no subas la carpeta ZIP sin extraer).
3. En GitHub abre **Settings > Pages > Build and deployment**.
4. En Source escoge **Deploy from a branch**. En Branch selecciona `main` y `/(root)`, y luego **Save**.
5. Abre la URL indicada por Pages, por ejemplo `https://TU-USUARIO.github.io/crm-visitas-medicas/`.
6. En Supabase > Authentication > URL Configuration, establece el enlace final de GitHub Pages como `Site URL` y añade allí la URL permitida para redirecciones si vas a invitar usuarios por correo.
7. Accede con un usuario de Supabase Auth que hayas autorizado.

> GitHub Pages hospeda archivos públicos. No subas el Excel original, la importación CSV privada, documentos con datos personales ni claves secretas. El archivo `.gitignore` ayuda en Git local pero **no impide que subas manualmente archivos mediante el navegador**.

## 4. Importar médicos existentes desde TOTAL (opcional)

Se entrega aparte el archivo `medicos_importacion_privada.csv`. Incluye 420 registros del Excel y **datos personales**: consérvalo de forma privada.

- Ejecuta primero `supabase.sql`.
- En Supabase > Table Editor > `medicos`, usa la opción **Import data from CSV** o el importador disponible en tu versión.
- Selecciona `medicos_importacion_privada.csv` (fuera de GitHub). El CSV solo contiene columnas editables: UUID, categorías y fechas técnicas se crean automáticamente.
- Los campos faltantes de la hoja original quedan sin rellenar hasta que se actualice la ficha.
- `legacy_id` conserva el código de la hoja `TOTAL`; no reemplaza al UUID automático.
- `CMP` es texto para conservar ceros iniciales y otros valores de origen. El listado original tiene varios registros sin CMP y registros que deben depurarse manualmente para evitar duplicados.
- El CSV importa **fichas**, no inventa visitas. En `TOTAL`, las columnas `¿Ya se visitó?` y `Fecha de visita` estaban vacías.

## Flujo diario desde el teléfono

1. Abre el enlace del CRM e inicia sesión.
2. Escribe nombre o CMP. Si el médico existe, selecciónalo y entrarás directamente a **Nueva visita**.
3. Si no existe, pulsa **Registrar nuevo médico**, completa la **Información general** y demás apartados que tengas disponibles; guarda la ficha.
4. Completa los campos de la visita y pulsa **Guardar registro de visita**.
5. En **Historial** encontrarás cada visita del mismo médico, ordenada por fecha. Si cambia su especialidad, segmentación o teléfono, actualiza **Ficha** sin repetirla en cada visita.

## Decisiones de diseño y siguientes mejoras

- Los campos `Potencial de prescripción 1/2`, `Adopción de marca 1/2` y `Contactos/mes` se consideran información de perfil **actualizable**. La categoría se recalcula automáticamente; se conserva el estado de segmentación en `visitas.perfil_snapshot`.
- `Zona MS` se deja como texto porque el comentario del Excel indica que las opciones están pendientes de desarrollo.
- `Representante Médico` está en la ficha; se añade `Representante que realiza la visita` al registro para conservar el nombre de quien realizó cada visita, aunque cambie el responsable asignado.
- Se mantienen los nombres y opciones del Excel; `Días atención` se deja como texto porque allí figura `Desplegar campo`, no una lista predeterminada.
- El historial muestra las 100 visitas más recientes por médico; para volúmenes grandes puede añadirse paginación.
- Esta primera versión requiere internet para Supabase, no ofrece modo offline ni sincronización diferida.
- Actualmente cualquier usuario autorizado puede ver/editar fichas de todo el equipo (eliminar visitas está bloqueado). Para uso productivo de varios equipos conviene añadir control por zona, roles y auditoría de cambios en perfiles.
- No se incluye importación de datos desde el navegador: se realiza administrativamente para evitar exponer archivos personales y accesos de alto privilegio.

## Seguridad

La web está publicada, **pero los datos no deberían ser públicos**: el usuario debe autenticarse y PostgreSQL aplica RLS. Haz una prueba de acceso sin sesión para comprobar que no se pueden consultar `medicos` ni `visitas`. Mantén cerradas las invitaciones, revisa permisos periódicamente y trata los datos de contacto de médicos como información personal. Para un despliegue corporativo deben verificarse las obligaciones de protección de datos aplicables en Perú.

## Tecnología

HTML + CSS + JavaScript puro, Supabase JS v2 CDN, PostgreSQL y Supabase Auth. No requiere `npm`, servidor Node ni pagos de hosting GitHub Pages para esta primera versión.
