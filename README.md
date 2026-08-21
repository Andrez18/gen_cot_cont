# gen_cot_cont

## Nómina de trabajadores (nuevo)

Nueva página `/payroll` para liquidar el pago de los trabajadores con la
normativa colombiana vigente (valores verificados para 2026).

### 1. Ejecutar la migración
En el SQL Editor de Supabase ejecuta `supabase/migrations/20260821_payroll.sql`.
Esta migración crea dos tablas con RLS (cada usuario solo ve lo suyo):
- `payroll_employees`: trabajadores con su forma de pago (por mes,
  quincenal, por día, por hora o por obra/tarea), tarifas y si les aplica
  auxilio de transporte.
- `payroll_runs`: cada liquidación guardada, con el detalle por trabajador
  congelado en la columna jsonb `lines`.

### 2. Cómo funciona
- Formas de pago soportadas: **mensual** y **quincenal** (se ingresa el
  sueldo mensual y se prorratea por días), **semanal** (pago por semana,
  prorrateado sobre una semana laboral de 6 días), **por día** (jornal),
  **por hora** y **por obra/tarea** (monto fijo del periodo).
- Por trabajador se registran días trabajados, **días festivos/dominicales
  trabajados** con **pago por día editable** (por defecto $150.000,
  constante `PAGO_FESTIVO_DEFAULT`), horas ordinarias (si es por hora),
  horas extra y recargo nocturno, bonificaciones y otras deducciones.
- **Descuentos opcionales**: cada trabajador tiene los checkboxes "Descontar
  salud (4 %)" y "Descontar pensión (4 %)" (columnas `deduct_health` /
  `deduct_pension` en `payroll_employees`). Al desmarcarlos —p. ej. cuando el
  trabajador ya tiene EPS/AFP cubierta por otra parte— la liquidación muestra
  "ya cubierta" con valor $0; sin pensión tampoco se cobra el FSP.
- El motor (`lib/payroll.ts`) calcula con los valores legales 2026:
  - SMLMV $1.750.905 y auxilio de transporte $249.095 proporcional a días
    (solo hasta 2 SMLMV).
  - Valor hora con divisor **210** (jornada de 42 h desde jul-2026).
  - Horas extra Ley 2466 de 2025: extra diurna ×1,25, extra nocturna ×1,75
    y recargo nocturno +35 % (7 p.m.–6 a.m.). Los festivos NO usan recargo
    por hora: se liquidan como días completos con la tarifa acordada.
  - Deducciones: salud 4 % y pensión 4 % sobre el IBC (sin auxilio), FSP
    según escala desde 4 SMLMV (o 4 % sobre el excedente desde 20 SMLMV)
    y techo de IBC en 25 SMLMV.
  - Estimado de prestaciones proporcionales: cesantías, intereses, prima
    y vacaciones (informativo, no se descuenta del neto).
- El PDF se genera client-side (vista oculta capturada con html2canvas) y
  muestra una sola tabla resumen: **Trabajador | Forma de pago | Días
  trabajados (+ festivos) | Valor por día | Neto a pagar**. Los bloques
  completos saltan a la página siguiente sin quedar cortados
  (`generatePdfNoBreak`).
- Cada nómina tiene un **nombre editable** ("Nómina {periodo}" por defecto,
  p. ej. "Nómina 1 – 15 de agosto de 2026"): es el título del PDF y del
  historial (columna `name` en `payroll_runs`; las viejas sin nombre muestran
  su código NOM-...).
- La primera vez que un usuario entra a la función se abre automáticamente
  un **tutorial en 5 pasos** (`components/payroll-tutorial-modal.tsx`);
  queda marcado como visto en localStorage (`cotifactura_payroll_tutorial_v1`)
  y puede volver a verse con el botón "Ver tutorial".

### 3. Notificar a todos los usuarios
Para anunciar la función (o cualquier otra) corre una sola vez:

```
node scripts/broadcast-payroll.mjs
```

El script usa la `service_role` key del `.env`, crea una notificación
in-app para cada usuario y además envía Web Push a quien tenga la app
instalada (si hay llaves VAPID). Los endpoints push inválidos se limpian
solo.

> Los cálculos son orientativos y no constituyen asesoría contable o laboral.

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
