import * as mongoose from 'mongoose';
import { config } from '../config/config';
import { Influx } from './_core/Influx/Influx';
import { Mongo } from './_core/Mongo/Mongo';
import { logger } from './logger';
import { API } from './api/API';
import { restartWatchers } from './api/modules/Watchers/helpers';
import { Server } from 'hapi';

/**
 * Initialization (MongoDB / InfluxDB / Watchers)
 *
 * @returns {Promise<Influx>}
 */
async function init(shouldRestartWatchers: boolean): Promise<{ influxClient: Influx }> {
  try {
    // Connect to MongoDB
    await Mongo.connect(config.mongo);
    // Connect InfluxDB
    const influxClient: Influx = new Influx(config.influx);
    await influxClient.init();
    // Restart watcher persisted
    if (shouldRestartWatchers) {
      await restartWatchers(influxClient);
    }
    return { influxClient };
  } catch (error) {
    logger.error(error);
    throw new Error('Initialization failed');
  }
}

/**
 * Main
 *
 * @returns {Promise<void>}
 */
export async function startServer(shouldRestartWatchers: boolean = true): Promise<Server> {
  try {
    // Init Influx/Mongo/Watchers
    const { influxClient } = await init(shouldRestartWatchers);
    // Create server API
    const server = await API.create({
      host: config.api.host,
      port: config.api.port,
      influx: influxClient,
    });
    return server;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function stopServer(): Promise<void> {
  try {
    logger.info('Shutting down server...');
    await Mongo.close();
    await API.stop();
  } catch (error) {
    logger.error(error);
    throw new Error('Error while stopping..');
  }
}
