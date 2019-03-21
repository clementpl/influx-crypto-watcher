path=$(dirname "$0")
docker cp $path/testset influxdb:/
docker exec influxdb influxd restore -portable -db test_crypto_series /testset

# Make backup
# docker run influxdb influxd backup -portable -db test_crypto_series -end 2018-03-15T00:00:00Z -start 2018-02-15T00:00:00Z ./testset
# docker cp influxdb:/testset .

# COPY DATA INFLUX (FROM ONE DB TO ANOTHER)
# SELECT * INTO test_crypto_series..OHLC FROM dev_crypto_series..OHLC group by *
# SELECT * INTO test_crypto_series..OHLC_FILLED FROM dev_crypto_series..OHLC_FILLED group by *

# package.json suggest
# "backup-influx": "docker run influxdb influxd backup -portable ./backup/`date +\"%m_%d_%Y\"`",
# "restore-influx": "docker run influxdb influxd restore -portable",

