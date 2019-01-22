import * as uuid from 'uuid';
import { WatcherModel } from './model';
import { Influx } from '../Influx/Influx';
import { logger } from '../../logger';

export enum WatcherStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
}

/**
 * Watcher configuration
 *
 * @export
 * @interface IWatcherConfig
 * @extends {Document} MongoDB model saving
 */
export interface IWatcherConfig {
  id?: string; // id of the watcher
  type: string; // Kind of watcher (MarketWatcher/SignalWatcher)
  extra?: any; // Extra configuration (not primary key all the other property of a watcher are use as primary key)
}

/**
 * Watcher abstract class
 *
 * @export
 * @abstract
 * @class Watcher
 */
export abstract class Watcher {
  public id: string;
  private status: WatcherStatus;
  private influx: Influx;
  private restart: number = 0;

  /**
   * Creates an instance of Watcher and save it to mongodb (if persist).
   *
   * @param {IWatcherConfig} conf Configuration object
   * @param {boolean} [persist=true] Should persist or not the watcher configuration to mongodb
   *                  onLoadWatcher persist = false because we load watcher already persisted
   * @memberof Watcher
   */
  constructor(public conf: IWatcherConfig) {
    this.id = conf.id || uuid.v1();
    this.status = WatcherStatus.STOPPED;
  }

  /**
   * Init the watcher (can be use for async checking before starting it)
   *
   * @abstract
   * @memberof Watcher
   */
  public abstract async init(): Promise<void>;

  /**
   * Start the watcher
   *
   * @abstract
   * @memberof Watcher
   */
  public abstract async runWatcher(): Promise<void>;

  /**
   * Stop the watcher
   *
   * @abstract
   * @memberof Watcher
   */
  public abstract async stopWatcher(): Promise<void>;

  public async run(): Promise<void> {
    this.status = WatcherStatus.RUNNING;
    await this.save().catch(error => logger.error(error));
    this.runWatcher()
      // On error try to restart the watcher 3 times before stopping it
      .catch(async error => {
        logger.error(error);
        try {
          if (this.restart < 3) {
            this.restart += 1;
            logger.info(`[Watcher] Try restarting (${this.restart}/3) watcher ${this.id}`);
            await this.stop();
            this.run().catch(err => {
              throw err;
            });
          } else {
            await this.stop();
            logger.error(`[Watcher] Stopping watcher ${this.id} (can't restart it)`);
          }
        } catch (error) {
          throw error;
        }
      });
  }

  public async stop(): Promise<void> {
    this.status = WatcherStatus.STOPPED;
    await this.stopWatcher();
    await this.save();
  }

  /**
   * Set influx client
   *
   * @param {Influx} influx
   * @memberof Watcher
   */
  public setInflux(influx: Influx): void {
    this.influx = influx;
  }

  /**
   * Get influx client
   *
   * @returns {Influx}
   * @memberof Watcher
   */
  public getInflux(): Influx {
    if (!this.influx) {
      throw new Error('No Influx instance set for this watcher');
    }
    return this.influx;
  }

  /**
   * Save watcher configuration in MongoDB
   *
   * @param {*} config
   * @memberof Watcher
   */
  public async save(): Promise<void> {
    const { type, ...extra } = this.conf;
    const watcher = { ...extra, id: this.id, type, status: this.status };
    await WatcherModel.findOneAndUpdate({ id: this.id }, watcher, { upsert: true });
  }
}
