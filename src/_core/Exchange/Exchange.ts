import * as ccxt from 'ccxt';
import { Exchange as ccxtExchange, Market } from 'ccxt';
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
  private exchange: ccxtExchange;
  private marketsInfo: Array<Market>;

  constructor(public config: ExchangeConfig) {
    // Create exchange with ccxt
    this.exchange = <ccxtExchange>new (<any>ccxt)[this.config.name]({
      apiKey: '', //this.config.api_key,
      secret: '', //this.config.api_secret,
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
  public async getExchangeInfo(symbol: string): Promise<Market> {
    if (!this.marketsInfo) this.marketsInfo = await this.exchange.fetchMarkets();
    const markets = this.marketsInfo.filter(market => market.id === symbol);
    if (markets.length !== 1) throw new Error(`Market ${symbol} not found`);
    return markets[0];
  }

  public async getCandles(symbol: string, opts: { limit: number; since?: number }): Promise<OHLCV[]> {
    if (!this.exchange.fetchOHLCV) {
      throw new Error(`[Exchange] ${this.config.name} doesn't have fetchOHLCV method`);
    }
    try {
      // Get limit timestamp (5 minutes before now if limit = 5)
      const limit: number = opts.limit | 1;
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

  /*
  public async getCandlesHistory(
    market: string,
    since: number,
    limit: number = 1
  ): Promise<OHLCV[]> {
    if (!this.exchange.fetchOHLCV) {
      const error = new Error(
        `Exchange ${this.config.name} doesn't have fetchOHLCV method`
      );
      logger.error(error.message, { stack: error.stack });
      throw error;
    }
    try {
      let candles = await this.cache.get(market, since, limit);
      if (!candles) {
        console.log('NO CANDLE FOUNDED');
        candles = await this.exchange.fetchOHLCV(market, '1m', since, limit);
        this.cache.set(market, candles);
      }
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
      throw error;
    }
  }*/
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
