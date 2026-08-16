import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  get mongodbUri(): string {
    return required('MONGODB_URI');
  },
  get port(): number {
    return Number(process.env.PORT ?? 3000);
  },
  get jwtSecret(): string {
    return process.env.JWT_SECRET ?? '';
  },
  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN ?? '8h';
  },
};
