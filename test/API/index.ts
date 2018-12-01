//Require the dev-dependencies
import * as chai from 'chai';
import { startServer, stopServer } from '../../src/server';
import { getWatcherConfig } from './helpers';
//import { Watcher } from '../src/_core/Watcher/Watcher';
import { WatcherModel } from '../../src/_core/Watcher/model';

chai.should();
chai.use(require('chai-http'));
let server: any;

//Our parent block
describe('Watchers', () => {
  before(async () => {
    return (server = await startServer(false));
  });

  /*
   * Test route GET /watchers
   */
  describe('CRUD Watchers', () => {
    before(async () => {
      await WatcherModel.remove({});
      return;
    });

    it('it should create a new watcher (BTC/USDT)', done => {
      chai
        .request(server.listener)
        .post('/watchers')
        .send(getWatcherConfig('BTC', 'USDT', 10000))
        .end((err: any, res: any) => {
          res.should.have.status(200);
          res.body.id.should.be.a('string');
          done();
        });
    });

    it('it should create a new watcher (ETH/USDT)', done => {
      chai
        .request(server.listener)
        .post('/watchers')
        .send(getWatcherConfig('ETH', 'USDT', 10000))
        .end((err: any, res: any) => {
          res.should.have.status(200);
          res.body.id.should.be.a('string');
          done();
        });
    });

    it('it should fetch 2 watchers running', done => {
      chai
        .request(server.listener)
        .get('/watchers')
        .end((err: any, res: any) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.length.should.be.eql(2);
          res.body.forEach((watcher: any) => {
            watcher.status.should.be.eql('RUNNING');
          });
          done();
        });
    });

    it('it should stop every watchers', done => {
      // Create 2 watcher, then
      chai
        .request(server.listener)
        .get('/watchers/stop')
        .end(() => {
          chai
            .request(server.listener)
            .get('/watchers')
            .end((err: any, res: any) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(2);
              res.body.forEach((watcher: any) => {
                watcher.status.should.be.eql('STOPPED');
              });
              done();
            });
        });
    });

    it('it should restart every watchers', done => {
      // Create 2 watcher, then
      chai
        .request(server.listener)
        .get('/watchers/restart')
        .end(() => {
          chai
            .request(server.listener)
            .get('/watchers')
            .end((err: any, res: any) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(2);
              res.body.forEach((watcher: any) => {
                watcher.status.should.be.eql('RUNNING');
              });
              done();
            });
        });
    });

    it('it should delete every watchers', done => {
      // Create 2 watcher, then
      chai
        .request(server.listener)
        .del('/watchers')
        .end(() => {
          chai
            .request(server.listener)
            .get('/watchers')
            .end((err: any, res: any) => {
              res.should.have.status(200);
              res.body.should.be.a('array');
              res.body.length.should.be.eql(0);
              done();
            });
        });
    });
  });

  /**
   * POST watchers
   */
  describe('/POST Watchers ERROR handling', () => {
    before(done => {
      WatcherModel.remove({}).then(() => {
        chai
          .request(server.listener)
          .post('/watchers')
          .send(getWatcherConfig('BTC', 'USDT', 10000))
          .end((err: any, res: any) => {
            done();
          });
      });
    });

    it('it should refuse to create the same watcher (BTC/USDT)', done => {
      chai
        .request(server.listener)
        .post('/watchers')
        .send(getWatcherConfig('BTC', 'USDT', 1000))
        .end((err: any, res: any) => {
          res.should.have.status(400);
          res.body.should.be.eql({
            statusCode: 400,
            error: 'Bad Request',
            message: 'Watcher configuration already exist',
          });
          done();
        });
    });

    it('it should refuse to create a watcher with an id', done => {
      chai
        .request(server.listener)
        .post('/watchers')
        .send({ id: 'lala', ...getWatcherConfig('ETH', 'USDT', 1000) })
        .end((err: any, res: any) => {
          res.should.have.status(400);
          res.body.should.be.eql({ statusCode: 400, error: 'Bad Request', message: 'Invalid request payload input' });
          done();
        });
    });
  });

  /* Manage watcher (get/start/stop) */
  describe('Manage watcher (get/start/stop)', () => {
    // ID of the watcher created with before hook
    let watcherId: string;

    // Create a watcher BTC/USDT
    before(done => {
      WatcherModel.remove({}).then(() => {
        chai
          .request(server.listener)
          .post('/watchers')
          .send(getWatcherConfig('BTC', 'USDT', 10000))
          .end((err: any, res: any) => {
            watcherId = res.body.id;
            done();
          });
      });
    });

    it('it should get the watcher created in before hook GET /watchers/{id}', done => {
      chai
        .request(server.listener)
        .get(`/watchers/${watcherId}`)
        .end((err: any, res: any) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.id.should.be.eql(watcherId);
          res.body.status.should.be.eql('RUNNING');
          done();
        });
    });

    it('it should stop the watcher GET /watchers/{id}/stop', done => {
      chai
        .request(server.listener)
        .get(`/watchers/${watcherId}/stop`)
        .end(() => {
          chai
            .request(server.listener)
            .get(`/watchers/${watcherId}`)
            .end((err: any, res: any) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.id.should.be.eql(watcherId);
              res.body.status.should.be.eql('STOPPED');
              done();
            });
        });
    });

    it('it should restart the watcher GET /watchers/{id}/start', done => {
      chai
        .request(server.listener)
        .get(`/watchers/${watcherId}/start`)
        .end(() => {
          chai
            .request(server.listener)
            .get(`/watchers/${watcherId}`)
            .end((err: any, res: any) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.id.should.be.eql(watcherId);
              res.body.status.should.be.eql('RUNNING');
              done();
            });
        });
    });

    it('it should delete the watcher DELETE /watchers/{id}', done => {
      chai
        .request(server.listener)
        .del(`/watchers/${watcherId}`)
        .end(() => {
          chai
            .request(server.listener)
            .get(`/watchers/${watcherId}`)
            .end((err: any, res: any) => {
              res.should.have.status(404);
              done();
            });
        });
    });
  });

  after(async () => {
    await stopServer();
  });
});
