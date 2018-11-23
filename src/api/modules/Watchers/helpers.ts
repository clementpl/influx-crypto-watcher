import { Influx } from '../../../_core/Influx/Influx';
import { watcherClasses } from '../../../_core/Watcher/exports';
import { IWatcherConfig, Watcher } from '../../../_core/Watcher/Watcher';
import { Watchers } from './Watchers';
import { logger } from '../../../logger';

/**
 * Restart (if needed) every watcher stored in mongodb
 *
 * @export
 * @param {Influx} influx
 * @returns {Promise<any>}
 */
export async function restartWatchers(influx: Influx): Promise<any> {
  let instance: Watcher | null = null;
  try {
    const watchers: IWatcherConfig[] = await Watchers.getWatchers();
    for (let i = 0; i < watchers.length; i++) {
      const watcher: IWatcherConfig = watchers[i];
      // If watcher not already running
      if (!(await Watchers.runningWatchers.find(w => w.id === watcher.id))) {
        // Create and configure the watcher
        instance = <Watcher>new (<any>watcherClasses)[watcher.type]({ ...watcher });
        instance.setInflux(influx);
        instance.run();
        // Push the watcher instance in the array of running watchers
        Watchers.runningWatchers.push(instance);
      }
    }
    return '';
  } catch (error) {
    // If instance pushed in the array remove it
    if (instance && Watchers.runningWatchers.indexOf(instance) > -1) {
      Watchers.runningWatchers.splice(Watchers.runningWatchers.indexOf(instance), 1);
    }
    logger.error(error);
    throw new Error('Error while restarting watchers');
  }
}

/**
 * Check if the given watcher configuration already exist in mongodb
 *
 * @export
 * @param {*} config
 * @returns
 */
export async function watcherConfigurationExist(config: any) {
    const watchers: any[] = await Watchers.getWatchers();
    const keys: string[] = Object.keys(config);
    // Remove extra config to retain only identifier property (used to compare if config already exists)
    if (keys.indexOf("extra") !== -1) {
        keys.splice(keys.indexOf("extra"), 1);
    }
    // For each watcher already existing, check if same config exist {exhange, base, quote}
    for (let i=0; i< watchers.length; i++) {
        const watcher = watchers[i];
        let sameKeys = 0;
        keys.forEach(key => watcher[key] === config[key] ? sameKeys++ : sameKeys)
        if (sameKeys === keys.length)
            return true;
    }
    return false;
}