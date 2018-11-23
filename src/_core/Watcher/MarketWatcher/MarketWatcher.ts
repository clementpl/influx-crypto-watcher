import * as moment from 'moment';
import { sleep } from '../../helpers';
import { IWatcherConfig, Watcher } from '../Watcher';
import { Exchange, OHLCV } from '../../Exchange/Exchange';
import { logger } from '../../../logger';
import { MEASUREMENT_OHLC } from '../../Influx/constants';

export interface IMarketWatcherConfig extends IWatcherConfig {
  exchange: string;
  base: string;
  quote: string;
  extra: {
    refreshInterval: number;
  };
}

/**
 * Market watcher class
 * Monitor the specified market:
 *    - get OHLC data and write it to InfluxDB
 *
 * @export
 * @class MarketWatcher
 * @extends {Watcher}
 */
export class MarketWatcher extends Watcher {
  public symbol: string;
  private exchange: Exchange;
  private shouldStop: boolean = false;

  constructor(public conf: IMarketWatcherConfig) {
    super(conf);
    this.checkConfig(this.conf);
    this.symbol = `${this.conf.base}/${this.conf.quote}`;
    this.exchange = new Exchange({ name: this.conf.exchange });
  }

  /**
   * Check if config allow the watcher creation
   *
   * @private
   * @param {IMarketWatcherConfig} config
   * @memberof MarketWatcher
   */
  private checkConfig(config: IMarketWatcherConfig) {
    // Can't create MarketWatcher with refreshInterval < 1 second
    if (config.extra.refreshInterval < 1000) throw new Error('[WATCHER] Cannot create market watcher with refreshInterval < 1000 (1 seconde)');
  }

  /**
   * Run the watcher
   *
   * @returns {Promise<void>}
   * @memberof MarketWatcher
   */
  public async runWatcher(): Promise<void> {
    logger.info(`[WATCHER] Watcher started on ${this.conf.exchange}: ${this.symbol}`);
    this.shouldStop = false;
    // Async fill missing data or fetch history (for new series)
    await this.checkTimeserie().catch(error => logger.error(error));
    // Watcher running loop
    while (!this.shouldStop) {
      try {
        // Get last OHLC and write it to influx
        const data: OHLCV[] = await this.exchange.getCandles(this.symbol, {
          limit: 1,
        });
        // Write ohlc async
        this.getInflux().writeOHLC({ symbol: this.symbol }, data);
      } catch (error) {
        logger.error(error);
      }
      // Sleep (make interval)
      await sleep(this.conf.extra.refreshInterval);
    }
  }

  /**
   * Stop the watcher
   *
   * @memberof MarketWatcher
   */
  public async stopWatcher(): Promise<void> {
    this.shouldStop = true;
  }

  // Check if the time serie already have data (if not fill history, otherwise scan and fill gap)
  private async checkTimeserie(): Promise<void> {
    // If no data founded
    if ((await this.getInflux().count(MEASUREMENT_OHLC, { symbol: this.symbol })) === 0) {
      //if ((await this.getInflux().count(MEASUREMENT_OHLC, { symbol: this.symbol })) === 0) {
      await this.fillHistory('2018-01-01T00:00:00Z');
    }
    // Fill missing point by fetching them (exchange)
    await this.fillGap();
  }

  /**
   * Fill time serie history
   *
   * @private
   * @returns {Promise<void>}
   * @memberof MarketWatcher
   */
  private async fillHistory(from: string): Promise<void> {
    try {
      const batchSize = 500;
      const start = moment(from);
      const end = moment().subtract(batchSize, 'm');
      while (end.diff(start, 'm') > batchSize) {
        // Fetch missing data and write it to influx
        const data: OHLCV[] = await this.exchange.getCandles(this.symbol, {
          limit: batchSize,
          since: end.toDate().getTime(),
        });
        // if data fetched
        if (data.length > 0) {
          await this.getInflux().writeOHLC({ symbol: this.symbol }, data);
        }
        end.subtract(batchSize, 'm');
      }
      // Fetch last point(start + 500)
      const data: OHLCV[] = await this.exchange.getCandles(this.symbol, {
        limit: batchSize,
        since: start.toDate().getTime(),
      });
      await this.getInflux().writeOHLC({ symbol: this.symbol }, data);
    } catch (error) {
      logger.error(error);
      throw new Error(`[Watcher] Error when filling history ${this.symbol}`);
    }
  }

  /**
   * Fill gap in the timeserie (Will fill missing point when restarting)
   *
   * @private
   * @memberof MarketWatcher
   */
  private async fillGap(): Promise<void> {
    try {
      // Check if data gap exist for the given symbol (= missing points)
      // return Array of timestamp where data is missing
      const missingPoints = await this.getInflux().getSeriesGap(MEASUREMENT_OHLC, { symbol: this.symbol }, '1m');
      if (missingPoints.length > 0) {
        const batchSize = 500;
        let i = 0;
        // Loop over missigPoints timestamp
        while (i < missingPoints.length) {
          let j = i + 1;
          const start = moment(missingPoints[i]);
          let next = moment(missingPoints[j]);
          // Find consecutive gap (diff between two point = 1 minute)
          while (j < missingPoints.length && Math.abs(start.diff(next, 'm')) < batchSize) {
            // If more than 500 consecutive missing point stop loop to make a request (cannot request more than 500 candles)
            j++;
            next = moment(missingPoints[j]);
          }
          // Fetch missing data and write it to influx
          const nbMinuteToFetch = Math.abs(moment(missingPoints[j - 1]).diff(moment(missingPoints[i]), 'm'));
          const data: OHLCV[] = await this.exchange.getCandles(this.symbol, {
            limit: 500,
            since: start
              .subtract(nbMinuteToFetch, 'm')
              .toDate()
              .getTime(),
          });
          if (data.length > 0) {
            await this.getInflux().writeOHLC({ symbol: this.symbol }, data);
          }
          i = j;
        }
        logger.info(`[Watcher] ${missingPoints.length} missing points filled into InfluxDB for serie ${this.symbol}`);
      }
    } catch (error) {
      logger.error(error);
      throw new Error(`[Watcher] Error when filling gap ${this.symbol}`);
    }
  }
}
