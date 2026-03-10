import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM ?? "Maestro FIM <noreply@maestrofim.com>";
const APP_NAME = "Maestro FIM";

export async function sendConfirmationEmail(
  email: string,
  name: string,
  confirmationUrl: string
) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Confirma tu cuenta en ${APP_NAME}`,
    html: confirmationEmailHtml(name, confirmationUrl),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Restablece tu contraseña de ${APP_NAME}`,
    html: passwordResetEmailHtml(name, resetUrl),
  });
}

function confirmationEmailHtml(name: string, confirmationUrl: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirma tu cuenta</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#000000;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</h1>
              <p style="margin:4px 0 0;color:#a1a1aa;font-size:13px;">Análisis de Flexibilidad Inmunometabólica</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#09090b;">
                Hola${name ? ", " + name.split(" ")[0] : ""} 👋
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
                Gracias por registrarte en ${APP_NAME}. Para activar tu cuenta y empezar a analizar tus resultados de laboratorio, confirma tu dirección de email.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#000000;border-radius:8px;padding:14px 28px;">
                    <a href="${confirmationUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
                      Confirmar mi cuenta →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">
                O copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 32px;font-size:12px;color:#71717a;word-break:break-all;">
                <a href="${confirmationUrl}" style="color:#71717a;">${confirmationUrl}</a>
              </p>
              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                Este enlace caduca en 24 horas. Si no creaste esta cuenta, puedes ignorar este email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f4f4f5;padding:20px 40px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                © ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function passwordResetEmailHtml(name: string, resetUrl: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Restablecer contraseña</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Inter,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#000000;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#09090b;">
                Restablecer contraseña
              </h2>
              <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
                Hola${name ? " " + name.split(" ")[0] : ""}, recibimos una solicitud para restablecer la contraseña de tu cuenta.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#000000;border-radius:8px;padding:14px 28px;">
                    <a href="${resetUrl}" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
                      Restablecer contraseña →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#a1a1aa;">
                Este enlace caduca en 1 hora. Si no solicitaste esto, ignora este email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f4f4f5;padding:20px 40px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                © ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
