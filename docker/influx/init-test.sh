path=$(dirname "$0")
# Copy data
docker exec influxdb rm -rf /testset
docker cp $path/testset influxdb:/
# Drop database
curl -XPOST "http://127.0.0.1:8086/query" --data-urlencode "q=DROP DATABASE \"test_crypto_series\""
# Restore database
docker exec influxdb influxd restore -portable -db test_crypto_series /testset

# Make backup
# docker exec influxdb influxd backup -portable -db test_crypto_series -end 2018-03-15T00:00:00Z -start 2018-02-15T00:00:00Z ./testset
# docker cp influxdb:/testset .

# COPY DATA INFLUX (FROM ONE DB TO ANOTHER)
# SELECT * INTO test_crypto_series..OHLC FROM dev_crypto_series..OHLC group by *
# SELECT * INTO test_crypto_series..OHLC_FILLED FROM dev_crypto_series..OHLC_FILLED group by *

# package.json suggest
# "restore-influx": "docker run influxdb influxd restore -portable",
