import nodemailer, { type Transporter, type SendMailOptions, type SentMessageInfo } from 'nodemailer';
import config from '../config/config';
import { Logger } from '../config/logger';

const logger = new Logger();

export class EmailService {
  public static transport: Transporter = nodemailer.createTransport(config.email.smtp as SendMailOptions);

  public static async initTransport(log: Logger): Promise<void> {
    try {
      if (config.env !== 'test') this.transport.verify();
      logger.info('Connected to email server');
    } catch (error) {
      logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env');
    }
  }

  public static async sendMail(to: string, subject: string, text: string): Promise<SentMessageInfo> {
    const msg: SendMailOptions = {
      from: config.email.from,
      to,
      subject,
      text
    }
    const res = await this.transport.sendMail(msg);
    console.log(res);
  }

  public static async sendVerificationEmail (to: string, token: string): Promise<SentMessageInfo> {
    const subject = 'Email Verification';
    // const verificationEmailUrl = `http://localhost:5500/auth/verify-email?tokens=${encodeURIComponent(token)}`;
    const verificationEmailUrl = `http://localhost:3000/v1/auth/verify-email?token=${token}`;
    const text = `Dear user,
    To verify your email, click on this link: ${verificationEmailUrl}
    If you did not create an account, then ignore this email.`;

    const res = await this.sendMail(to, subject, text);
    console.log(res);
  }

  public static async sendResetPassword (to: string, link: string, token: string): Promise<SentMessageInfo> {
    const subject = 'Reset password';
    // const resetPasswordUrl = `http://localhost:3000/reset-password?token=${token}`;
    // const resetPasswordUrl = `http://localhost:5500/reset-password?tokens=${encodeURIComponent(token)}`;
    // const resetPasswordUrl = `http://localhost:5500/reset-password`;
    const text = `Dear user,
    To reset your password, click on this link:  ${link.replace('$token', token)}
    If you did not request any password resets, then ignore this email.`;
  
    await this.sendMail(to, subject, text);
  }
}