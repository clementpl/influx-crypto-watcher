import { Server } from 'hapi';
import { logger } from '../logger';
import { routes } from './modules/Watchers/route';
import { Influx } from '../_core/Influx/Influx';

export interface APIConfig {
  port?: number;
  host?: string;
  influx: Influx;
}

export class API {
  public static async create(conf?: APIConfig): Promise<Server> {
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

      // Expose instance
      //server.expose('influx', config.influx);
      server.app = { influx: config.influx };
      // Bind routes
      routes.forEach(route => server.route(route));

      // Start the http server
      await server.start();
      logger.info(`[API] Server running at: ${server.info.uri}`);
      return server;
    } catch (error) {
      logger.error(error);
      throw new Error('[API] Cannot start api');
    }
  }
}
