# 📧 Configuración del Sistema de Emails

## 🚀 Introducción

El sistema de emails está configurado para funcionar con diferentes proveedores según el entorno:

- **Desarrollo**: Ethereal Email (emails de prueba con preview)
- **Producción**: Resend (emails reales) o Nodemailer (SMTP personalizado)

## 🔧 Configuración

### Variables de Entorno

Agrega estas variables a tu archivo `.env`:

```env
# Email Configuration
EMAIL_PROVIDER=ethereal  # Opciones: resend, nodemailer, ethereal
EMAIL_FROM=noreply@bunkerapp.com
APP_URL=http://localhost:5173

# Resend (Para producción)
RESEND_API_KEY=re_123456789

# Nodemailer SMTP (Configuración personalizada)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu@email.com
SMTP_PASS=tu_password
```

### Configuración por Entorno

#### Desarrollo (Ethereal)

```env
EMAIL_PROVIDER=ethereal
```

No requiere configuración adicional. Los emails se envían a Ethereal y recibes un link de preview en la consola.

#### Producción con Resend (Recomendado)

```env
NODE_ENV=production
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_tu_api_key
EMAIL_FROM=noreply@tudominio.com
```

**Obtener API Key de Resend:**
1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta
3. Genera un API key en [resend.com/api-keys](https://resend.com/api-keys)
4. Verifica tu dominio

#### Producción con Nodemailer (SMTP)

```env
NODE_ENV=production
EMAIL_PROVIDER=nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu@email.com
SMTP_PASS=tu_app_password
EMAIL_FROM=tu@email.com
```

## 📨 Uso del Sistema de Emails

### 1. Usando Funciones de Utilidad (Recomendado)

```typescript
import { 
  sendWelcomeEmail, 
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendNotificationEmail 
} from '@/utils/email.util';

// Email de bienvenida
await sendWelcomeEmail({
  email: 'usuario@example.com',
  nombre: 'Juan Pérez',
});

// Email de reset de contraseña
await sendPasswordResetEmail({
  email: 'usuario@example.com',
  nombre: 'Juan Pérez',
  resetToken: 'abc123xyz',
});

// Email de verificación
await sendVerificationEmail({
  email: 'usuario@example.com',
  nombre: 'Juan Pérez',
  verificationToken: 'verify123',
});

// Email de notificación personalizada
await sendNotificationEmail(
  'usuario@example.com',
  'Juan Pérez',
  'Nuevo mensaje',
  'Tienes un nuevo mensaje en tu bandeja.'
);
```

### 2. Usando el Servicio Directamente

```typescript
import { emailService } from '@/services/email.service';

// Con plantilla
const result = await emailService.sendEmailWithTemplate({
  to: 'usuario@example.com',
  subject: 'Bienvenido',
  templateName: 'welcome',
  data: {
    email: 'usuario@example.com',
    nombre: 'Juan Pérez',
    appUrl: 'https://app.bunkerapp.com',
  },
});

// Email HTML directo
await emailService.sendEmail({
  to: 'usuario@example.com',
  subject: 'Hola',
  html: '<h1>Hola Juan!</h1><p>Este es un email de prueba.</p>',
});
```

### 3. Ejemplo en un Controlador

```typescript
import { Request, Response } from 'express';
import { sendWelcomeEmail } from '@/utils/email.util';

export async function registerUser(req: Request, res: Response) {
  const { email, nombre, password } = req.body;
  
  // Crear usuario...
  const user = await userService.createUser({ email, nombre, password });
  
  // Enviar email de bienvenida
  const emailResult = await sendWelcomeEmail({
    email: user.email,
    nombre: user.nombre,
  });
  
  if (!emailResult.success) {
    console.error('Error al enviar email:', emailResult.error);
  }
  
  // En desarrollo con Ethereal, el preview URL estará disponible
  if (emailResult.previewUrl) {
    console.log('📧 Preview del email:', emailResult.previewUrl);
  }
  
  res.json({ user });
}
```

## 🎨 Plantillas Disponibles

### 1. `welcome` - Email de Bienvenida

**Variables:**
- `nombre`: Nombre del usuario
- `email`: Email del usuario
- `appUrl`: URL de la aplicación

### 2. `password-reset` - Recuperación de Contraseña

**Variables:**
- `nombre`: Nombre del usuario
- `email`: Email del usuario
- `resetLink`: Link de reset de contraseña

### 3. `verification` - Verificación de Cuenta

**Variables:**
- `nombre`: Nombre del usuario
- `email`: Email del usuario
- `verificationLink`: Link de verificación

### 4. `notification` - Notificación General

**Variables:**
- `nombre`: Nombre del usuario
- `email`: Email del usuario
- `title`: Título de la notificación
- `message`: Mensaje de la notificación

## 🛠️ Crear Plantillas Personalizadas

### 1. Crear el archivo HTML

Crea un archivo en `src/templates/emails/mi-plantilla.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{titulo}}</title>
    <style>
        /* Estilos inline para mejor compatibilidad */
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hola {{nombre}}!</h1>
        <p>Tu DNI es: {{dni}}</p>
        <p>Email: {{email}}</p>
        <!-- Cualquier otra variable que necesites -->
    </div>
</body>
</html>
```

### 2. Usar la plantilla

```typescript
import { emailService } from '@/services/email.service';

await emailService.sendEmailWithTemplate({
  to: 'usuario@example.com',
  subject: 'Mi Email Personalizado',
  templateName: 'mi-plantilla',
  data: {
    email: 'usuario@example.com',
    nombre: 'Juan Pérez',
    dni: '12345678',
    // Cualquier otro dato
    ciudad: 'Buenos Aires',
    telefono: '+54 11 1234-5678',
  },
});
```

## 📝 Sistema de Variables

Las variables se reemplazan usando la sintaxis `{{variable}}`:

```html
<p>Hola {{nombre}}, tu email es {{email}}</p>
```

**Importante:**
- El campo `email` es siempre requerido en `data`
- Puedes pasar cualquier dato adicional como `nombre`, `dni`, etc.
- Las variables no reemplazadas se eliminan automáticamente

## 🧪 Testing

### Preview de Plantillas

```typescript
import { emailService } from '@/services/email.service';

// Obtener HTML de la plantilla con datos de prueba
const html = emailService.previewTemplate('welcome', {
  email: 'test@example.com',
  nombre: 'Test User',
  appUrl: 'http://localhost:5173',
});

console.log(html); // HTML renderizado
```

### Testing en Desarrollo

Con Ethereal, cada email enviado genera un link de preview:

```
📧 Email enviado (Ethereal)
📬 Preview URL: https://ethereal.email/message/...
```

Abre el link para ver cómo se ve el email.

## ⚠️ Consideraciones de Producción

### Resend

- **Límite gratuito**: 100 emails/día
- **Verificación de dominio**: Requerida para enviar desde tu dominio
- **Pricing**: Ver [resend.com/pricing](https://resend.com/pricing)

### Nodemailer con Gmail

Si usas Gmail con Nodemailer:

1. Habilita verificación en 2 pasos
2. Genera una "Contraseña de aplicación"
3. Usa esa contraseña en `SMTP_PASS`

### Mejores Prácticas

1. **Siempre manejar errores** al enviar emails
2. **No bloquear la respuesta** del API esperando el email
3. **Considerar usar una cola** (BullMQ) para emails en producción
4. **Logs**: Registrar éxitos y fallos de emails
5. **Monitoreo**: Alertas si muchos emails fallan

## 🔍 Debugging

### Verificar configuración

```typescript
import { emailProvider } from '@/config/email';

// El provider se inicializa automáticamente según EMAIL_PROVIDER
console.log('Email provider:', process.env.EMAIL_PROVIDER);
```

### Logs de Ethereal

En desarrollo, verás logs como:

```
✅ Ethereal email transporter configurado
📧 Usuario de prueba: xyz123@ethereal.email
📧 Email enviado (Ethereal)
📬 Preview URL: https://ethereal.email/message/...
```

### Errores Comunes

1. **"Plantilla no encontrada"**: Verifica que el archivo exista en `src/templates/emails/`
2. **"RESEND_API_KEY required"**: Configura la API key en `.env`
3. **"SMTP connection failed"**: Verifica credenciales SMTP

## 📚 Ejemplos Completos

Ver archivos de ejemplo:
- `src/utils/email.util.ts` - Funciones de utilidad
- `src/services/email.service.ts` - Servicio principal
- `src/config/email.ts` - Configuración de providers

