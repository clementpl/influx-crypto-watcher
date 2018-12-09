import { startServer, stopServer } from '../src/server';
import { logger } from './logger';

process.env.NODE_ENV = process.env.NODE_ENV || 'DEV';

// Start the server
startServer().catch(error => {
  logger.error(error);
  logger.error(new Error('Unexpected Error'));
  process.exit(1);
});

/* tslint:disable */
// Catch SIGINT/SIGNTERM/KILL ,...
require('death')(() => {
    stopServer().catch(error => {
      logger.error(error);
      logger.error(new Error('Unexpected Error'));
      process.exit(1);
    });
  });
  