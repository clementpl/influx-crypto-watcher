import * as moment from 'moment';
import { InfluxDB, IPoint, IResults } from 'influx';
import { OHLCV } from '../Exchange/Exchange';
import { logger } from '../../logger';
import { MEASUREMENT_OHLC } from './constants';
import { tagsToString } from './helpers';

export interface InfluxConfig {
  host: string;
  port: number;
  stockDatabase: string;
  eventDatabase: string;
}

export class Influx {
  private influx: InfluxDB;

  constructor(public conf: InfluxConfig) {
    this.influx = new InfluxDB({
      host: this.conf.host,
      port: this.conf.port,
    });
  }

  public async init() {
    try {
      await this.createDatabaseIfNotExist(this.conf.stockDatabase);
      await this.createDatabaseIfNotExist(this.conf.eventDatabase);
      logger.info(`[INFLUXDB] Connection successful: ${this.conf.host}:${this.conf.port}`);
    } catch (error) {
      logger.error(new Error(`[INFLUXDB] Connection error: ${this.conf.host}:${this.conf.port}`));
      throw error;
    }
  }

  /**
   * Check if given database name exist. If not create it.
   *
   * @private
   * @param {string} name
   * @memberof Influx
   */
  private async createDatabaseIfNotExist(name: string) {
    try {
      const databases: string[] = await this.influx.getDatabaseNames();
      // If not exist create it
      if (!databases.includes(name)) this.influx.createDatabase(name);
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Write OHLCV points to influxdb
   *
   * @param {{symbol: string}} tags Tag of the serie (currently just the symbol, maybe more later)
   * @param {OHLCV[]} data
   * @memberof Influx
   */
  public async writeOHLC(tags: { symbol: string }, data: OHLCV[]) {
    const points = data.map(({ time, open, high, low, close, volume }) => {
      return {
        measurement: MEASUREMENT_OHLC,
        tags,
        fields: { open, high, low, close, volume },
        timestamp: moment(time).toDate().getTime()
      };
    });
    await this.influx.writePoints(points, {
      database: this.conf.stockDatabase,
      precision: 'ms',
    });
  }

  /**
   * Get OHLC from influx db group by the specified aggregation time (minutes by default)
   *
   * @param {{ symbol: string }} tags
   * @param {string} [aggregatedTime='1m'] // influxdb units: s(seconds), m (minutes), d (days)
   * @memberof Influx
   */
  public async getOHLC(tags: { symbol: string }, aggregatedTime: string = '1m') {
    this.influx.query(
      `SELECT first(open) as open, max(high) as high, min(low) as low, last(close) as close
       FROM ${MEASUREMENT_OHLC}
       WHERE ${tagsToString(tags)}
       GROUP BY time(${aggregatedTime})`,
      {
        database: this.conf.stockDatabase,
      }
    );
  }

  /**
   * Find missing point inside a serie
   *
   * @param {string} measurement
   * @param {{[name: string]: string}} tags (symbol, ...)
   * @param {string} [aggregatedTime='1m']
   * @returns {string[]} Array of timestamp where data is missing
   * @memberof Influx
   */
  public async getSeriesGap(measurement: string, tags: { [name: string]: string }, aggregatedTime: string = '1m'): Promise<string[]> {
    const query = `SELECT * FROM (
        SELECT max(close) as close 
        FROM ${measurement}
        WHERE ${tagsToString(tags)}
        GROUP BY time(${aggregatedTime}) fill(-1)
      ) WHERE close = -1`;
    try {
      const ret = await this.influx.query(query, {
        database: this.conf.stockDatabase,
      });
      return ret.map((el: any) => el.time._nanoISO);
    } catch (error) {
      logger.error(error);
      throw new Error(`Problem with query ${query}`);
    }
  }

  /**
   * Count number of points in a given series
   *
   * @param {string} measurement
   * @param {{ [name: string]: string }} tags
   * @returns {Promise<number>}
   * @memberof Influx
   */
  public async count(measurement: string, tags: { [name: string]: string }): Promise<number> {
    const query: string = `SELECT count(close) FROM ${measurement} WHERE ${tagsToString(tags)}`;
    try {
      const ret: any = (<any>await this.influx.query(query, {
        database: this.conf.stockDatabase,
      }))[0];
      return ret ? ret.count : 0;
    } catch (error) {
      logger.error(error);
      throw new Error(`Problem with query ${query}`);
    }
  }
}
