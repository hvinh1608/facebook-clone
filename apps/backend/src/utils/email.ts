import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  const port = Number(process.env.SMTP_PORT) || 587;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  if (!isSmtpConfigured()) {
    console.log(`\n📧 MOCK EMAIL to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`🔗 ${text}\n`);
    return false;
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({ from, to, subject, html, text });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('SMTP send failed:', error);
    console.log(`\n📧 FALLBACK — copy link manually:\n🔗 ${text}\n`);
    return false;
  }
}

export async function sendVerificationEmail(to: string, verificationUrl: string) {
  const subject = 'Xác minh tài khoản Nexus';
  const text = `Nhấn vào link sau để xác minh tài khoản: ${verificationUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1877f2;">Xác minh tài khoản Nexus</h2>
      <p>Cảm ơn bạn đã đăng ký. Nhấn nút bên dưới để xác minh email và bắt đầu sử dụng.</p>
      <p style="margin: 24px 0;">
        <a href="${verificationUrl}" style="background:#1877f2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Xác minh tài khoản
        </a>
      </p>
      <p style="color:#65676b;font-size:13px;">Hoặc copy link: <a href="${verificationUrl}">${verificationUrl}</a></p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const subject = 'Đặt lại mật khẩu Nexus';
  const text = `Nhấn vào link sau để đặt lại mật khẩu (hết hạn sau 1 giờ): ${resetUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1877f2;">Đặt lại mật khẩu</h2>
      <p>Bạn vừa yêu cầu đặt lại mật khẩu. Link có hiệu lực trong 1 giờ.</p>
      <p style="margin: 24px 0;">
        <a href="${resetUrl}" style="background:#1877f2;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
          Đặt lại mật khẩu
        </a>
      </p>
      <p style="color:#65676b;font-size:13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    </div>
  `;

  return sendEmail({ to, subject, html, text });
}
