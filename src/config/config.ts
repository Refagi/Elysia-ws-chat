import dotenv from 'dotenv';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
// import process from 'node:process';
import { TypeCompiler, t } from 'elysia/type-system';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = t.Object({
  ENV: t.Enum({ production: 'production', development: 'development', test: 'test' }),
  PORT: t.Number(),
  DATABASE_URL: t.String(),
  JWT_SECRET: t.String(),
  JWT_ACCESS_EXPIRATION_MINUTES: t.Number(),
  JWT_REFRESH_EXPIRATION_DAYS: t.Number(),
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: t.Number(),
  JWT_VERIFY_EMAIL_EXPIRATION_SECOND: t.Number(),
  SMTP_HOST: t.Optional(t.String()),
  SMTP_PORT: t.Optional(t.Number()),
  SMTP_USERNAME: t.Optional(t.String()),
  SMTP_PASSWORD: t.Optional(t.String()),
  EMAIL_FROM: t.Optional(t.String()),
  CLOUDINARY_CLOUD_NAME: t.String(),
  CLOUDINARY_API_KEY: t.String(),
  CLOUDINARY_API_SECRET: t.String()
});

const envCompiler = TypeCompiler.Compile(envSchema);

type EnvVars = {
  ENV: 'production' | 'development' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRATION_MINUTES: number;
  JWT_REFRESH_EXPIRATION_DAYS: number;
  JWT_RESET_PASSWORD_EXPIRATION_MINUTES: number;
  JWT_VERIFY_EMAIL_EXPIRATION_SECOND: number;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_USERNAME?: string;
  SMTP_PASSWORD?: string;
  EMAIL_FROM?: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
};

class EnvValidator {
  private env: Record<string, string | number | undefined>;

  constructor() {
    this.env = { ...process.env };
    this.convertNumbers();
    this.validate();
  }

  private convertNumbers() {
    Object.keys(this.env).forEach((key) => {
      if (key.includes('PORT') || key.includes('EXPIRATION')) {
        this.env[key] = Number(this.env[key]);
      }
    });
  }

  private validate() {
    let errCount = 0;
    for (const err of envCompiler.Errors(this.env)) {
      console.error(`❌ ENV ERROR: ${Array.isArray(err.path) ? err.path.join('.') : err.path} - ${err.message}`);
      errCount++;
    }
    if (errCount) process.exit(1);
  }

  public getValidatedEnv(): EnvVars {
    return envCompiler.Encode(this.env) as EnvVars;
  }
}

class Config {
  public env: string;
  public port: number;
  public database: { url: string };
  public jwt: Record<string, number | string>;
  public email: {
    smtp: {
      host?: string;
      port?: number;
      auth: { user?: string; pass?: string };
    };
    from?: string;
  };
  public cloudinary: { name: string; apiKey: string ; secret: string };
  
  constructor(env: EnvVars) {
    this.env = env.ENV;
    this.port = env.PORT || 5500;
    this.database = { url: env.DATABASE_URL + (env.ENV === 'test' ? '-test' : '') };
    this.jwt = {
      secret: env.JWT_SECRET,
      accessExpirationMinutes: env.JWT_ACCESS_EXPIRATION_MINUTES || 60,
      refreshExpirationDays: env.JWT_REFRESH_EXPIRATION_DAYS || 30,
      resetPasswordExpirationMinutes: env.JWT_RESET_PASSWORD_EXPIRATION_MINUTES || 15,
      verifyEmailExpirationMinutes: env.JWT_VERIFY_EMAIL_EXPIRATION_SECOND || 15
    };
    this.email = {
      smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        auth: { user: env.SMTP_USERNAME, pass: env.SMTP_PASSWORD }
      },
      from: env.EMAIL_FROM
    };
    this.cloudinary = {
      name: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      secret: env.CLOUDINARY_API_SECRET
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

const validatedEnv = new EnvValidator().getValidatedEnv();
const config = new Config(validatedEnv);

export default config;
export { cloudinary }