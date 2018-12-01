import * as chai from 'chai';
import { startServer, stopServer } from '../src/server';
import { logger } from '../src/logger';

logger.silent = true;
chai.should();
chai.use(require('chai-http'));

function importTest(name: string, path: string): void {
  describe(name, function() {
    require(path);
  });
}

describe('UNIT TEST', () => {
  importTest('API', './API/index.ts');
});
