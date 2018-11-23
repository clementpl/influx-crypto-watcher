import * as config from '../config/config.json';
import { MarketWatcher } from './_core/Watcher/MarketWatcher/MarketWatcher';
import { Influx } from './_core/Influx/Influx';
import { Mongo } from './_core/Mongo/Mongo';
import { logger } from './logger';
import { API } from './api/API';
import { restartWatchers } from './api/modules/Watchers/helpers';

/**
 * Initialization
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
    // Start watcher persisted
    // TODO
    return { influxClient };
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * Main
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const { influxClient } = await init().catch(() => logger.error('Initialization failed\nexiting...') && process.exit());
  // Main
  try {
    const watcher = new MarketWatcher({
      exchange: 'binance',
      type: 'MarketWatcher',
      quote: 'USDT',
      base: 'BTC',
      extra: {
        refreshInterval: 30 * 1000,
      },
    });
    // Set influx instance to the watcher
    watcher.setInflux(influxClient);
    watcher.run();
  } catch (error) {
    logger.error(error);
    logger.error('exiting...');
    process.exit();
  }
}

//main();

async function mainAPI() {
  try {
    console.log('here');
    const { influxClient } = await init().catch(() => logger.error('Initialization failed\nexiting...') && process.exit());
    //restartWatchers(influxClient);
    const server = await API.create({
      host: 'localhost',
      port: 3000,
      influx: influxClient,
    });
    //console.log('ok', server);
  } catch (error) {
    logger.error(error);
    logger.error('Exiting...');
    process.exit();
  }
}
console.log('0here');

mainAPI();
