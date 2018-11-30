import * as Boom from 'boom';
import { Request } from 'hapi';
import { WatcherModel, IWatcherModel } from '../../../_core/Watcher/model';
import { IWatcherConfig, Watcher } from '../../../_core/Watcher/Watcher';
import { watcherClasses } from '../../../_core/Watcher/exports';
import { logger } from '../../../logger';
import { restartWatchers, watcherConfigurationExist, stopWatchers } from './helpers';

/**
 * Handle endpoints to manage multiple watchers
 *
 * @export
 * @class Watchers
 */
export class Watchers {
  public static runningWatchers: Watcher[] = [];

  /**
   * Restart every watcher
   *
   * @static
   * @param {Request} request
   * @returns {Promise<any>}
   * @memberof Watchers
   */
  public static async restartAllWatchers(request: Request): Promise<any> {
    try {
      await restartWatchers((<any>request.server.app).influx);
      return { msg: '' };
    } catch (error) {
      logger.error(error);
      throw Boom.internal(error);
    }
  }

  public static async stopAllWatchers(request: Request): Promise<any> {
    try {
      await stopWatchers();
      return { msg: '' };
    } catch (error) {
      logger.error(error);
      throw Boom.internal(error);
    }
  }

  public static async getWatchers(): Promise<any> {
    try {
      const watchers: IWatcherModel[] = await WatcherModel.find();
      return watchers.map((w: any) => <IWatcherConfig>w._doc);
    } catch (error) {
      logger.error(error);
      throw Boom.internal(error);
    }
  }

  public static async deleteWatchers(request: Request): Promise<any> {
    try {
      for (const watcher of Watchers.runningWatchers) {
        await watcher.stop();
      }
      await WatcherModel.collection.drop();
      Watchers.runningWatchers = [];
      return { msg: '' };
    } catch (error) {
      logger.error(error);
      return Boom.internal(error);
    }
  }

  public static async getWatcher(request: Request): Promise<any> {
    try {
      const { id } = request.params;
      const watcher = await WatcherModel.findOne({ id });
      if (!watcher) {
        return Boom.notFound(`Watcher ${id} not found`);
      }
      return watcher;
    } catch (error) {
      logger.error(error);
      throw Boom.internal(error);
    }
  }

  public static async createWatcher(request: Request): Promise<any> {
    const watcherConfig = <IWatcherConfig>request.payload;
    if (watcherConfig.id) {
      return Boom.badRequest('Cannot create a new watcher with an id');
    }
    if (!(<any>watcherClasses)[watcherConfig.type]) {
      return Boom.badRequest(`Watcher type ${watcherConfig.type} doesn't exists`);
    }
    // Check if watcher with same config already exist
    if (await watcherConfigurationExist(watcherConfig)) {
      return Boom.badRequest(`Watcher configuration already exist`);
    }
    // Create the watcher (in function of the given type)
    const watcher: Watcher = new (<any>watcherClasses)[watcherConfig.type](watcherConfig);
    watcher.setInflux((<any>request.server.app).influx);
    watcher.run().catch(error => {
      throw error;
    });
    // Push the new running watchers
    Watchers.runningWatchers.push(watcher);
    return { id: watcher.id };
  }

  public static async startWatcher(request: Request): Promise<any> {
    try {
      const { id } = request.params;
      const running = Watchers.runningWatchers.find(w => w.id === id);
      if (running) return { msg: 'Watcher already running' };
      const watcher = await WatcherModel.findOne({ id });
      if (!watcher) return Boom.notFound(`Watcher ${id} not found`);

      // Create and configure the watcher
      const instance = <Watcher>new (<any>watcherClasses)[watcher.type]((<any>watcher)._doc);
      instance.setInflux((<any>request.server.app).influx);
      instance.run().catch(error => {
        throw error;
      });
      // Push the watcher instance in the array of running watchers
      Watchers.runningWatchers.push(instance);
      return { msg: `Watcher ${id} started` };
    } catch (error) {
      logger.error(error);
      return Boom.internal(error);
    }
  }

  public static async stopWatcher(request: Request): Promise<any> {
    try {
      const { id } = request.params;
      const running = Watchers.runningWatchers.find(w => w.id === id);
      if (running) {
        await running.stop();
        const runningIdx = Watchers.runningWatchers.map(w => w.id).indexOf(running.id);
        Watchers.runningWatchers.splice(runningIdx, 1);
      }
      return { msg: `Watcher ${id} stopped` };
    } catch (error) {
      logger.error(error);
      return Boom.internal(error);
    }
  }

  public static async deleteWatcher(request: Request): Promise<any> {
    try {
      const { id } = request.params;
      const running = Watchers.runningWatchers.find(w => w.id === id);
      if (running) {
        await running.stop();
        const runningIdx = Watchers.runningWatchers.map(w => w.id).indexOf(running.id);
        Watchers.runningWatchers.splice(runningIdx, 1);
      }
      await WatcherModel.findOneAndDelete({ id });
      return { msg: '' };
    } catch (error) {
      logger.error(error);
      return Boom.internal(error);
    }
  }
}
