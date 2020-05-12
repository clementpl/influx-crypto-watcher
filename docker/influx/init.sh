path=$(dirname "$0")
# restore data
docker cp $path/latest influxdb:/
# Restore database
docker exec influxdb influxd restore -portable -db dev_crypto_series /latest

# Create trader db + adjust retention policy for better performance on backtest
docker exec influxdb influx -execute "create database dev_crypto_trader"
docker exec influxdb influx -execute "ALTER RETENTION POLICY \"autogen\" ON dev_crypto_trader SHARD DURATION 12w"
