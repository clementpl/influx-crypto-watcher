import * as Joi from 'joi';
import { ServerRoute } from 'hapi';
import { Watchers } from './Watchers';

export const routes: ServerRoute[] = [
  {
    method: 'POST',
    path: '/watchers',
    handler: Watchers.createWatcher,
    options: {
      validate: {
        payload: {
          type: Joi.string().valid('MarketWatcher').required(),
          base: Joi.string().required(),
          quote: Joi.string().required(),
          exchange: Joi.string().required(),
          extra: Joi.object(),
        },
      },
      tags: ['Watcher', 'API'],
      description: 'POST Create a new watcher with the given configuration',
    },
  },
  {
    method: 'GET',
    path: '/watchers',
    handler: Watchers.getWatchers,
    options: {
      tags: ['Watcher', 'API'],
      description: 'GET Fetch every watchers',
    },
  },
  {
    method: 'GET',
    path: '/watchers/restart',
    handler: Watchers.restartAllWatchers,
    options: {
      tags: ['Watcher', 'API'],
      description: 'GET Restart every watchers',
    },
  },
  {
    method: 'GET',
    path: '/watchers/stop',
    handler: Watchers.stopAllWatchers,
    options: {
      tags: ['Watcher', 'API'],
      description: 'GET Stop every watchers',
    },
  },
  {
    method: 'DELETE',
    path: '/watchers',
    handler: Watchers.deleteWatchers,
    options: {
      tags: ['Watcher', 'API'],
      description: 'DELETE Delete every watchers',
    },
  },
  {
    method: 'GET',
    path: '/watchers/{id}/start',
    handler: Watchers.startWatcher,
    options: {
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
      },
      tags: ['Watcher', 'API'],
      description: 'GET Start a watcher',
    },
  },
  {
    method: 'GET',
    path: '/watchers/{id}/stop',
    handler: Watchers.stopWatcher,
    options: {
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
      },
      tags: ['Watcher', 'API'],
      description: 'GET Stop a watcher',
    },
  },
  {
    method: 'GET',
    path: '/watchers/{id}',
    handler: Watchers.getWatcher,
    options: {
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
      },
      tags: ['Watcher', 'API'],
      description: 'GET Get a specific watcher',
    },
  },
  {
    method: 'DELETE',
    path: '/watchers/{id}',
    handler: Watchers.deleteWatcher,
    options: {
      validate: {
        params: Joi.object({
          id: Joi.string().required(),
        }),
      },
      tags: ['Watcher', 'API'],
      description: 'DELETE Delete a watcher',
    },
  },
];
