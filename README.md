# gen_cot_cont

## Firma personal por usuario (nuevo)

Antes todos los documentos usaban la misma imagen estática
`public/firma.png`. Ahora cada persona sube su propia firma en
**Configuración**, y es obligatoria: no se puede guardar la configuración
ni generar el PDF de una cotización/cuenta de cobro sin haberla agregado.

### 1. Ejecutar la migración
En el SQL Editor de Supabase, ejecuta `supabase/migrations/user_signature.sql`.
Esta migración:
- Crea (si no existe) la tabla `user_settings` con RLS para que cada quien
  solo vea y edite su propia configuración.
- Le agrega la columna `signature_path`.
- Crea el bucket privado `signatures`, con policies para que cada usuario
  solo pueda subir/leer/borrar dentro de su propia carpeta
  (`signatures/<user_id>/archivo.png`).

### 2. Cómo funciona
- En Configuración hay una tarjeta "Mi firma" (marcada como obligatoria)
  donde cada usuario sube una imagen (PNG con fondo transparente
  recomendado). El archivo se sube al guardar, y se borra el archivo
  anterior para no acumular basura en el bucket.
- Lo que se guarda en base de datos es el **path** del archivo, no una URL
  (las URLs firmadas expiran). Cada vez que se muestra la firma —tanto en
  un documento recién creado como en el historial— se genera una URL
  firmada nueva al vuelo, válida por una hora.
- Si el usuario no ha subido su firma, ve un aviso en los formularios de
  cotización y cuenta de cobro, y el botón "Descargar PDF" se bloquea con
  un mensaje pidiéndole que la agregue en Configuración.
- La firma queda "congelada" dentro de cada documento guardado (se
  referencia el mismo `signature_path` que estaba vigente al crearlo), así
  que si luego cambia su firma, los documentos antiguos en el historial no
  se alteran retroactivamente.

## Seguridad de pagos + códigos de descuento (nuevo)

### 1. Ejecutar la migración
En el SQL Editor de Supabase, ejecuta (en este orden si es un proyecto nuevo):
1. `supabase/migrations/subscriptions.sql` (si aún no la habías corrido)
2. `supabase/migrations/payments_security_and_discounts.sql`

Esta segunda migración:
- Crea la tabla `discount_codes`.
- Agrega a `payment_requests` las columnas `proof_path`, `discount_code`,
  `discount_amount`, `final_amount`.
- Agrega dos índices únicos: uno impide reutilizar el mismo número de
  referencia en más de una solicitud activa, y otro impide que un usuario
  tenga dos solicitudes pendientes a la vez.
- Elimina la policy que permitía insertar `payment_requests` directo desde
  el cliente (ahora todo pasa por `/api/payments/submit`, que valida
  formato, límites de intentos, el comprobante y el código de descuento
  antes de insertar con la `service_role` key).
- Crea las funciones `redeem_discount_code` / `release_discount_code`, que
  canjean/liberan un código de forma atómica (evita que dos personas
  "ganen" el mismo cupo al mismo tiempo).
- Crea el bucket privado `payment-proofs` (foto del comprobante de pago)
  con policies para que cada usuario solo suba/lea su propia carpeta.

### 2. Qué cambia para el usuario
- Ahora, además del número de referencia, debe adjuntar una **foto del
  comprobante** de la transferencia.
- Puede ingresar un **código de descuento** antes de pagar; si es válido,
  ve el precio final actualizado.
- Solo puede tener una solicitud pendiente a la vez, y hay un límite de
  5 intentos por día para evitar spam.

### 3. Qué cambia para el admin (tu correo en `ADMIN_EMAIL`)
- En `/admin/payments`, cada solicitud pendiente ahora muestra un enlace
  "Ver comprobante" (URL firmada, válida 60 segundos) y, si se usó un
  código de descuento, el monto final y el nombre del código.
- Si rechazas un pago que usó un código de descuento, el cupo del código
  se libera automáticamente.
- Nueva sección `/admin/discount-codes` para crear, ver y activar/desactivar
  códigos (porcentaje o monto fijo, con tope de usos y fecha de vencimiento
  opcionales). Ambas páginas admin quedan enlazadas entre sí y aparecen en
  el menú del header solo para el correo admin.

### 4. Variables de entorno
No se agregó ninguna variable nueva obligatoria: se reutiliza
`NEXT_PUBLIC_SUBSCRIPTION_PRICE_COP` como precio base (el monto final
siempre se calcula en el servidor, nunca se confía en lo que mande el
cliente).
