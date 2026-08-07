import nodemailer from 'nodemailer';
import pug from 'pug';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Views are at backend/views/email/ - three levels up from src/shared/utils/
const VIEWS_DIR = path.join(__dirname, '../../../views/email');

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Ticketflow <${process.env.GMAIL_EMAIL}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'gmail',
        host: process.env.GMAIL_HOST,
        port: Number(process.env.GMAIL_PORT) || 587,
        auth: {
          user: process.env.GMAIL_EMAIL,
          pass: process.env.GMAIL_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    const html = pug.renderFile(path.join(VIEWS_DIR, `${template}.pug`), {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
    };

    await this.newTransport().sendMail(mailOptions);
  }

  sendWelcome() {
    return this.send('welcome', 'Welcome to the Ticketflow Family!');
  }

  sendPasswordReset() {
    return this.send(
      'passwordReset',
      'YOUR PASSWORD RESET TOKEN (Valid for 10 minutes)',
    );
  }
}

export default Email;
