import * as ccxt from 'ccxt';
import * as moment from 'moment';
import { logger } from '../../logger';

export interface ExchangeConfig {
  name: string;
}

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Exchange class
 *
 * @export
 * @class Exchange
 */
export class Exchange {
  private exchange: ccxt.Exchange;
  private marketsInfo: ccxt.Market[];

  constructor(public config: ExchangeConfig) {
    // Create exchange with ccxt
    this.exchange = <ccxt.Exchange>new (<any>ccxt)[this.config.name]({
      apiKey: '',
      secret: '',
      timeout: 30000,
      enableRateLimit: true,
    });
  }

  /**
   * Get exchange info for a given symbol
   *
   * @param {string} symbol
   * @returns {Promise<Market>}
   * @memberof Exchange
   */
  public async getExchangeInfo(symbol: string): Promise<ccxt.Market> {
    if (!this.marketsInfo) this.marketsInfo = await this.exchange.fetchMarkets();
    const markets = this.marketsInfo.filter(market => market.id === symbol);
    if (markets.length !== 1) throw new Error(`Market ${symbol} not found`);
    return markets[0];
  }

  /**
   * Fetch candle history
   *
   * @param {string} symbol Crypto symbol to fetch (BTC/USDT, ETH/BTC, ...)
   * @param {{ limit: number; since?: number }} opts
   *           limit: number of candle to fetch since the given timestamp (default now() - limit minutes)
   * @returns {Promise<OHLCV[]>}
   * @memberof Exchange
   */
  public async getCandles(symbol: string, opts: { limit: number; since?: number }): Promise<OHLCV[]> {
    if (!this.exchange.fetchOHLCV) {
      throw new Error(`[Exchange] ${this.config.name} doesn't have fetchOHLCV method`);
    }
    try {
      // Get limit timestamp (5 minutes before now if limit = 5)
      const limit: number = opts.limit || 1;
      const since: number =
        opts.since ||
        moment()
          .subtract(limit, 'm')
          .toDate()
          .getTime();
      const candles = await this.exchange.fetchOHLCV(symbol, '1m', since, limit);
      return candles.map(
        ([T, O, H, L, C, V]) =>
          <OHLCV>{
            time: T,
            open: O,
            high: H,
            low: L,
            close: C,
            volume: V,
          }
      );
    } catch (error) {
      logger.error(error);
      throw new Error(`[Exchange] ${this.config.name} doesn't have fetchOHLCV method`);
    }
  }
}

/*
export interface Order {
	market: string, // 'BNBETH'
		orderId: string, // 4480553
		transactTime: number, //1509049376261,
		price: number, //'0.00000000',
		origQty: number, //'1.00000000',
		exeutedQty: number, //'1.00000000',
		status: string, //'FILLED',
		type: string, //'MARKET',
		side: string, //'BUY'
}
*/
