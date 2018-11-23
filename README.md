# Crypto market data aggregator

## Description

This application help gathering data about cryptocurrencies (stock price, signals, tweet) and store those data in inflxdb (https://github.com/influxdata/influxdb)

## Getting started

Install dependencies

`npm install`

Run docker containers (influx, mongodb) (Need docker-compose)

`npm run docker`

Start watcher api

`npm start`

## API

- Easy watcher deployment
- Watch specific market price
- Watch signals (telegram, ...?)

## UI

- Manage watchers (create/delete/monitor)

## Realtime visualization with grafana ?
