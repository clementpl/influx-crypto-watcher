# Crypto market data aggregator

## Description

This application help gathering data about cryptocurrencies (stock price, signals, tweet) and store those data in [InfluxDB](https://github.com/influxdata/influxdb)

## Getting started

Install dependencies

`npm install`

Run docker containers (influx, mongodb) (Need docker-compose)

`npm run docker`

Start watcher api

`npm start`

## Core

The software let you deploy watcher which will collect data about a specific exchange currencie.

The principal concept is the watcher.
A watcher can track signal/crypto (TODO => telegram signal part)


A watcher will track a crypto currency price given a configuration. 
For example to watch the price of BTC/USDT on binance we configure a MarketWatcher as : 
```
{
  type: 'MarketWatcher'
  exchange: 'binance';
  base: 'BTC';
  quote: 'USDT';
  extra: {
    refreshInterval: 30000;
  };
}
```
Every watcher are persist to MongoDB to restart them when restarting the app.

## API

- Doc available at http://localhost:3000/docs generated with [lout](https://github.com/hapijs/lout)
- Easy watcher deployment
- Watch specific currencies
- TODO Watch signals (telegram, ...?)

## UI 

- [influx-crypto-watcher-ui](https://github.com/clementpl/influx-crypto-watcher-ui)

## Visualization with grafana

A grafana container will run when using `npm run docker`

Then go to http://localhost:3001/
- username: admin
- password: admin
