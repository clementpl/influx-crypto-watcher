import * as uuid from 'uuid';
import { WatcherModel } from './model';
import { Influx } from '../Influx/Influx';

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
  id?: string;
  type: string;
  extra?: any
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
  private model: Document;

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
    this.runWatcher();
    await this.save();
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
  public async save() {
    const { type, ...extra } = this.conf;
    const watcher = { ...extra, id: this.id,  type, status: this.status };
    await WatcherModel.findOneAndUpdate({ id: this.id }, watcher, { upsert: true });
  }
}
