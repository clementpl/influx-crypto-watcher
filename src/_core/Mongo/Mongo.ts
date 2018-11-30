import * as mongoose from 'mongoose';
import { logger } from '../../logger';

export interface MongoConfig {
  host: string;
  port: number;
  database: string;
}

export class Mongo {
  public static async connect(conf: MongoConfig) {
    const URL = `mongodb://${conf.host}:${conf.port}/${conf.database}`;
    try {
      await mongoose.connect(
        URL,
        { useNewUrlParser: true }
      );
      logger.info(`[MONGODB] Connection successful: ${URL}`);
    } catch (error) {
      logger.error(new Error(`[MONGODB] Connection error: ${URL}`));
      throw error;
    }
  }

  public static async close() {
    try {
      await mongoose.connection.close();
    } catch (error) {
      logger.error(new Error(`[MONGODB] Close connection error: ${URL}`));
      throw error;
    }
  }
}
