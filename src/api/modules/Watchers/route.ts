import * as Joi from 'joi';
import { ServerRoute } from 'hapi';
import { Watchers } from './Watchers';

export const routes: Array<ServerRoute> = [
  <ServerRoute>{
    method: 'POST',
    path: '/watchers',
    handler: Watchers.createWatcher,
    options: {
      validate: {
        query: Joi.object({
          type: Joi.string().required(),
          base: Joi.string().required(),
          quote: Joi.string().required(),
          exchange: Joi.string().required(),
        }),
      },
      tags: ['Watcher', 'API'],
      description: 'POST Create a new watcher with the given configuration',
    },
  },
  <ServerRoute>{
    method: 'GET',
    path: '/watchers',
    handler: Watchers.getWatchers,
    options: {
      tags: ['Watcher', 'API'],
      description: 'GET Fetch every watchers',
    },
  },
  <ServerRoute>{
    method: 'GET',
    path: '/watchers/restart',
    handler: Watchers.restartAllWatchers,
    options: {
      tags: ['Watcher', 'API'],
      description: 'GET Restart every watchers',
    },
  },
  <ServerRoute>{
    method: 'DELETE',
    path: '/watchers',
    handler: Watchers.deleteWatchers,
    options: {
      tags: ['Watcher', 'API'],
      description: 'DELETE Delete every watchers',
    },
  },
  <ServerRoute>{
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
  <ServerRoute>{
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
  <ServerRoute>{
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
  <ServerRoute>{
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
