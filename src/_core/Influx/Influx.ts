import * as moment from 'moment';
import { InfluxDB } from 'influx';
import { logger } from '../../logger';
import { OHLCV } from '../Exchange/Exchange';
import { MEASUREMENT_OHLC, MEASUREMENT_OHLC_FILLED } from './constants';
import { tagsToString } from './helpers';
import { sleep } from '../helpers';

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
      await this.createContinuousQuery();
      logger.info(`[INFLUXDB] Connection successful: ${this.conf.host}:${this.conf.port}`);
    } catch (error) {
      logger.error(new Error(`[INFLUXDB] Connection error: ${this.conf.host}:${this.conf.port}`));
      throw error;
    }
  }

  /**
   * Write OHLCV points to influxdb
   *
   * @param {{symbol: string}} tags Tag of the serie (currently just the symbol, maybe more later)
   * @param {OHLCV[]} data
   * @memberof Influx
   */
  public async writeOHLC(tags: { base: string; quote: string; exchange: string }, data: OHLCV[]) {
    const points = data.map(({ time, open, high, low, close, volume }) => {
      return {
        measurement: MEASUREMENT_OHLC,
        tags,
        fields: { open, high, low, close, volume },
        timestamp: moment(time)
          .toDate()
          .getTime(),
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
  public async getOHLC(tags: { base: string; quote: string; exchange: string }, aggregatedTime: string = '1m') {
    try {
      const ret = await this.influx.query(
        `SELECT first(open) as open, max(high) as high, min(low) as low, last(close) as close
         FROM ${MEASUREMENT_OHLC}
         WHERE ${tagsToString(tags)}
         GROUP BY time(${aggregatedTime})`,
        {
          database: this.conf.stockDatabase,
        }
      );
      // TODO Check => console.log(ret);
      return ret;
    } catch (error) {
      logger.error(error);
      throw new Error('[INFLUX] Problem while fetching OHLC data');
    }
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
  public async getSeriesGap(
    measurement: string,
    tags?: { [name: string]: string },
    aggregatedTime: string = '1m'
  ): Promise<string[]> {
    const query = `SELECT * FROM (
        SELECT max(close) as close 
        FROM ${measurement}
        ${tags ? `WHERE ${tagsToString(tags)}` : ''}
        GROUP BY time(${aggregatedTime}) fill(-1)
      ) WHERE close = -1`;
    try {
      const ret = await this.influx.query(query, {
        database: this.conf.stockDatabase,
      });
      return ret.map((el: any) => el.time._nanoISO);
    } catch (error) {
      logger.error(error);
      throw new Error(`[INFLUX] Problem during query fetchGap\n${query}`);
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
  public async count(measurement: string, tags?: { [name: string]: string }): Promise<number> {
    const query: string = `
      SELECT count(close)
      FROM ${measurement}
      ${tags ? `WHERE ${tagsToString(tags)}` : ''}
    `;
    try {
      const ret: any = (<any>await this.influx.query(query, {
        database: this.conf.stockDatabase,
      }))[0];
      return ret ? ret.count : 0;
    } catch (error) {
      logger.error(error);
      throw new Error(`[INFLUX] Problem with count query\n${query}`);
    }
  }

  public async createContinuousQuery() {
    /*
     To refill every serie use:
     SELECT first(open) as open, max(high) as high, min(low) as low, last(close) as close, sum(volume) as volume 
     INTO OHLC_FILLED FROM OHLC 
     GROUP BY time(1m), * fill(linear)
     */
    try {
      const query: string = `
      SELECT first(open) as open, max(high) as high, min(low) as low, last(close) as close, sum(volume) as volume
      INTO ${MEASUREMENT_OHLC_FILLED}
      FROM ${MEASUREMENT_OHLC}
      GROUP BY time(1m), * fill(linear)
    `;
      // Fetch existing queries
      const queries = await this.influx.showContinousQueries(this.conf.stockDatabase);
      // If queryName not exist
      const queryName = 'fill_OHLC';
      if (!queries.find(q => q.name === queryName)) {
        await this.influx.createContinuousQuery(queryName, query, this.conf.stockDatabase);
      }
    } catch (error) {
      logger.error(error);
      throw new Error('[INFLUX] Problem while creating continuous query');
    }
  }

  public async refreshOHLCFILLED(tags: { [name: string]: string }, force: boolean = false): Promise<void> {
    try {
      // Query creator set time in where clause
      const query: (time?: string) => string = (time?: string) => `
        SELECT first(open) as open, max(high) as high, min(low) as low, last(close) as close, sum(volume) as volume
        INTO ${MEASUREMENT_OHLC_FILLED}
        FROM ${MEASUREMENT_OHLC}
        WHERE ${tagsToString(tags)}
        ${time ? `AND time > '${time}'` : ''}
        GROUP BY time(1m), * fill(linear)
      `;
      // If for refresh the whole serie
      if (force) {
        await this.influx.query(query(), { database: this.conf.stockDatabase });
      } else {
        const ret = await this.getSeriesGap(MEASUREMENT_OHLC_FILLED);
        console.log('Check refresh');
        if (ret.length > 0) {
          console.log('refresh FILLED');
          const start = moment(ret[0])
            .subtract(100, 'm')
            .utc()
            .format();
          // Wait 30 seconds then refresh (allow watcher to fetch missing points)
          await sleep(30 * 1000);
          await this.influx.query(query(start), { database: this.conf.stockDatabase });
          console.log('refresh FILLED DONE');
        }
      }
    } catch (error) {
      logger.error(error);
      throw new Error(`[INFLUX] Problem while refreshing ${MEASUREMENT_OHLC_FILLED}`);
    }
  }

  public async dropSerie(measurement: string, tags: { [name: string]: any }) {
    await this.influx.query(`DROP SERIES FROM "${measurement}" WHERE ${tagsToString(tags)}`, {
      database: this.conf.stockDatabase,
    });
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
      if (!databases.includes(name)) await this.influx.createDatabase(name);
    } catch (error) {
      throw error;
    }
  }
}
