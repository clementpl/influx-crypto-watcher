import { IMarketWatcherConfig } from '../../src/_core/Watcher/MarketWatcher/MarketWatcher';
import * as moment from 'moment';

const DEFAULT_MARKET_WATCHER_CONFIG: IMarketWatcherConfig = {
  type: 'MarketWatcher',
  base: 'BTC',
  exchange: 'binance',
  quote: 'USDT',
  extra: {
    refreshInterval: 1000,
    maxHistory: moment()
      .subtract(10, 'm')
      .utc()
      .format(),
  },
};

export function getWatcherConfig(
  base: string = 'BTC',
  quote: string = 'USDT',
  refreshInterval: number = 1000
): IMarketWatcherConfig {
  return Object.assign({}, DEFAULT_MARKET_WATCHER_CONFIG, {
    base,
    quote,
    extra: { refreshInterval },
  });
}
