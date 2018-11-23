import { ServerRoute } from 'hapi';
import { Watchers } from './Watchers';

export const routes: Array<ServerRoute> = [
  <ServerRoute>{
    method: 'POST',
    path: '/watchers',
    handler: Watchers.createWatcher,
  },
  <ServerRoute>{
    method: 'DELETE',
    path: '/watchers/{id}',
    handler: Watchers.deleteWatcher,
  },
  <ServerRoute>{
    method: 'DELETE',
    path: '/watchers',
    handler: Watchers.deleteWatchers,
  },
  <ServerRoute>{
    method: 'GET',
    path: '/watchers/restart',
    handler: Watchers.restartAllWatchers,
  },
  <ServerRoute>{
    method: 'GET',
    path: '/watchers',
    handler: Watchers.getWatchers,
  },
  <ServerRoute>{
    method: 'GET',
    path: '/watchers/{id}',
    handler: Watchers.getWatcher,
  },
];
