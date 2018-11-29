import * as config from '../config/config.json';
import { Influx } from './_core/Influx/Influx';
import { Mongo } from './_core/Mongo/Mongo';
import { logger } from './logger';
import { API } from './api/API';
import { restartWatchers } from './api/modules/Watchers/helpers';

/**
 * Initialization (MongoDB / InfluxDB / Watchers)
 *
 * @returns {Promise<Influx>}
 */
async function init(): Promise<{ influxClient: Influx }> {
  try {
    // Connect to MongoDB
    await Mongo.connect(config.mongo);
    // Connect InfluxDB
    const influxClient: Influx = new Influx(config.influx);
    await influxClient.init();
    // Restart watcher persisted
    await restartWatchers(influxClient);
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
async function main(): Promise<void> {
  try {
    // Init Influx/Mongo/Watchers
    const { influxClient } = await init();
    // Create server API
    await API.create({
      host: config.api.host,
      port: config.api.port,
      influx: influxClient,
    });
  } catch (error) {
    logger.error(error);
    logger.error('Exiting...');
    process.exit();
  }
}

// Catch SIGINT/SIGNTERM/KILL ,...
require('death')(async () => {
  logger.info('Shutting down...');
  await API.stop();
  process.exit();
});

main();
