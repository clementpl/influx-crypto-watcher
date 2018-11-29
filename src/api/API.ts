import { Server } from 'hapi';
import { logger } from '../logger';
import { routes } from './modules/Watchers/route';
import { Influx } from '../_core/Influx/Influx';
import { stopWatchers } from './modules/Watchers/helpers';

export interface APIConfig {
  port?: number;
  host?: string;
  influx: Influx;
}

/**
 * Static class API
 *
 * @export
 * @class API
 */
export class API {
  public static server: Server | null = null;

  /**
   * Static method create the server api (hapi.js), then bind it to the server property
   *
   * @static
   * @param {APIConfig} [conf]
   * @returns {Promise<void>}
   * @memberof API
   */
  public static async create(conf?: APIConfig): Promise<void> {
    const config = Object.assign(
      {
        port: 3000,
        host: 'localhost',
      },
      conf
    );
    try {
      // Create new Server
      const server = new Server({
        port: config.port,
        host: config.host,
        routes: { cors: true },
      });

      // Expose influx instance
      server.app = { influx: config.influx };

      // Bind routes
      routes.forEach(route => server.route(route));

      // Start the http server
      await server.start();

      // Bind server instance
      API.server = server;

      logger.info(`[API] Server running at: ${API.server.info.uri}`);
    } catch (error) {
      logger.error(error);
      throw new Error('[API] Cannot start api');
    }
  }

  /**
   * Static method stop watchers and api, then unbind the server property
   *
   * @static
   * @returns {Promise<void>}
   * @memberof API
   */
  public static async stop(): Promise<void> {
    // If API running
    if (API.server) {
      await stopWatchers();
      await API.server.stop();
      API.server = null;
    }
  }
}
