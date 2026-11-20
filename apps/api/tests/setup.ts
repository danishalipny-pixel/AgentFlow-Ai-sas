import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ToolService } from '../src/services/tool.service';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.24',
      },
      instance: {
        dbName: 'agentflow_test',
      },
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    await ToolService.seedBuiltinTools();
  } catch (err) {
    console.error('Failed to start in-memory Mongo test server:', err);
    throw err;
  }
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      if (key !== 'tooldefinitions') {
        await collections[key].deleteMany({});
      }
    }
  }
});
