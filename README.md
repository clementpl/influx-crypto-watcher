# influx crypto watcher [![Build Status](https://travis-ci.org/clementpl/influx-crypto-watcher.svg?branch=master)](https://travis-ci.org/clementpl/influx-crypto-watcher) [![Coverage Status](https://coveralls.io/repos/github/clementpl/influx-crypto-watcher/badge.svg?branch=master)](https://coveralls.io/github/clementpl/influx-crypto-watcher?branch=master)

Crypto market data aggregator

## Description

This application help gathering data about cryptocurrencies (stock price, signals, tweet) and store those data in [InfluxDB](https://github.com/influxdata/influxdb)

## Getting started

Install dependencies

`npm install`

Run docker containers (influx, mongodb) (Need docker-compose)

`npm run docker-start`

Start watcher api

`npm start`

Create your first watcher (binance, BTC/USDT)

```
curl --request POST --url http://localhost:3000/watchers --header 'content-type: application/json' --data\
 '{ "type": "MarketWatcher",
    "exchange": "binance",
    "quote": "USDT",
    "base": "BTC",
    "extra": {
      "refreshInterval": 30000,
      "maxHistory": "2018-10-01T00:00:00Z"
      }
    }'
```

Then go to grafana (http://localhost:3001/), import the dashboard given in "docker/grafana/dashboard/cypto-watcher.json"

![dashboard](/docker/grafana/dashboard/screen.png)

## Core

The software let you deploy watcher which will collect data about a specific exchange cryptocurrency.

The principal concept is the watcher.
A watcher can track price/signal (TODO => telegram signal part)

A watcher will track a cryptocurrency price given a configuration.
For example to watch the price of BTC/USDT on binance we configure a MarketWatcher as:

```
{
  type: 'MarketWatcher'
  exchange: 'binance';
  base: 'BTC';
  quote: 'USDT';
  extra: {
    refreshInterval: 30000; // refresh every 30 seconds
    maxHistory: "2018-10-01T00:00:00Z"; // onInit will fetch history data
  };
}
```

Every watcher are persist to MongoDB to restart them on reboot.

## API

- Doc available at http://localhost:3000/docs generated with [lout](https://github.com/hapijs/lout)
- Easy watcher deployment
- Watch specific currencies
- TODO Watch signals (telegram, ...?)

## Visualization with grafana

A grafana container will run when using `npm run docker`

Then go to http://localhost:3001/

- username: admin
- password: admin

## UI

- [influx-crypto-watcher-ui](https://github.com/clementpl/influx-crypto-watcher-ui)
