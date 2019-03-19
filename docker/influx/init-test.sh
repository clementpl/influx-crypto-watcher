docker cp ./testset influxdb:/
docker exec influxdb influxd restore -portable /testset

# Make backup
# docker run influxdb influxd backup -portable - -database dev-crypto-watcher -end 2018-03-01T00:00:00Z -start 2018-02-15T00:00:00Z ./testset
# docker cp influxdb:/testset .

# package.json suggest
# "backup-influx": "docker run influxdb influxd backup -portable ./backup/`date +\"%m_%d_%Y\"`",
# "restore-influx": "docker run influxdb influxd restore -portable",

