import mongoose from 'mongoose';
import { config } from '../config/env';

let isConnected = false;

export async function connectDatabase(uri: string = config.mongodbUri): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  isConnected = true;
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  isConnected = false;
}
