# Configuración de Mercado Pago

Esta guía explica cómo configurar la integración de Mercado Pago para recibir pagos de suscripciones.

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_de_mercadopago
MERCADOPAGO_WEBHOOK_SECRET=tu_clave_secreta_del_webhook

# URLs (para webhooks y redirecciones)
APP_URL=https://tu-dominio.com
BACKEND_URL=https://api.tu-dominio.com
FRONTEND_URL=https://app.tu-dominio.com
```

## Obtener Access Token de Mercado Pago

1. Inicia sesión en tu cuenta de [Mercado Pago](https://www.mercadopago.com.ar/)
2. Ve a [Tus integraciones](https://www.mercadopago.com.ar/developers/panel/app)
3. Crea una nueva aplicación o selecciona una existente
4. En la sección "Credenciales de producción" o "Credenciales de prueba", copia el **Access Token**
5. Pega el token en la variable `MERCADOPAGO_ACCESS_TOKEN`

### Modo Prueba vs Producción

- **Modo Prueba**: Usa las credenciales de prueba para desarrollar y probar sin realizar pagos reales
  - Los tokens de prueba comienzan con `TEST-`
  - Asegúrate de que tu aplicación tenga permisos habilitados incluso en modo prueba
- **Modo Producción**: Usa las credenciales de producción cuando estés listo para recibir pagos reales
  - Los tokens de producción comienzan con `APP_USR-`

### Error 403 PA_UNAUTHORIZED_RESULT_FROM_POLICIES

Este error puede tener varias causas:

1. **Perfil de cuenta incompleto**: Tu cuenta de Mercado Pago puede tener información incompleta o falta de verificación de identidad
   - Ve a tu cuenta de Mercado Pago y completa tu perfil
   - Verifica que todos los datos requeridos estén completos
   - Si hay documentos pendientes de verificación, complétalos

2. **Token inválido o expirado**: El Access Token puede estar mal configurado o haber expirado
   - Verifica que el token sea válido y no haya expirado
   - Regenera el Access Token desde el panel de desarrolladores
   - Asegúrate de usar el token correcto para tu entorno (TEST- para pruebas, APP_USR- para producción)

3. **Problemas con usuarios de prueba**: En modo sandbox, asegúrate de usar usuarios de prueba válidos
   - Los usuarios de prueba deben crearse específicamente para testing
   - No uses cuentas reales en el entorno de pruebas

4. **Campos inválidos en la preferencia**: Algunos campos pueden causar problemas
   - El código ahora usa una estructura mínima para evitar este problema
   - Si el error persiste, verifica los logs para ver qué campos se están enviando

## Configurar Webhook

Mercado Pago enviará notificaciones de pago a tu servidor mediante webhooks. 

1. Ve a tu aplicación en el panel de Mercado Pago
2. Configura la URL del webhook: `https://tu-dominio.com/api/subscription/mercadopago/webhook`
3. Selecciona los eventos que quieres recibir:
   - `payment` (obligatorio)
   - `plan` (opcional, para planes y suscripciones)
   - `subscription` (opcional, para suscripciones)
   - `claim` (opcional, para reclamos)
4. **IMPORTANTE**: Copia la **Clave Secreta** que te proporciona Mercado Pago
5. Guarda la clave secreta en la variable de entorno `MERCADOPAGO_WEBHOOK_SECRET`

### ¿Por qué necesito la Clave Secreta?

La clave secreta se usa para validar que los webhooks realmente provienen de Mercado Pago y no de un atacante. El sistema valida automáticamente la firma de cada webhook usando esta clave.

**⚠️ IMPORTANTE**: Nunca compartas esta clave secreta ni la subas a repositorios públicos.

## Flujo de Pago

1. **Usuario hace clic en "Pagar con Mercado Pago"** en la página de Configuración
2. **Backend crea una preferencia de pago** (`POST /api/subscription/mercadopago/create-preference`)
3. **Usuario es redirigido** al checkout de Mercado Pago
4. **Usuario completa el pago** en Mercado Pago
5. **Mercado Pago envía webhook** a tu servidor con el estado del pago
6. **Backend procesa el webhook** y actualiza el estado de la suscripción
7. **Usuario es redirigido** de vuelta a la aplicación con el resultado del pago

## Estados de Pago

- **approved**: Pago aprobado - La suscripción se activa automáticamente
- **pending**: Pago pendiente - Se crea un registro pero la suscripción no se activa hasta que se apruebe
- **rejected**: Pago rechazado - No se activa la suscripción
- **cancelled**: Pago cancelado - No se activa la suscripción

## Endpoints Disponibles

### Crear Preferencia de Pago
```
POST /api/subscription/mercadopago/create-preference
Authorization: Bearer <token>
Body: { "planId": "uuid-del-plan" }
```

### Webhook (llamado por Mercado Pago)
```
POST /api/subscription/mercadopago/webhook
Body: { "type": "payment", "data": { "id": "payment-id" } }
```

### Verificar Estado de Pago
```
GET /api/subscription/mercadopago/verify/:paymentId
Authorization: Bearer <token>
```

## Pruebas

### Tarjetas de Prueba

Para probar en modo sandbox, usa las tarjetas de prueba de Mercado Pago:

**Tarjeta aprobada:**
- Número: 5031 7557 3453 0604
- CVV: 123
- Fecha: 11/25
- Nombre: APRO

**Tarjeta rechazada:**
- Número: 5031 4332 1540 6351
- CVV: 123
- Fecha: 11/25
- Nombre: OTHE

### Probar Webhooks

**⚠️ IMPORTANTE**: Los webhooks reales de Mercado Pago envían datos en el **body** de la petición, no en los query params.

Para probar webhooks localmente, puedes usar herramientas como:
- **ngrok** para exponer tu servidor local: `ngrok http 3000`
- **Mercado Pago Webhook Simulator** en el panel de desarrolladores
- **Postman** o **REST Client** enviando el body correcto:

```json
{
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

**Nota**: El ID de pago debe ser un número real de Mercado Pago (al menos 6 dígitos). No uses IDs de prueba como `123456` ya que no existen en el sistema de Mercado Pago.

## Migración de Base de Datos

Ejecuta la migración para agregar los campos de Mercado Pago:

```bash
cd back
npx prisma migrate dev
```

## Troubleshooting

### El webhook no se recibe
- Verifica que la URL del webhook sea accesible públicamente
- Verifica que el servidor esté escuchando en el puerto correcto
- Revisa los logs del servidor para ver si hay errores

### El webhook es rechazado por firma inválida
- Verifica que `MERCADOPAGO_WEBHOOK_SECRET` esté configurada correctamente
- Asegúrate de haber copiado la clave secreta completa sin espacios adicionales
- Verifica que la clave secreta corresponda al entorno correcto (prueba vs producción)
- Revisa los logs para ver el detalle del error de validación

### El pago se aprueba pero no se activa la suscripción
- Verifica que el webhook esté procesando correctamente
- Revisa los logs del servicio de Mercado Pago
- Verifica que el `businessId` esté correctamente en los metadatos del pago

### Error al crear preferencia
- Verifica que el `MERCADOPAGO_ACCESS_TOKEN` sea válido
- Verifica que el plan exista y esté activo
- Revisa los logs del servidor para más detalles
