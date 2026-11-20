import mongoose from 'mongoose';
import { config } from './index';

let mongoMemoryServer: any = null;

export const connectDatabase = async (): Promise<void> => {
  try {
    // Set mongoose connection options
    mongoose.set('strictQuery', true);
    
    // Attempt connecting to the configured URI
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] Connected successfully to MongoDB at ${config.mongoUri}`);
  } catch (error) {
    if (config.env === 'production') {
      console.error('[Database] Failed to connect to MongoDB in production:', error);
      throw error;
    }

    console.warn(`[Database] Could not connect to local/configured MongoDB (${(error as Error).message}). Initializing resilient in-memory MongoDB fallback for development/testing...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        binary: {
          version: '7.0.24',
        },
      });
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Resilient In-Memory MongoDB connected at ${memoryUri}`);
    } catch (memError) {
      console.error('[Database] Critical: Failed to start in-memory MongoDB fallback:', memError);
      throw memError;
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (error) {
    console.error('[Database] Error while disconnecting:', error);
  }
};
